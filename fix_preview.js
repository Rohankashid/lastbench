const fs = require('fs');

let content = fs.readFileSync('src/app/api/preview/route.ts', 'utf8');

if (!content.includes('withRateLimit')) {
  content = content.replace(
    "import { NextRequest, NextResponse } from 'next/server';",
    "import { NextRequest, NextResponse } from 'next/server';\nimport { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';"
  );

  content = content.replace(
    "export async function GET(req: NextRequest) {",
    "async function previewHandler(req: NextRequest) {"
  );

  content += "\n\nexport const GET = withRateLimit(previewHandler, RATE_LIMIT_CONFIGS.general);\n";
  fs.writeFileSync('src/app/api/preview/route.ts', content);
  console.log("Added rate limit to preview!");
} else {
  console.log("Already rate limited.");
}
