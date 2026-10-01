import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: '14px',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
