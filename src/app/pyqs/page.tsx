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
  const v = typeof searchParams.v === 'string' ? searchParams.v.trim() : undefined;
  const q = typeof searchParams.q === 'string' ? searchParams.q.trim() : undefined;

  if (!v || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (q) {
      const qTitle = `${q} PYQs & University Question Papers | LastBench`;
      const qDesc = `Download solved university question papers (PYQs) and model answer schemes for ${q} on LastBench. Free PDF preview, no paywalls.`;
      return {
        title: qTitle,
        description: qDesc,
        alternates: {
          canonical: `/pyqs?q=${encodeURIComponent(q)}`,
        },
        openGraph: {
          title: qTitle,
          description: qDesc,
          url: `https://www.lastbench.online/pyqs?q=${encodeURIComponent(q)}`,
        },
      };
    }
    return {
      title: 'Previous Year Question Papers (PYQs) - LastBench',
      description: 'Find past exam question papers from top engineering universities including SPPU and DBATU.',
      alternates: {
        canonical: '/pyqs',
      },
    };
  }

  try {
    const { data } = await supabase
      .from('materials')
      .select('id, title, name, subject, university, year, exam_year, branch, semester')
      .eq('id', v)
      .single();

    if (data) {
      const title = data.title || data.name || 'PYQ Paper';
      const university = data.university || '';
      const subject = data.subject || '';
      const year = data.exam_year || data.year || '';
      
      const fullTitle = `${title} ${year ? '(' + year + ')' : ''} | LastBench`;
      const description = `Download ${title} ${university ? 'for ' + university : ''} completely free on LastBench. Features 100% option-complete model solutions and examiner marking schemes.`;
      const docCanonical = `/pyqs?v=${encodeURIComponent(v)}`;

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
    console.error("Failed to generate metadata for PYQ", e);
  }

  return {
    title: 'PYQ Paper - LastBench',
    alternates: {
      canonical: `/pyqs?v=${encodeURIComponent(v)}`,
    },
  };
}

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const v = typeof searchParams.v === 'string' ? searchParams.v.trim() : undefined;

  let initialPYQs: PYQ[] = [];
  let targetedDoc: PYQ | null = null;

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // 1. If a specific PYQ is requested via ?v=<id>, fetch it server-side first
      if (v) {
        const { data: docData } = await supabase
          .from('materials')
          .select('id, title, name, category, subject, university, university_short, branch, semester, year, exam_year, download_url, file_url, uploaded_by, uploaded_at')
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
            year: docData.year || docData.exam_year || '',
            examYear: docData.exam_year || docData.year || '',
            downloadUrl: docData.download_url || docData.file_url || '',
            fileUrl: docData.file_url || docData.download_url || '',
            uploadedBy: docData.uploaded_by || '',
            uploadedAt: docData.uploaded_at || '',
          };
        }
      }

      // 2. Pre-fetch the latest 20 PYQs for instant SSR feed
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

      // If targetedDoc exists and isn't already in initialPYQs, prepend it
      if (targetedDoc && !initialPYQs.some(p => p.id === targetedDoc!.id)) {
        initialPYQs = [targetedDoc, ...initialPYQs];
      }
    }
  } catch (err) {
    console.error('Failed to pre-fetch PYQs on server:', err);
  }

  // Generate structured JSON-LD for Search Engines
  const jsonLd = targetedDoc ? {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: targetedDoc.title || targetedDoc.name,
    description: `Official solved university question paper and marking scheme for ${targetedDoc.subject || targetedDoc.title} at ${targetedDoc.university || 'SPPU'}.`,
    educationalLevel: targetedDoc.examYear || targetedDoc.year || 'Higher Education / Engineering Exam',
    about: targetedDoc.subject,
    educationalUse: 'University Question Paper Solution and Model Answers',
    inLanguage: 'en',
    provider: {
      '@type': 'Organization',
      name: 'LastBench',
      url: 'https://www.lastbench.online',
    },
    encodingFormat: 'application/pdf',
    url: `https://www.lastbench.online/pyqs?v=${targetedDoc.id}`,
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
        <article className="sr-only" aria-label="Solved Question Paper Details">
          <h1>{targetedDoc.title || targetedDoc.name}</h1>
          <p>
            Subject: {targetedDoc.subject} | University: {targetedDoc.university} | Branch: {targetedDoc.branch} | Semester: {targetedDoc.semester} | Exam Year: {targetedDoc.examYear || targetedDoc.year}
          </p>
          <a href={targetedDoc.downloadUrl || targetedDoc.fileUrl} download>
            Download Solved PDF: {targetedDoc.title || targetedDoc.name}
          </a>
        </article>
      ) : (
        initialPYQs.length > 0 && (
          <nav className="sr-only" aria-label="Latest Solved Question Papers">
            <h2>Latest Solved Engineering Question Papers (PYQs)</h2>
            <ul>
              {initialPYQs.map((item) => (
                <li key={item.id}>
                  <a href={`/pyqs?v=${item.id}`}>
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
      <PYQsClient initialPYQs={initialPYQs} />
    </>
  );
}
