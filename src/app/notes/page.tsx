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
  const v = typeof searchParams.v === 'string' ? searchParams.v.trim() : undefined;
  const q = typeof searchParams.q === 'string' ? searchParams.q.trim() : undefined;

  if (!v || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (q) {
      const qTitle = `${q} Notes & Exam Question Bank | LastBench`;
      const qDesc = `Download verified university study notes, course packs, and solutions for ${q} on LastBench. Free inline PDF preview, zero paywalls.`;
      return {
        title: qTitle,
        description: qDesc,
        alternates: {
          canonical: `/notes?q=${encodeURIComponent(q)}`,
        },
        openGraph: {
          title: qTitle,
          description: qDesc,
          url: `https://www.lastbench.online/notes?q=${encodeURIComponent(q)}`,
        },
      };
    }
    return {
      title: 'Study Notes Archive - LastBench',
      description: 'Explore comprehensive engineering study notes, lecture digests, and exam guides across universities and branches.',
      alternates: {
        canonical: '/notes',
      },
    };
  }

  try {
    const { data } = await supabase
      .from('materials')
      .select('id, title, name, subject, university, branch, semester, year')
      .eq('id', v)
      .single();

    if (data) {
      const title = data.title || data.name || 'Study Note';
      const university = data.university || '';
      const subject = data.subject || '';
      
      const fullTitle = `${title} ${subject ? '- ' + subject : ''} | LastBench`;
      const description = `Download ${title} ${university ? 'for ' + university : ''} completely free on LastBench. Access comprehensive engineering lecture digests and verified notes.`;
      const docCanonical = `/notes?v=${encodeURIComponent(v)}`;

      return {
        title: fullTitle,
        description: description,
        alternates: {
          canonical: docCanonical,
        },
        openGraph: {
          title: fullTitle,
          description: description,
          url: `https://www.lastbench.online${docCanonical}`,
          type: 'article',
        },
        twitter: {
          card: 'summary_large_image',
          title: fullTitle,
          description: description,
        },
      };
    }
  } catch (e) {
    console.error("Failed to generate metadata for note", e);
  }

  return {
    title: 'Study Note - LastBench',
    alternates: {
      canonical: `/notes?v=${encodeURIComponent(v)}`,
    },
  };
}

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const v = typeof searchParams.v === 'string' ? searchParams.v.trim() : undefined;

  let initialNotes: Note[] = [];
  let targetedDoc: Note | null = null;

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // 1. If a specific doc is requested via ?v=<id>, fetch it server-side first
      if (v) {
        const { data: docData } = await supabase
          .from('materials')
          .select('id, title, name, category, subject, university, university_short, branch, semester, year, download_url, file_url, uploaded_by, uploaded_at')
          .eq('id', v)
          .single();

        if (docData) {
          targetedDoc = {
            id: docData.id,
            title: docData.title || docData.name || '',
            name: docData.name || docData.title || '',
            description: '',
            subject: docData.subject || '',
            semester: docData.semester || '',
            university: docData.university || '',
            branch: docData.branch || '',
            year: docData.year || '',
            downloadUrl: docData.download_url || docData.file_url || '',
            fileUrl: docData.file_url || docData.download_url || '',
            uploadedBy: docData.uploaded_by || '',
            uploadedAt: docData.uploaded_at || '',
          };
        }
      }

      // 2. Pre-fetch the latest 20 notes for instant SSR feed
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

      // If targetedDoc exists and isn't already in initialNotes, prepend it
      if (targetedDoc && !initialNotes.some(n => n.id === targetedDoc!.id)) {
        initialNotes = [targetedDoc, ...initialNotes];
      }
    }
  } catch (err) {
    console.error('Failed to pre-fetch notes on server:', err);
  }

  // Generate structured JSON-LD for Search Engines
  const jsonLd = targetedDoc ? {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: targetedDoc.title || targetedDoc.name,
    description: `Engineering study notes and curriculum lecture material for ${targetedDoc.subject || targetedDoc.title} at ${targetedDoc.university || 'SPPU'}.`,
    educationalLevel: targetedDoc.year || 'Higher Education / B.Tech Engineering',
    about: targetedDoc.subject,
    educationalUse: 'Lecture Notes and Exam Revision',
    inLanguage: 'en',
    provider: {
      '@type': 'Organization',
      name: 'LastBench',
      url: 'https://www.lastbench.online',
    },
    encodingFormat: 'application/pdf',
    url: `https://www.lastbench.online/notes?v=${targetedDoc.id}`,
    datePublished: targetedDoc.uploadedAt || undefined,
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {/* Crawlable server-rendered semantic fallback for search bots */}
      {targetedDoc ? (
        <article className="sr-only" aria-label="Study Note Details">
          <h1>{targetedDoc.title || targetedDoc.name}</h1>
          <p>
            Subject: {targetedDoc.subject} | University: {targetedDoc.university} | Branch: {targetedDoc.branch} | Semester: {targetedDoc.semester}
          </p>
          <a href={targetedDoc.downloadUrl || targetedDoc.fileUrl} download>
            Download PDF: {targetedDoc.title || targetedDoc.name}
          </a>
        </article>
      ) : (
        initialNotes.length > 0 && (
          <nav className="sr-only" aria-label="Latest Study Notes">
            <h2>Latest Engineering Course Packs and Study Notes</h2>
            <ul>
              {initialNotes.map((item) => (
                <li key={item.id}>
                  <a href={`/notes?v=${item.id}`}>
                    {item.title || item.name} ({item.subject} - {item.university})
                  </a>
                  {(item.downloadUrl || item.fileUrl) && (
                    <a href={item.downloadUrl || item.fileUrl} download>
                      Download PDF: {item.title || item.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )
      )}
      <NotesClient initialNotes={initialNotes} />
    </>
  );
}
