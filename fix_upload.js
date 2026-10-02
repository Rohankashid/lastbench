const fs = require('fs');

const path = 'src/app/upload/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the fetch('/api/upload') block with presigned URL flow
const oldUploadBlock = `
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('name', finalName);
      uploadData.append('subject', subject.trim());
      uploadData.append('category', category);
      uploadData.append('semester', semester);
      uploadData.append('university', university);
      uploadData.append('branch', branch);
      uploadData.append('year', category === 'pyq' ? year : '');

      if (user) {
        uploadData.append('uploadedBy', user.email || user.uid);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Upload failed');
      if (!data.url) throw new Error('File storage upload not acknowledged');
`;

const newUploadBlock = `
      // 1. Get presigned URL
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size
        })
      });
      
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error || 'Failed to get upload URL');

      // 2. Upload directly to S3 (Bypasses Vercel 4.5MB limit)
      const uploadRes = await fetch(presignData.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        }
      });

      if (!uploadRes.ok) throw new Error('Failed to upload file to storage');

      // 3. Confirm and save metadata
      const confirmRes = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            name: finalName,
            subject: subject.trim(),
            category,
            semester,
            university,
            branch,
            year: category === 'pyq' ? year : '',
            uploadedBy: user ? (user.email || user.uid) : 'student'
          },
          fileDetails: {
            fileUrl: presignData.fileUrl,
            filename: presignData.secureFilename,
            originalName: presignData.sanitizedFilename,
            size: file.size,
            type: file.type
          }
        })
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error || 'Failed to save metadata');
`;

content = content.replace(oldUploadBlock, newUploadBlock);
fs.writeFileSync(path, content);
console.log("Replaced upload logic in page.tsx");
