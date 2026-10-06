import type { Metadata } from 'next';
import PYQsClient from './PYQsClient';

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
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/materials/${v}`);
    if (res.ok) {
      const data = await res.json();
      const title = data.fields?.name?.stringValue || data.fields?.title?.stringValue || 'PYQ Paper';
      const university = data.fields?.university?.stringValue || '';
      const subject = data.fields?.subject?.stringValue || '';
      const year = data.fields?.year?.stringValue || '';
      
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
