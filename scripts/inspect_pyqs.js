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

async function inspectPyqs() {
  const auditReport = JSON.parse(fs.readFileSync(path.join(__dirname, 'audit_report.json'), 'utf8'));
  const missingYearPyqs = auditReport.issues.pyqMissingYear;

  console.log(`Inspecting ${missingYearPyqs.length} PYQs missing year:`);
  for (const item of missingYearPyqs) {
    const docSnap = await db.collection('materials').doc(item.id).get();
    const data = docSnap.data();
    console.log({
      id: item.id,
      title: data.title || data.name,
      subject: data.subject,
      semester: data.semester,
      branch: data.branch,
      university: data.university,
      year: data.year,
      examYear: data.examYear,
      pattern: data.pattern,
      fileUrl: data.fileUrl
    });
  }
}

inspectPyqs().catch(err => console.error(err));
