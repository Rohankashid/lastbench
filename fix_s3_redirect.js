const fs = require('fs');

let content = fs.readFileSync('src/app/api/preview/route.ts', 'utf8');

const s3RedirectCode = `
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
          ResponseContentDisposition: 'inline',
        });

        // Instead of downloading to Vercel and buffering in memory, 
        // generate a presigned URL and redirect the client directly to S3.
        // This cuts Vercel bandwidth costs to ZERO and speeds up loading.
        const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        
        return NextResponse.redirect(signedUrl, {
          status: 302,
          headers: {
            'Cache-Control': 'public, max-age=3600'
          }
        });
`;

content = content.replace(
/const command = new GetObjectCommand\(\{\s*Bucket: bucketName,\s*Key: key,\s*ResponseContentDisposition: 'inline',\s*\}\);\s*const s3Response = await s3\.send\(command\);\s*if \(s3Response\.Body\) \{[^}]*return new NextResponse\([^}]*\}\s*\}/s,
  s3RedirectCode
);

fs.writeFileSync('src/app/api/preview/route.ts', content);
console.log("Updated to use Presigned URL redirects!");
