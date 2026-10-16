const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { createClient } = require('@supabase/supabase-js');

// 1. Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').replace(/^"|"$/g, '').trim();
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

async function migrate() {
  console.log('--- 1. Testing Supabase Connection ---');
  const { data: testData, error: testErr } = await supabase.from('materials').select('count', { count: 'exact', head: true });
  if (testErr) {
    console.error('Supabase connection failed:', testErr);
    process.exit(1);
  }
  console.log(`Supabase connection successful! Current row count in materials: ${testData || 0}`);

  console.log('\n--- 2. Fetching all materials from Firestore ---');
  const snapshot = await db.collection('materials').get();
  console.log(`Found ${snapshot.size} materials in Firestore.`);

  const rows = [];
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;

    const row = {
      id,
      title: (data.title || data.name || '').trim(),
      name: (data.name || data.title || '').trim(),
      category: data.category || 'note',
      subject: (data.subject || '').trim(),
      university: (data.university || '').trim(),
      university_short: data.universityShort || (data.university && data.university.includes('SPPU') ? 'SPPU' : 'DBATU'),
      branch: (data.branch || '').trim(),
      semester: String(data.semester || '1').trim(),
      year: data.year ? String(data.year).trim() : null,
      exam_year: data.examYear ? String(data.examYear).trim() : (data.year ? String(data.year).trim() : null),
      file_url: (data.fileUrl || data.downloadUrl || '').trim(),
      download_url: (data.downloadUrl || data.fileUrl || '').trim(),
      file_size: data.fileSize ? parseInt(data.fileSize, 10) : null,
      file_type: data.fileType || null,
      original_name: data.originalName || null,
      uploaded_by: data.uploadedBy || 'system',
      uploaded_at: data.uploadedAt ? new Date(data.uploadedAt).toISOString() : new Date().toISOString(),
      helpful_count: data.helpfulCount || 0
    };

    rows.push(row);
  });

  console.log(`\n--- 3. Uploading ${rows.length} rows to Supabase in batches ---`);
  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('materials').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Error uploading batch starting at index ${i}:`, error);
      process.exit(1);
    }
    console.log(`Uploaded batch ${i + 1} to ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length}`);
  }

  console.log('\n--- 4. Verifying Total Count in Supabase ---');
  const { count, error: countErr } = await supabase.from('materials').select('*', { count: 'exact', head: true });
  if (countErr) {
    console.error('Error fetching count:', countErr);
  } else {
    console.log(`Verification: Supabase now has exactly ${count} materials!`);
  }

  console.log('\n--- 5. Testing Instant Full-Text Search ("bxe") ---');
  const t0 = Date.now();
  const { data: searchResults, error: searchErr } = await supabase
    .from('materials')
    .select('id, title, category, subject, university, year')
    .textSearch('search_vector', 'bxe');
  const duration = Date.now() - t0;

  if (searchErr) {
    console.error('Search test error:', searchErr);
  } else {
    console.log(`Search for "bxe" returned ${searchResults.length} results in ${duration}ms:`);
    console.log(searchResults.slice(0, 5));
  }

  console.log('\nMigration complete and verified!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
