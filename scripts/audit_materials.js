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

async function runAudit() {
  console.log('--- Fetching all documents from `materials` collection ---');
  const snapshot = await db.collection('materials').get();
  console.log(`Total documents found: ${snapshot.size}`);

  const stats = {
    total: snapshot.size,
    byCategory: {},
    byUniversity: {},
    issues: {
      ghosts: [], // missing title AND fileUrl
      missingTitleOrName: [],
      missingFileUrlAndDownloadUrl: [],
      invalidFileUrl: [],
      missingSubject: [],
      missingUniversity: [],
      unnormalizedUniversity: [],
      missingBranch: [],
      missingSemester: [],
      pyqMissingYear: [],
      corruptValues: [], // e.g. "undefined", "null", "[object Object]"
      duplicateUrls: {},
    }
  };

  const urlMap = new Map();

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;
    const cat = data.category || 'NO_CATEGORY';
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;

    const uni = data.university || 'NO_UNIVERSITY';
    stats.byUniversity[uni] = (stats.byUniversity[uni] || 0) + 1;

    const title = (data.title || data.name || '').trim();
    const fileUrl = (data.fileUrl || data.downloadUrl || '').trim();
    const subject = (data.subject || '').trim();
    const branch = (data.branch || '').trim();
    const semester = data.semester !== undefined && data.semester !== null ? String(data.semester).trim() : '';
    const year = data.year || data.examYear || '';

    // Check Ghost (completely broken doc)
    if (!title && !fileUrl) {
      stats.issues.ghosts.push({ id, data });
    }

    // Title check
    if (!title) {
      stats.issues.missingTitleOrName.push({ id, subject, cat });
    }

    // File URL check
    if (!fileUrl) {
      stats.issues.missingFileUrlAndDownloadUrl.push({ id, title, cat });
    } else if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
      stats.issues.invalidFileUrl.push({ id, title, fileUrl });
    }

    // Duplicate check on fileUrl
    if (fileUrl) {
      if (urlMap.has(fileUrl)) {
        const existingId = urlMap.get(fileUrl);
        if (!stats.issues.duplicateUrls[fileUrl]) {
          stats.issues.duplicateUrls[fileUrl] = [existingId];
        }
        stats.issues.duplicateUrls[fileUrl].push(id);
      } else {
        urlMap.set(fileUrl, id);
      }
    }

    // Subject check
    if (!subject || subject.toLowerCase() === 'undefined' || subject.toLowerCase() === 'null') {
      stats.issues.missingSubject.push({ id, title, cat, uni });
    }

    // University check
    if (!data.university || !data.university.trim()) {
      stats.issues.missingUniversity.push({ id, title, cat });
    } else {
      const u = data.university.trim();
      if (u === 'SPPU' || u === 'sppu' || u === 'DBATU' || u === 'dbatu' || u === 'SPPU University') {
        stats.issues.unnormalizedUniversity.push({ id, title, currentUni: u });
      }
    }

    // Branch check
    if (!branch) {
      stats.issues.missingBranch.push({ id, title, cat, uni });
    }

    // Semester check
    if (!semester) {
      stats.issues.missingSemester.push({ id, title, cat, uni });
    }

    // PYQ Year check
    if (cat === 'pyq' && !year) {
      stats.issues.pyqMissingYear.push({ id, title, uni });
    }

    // Corrupted field values
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === 'string') {
        if (val === 'undefined' || val === 'null' || val === '[object Object]' || val === 'NaN') {
          stats.issues.corruptValues.push({ id, key, val, title });
        }
      }
    }
  });

  console.log('\n================ AUDIT SUMMARY ================');
  console.log(`Total Materials: ${stats.total}`);
  console.log('\n--- Materials By Category ---');
  console.log(stats.byCategory);

  console.log('\n--- Materials By University ---');
  console.log(stats.byUniversity);

  console.log('\n--- Critical Integrity Issues ---');
  console.log(`Ghost Documents (No Title AND No URL): ${stats.issues.ghosts.length}`);
  if (stats.issues.ghosts.length > 0) {
    console.log(JSON.stringify(stats.issues.ghosts, null, 2));
  }

  console.log(`Missing Title/Name: ${stats.issues.missingTitleOrName.length}`);
  if (stats.issues.missingTitleOrName.length > 0) {
    console.log(stats.issues.missingTitleOrName.slice(0, 10));
  }

  console.log(`Missing File URL / Download URL: ${stats.issues.missingFileUrlAndDownloadUrl.length}`);
  if (stats.issues.missingFileUrlAndDownloadUrl.length > 0) {
    console.log(stats.issues.missingFileUrlAndDownloadUrl.slice(0, 10));
  }

  console.log(`Invalid File URLs: ${stats.issues.invalidFileUrl.length}`);
  if (stats.issues.invalidFileUrl.length > 0) {
    console.log(stats.issues.invalidFileUrl.slice(0, 10));
  }

  console.log(`Missing Subject: ${stats.issues.missingSubject.length}`);
  if (stats.issues.missingSubject.length > 0) {
    console.log(stats.issues.missingSubject.slice(0, 10));
  }

  console.log(`Missing University: ${stats.issues.missingUniversity.length}`);
  if (stats.issues.missingUniversity.length > 0) {
    console.log(stats.issues.missingUniversity.slice(0, 10));
  }

  console.log(`Unnormalized University Names (e.g. short SPPU): ${stats.issues.unnormalizedUniversity.length}`);
  if (stats.issues.unnormalizedUniversity.length > 0) {
    console.log(stats.issues.unnormalizedUniversity.slice(0, 10));
  }

  console.log(`Missing Branch: ${stats.issues.missingBranch.length}`);
  if (stats.issues.missingBranch.length > 0) {
    console.log(stats.issues.missingBranch.slice(0, 10));
  }

  console.log(`Missing Semester: ${stats.issues.missingSemester.length}`);
  if (stats.issues.missingSemester.length > 0) {
    console.log(stats.issues.missingSemester.slice(0, 10));
  }

  console.log(`PYQs Missing Exam Year: ${stats.issues.pyqMissingYear.length}`);
  if (stats.issues.pyqMissingYear.length > 0) {
    console.log(stats.issues.pyqMissingYear.slice(0, 10));
  }

  console.log(`Corrupt Values ("undefined", "null", etc): ${stats.issues.corruptValues.length}`);
  if (stats.issues.corruptValues.length > 0) {
    console.log(stats.issues.corruptValues.slice(0, 10));
  }

  const dupCount = Object.keys(stats.issues.duplicateUrls).length;
  console.log(`Duplicate File URLs: ${dupCount}`);
  if (dupCount > 0) {
    console.log(JSON.stringify(stats.issues.duplicateUrls, null, 2));
  }

  // Also write the full report to a json file for detailed inspection
  fs.writeFileSync(
    path.join(__dirname, 'audit_report.json'),
    JSON.stringify(stats, null, 2)
  );
  console.log('\nFull audit written to scripts/audit_report.json');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
