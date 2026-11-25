import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/preview'],
        disallow: ['/api/', '/admin/'],
      },
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/api/preview'],
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: 'https://www.lastbench.online/sitemap.xml',
  };
}
