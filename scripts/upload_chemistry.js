const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
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

// 3. Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 4. Initialize AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const SPPU_FULL = 'Savitribai Phule Pune University (SPPU)';
const BRANCH_FE = 'First Year Engineering (Common)';
const SUBJECT_CHEM = 'Engineering Chemistry';

// 5. Existing records to standardize/clean up
const EXISTING_RECORDS_TO_STANDARDIZE = [
  {
    id: 'i5wTi2nKZ9oKwzj5aAv4',
    name: 'SPPU FE Engineering Chemistry 70/70 Topper University Exam Answer Sheet',
    title: 'SPPU FE Engineering Chemistry 70/70 Topper University Exam Answer Sheet',
    category: 'pyq',
    year: '2022',
    examYear: '2022',
    semester: '2',
    subject: SUBJECT_CHEM,
    description: 'Official 70/70 out of 70 university topper handwritten answer sheet for SPPU Engineering Chemistry (2019 Pattern, Paper P6487).'
  },
  {
    id: 'rBRPVovSYHqZSzJstUgY',
    name: 'SPPU FE Engineering Chemistry 2019 Pattern Solved University Question Paper',
    title: 'SPPU FE Engineering Chemistry 2019 Pattern Solved University Question Paper',
    category: 'pyq',
    year: '2022',
    examYear: '2022',
    semester: '2',
    subject: SUBJECT_CHEM,
    description: 'Complete 51-page official SPPU 70-mark university question paper with comprehensive model solutions, reaction mechanisms, and diagrams.'
  },
  {
    id: 'y84m1yFtCbDuQHFAeWEZ',
    name: 'Engineering Chemistry 2019 Pattern End-Sem Model Answer Set (Units 3 to 6)',
    title: 'Engineering Chemistry 2019 Pattern End-Sem Model Answer Set (Units 3 to 6)',
    category: 'note',
    year: null,
    examYear: null,
    semester: '2',
    subject: SUBJECT_CHEM,
    description: 'Official 53-page SPPU End-Semester model answer set covering Units 3, 4, 5, and 6 with detailed marking schemes and exam solutions.'
  },
  {
    id: 'A2NddSg6Sdoe9pIMIEw0',
    name: 'Engineering Chemistry Comprehensive Handwritten Micro Revision Notes',
    title: 'Engineering Chemistry Comprehensive Handwritten Micro Revision Notes',
    category: 'note',
    year: null,
    examYear: null,
    semester: '2',
    subject: SUBJECT_CHEM,
    description: 'Concise high-yield handwritten micro revision notes covering Zeolite process, scale & sludge, priming & foaming, and AWG.'
  },
  {
    id: 'RVEWUAxW2g66j2eAxl5S',
    name: 'Engineering Chemistry High-Yield Exam Diagrams & Formulas Cheat Sheet',
    title: 'Engineering Chemistry High-Yield Exam Diagrams & Formulas Cheat Sheet',
    category: 'note',
    year: null,
    examYear: null,
    semester: '2',
    subject: SUBJECT_CHEM,
    description: 'High-yield 1-page visual revision sheet of essential exam diagrams: Beer-Lambert Law, Calomel Electrode, Glass Electrode, and Graphene lattice.'
  }
];

