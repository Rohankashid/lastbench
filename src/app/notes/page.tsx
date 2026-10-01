import type { Metadata } from 'next';
import NotesClient from './NotesClient';

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
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/materials/${v}`);
    if (res.ok) {
      const data = await res.json();
      const title = data.fields?.name?.stringValue || data.fields?.title?.stringValue || 'Study Note';
      const university = data.fields?.university?.stringValue || '';
      const subject = data.fields?.subject?.stringValue || '';
      
      const fullTitle = `${title} ${subject ? '- ' + subject : ''} | LastBench`;
      const description = `Download ${title} ${university ? 'for ' + university : ''} completely free on LastBench.`;

      return {
        title: fullTitle,
        description: description,
        openGraph: {
          title: fullTitle,
          description: description,
          images: [
            // If we had a dynamic OG generator we could use it here
            // `/api/og?title=${encodeURIComponent(title)}&subject=${encodeURIComponent(subject)}&uni=${encodeURIComponent(university)}`
          ],
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
