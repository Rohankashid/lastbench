const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function migrate() {
  console.log('Starting migration to add pinnedAt to community_posts...');
  const snapshot = await db.collection('community_posts').get();
  
  if (snapshot.empty) {
    console.log('No posts found.');
    return process.exit(0);
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
  process.exit(0);
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
