# LastBench — Distributed Academic Collaboration & Study Intelligence Platform

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.0-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![AWS S3](https://img.shields.io/badge/AWS-S3%20Presigned-569A31?style=flat&logo=amazon-s3)](https://aws.amazon.com/s3/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![Cloudflare Turnstile](https://img.shields.io/badge/Cloudflare-Turnstile%20Bot%20Defense-F38020?style=flat&logo=cloudflare)](https://www.cloudflare.com/products/turnstile/)
[![Traction](https://img.shields.io/badge/Pageviews-1K%2B%20%2F%20mo-success)](https://www.lastbench.online)
[![Active Users](https://img.shields.io/badge/WAU-30%2B%20users-blue)](https://www.lastbench.online)

An open-access, production-grade academic repository and document intelligence platform built for engineering students across 25+ Maharashtra technical universities (SPPU, DBATU, MU, etc.). LastBench delivers sub-50ms catalog searches across 730+ verified study materials, zero-server-overhead document uploads, multimodal AI document indexing, and an interactive study community.

**Traction & Reach:** Scaled organically to **1,000+ page views in <30 days** post-launch with **30+ weekly active users (WAU)** via Google Search Console indexing and dynamic Next.js SSR metadata optimization.

---

## 🏗️ Architecture & Ingestion Pipeline

```
                                  [ Client Browser ]
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
         [ Document Upload ]                             [ Catalog Query ]
                  │                                               │
   [ Adaptive PDF Sampler (pdf-lib) ]                    [ 300ms Search Debounce ]
   (Drops 40MB scan to <300KB payload)                            │
                  │                                               ▼
                  ├──────────────────────────────┐       [ toSearchQuery() ]
                  ▼                              ▼       (Prefix-aware tsquery)
       [ Inline Base64 Analysis ]       [ S3 Staging Fallback ]   │
                  │                     (ai-temp/ bucket presign) │
                  ▼                              │                ▼
      [ Google Gemini 2.5 Flash ] ◄──────────────┘       [ Supabase PostgreSQL ]
      (Subject, Pattern, Syllabus,                       (GIN search_vector index)
       Uni & Branch Normalization)                                │
                  │                                               ▼
                  ▼                                      [ Sub-50ms Fast Results ]
    [ Direct S3 Presigned POST Ingestion ]
    (Zero server RAM usage, 100MB ceiling)
                  │
                  ▼
      [ Verification & Atomic Sync ]
    ┌─────────────┴─────────────┐
    ▼                           ▼
[ Firebase Firestore ]   [ Supabase PostgreSQL ]
(Metadata & User Stats)    (FTS Indexed Catalog)
```

---

## ⚡ Core Engineering Highlights

### 1. Multimodal AI Document Metadata Extraction
- Integrated **Google Gemini 2.5 Flash API** to classify, normalize, and extract academic metadata from scanned exams and lecture slides (University, Branch, Pattern, Exam Year, Semester, and Units Covered).
- Designed an **isomorphic adaptive milestone sampling engine** (`pdfSampler.ts`) using `pdf-lib` featuring a progressive 4-tier sampling strategy (`6 Evenly Spaced Pages` ➔ `3 Milestones` ➔ `First 2 Pages` ➔ `Page 1`).
- Dynamically reduces 40MB+ high-DPI scans into **<300KB payloads**, completely eliminating Vercel Serverless Function 4.5MB request body ceiling errors while retaining 95%+ extraction accuracy.
- Seamless S3 staging fallback (`ai-temp/` presigned storage) for large presentation files and high-density documents.

### 2. Hybrid Dual-Database Architecture
- **Firebase Firestore**: Manages real-time application state, bookmarking, upvoting/helpfulness counters, user role-based access control (RBAC), and community leaderboard metrics.
- **Supabase (PostgreSQL with Full-Text Search)**: Powers the high-throughput academic search catalog using PostgreSQL `tsvector` and prefix-aware `tsquery` tokenization (`chem:* & unit:*`), delivering **<50ms latency** on partial and multi-keyword queries.
- Atomic dual-write sync pipeline ensures document integrity between NoSQL real-time storage and relational search indices.

### 3. Zero-Server Direct S3 Ingestion Pipeline
- Engineered client-to-storage direct uploads using **AWS S3 Presigned POST** policies, completely bypassing API gateway memory limits and reducing server bandwidth costs to zero.
- Enforces strict server-side MIME type verification and size restrictions (100MB ceiling) directly within S3 upload policies.
- Automated client-side canvas image downsampling (`compressImageForAI`) for fast thumbnail previews.

### 4. Defense-in-Depth & Code Governance
- **Bot Mitigation**: Cloudflare Turnstile integration across all mutation endpoints (uploads, requests, admin operations).
- **Sliding-Window Rate Limiting**: In-memory LRU-cached sliding window rate limiting (`lru-cache`) to throttle bursts and protect AI/storage endpoints from abuse.
- **Strict Data Scrubbing & Privacy**: Public API projections automatically strip uploader PII and sanitize input paths.
- **Auditing Pipelines**: Automated catalog verification scripts (`audit_materials.js`, `repair_and_sync_materials.js`) guaranteeing zero broken links, ghost records, or unnormalized university taxonomy across 730+ assets.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router, Turbopack, SSR), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Framer Motion |
| **Backend & APIs** | Next.js Serverless Route Handlers, Firebase Admin SDK, AWS SDK v3, Supabase Client |
| **Databases** | Supabase (PostgreSQL with GIN Full-Text Indexing), Firebase Firestore |
| **AI & Document Processing** | Google Gemini 2.5 Flash API, `pdf-lib` (Isomorphic sampling) |
| **Cloud & Storage** | AWS S3 (Presigned POST), Vercel Serverless Edge, Cloudflare Turnstile |
| **Data Fetching & State** | TanStack React Query v5, LRU Cache, Custom React Contexts (Auth, Bookmarks) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm
- AWS Account (S3 Bucket)
- Firebase Project (Auth & Firestore)
- Supabase Project (PostgreSQL)
- Google Gemini API Key
- Cloudflare Turnstile Site Key

### 1. Clone & Install
```bash
git clone https://github.com/Rohankashid/lastbench.git
cd lastbench
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the project root:
```env
# Firebase Public
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Supabase (PostgreSQL)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AWS S3 Storage
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET_NAME=your_s3_bucket_name

# AI & Security
GEMINI_API_KEY=your_gemini_api_key
TURNSTILE_SECRET=your_turnstile_secret_key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
ADMIN_USER_EMAILS=admin@lastbench.in
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📁 Repository Structure

```
src/
├── app/
│   ├── api/                   # Serverless route handlers (AI, S3 presign, Supabase catalog, requests)
│   │   ├── ai/                # Gemini metadata extraction & temporary staging
│   │   ├── upload/            # Presigned POST issuance and dual-write confirmation
│   │   ├── materials/         # Catalog search & filtering endpoints
│   │   └── leaderboard/       # Real-time contributor ranking
│   ├── notes/                 # SSR study notes archive with dynamic OG metadata
│   ├── pyqs/                  # SSR previous-year question papers archive
│   ├── upload/                # Multi-stage upload workflow with Turnstile & AI auto-fill
│   └── leaderboard/           # Community leaderboard & contributor analytics
├── components/                # Reusable UI primitives, modals, and layout containers
├── context/                   # Global auth and bookmark React contexts
├── hooks/                     # Custom React hooks (useAuth, useDebounce)
├── lib/
│   ├── ai/                    # Gemini API extractor & isomorphic PDF milestone sampler
│   ├── constants/             # Maharashtra academic taxonomy (25+ universities, branch groups)
│   ├── rateLimit.ts           # Sliding-window LRU rate limiter
│   ├── search.ts              # Prefix-aware PostgreSQL tsquery formatter
│   └── supabase.ts            # Supabase PostgreSQL client configuration
└── scripts/                   # Data auditing, migration, and normalization utilities
```

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