// 6. Brand new documents to upload
const NEW_DOCUMENTS = [
  {
    file: 'Chem 60M Feb 2026.pdf',
    cleanFilename: 'SPPU FE Engineering Chemistry 2024 Pattern End-Sem Question Paper (60 Marks).pdf',
    name: 'SPPU FE Engineering Chemistry 2024 Pattern End-Sem Question Paper (60 Marks)',
    category: 'pyq',
    year: '2024',
    examYear: '2024',
    semester: '2',
    subject: SUBJECT_CHEM,
    description: 'Official SPPU First Year Engineering Chemistry (BSC-103-BES) End-Semester Question Paper under the new 2024 NEP Pattern (60 Marks).'
  },
  {
    file: 'ENGINEERING CHEMISTRY.pdf',
    cleanFilename: 'Engineering Chemistry Master Question Bank with Detailed Model Answers.pdf',
    name: 'Engineering Chemistry Master Question Bank with Detailed Model Answers',
    category: 'note',
    year: null,
    examYear: null,
    semester: '2',
    subject: SUBJECT_CHEM,
    description: 'Exhaustive 119-page master question bank covering all 6 units with complete exam-oriented explanations, definitions, and model solutions.'
  },
  {
    file: 'chemistry imp.pdf',
    cleanFilename: 'Engineering Chemistry Solved Numericals & Derivations (EDTA, Water Hardness & Fuels).pdf',
    name: 'Engineering Chemistry Solved Numericals & Derivations (EDTA, Water Hardness & Fuels)',
    category: 'note',
    year: null,
    examYear: null,
    semester: '2',
    subject: SUBJECT_CHEM,
    description: '37-page handwritten compilation of solved university numericals: EDTA titrations, water hardness calculations, proximate/ultimate fuel analysis, and GCV/NCV.'
  },
  {
    file: 'Chemistry_Unit_1_One_night_engineer_watermark.pdf',
    cleanFilename: 'Engineering Chemistry Unit 1 Notes - Water Technology & Treatment.pdf',
    name: 'Engineering Chemistry Unit 1 Notes - Water Technology & Treatment',
    category: 'note',
    year: null,
    examYear: null,
    semester: '2',
    subject: SUBJECT_CHEM,
    description: '21-page handwritten lecture notes on Unit 1: Water impurities, Zeolite process, demineralization, reverse osmosis, and boiler problems.'
  },
  {
    file: 'chem unit 3 notes.pdf',
    cleanFilename: 'Engineering Chemistry Unit 3 Complete Handwritten Notes - Engineering Materials.pdf',
    name: 'Engineering Chemistry Unit 3 Complete Handwritten Notes - Engineering Materials',
    category: 'note',
    year: null,
    examYear: null,
    semester: '2',
    subject: SUBJECT_CHEM,
    description: '25-page comprehensive handwritten notebook notes covering Polymers, Conducting Polymers, Graphene, Carbon Nanotubes, and Biodegradable Polymers.'
  },
  {
    file: 'Chem Endsem Final (1) (1) (1).pdf',
    cleanFilename: 'Engineering Chemistry End-Sem High-Yield Question Bank with Detailed Answers.pdf',
    name: 'Engineering Chemistry End-Sem High-Yield Question Bank with Detailed Answers',
    category: 'note',
    year: null,
    examYear: null,
    semester: '2',
    subject: SUBJECT_CHEM,
    description: '10-page high-probability typed Q&A bank with chemical structures and diagrams for Biodegradable polymers, Polycarbonate, and Nanomaterials.'
  },
  {
    file: 'CHEMISTRY MICROO 1.pdf',
    cleanFilename: 'Engineering Chemistry Unit 3 Micro Notes - Polymers, Graphene & Nanomaterials.pdf',
    name: 'Engineering Chemistry Unit 3 Micro Notes - Polymers, Graphene & Nanomaterials',
    category: 'note',
    year: null,
    examYear: null,
    semester: '2',
    subject: SUBJECT_CHEM,
    description: 'Fast-revision micro notes with bullet-point definitions and key applications for Conducting Polymers, Graphene, and Nanocomposites.'
  },
  {
    file: 'ChemMICRO (1)_260126_103441.pdf',
    cleanFilename: 'Engineering Chemistry Quick Revision Notes (Units 3 & 4 - Advanced Materials & Fuels).pdf',
    name: 'Engineering Chemistry Quick Revision Notes (Units 3 & 4 - Advanced Materials & Fuels)',
    category: 'note',
    year: null,
    examYear: null,
    semester: '2',
    subject: SUBJECT_CHEM,
    description: 'Concise 4-page quick revision sheet summarizing CNT structures, graphene properties, steam reforming of coke/methane, and hydrogen production.'
  },
  {
    file: 'Chemistry Micro pdf.pdf',
    cleanFilename: 'Engineering Chemistry High-Yield Exam Revision Cards & Formulas.pdf',
    name: 'Engineering Chemistry High-Yield Exam Revision Cards & Formulas',
    category: 'note',
    year: null,
    examYear: null,
    semester: '2',
    subject: SUBJECT_CHEM,
    description: 'Compact multi-column exam revision cards with diagrams for Electrodialysis, Reverse Osmosis, Bomb Calorimeters, and Quantum Dots.'
  },
  {
    file: 'QP 60 MARKS 2024 PAT ALL SUB (1).pdf',
    cleanFilename: 'SPPU First Year Engineering 2024 NEP Pattern All Subjects Question Papers Compilation.pdf',
    name: 'SPPU First Year Engineering 2024 NEP Pattern All Subjects Question Papers Compilation',
    category: 'pyq',
    year: '2024',
    examYear: '2024',
    semester: '2',
    subject: 'First Year Engineering (All Subjects)',
    description: '31-page comprehensive compilation of official 60-mark SPPU university question papers under the 2024 NEP Pattern across First Year Engineering subjects.'
  }
];

