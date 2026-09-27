import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url');

  if (!urlParam) {
    return new NextResponse('File URL is required', { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(urlParam);

    // If it's an S3 URL and AWS credentials are configured, use S3 Client
    if (
      (decodedUrl.includes('s3.amazonaws.com') || decodedUrl.includes('s3.')) &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
    ) {
      try {
        const urlObj = new URL(decodedUrl);
        const key = decodeURIComponent(urlObj.pathname.substring(1));
        const hostnameParts = urlObj.hostname.split('.');
        const bucketName = hostnameParts[0] || process.env.S3_BUCKET_NAME!;

        const s3 = new S3Client({
          region: process.env.AWS_REGION || 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        });

        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
          ResponseContentDisposition: 'inline',
        });

        const s3Response = await s3.send(command);

        if (s3Response.Body) {
          const contentType = s3Response.ContentType || 'application/pdf';
          const byteArray = await s3Response.Body.transformToByteArray();

          return new NextResponse(byteArray as unknown as BodyInit, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': 'inline',
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
            },
          });
        }
      } catch (s3Error) {
        console.warn('S3 client get failed, falling back to direct fetch:', s3Error);
      }
    }

    // Direct fetch fallback (for Firebase Storage or public URLs)
    const fetchResponse = await fetch(decodedUrl);

    if (!fetchResponse.ok) {
      return new NextResponse('Unable to retrieve file from storage provider', {
        status: fetchResponse.status,
      });
    }

    const contentType = fetchResponse.headers.get('content-type') || 'application/pdf';
    const buffer = await fetchResponse.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    console.error('Document preview error:', error);
    return new NextResponse('Internal error loading preview', { status: 500 });
  }
}
