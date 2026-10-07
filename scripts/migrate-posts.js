// scripts/migrate-posts.js
// Migration to add pinnedAt: null to all existing community posts.
// Run this with Node (requires firebase-admin).
// node scripts/migrate-posts.js

const admin = require('firebase-admin');

// Ensure you have your Firebase Admin credentials exported or loaded here.
// e.g. export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
// Or configure it manually if running locally:

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function migrate() {
  console.log('Starting migration to add pinnedAt to community_posts...');
  const snapshot = await db.collection('community_posts').get();
  
  if (snapshot.empty) {
    console.log('No posts found.');
    return;
  }

  const batch = db.batch();
  let count = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.pinnedAt === undefined) {
      batch.update(doc.ref, { pinnedAt: null });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Successfully added pinnedAt: null to ${count} posts.`);
  } else {
    console.log('All posts already migrated.');
  }
}

migrate().catch(console.error);
