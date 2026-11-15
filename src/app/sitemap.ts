import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate dynamic sitemap hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.lastbench.online';
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/notes`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pyqs`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/takedown`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/upload`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { data, error } = await supabase
        .from('materials')
        .select('id, category, uploaded_at')
        .order('uploaded_at', { ascending: false })
        .limit(1000);

      if (!error && Array.isArray(data)) {
        const dynamicRoutes: MetadataRoute.Sitemap = data.map((item) => ({
          url: `${baseUrl}/${item.category === 'pyq' ? 'pyqs' : 'notes'}?v=${item.id}`,
          lastModified: item.uploaded_at ? new Date(item.uploaded_at) : now,
          changeFrequency: 'weekly',
          priority: 0.7,
        }));
        return [...staticRoutes, ...dynamicRoutes];
      }
    }
  } catch (err) {
    console.error('Failed to generate dynamic sitemap:', err);
  }

  return staticRoutes;
}
