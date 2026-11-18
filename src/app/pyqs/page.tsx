import type { Metadata } from 'next';
import PYQsClient, { PYQ } from './PYQsClient';
import { supabase } from '@/lib/supabase';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  props: Props
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const v = searchParams.v;
  const q = typeof searchParams.q === 'string' ? searchParams.q.trim() : undefined;

  if (!v || typeof v !== 'string' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (q) {
      const qTitle = `${q} PYQs & University Question Papers | LastBench`;
      const qDesc = `Download solved university question papers (PYQs) and model answer schemes for ${q} on LastBench. Free PDF preview, no paywalls.`;
      return {
        title: qTitle,
        description: qDesc,
        openGraph: {
          title: qTitle,
          description: qDesc,
        },
      };
    }
    return {
      title: 'Previous Year Question Papers (PYQs) - LastBench',
      description: 'Find past exam question papers from top engineering universities including SPPU and DBATU.',
    };
  }

  try {
    const { data } = await supabase
      .from('materials')
      .select('title, name, subject, university, year, exam_year')
      .eq('id', v)
      .single();

    if (data) {
      const title = data.title || data.name || 'PYQ Paper';
      const university = data.university || '';
      const subject = data.subject || '';
      const year = data.exam_year || data.year || '';
      
      const fullTitle = `${title} ${year ? '(' + year + ')' : ''} | LastBench`;
      const description = `Download the ${subject} PYQ for ${university} completely free on LastBench.`;

      return {
        title: fullTitle,
        description: description,
        openGraph: {
          title: fullTitle,
          description: description,
        }
      };
    }
  } catch (e) {
    console.error("Failed to generate metadata for PYQ", e);
  }

  return {
    title: 'PYQ Paper - LastBench',
  };
}

export default async function Page() {
  let initialPYQs: PYQ[] = [];

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { data, error } = await supabase
        .from('materials')
        .select('id, title, name, category, subject, university, university_short, branch, semester, year, exam_year, download_url, file_url, uploaded_by, uploaded_at')
        .eq('category', 'pyq')
        .order('uploaded_at', { ascending: false })
        .range(0, 19);

      if (!error && data) {
        initialPYQs = data.map(row => ({
          id: row.id,
          title: row.title || row.name || '',
          name: row.name || row.title || '',
          description: '',
          subject: row.subject || '',
          semester: row.semester || '',
          university: row.university || '',
          branch: row.branch || '',
          year: row.year || '',
          examYear: row.exam_year || row.year || '',
          downloadUrl: row.download_url || row.file_url || '',
          fileUrl: row.file_url || row.download_url || '',
          uploadedBy: row.uploaded_by || '',
          uploadedAt: row.uploaded_at || '',
        }));
      }
    }
  } catch (err) {
    console.error('Failed to pre-fetch PYQs on server:', err);
  }

  return <PYQsClient initialPYQs={initialPYQs} />;
}