async function main() {
  console.log('================================================================');
  console.log('  LASTBENCH ENGINEERING CHEMISTRY UPLOAD & SYNCHRONIZATION');
  console.log('================================================================\n');

  // Step 1: Standardize existing 5 records
  console.log('--- Step 1: Standardizing 5 Existing Chemistry Database Records ---');
  for (const item of EXISTING_RECORDS_TO_STANDARDIZE) {
    console.log(`Updating record ${item.id}: "${item.name}"`);
    
    // Update Firestore
    await db.collection('materials').doc(item.id).update({
      title: item.title,
      name: item.name,
      category: item.category,
      year: item.year,
      examYear: item.examYear,
      semester: item.semester,
      subject: item.subject,
      description: item.description,
      updatedAt: new Date().toISOString()
    });

    // Update Supabase
    const { error: supaErr } = await supabase.from('materials').update({
      title: item.title,
      name: item.name,
      category: item.category,
      year: item.year,
      exam_year: item.examYear,
      semester: item.semester,
      subject: item.subject
    }).eq('id', item.id);

    if (supaErr) {
      console.error(`  Error updating Supabase record ${item.id}:`, supaErr);
    } else {
      console.log(`  ✓ Updated Firestore & Supabase for ${item.id}`);
    }
  }

  // Step 2: Upload new documents to S3 and index in Firestore + Supabase
  console.log('\n--- Step 2: Uploading 10 New Chemistry Documents ---');
  const uploadDir = path.join(__dirname, '..', 'upload_content');
  let successCount = 0;

  for (const doc of NEW_DOCUMENTS) {
    const filePath = path.join(uploadDir, doc.file);
    if (!fs.existsSync(filePath)) {
      console.error(`File missing: ${filePath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Check duplicate in Firestore
    const existing = await db.collection('materials').where('fileHash', '==', hash).get();
    if (!existing.empty) {
      console.log(`[SKIP - Already Uploaded] ${doc.name}`);
      continue;
    }

    console.log(`\n--> Uploading: "${doc.name}"`);
    console.log(`    File: ${doc.cleanFilename} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);

    // S3 Key
    const secureKey = `materials/${Date.now()}_${crypto.randomBytes(8).toString('hex')}_${doc.cleanFilename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: secureKey,
      Body: fileBuffer,
      ContentType: 'application/pdf',
      ContentDisposition: `inline; filename="${doc.cleanFilename}"`,
      Metadata: {
        'original-filename': doc.cleanFilename,
        'upload-timestamp': new Date().toISOString(),
        'file-size': fileSize.toString(),
        'subject': doc.subject,
        'university': 'SPPU'
      }
    };

    try {
      await s3.send(new PutObjectCommand(uploadParams));
      const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${secureKey}`;
      console.log(`    ✓ S3 Upload Complete: ${fileUrl}`);

      const now = new Date().toISOString();
      const firestoreData = {
        name: doc.name,
        title: doc.name,
        university: SPPU_FULL,
        universityShort: 'SPPU',
        branch: BRANCH_FE,
        subject: doc.subject,
        semester: doc.semester,
        category: doc.category,
        description: doc.description,
        fileUrl: fileUrl,
        downloadUrl: fileUrl,
        filename: secureKey,
        originalName: doc.cleanFilename,
        fileSize: fileSize,
        fileType: 'application/pdf',
        fileHash: hash,
        uploadedBy: 'system',
        uploadedAt: now,
      };

      if (doc.category === 'pyq' && doc.year) {
        firestoreData.year = doc.year;
        firestoreData.examYear = doc.examYear;
      }

      // Add to Firestore
      const docRef = await db.collection('materials').add(firestoreData);
      const newId = docRef.id;
      console.log(`    ✓ Firestore Document ID: ${newId}`);

      // Add to Supabase
      const supabaseRow = {
        id: newId,
        title: doc.name,
        name: doc.name,
        category: doc.category,
        subject: doc.subject,
        university: SPPU_FULL,
        university_short: 'SPPU',
        branch: BRANCH_FE,
        semester: doc.semester,
        year: doc.year,
        exam_year: doc.examYear,
        file_url: fileUrl,
        download_url: fileUrl,
        file_size: fileSize,
        file_type: 'application/pdf',
        original_name: doc.cleanFilename,
        uploaded_by: 'system',
        uploaded_at: now,
        helpful_count: 0
      };

      const { error: supaInsertErr } = await supabase.from('materials').insert(supabaseRow);
      if (supaInsertErr) {
        console.error(`    ✗ Supabase Insert Error for ${newId}:`, supaInsertErr);
      } else {
        console.log(`    ✓ Supabase Synced successfully!`);
        successCount++;
      }
    } catch (err) {
      console.error(`    ✗ Error processing ${doc.name}:`, err);
    }
  }

  // Step 3: Fulfill the Student Paper Request
  console.log('\n--- Step 3: Fulfilling Student Paper Request ---');
  const reqSnapshot = await db.collection('paper_requests').where('status', '==', 'pending').get();
  reqSnapshot.forEach(async (docSnap) => {
    const data = docSnap.data();
    if (data.description && data.description.toLowerCase().includes('chemistry')) {
      console.log(`Fulfilling request ID ${docSnap.id}: "${data.description}"`);
      await db.collection('paper_requests').doc(docSnap.id).update({
        status: 'fulfilled',
        fulfilledAt: new Date().toISOString(),
        fulfilledWithSubject: SUBJECT_CHEM,
        note: 'Fulfilled with 10 newly uploaded Engineering Chemistry study materials & 2024/2019 PYQs.'
      });
      console.log(`✓ Request ${docSnap.id} marked as FULFILLED!`);
    }
  });

  console.log('\n================================================================');
  console.log(`  COMPLETED: ${successCount} new files uploaded & indexed.`);
  console.log('================================================================\n');
}

main().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
