import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function downloadHandler(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url');
  const filename = req.nextUrl.searchParams.get('filename') || 'download.pdf';

  if (!urlParam) {
    return new NextResponse('File URL is required', { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(urlParam);

    // SECURITY: Domain Whitelisting
    try {
      const parsedUrl = new URL(decodedUrl);
      const allowedDomains = [
        'firebasestorage.googleapis.com',
        's3.amazonaws.com',
        process.env.S3_BUCKET_NAME ? `${process.env.S3_BUCKET_NAME}.s3.amazonaws.com` : null,
        process.env.S3_BUCKET_NAME ? `${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com` : null
      ].filter(Boolean);

      const isAllowed = allowedDomains.some(domain => 
        domain && (parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain))
      );

      if (!isAllowed) {
        console.error('Blocked attempt to proxy unauthorized domain:', parsedUrl.hostname);
        return new NextResponse('Unauthorized storage domain', { status: 403 });
      }
    } catch {
      return new NextResponse('Invalid URL provided', { status: 400 });
    }

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
          ResponseContentDisposition: `attachment; filename="${filename}"`,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const signedUrl = await getSignedUrl(s3 as any, command, { expiresIn: 3600 });
        
        return NextResponse.redirect(signedUrl, {
          status: 302,
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        });
      } catch (s3Error) {
        console.warn('S3 client get failed, falling back to direct fetch:', s3Error);
      }
    }

    // Direct fetch fallback for Firebase Storage or non-S3 URLs
    const fetchResponse = await fetch(decodedUrl);

    if (!fetchResponse.ok) {
      return new NextResponse('Unable to retrieve file from storage provider', {
        status: fetchResponse.status,
      });
    }

    const contentType = fetchResponse.headers.get('content-type') || 'application/octet-stream';
    const buffer = await fetchResponse.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error) {
    console.error('Download API Error:', error);
    return new NextResponse('Internal server error while processing file download', { status: 500 });
  }
}

export const GET = withRateLimit(downloadHandler, RATE_LIMIT_CONFIGS.standard);
