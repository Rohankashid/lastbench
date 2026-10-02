const fs = require('fs');

let content = fs.readFileSync('src/app/api/preview/route.ts', 'utf8');

const whitelistCode = `
    const decodedUrl = decodeURIComponent(urlParam);

    // SECURITY: Domain Whitelisting to prevent SSRF and bandwidth abuse
    try {
      const parsedUrl = new URL(decodedUrl);
      const allowedDomains = [
        'firebasestorage.googleapis.com',
        's3.amazonaws.com',
        process.env.S3_BUCKET_NAME ? \`\${process.env.S3_BUCKET_NAME}.s3.amazonaws.com\` : null,
        process.env.S3_BUCKET_NAME ? \`\${process.env.S3_BUCKET_NAME}.s3.\${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com\` : null
      ].filter(Boolean);

      const isAllowed = allowedDomains.some(domain => 
        domain && (parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain))
      );

      if (!isAllowed) {
        console.error('Blocked attempt to proxy unauthorized domain:', parsedUrl.hostname);
        return new NextResponse('Unauthorized storage domain', { status: 403 });
      }
    } catch (e) {
      return new NextResponse('Invalid URL provided', { status: 400 });
    }
`;

content = content.replace('    const decodedUrl = decodeURIComponent(urlParam);', whitelistCode);

fs.writeFileSync('src/app/api/preview/route.ts', content);
console.log("Secured API Route!");
