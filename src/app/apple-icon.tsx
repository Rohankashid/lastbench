import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
        }}
      >
        <svg width="100" height="100" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="10" width="24" height="4" rx="2" fill="#e4e4e7" />
          <rect x="8" y="18" width="24" height="4" rx="2" fill="#e4e4e7" />
          <rect x="4" y="26" width="32" height="6" rx="2" fill="#4f46e5" />
          <rect x="8" y="32" width="4" height="6" rx="1" fill="#e4e4e7" />
          <rect x="28" y="32" width="4" height="6" rx="1" fill="#e4e4e7" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
