import type { Metadata } from 'next';
import NotesClient from './NotesClient';
import { supabase } from '@/lib/supabase';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  props: Props
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const v = searchParams.v;
  if (!v || typeof v !== 'string') {
    return {
      title: 'Study Notes Archive - LastBench',
      description: 'Explore comprehensive engineering study notes, lecture digests, and exam guides.',
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

export default function Page() {
  return <NotesClient />;
}
