const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();

const SPPU_FULL_NAME = 'Savitribai Phule Pune University (SPPU)';
const DBATU_FULL_NAME = 'Dr. Babasaheb Ambedkar Technological University (DBATU)';

async function normalize() {
  console.log('Fetching materials from Firestore...');
  const snapshot = await db.collection('materials').get();
  console.log(`Total materials found: ${snapshot.size}`);

  let updatedSPPU = 0;
  let updatedDBATU = 0;
  let batches = [];
  let currentBatch = db.batch();
  let countInCurrentBatch = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const uni = (data.university || '').trim();
    let targetUni = null;

    // Check SPPU variations
    if (
      uni === 'SPPU' ||
      uni.toLowerCase() === 'sppu' ||
      uni === 'SPPU_university' ||
      uni === 'SPPU_University' ||
      uni === 'SPPU University'
    ) {
      targetUni = SPPU_FULL_NAME;
      updatedSPPU++;
    } else if (uni === 'DBATU' || uni.toLowerCase() === 'dbatu') {
      targetUni = DBATU_FULL_NAME;
      updatedDBATU++;
    }

    if (targetUni && targetUni !== data.university) {
      currentBatch.update(doc.ref, {
        university: targetUni,
        universityShort: targetUni === SPPU_FULL_NAME ? 'SPPU' : 'DBATU',
      });
      countInCurrentBatch++;

      // Commit every 400 operations to stay below 500 batch limit
      if (countInCurrentBatch >= 400) {
        batches.push(currentBatch.commit());
        currentBatch = db.batch();
        countInCurrentBatch = 0;
      }
    }
  });

  if (countInCurrentBatch > 0) {
    batches.push(currentBatch.commit());
  }

  console.log(`Committing updates for ${updatedSPPU} SPPU docs and ${updatedDBATU} DBATU docs...`);
  await Promise.all(batches);
  console.log('Migration completed successfully!');
}

normalize().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
