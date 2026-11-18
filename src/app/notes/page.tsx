import type { Metadata } from 'next';
import NotesClient, { Note } from './NotesClient';
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
      const qTitle = `${q} Notes & Exam Question Bank | LastBench`;
      const qDesc = `Download verified university study notes, course packs, and PYQ solutions for ${q} on LastBench. Free inline PDF preview, zero paywalls.`;
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
      title: 'Study Notes Archive - LastBench',
      description: 'Explore comprehensive engineering study notes, lecture digests, and exam guides across universities and branches.',
    };
  }

  try {
    const { data } = await supabase
      .from('materials')
      .select('title, name, subject, university')
      .eq('id', v)
      .single();

    if (data) {
      const title = data.title || data.name || 'Study Note';
      const university = data.university || '';
      const subject = data.subject || '';
      
      const fullTitle = `${title} ${subject ? '- ' + subject : ''} | LastBench`;
      const description = `Download ${title} ${university ? 'for ' + university : ''} completely free on LastBench.`;

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
    console.error("Failed to generate metadata for note", e);
  }

  return {
    title: 'Study Note - LastBench',
  };
}

export default async function Page() {
  let initialNotes: Note[] = [];

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { data, error } = await supabase
        .from('materials')
        .select('id, title, name, category, subject, university, university_short, branch, semester, year, download_url, file_url, uploaded_by, uploaded_at')
        .eq('category', 'note')
        .order('uploaded_at', { ascending: false })
        .range(0, 19);

      if (!error && data) {
        initialNotes = data.map(row => ({
          id: row.id,
          title: row.title || row.name || '',
          name: row.name || row.title || '',
          description: '',
          subject: row.subject || '',
          semester: row.semester || '',
          university: row.university || '',
          branch: row.branch || '',
          year: row.year || '',
          downloadUrl: row.download_url || row.file_url || '',
          fileUrl: row.file_url || row.download_url || '',
          uploadedBy: row.uploaded_by || '',
          uploadedAt: row.uploaded_at || '',
        }));
      }
    }
  } catch (err) {
    console.error('Failed to pre-fetch notes on server:', err);
  }

  return <NotesClient initialNotes={initialNotes} />;
}
