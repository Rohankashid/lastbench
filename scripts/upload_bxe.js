const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

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

// 3. Initialize AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const SPPU_FULL = 'Savitribai Phule Pune University (SPPU)';
const BRANCH_FE = 'First Year Engineering (Common)';
const SUBJECT_BXE = 'Basic Electronics Engineering';

// Document definitions for BXE files
const BXE_DOCUMENTS = [
  {
    originalFile: 'BASIC_ELECTRONCS_ENGINEERING_Prelimanry_Quetion_220803_213132.pdf',
    cleanFilename: 'BXE Comprehensive Question Bank.pdf',
    name: 'BXE Comprehensive Question Bank',
    category: 'pyq',
    year: '2022',
    semester: '1',
    description: 'Comprehensive question bank covering Logic Gates, Flip-Flops, Adders, DMM, DSO, Transducers, and Communication Systems.'
  },
  {
    originalFile: "BXE_EndSem_Question Bank.docx'.pdf",
    cleanFilename: 'BXE End-Sem Question Bank (Units 3 to 6).pdf',
    name: 'BXE End-Sem Question Bank (Units 3 to 6)',
    category: 'pyq',
    year: '2020',
    semester: '1',
    description: 'SPPU affiliated End-Semester question bank for Units 3, 4, 5, and 6 covering Instrumentation, Sensors, and Digital Electronics.'
  },
  {
    originalFile: 'BXE_Unit 1 Notes_NIRMAAN (1).pdf',
    cleanFilename: 'BXE Unit 1 Notes - Introduction to Electronics and Diodes.pdf',
    name: 'BXE Unit 1 Notes - Introduction to Electronics and Diodes',
    category: 'note',
    year: null,
    semester: '1',
    description: 'Detailed handwritten lecture notes on Unit 1: P-N Junction Diodes, Drift and Diffusion currents, Zener & Avalanche breakdown, and V-I characteristics.'
  },
  {
    originalFile: 'bxe micro end sem.pdf',
    cleanFilename: 'BXE End-Sem Micro Revision Notes (Units 3 to 6).pdf',
    name: 'BXE End-Sem Micro Revision Notes (Units 3 to 6)',
    category: 'note',
    year: null,
    semester: '1',
    description: 'Quick-revision micro handwritten notes with block diagrams, truth tables, and key definitions across Units 3 through 6.'
  },
  {
    originalFile: 'BXE .pdf',
    cleanFilename: 'BXE End-Sem Solved Model Questions & Assignments.pdf',
    name: 'BXE End-Sem Solved Model Questions & Assignments',
    category: 'note',
    year: null,
    semester: '1',
    description: 'Handwritten solved assignment questions and model answers with circuits for Multimeters, Flip Flops, Autotransformers, DSO, and GSM.'
  },
  {
    originalFile: 'BXE Previous year Solved QP.pdf',
    cleanFilename: 'BXE 2019 Pattern Solved University Question Paper.pdf',
    name: 'BXE 2019 Pattern Solved University Question Paper',
    category: 'pyq',
    year: '2022',
    semester: '1',
    description: 'Complete official SPPU 70-mark university question paper with step-by-step model answers and diagrams on university answer sheets.'
  },
  {
    originalFile: 'IMP BXE (1).pdf',
    cleanFilename: 'BXE High-Yield Important Solved Questions.pdf',
    name: 'BXE High-Yield Important Solved Questions',
    category: 'note',
    year: null,
    semester: '1',
    description: 'High-yield important questions bank with solutions on Microprocessor vs Microcontroller, FM Receivers, Biosensors, LVDT, and Strain Gauges.'
  }
];

async function processUploads() {
  const uploadDir = path.join(__dirname, '..', 'upload_content');
  console.log(`Checking files in: ${uploadDir}`);

  if (!fs.existsSync(uploadDir)) {
    console.error(`Directory not found: ${uploadDir}`);
    process.exit(1);
  }

  let uploadedCount = 0;
  let skippedCount = 0;

  for (const doc of BXE_DOCUMENTS) {
    const filePath = path.join(uploadDir, doc.originalFile);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}. Trying clean name: ${doc.cleanFilename}`);
      const fallbackPath = path.join(uploadDir, doc.cleanFilename);
      if (!fs.existsSync(fallbackPath)) {
        console.error(`Skipping ${doc.originalFile} - neither original nor clean file found.`);
        continue;
      }
    }

    const targetPath = fs.existsSync(filePath) ? filePath : path.join(uploadDir, doc.cleanFilename);
    const fileBuffer = fs.readFileSync(targetPath);
    const fileSize = fileBuffer.length;

    // Compute SHA-256 hash
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Check for existing document in Firestore with same hash or title
    const existingByHash = await db.collection('materials').where('fileHash', '==', hash).get();
    if (!existingByHash.empty) {
      console.log(`[SKIP - Duplicate Hash] ${doc.name} already exists in database.`);
      skippedCount++;
      continue;
    }

    const existingByName = await db.collection('materials')
      .where('name', '==', doc.name)
      .where('subject', '==', SUBJECT_BXE)
      .get();

    if (!existingByName.empty) {
      console.log(`[SKIP - Duplicate Name] ${doc.name} already exists in database.`);
      skippedCount++;
      continue;
    }

    console.log(`\n--> Uploading: ${doc.name}`);
    console.log(`    File: ${doc.cleanFilename} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`    Subject: ${SUBJECT_BXE} | Sem: ${doc.semester} | Category: ${doc.category}`);

    // Generate clean secure S3 filename
    const secureFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${doc.cleanFilename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: secureFilename,
      Body: fileBuffer,
      ContentType: 'application/pdf',
      ContentDisposition: `inline; filename="${doc.cleanFilename}"`,
      Metadata: {
        'original-filename': doc.cleanFilename,
        'upload-timestamp': new Date().toISOString(),
        'file-size': fileSize.toString(),
        'subject': SUBJECT_BXE,
        'university': 'SPPU'
      }
    };

    try {
      await s3.send(new PutObjectCommand(uploadParams));
      const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${secureFilename}`;
      console.log(`    S3 Upload Success: ${fileUrl}`);

      const firestoreData = {
        name: doc.name,
        title: doc.name,
        university: SPPU_FULL,
        universityShort: 'SPPU',
        branch: BRANCH_FE,
        subject: SUBJECT_BXE,
        semester: doc.semester,
        category: doc.category,
        description: doc.description,
        fileUrl: fileUrl,
        downloadUrl: fileUrl,
        filename: secureFilename,
        originalName: doc.cleanFilename,
        fileSize: fileSize,
        fileType: 'application/pdf',
        fileHash: hash,
        uploadedBy: 'system',
        uploadedAt: new Date().toISOString(),
      };

      if (doc.category === 'pyq' && doc.year) {
        firestoreData.year = doc.year;
      }

      const docRef = await db.collection('materials').add(firestoreData);
      console.log(`    Firestore Indexed: ID ${docRef.id}`);
      uploadedCount++;
    } catch (err) {
      console.error(`    FAILED to upload ${doc.name}:`, err);
    }
  }

  console.log(`\n======================================================`);
  console.log(`UPLOAD SUMMARY: ${uploadedCount} uploaded, ${skippedCount} skipped.`);
  console.log(`======================================================`);
}

processUploads().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error during upload:', err);
  process.exit(1);
});
