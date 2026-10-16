const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load environment variables from .env.local
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

async function inspect() {
  const fourMissingTitles = [
    '3lmWcLDyEaRvKtZjuKwn',
    '4oDTuPgH5uNVN2mdeSKO',
    '6k2flySMXTbywdPglTrn',
    'hZSS94DYlwFu2J3hcGFv'
  ];

  console.log('=== INSPECTING 4 DOCS WITH MISSING TITLE ===');
  for (const id of fourMissingTitles) {
    const docSnap = await db.collection('materials').doc(id).get();
    console.log(`\nDoc ID: ${id}`);
    console.log(docSnap.data());
  }

  // Check fileUrl vs downloadUrl across all 739 docs
  console.log('\n=== CHECKING fileUrl vs downloadUrl across all documents ===');
  const snapshot = await db.collection('materials').get();
  let hasBoth = 0;
  let onlyFileUrl = 0;
  let onlyDownloadUrl = 0;
  let missingBoth = 0;

  const docsWithOnlyDownloadUrl = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const hasFileUrl = Boolean(data.fileUrl && data.fileUrl.trim());
    const hasDownloadUrl = Boolean(data.downloadUrl && data.downloadUrl.trim());

    if (hasFileUrl && hasDownloadUrl) hasBoth++;
    else if (hasFileUrl && !hasDownloadUrl) onlyFileUrl++;
    else if (!hasFileUrl && hasDownloadUrl) {
      onlyDownloadUrl++;
      docsWithOnlyDownloadUrl.push({ id: docSnap.id, title: data.title || data.name, downloadUrl: data.downloadUrl });
    } else missingBoth++;
  });

  console.log({ hasBoth, onlyFileUrl, onlyDownloadUrl, missingBoth });
  if (docsWithOnlyDownloadUrl.length > 0) {
    console.log('Docs with only downloadUrl (missing fileUrl):', docsWithOnlyDownloadUrl.length);
    console.log(docsWithOnlyDownloadUrl.slice(0, 5));
  }
}

inspect().catch(err => console.error(err));
