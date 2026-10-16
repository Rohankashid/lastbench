import type { Metadata } from 'next';
import PYQsClient from './PYQsClient';
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
      title: 'Previous Year Question Papers (PYQs) - LastBench',
      description: 'Find past exam question papers from top engineering universities.',
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

export default function Page() {
  return <PYQsClient />;
}
