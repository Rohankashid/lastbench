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

const SPPU_FULL = 'Savitribai Phule Pune University (SPPU)';
const DBATU_FULL = 'Dr. Babasaheb Ambedkar Technological University (DBATU)';

// 4 Ghost .DS_Store files to delete
const GHOST_IDS = [
  '3lmWcLDyEaRvKtZjuKwn',
  '4oDTuPgH5uNVN2mdeSKO',
  '6k2flySMXTbywdPglTrn',
  'hZSS94DYlwFu2J3hcGFv'
];

// Clean titles with raw file extensions
const CLEAN_TITLES = {
  'D7lGFp0losqefxDQM265': 'Engineering Chemistry Unit 5 Notes',
  'NwHZEv0jplK73xrmQnpc': 'BEEE Unit 2 Numericals',
  'mspoj3kQcpTngPxlSznU': 'OOPCG Oral Question Bank'
};

// Fallback / extracted years for PYQs missing year
const PYQ_YEAR_MAP = {
  '0G9KhJSMR6xNeAVsqvJA': '2024',
  '2bE9o4uUUeieC0y8RIaW': '2024',
  'B0cS68BTnz8liHnJLdOj': '2023',
  'BhQQbMWZ7xwRmq57IQVX': '2023',
  'CkfQ34FSHXi0TkURDmEK': '2023',
  'DV91I07TLbKxm0WzG1li': '2023',
  'GsY2LAi1GcW3Bsur06om': '2023',
  'J6IOXJDTPaJBTuXH4IXD': '2024',
  'QzLYBHXwWG4V9QOyAxlU': '2023',
  'VjQOEXlOG6aXHUDzdilv': '2023',
  'WChawcnWmLIQaIPBb0CX': '2023',
  'YUzYMnpRDrizkBp7blgc': '2024',
  'ZaclbaCjlQsZF13E40aI': '2023',
  'i5QuulqqrNcppFZdAetJ': '2023',
  'lO9oJeXOPFwrhUyj4l7g': '2023',
  'mFm2mtUNR6F4Vq2OPSpZ': '2023',
  'mSJNCC5b3wjNBKlcRMbO': '2023',
  'oxxcQAD2mocti73tAMwA': '2023',
  'rBRPVovSYHqZSzJstUgY': '2023',
  'uoPUOH0mXhNOGA1pQeuN': '2023',
  'y84m1yFtCbDuQHFAeWEZ': '2023'
};

async function repair() {
  console.log('1. Deleting 4 ghost .DS_Store documents...');
  for (const ghostId of GHOST_IDS) {
    await db.collection('materials').doc(ghostId).delete();
    console.log(`Deleted ghost document: ${ghostId}`);
  }

  console.log('\n2. Fetching remaining documents to sync and normalize fields...');
  const snapshot = await db.collection('materials').get();
  console.log(`Found ${snapshot.size} documents to check.`);

  let updatedCount = 0;
  let batch = db.batch();
  let opsInBatch = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const id = docSnap.id;
    const updates = {};

    // 1. Sync title & name
    let cleanTitle = data.title || data.name || '';
    if (CLEAN_TITLES[id]) {
      cleanTitle = CLEAN_TITLES[id];
    }
    if (cleanTitle !== data.title) {
      updates.title = cleanTitle;
    }
    if (cleanTitle !== data.name) {
      updates.name = cleanTitle;
    }

    // 2. Sync fileUrl & downloadUrl
    const url = data.fileUrl || data.downloadUrl || '';
    if (url && data.fileUrl !== url) {
      updates.fileUrl = url;
    }
    if (url && data.downloadUrl !== url) {
      updates.downloadUrl = url;
    }

    // 3. Normalize universityShort
    const uni = data.university || '';
    const expectedShort = uni.includes('SPPU') ? 'SPPU' : uni.includes('DBATU') ? 'DBATU' : '';
    if (expectedShort && data.universityShort !== expectedShort) {
      updates.universityShort = expectedShort;
    }

    // 4. PYQ year & examYear normalization
    if (data.category === 'pyq') {
      let pyqYear = data.year || data.examYear || PYQ_YEAR_MAP[id] || '';
      if (pyqYear) {
        if (data.year !== pyqYear) updates.year = pyqYear;
        if (data.examYear !== pyqYear) updates.examYear = pyqYear;
      }
    }

    if (Object.keys(updates).length > 0) {
      batch.update(docSnap.ref, updates);
      opsInBatch++;
      updatedCount++;

      if (opsInBatch >= 400) {
        await batch.commit();
        console.log(`Committed batch of ${opsInBatch} updates...`);
        batch = db.batch();
        opsInBatch = 0;
      }
    }
  }

  if (opsInBatch > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${opsInBatch} updates.`);
  }

  console.log(`\nRepair completed successfully! Total documents updated: ${updatedCount}`);
}

repair().catch(err => {
  console.error('Repair failed:', err);
  process.exit(1);
});
