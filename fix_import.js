const fs = require('fs');
let content = fs.readFileSync('src/app/api/preview/route.ts', 'utf8');
content = content.replace(
  "import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';",
  "import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';\nimport { getSignedUrl } from '@aws-sdk/s3-request-presigner';"
);
content = content.replace(
  "const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');\n",
  ""
);
fs.writeFileSync('src/app/api/preview/route.ts', content);
