# LastBench Course Pack Publishing Specification & Engineering Standard

> **Document Version:** 2.0  
> **Status:** Authoritative Standard  
> **Target Products:** University Course Packs (SPPU, MU, DBATU, Autonomous Engineering Institutes)  
> **Publishing Pipeline:** Modular Python HTML Generator $\rightarrow$ Server-Side KaTeX $\rightarrow$ Chromium/Puppeteer $\rightarrow$ PyPDF Postprocessing $\rightarrow$ AWS S3 / Firestore / Supabase

---

## 1. Executive Architecture & Pipeline Overview

All LastBench publication-grade academic course packs are built using a **headless Chromium / KaTeX / Post-processing pipeline**. Legacy ReportLab Platypus scripts are deprecated because they lack native CSS flexbox/grid layout, cannot accurately format complex multi-page academic tables, fail on web-standard fonts, and leak LaTeX math tokens.

### The 8-Stage Build Pipeline

```
[Curriculum Question Bank & SVG Engine]
         │
         ▼
 1. generate_unit{N}_html.py
    ├── Generates raw HTML with embedded CSS, IBM Plex/Source Serif fonts
    ├── Assembles 14 comprehensive model answers (~1.5–2 pages each)
    ├── Injects clean inline vector SVGs for all architectural diagrams
    └── Appends the 1-page High-Yield Revision Sheet
         │
         ▼
 2. render_math.js (KaTeX Server-Side Pre-Rendering)
    ├── Converts all inline ($...$) and display ($$...$$) LaTeX expressions
    └── Outputs unit{N}_rendered.html (ZERO raw LaTeX tokens remain)
         │
         ▼
 3. render_pdf.js (Headless Puppeteer / Chromium)
    ├── Loads local woff2 fonts and KaTeX CSS
    ├── Evaluates page breaks and typographic orphans/widows
    └── Exports print-perfect vector A4 PDF to out/COA_Unit{N}.pdf
         │
         ▼
 4. mask_page1_header (build.py)
    ├── Suppresses running header on Page 1 (Chapter Title opener)
    └── Injects PDF document metadata (Author, Title, Subject, Creator)
         │
         ▼
 5. postprocess_pdf.py (PyPDF Vector Link Injection)
    ├── Injects clickable PDF link annotations on running headers/footers
    ├── Wraps QR code in active bounding-box link annotation
    └── Generates hierarchical PDF Table of Contents bookmarks
         │
         ▼
 6. check_math_leak.py (Quality Build Gate 1)
    └── Scans extracted PDF text; FAILS build if any unrendered LaTeX tokens exist
         │
         ▼
 7. report_page_fill.py (Quality Build Gate 2)
    └── Measures question answer heights; asserts 1.50 to 2.00 pages per question
         │
         ▼
 8. render_pages.py (Visual Verification Contact Sheet)
    └── Renders pages to 130 DPI images and creates a 4-column master contact sheet
```

---

## 2. Design System & Visual Tokens

The design system is strictly enforced across all units and subjects to maintain instant visual recognition and institutional authority.

### Color Palette

| Token | Hex Value | Role / Usage |
| :--- | :--- | :--- |
| `--ink` | `#0B1020` | Midnight Ink. Primary headers, chapter titles, primary borders, strong emphasis |
| `--body` | `#1F2433` | Deep Slate. High-legibility body prose, paragraph text |
| `--muted` | `#5B6275` | Cool Gray. Running headers/footers, metadata tags, micro-labels, figure captions |
| `--rule` | `#D9D4C7` | Bone Rule. Subtle horizontal rules, card borders, table grid lines |
| `--surface` | `#F3EEE4` | Warm Parchment. Callout background fills, definition blocks |
| `--surface-subtle` | `#F8F6F0` | Light Parchment. Table header backgrounds, practice numerical card fills |
| `--accent` | `#FFB02E` | Deep Amber. Exam tips, key rubric highlights, section indicator bars |
| `--danger` | `#8B2500` | Brick Red. Examiner trap callouts, common student pitfalls |
| `--paper` | `#FFFFFF` | Pure White background canvas |

### Typography System (Embedded Local WOFF2 Only)

No system fallback fonts (e.g., Apple System, Arial) may be relied upon for primary layout. All fonts must load from `theme/fonts/`:

| Role | Font Family | Weights | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- |
| **Body Prose** | `Source Serif 4` | 400 (Regular), 400i (Italic), 600 (Semibold), 700 (Bold) | `1.55` | `0` |
| **Headings & UI** | `IBM Plex Sans` | 400, 600, 700 | `1.20 – 1.30` | `-0.01em` |
| **Code, RTL & Math Tags** | `IBM Plex Mono` | 400, 600 | `1.40` | `0` |
| **Equations & Symbols** | `KaTeX Fonts` | Pre-rendered via KaTeX CSS | Standard KaTeX | — |

### Spacing Scale
Layout spacing follows a strict 4pt baseline grid:
- `--space-4`: `4pt`
- `--space-8`: `8pt`
- `--space-12`: `12pt`
- `--space-16`: `16pt`
- `--space-24`: `24pt`
- `--space-32`: `32pt`
- `--space-48`: `48pt`

### Page Geometry (`@page`)
- **Page Size**: A4 (`210mm` $\times$ `297mm`)
- **Page Margins**: `margin: 20mm 20mm 22mm 20mm;`
- **Orphans & Widows**: Set to `3` globally on all paragraph tags.
- **Page Breaks**:
  - Questions MUST start with `break-before: page;` (or `.qa-card { break-before: page; }`).
  - Section titles and question header blocks MUST have `break-after: avoid;`.
  - Figures, callout boxes, and rubric blocks MUST have `break-inside: avoid;`.

---

## 3. Standard Question Bank Architecture (1.50 – 2.00 Pages per Answer)

Each unit contains **14 comprehensive, university-aligned model exam questions** (accounting for ~25–28 pages of the unit pack).

### The Strict 8-Point Model Answer Rubric

Every model answer must implement all 8 structural layers in order:

```html
<div class="qa-card">
  <!-- 1. Header Block -->
  <div class="qa-header-block">
    <div class="qa-micro-label">QUESTION {N} • {MARKS} MARKS • {TOPIC}</div>
    <h3 class="qa-question-title">{Full University Question Title}</h3>
    <div class="qa-tag-row">
      <span class="tag-marks">{MARKS} Marks</span> •
      <span>SPPU May 2023</span> • <span>MU Dec 2022</span> • <span>Bloom's: Analyze</span>
    </div>
  </div>

  <!-- 2. Executive Principle (High-density 1-paragraph summary) -->
  <div class="callout callout-definition">
    <span class="callout-label">Core Principle & Exam Takeaway</span>
    <p>Dense technical summary defining the architecture, governing law, or protocol...</p>
  </div>

  <!-- 3. Architectural Vector Diagram (Clean inline SVG) -->
  <div class="figure-block">
    <svg ...>...</svg>
    <div class="figure-caption">Figure N.1: Architectural Block Diagram & Signal Interconnects.</div>
  </div>

  <!-- 4. Deep Theoretical Breakdown / Mathematical Derivation -->
  <div class="qa-content-block">
    <h4 class="qa-subhead">1. Mathematical Foundation & Working Architecture</h4>
    <p>In-depth technical explanation, RTL transfers, and formal equations...</p>
  </div>

  <!-- 5. Step-by-Step Execution Trace / State Table / Micro-operation Sequence -->
  <div class="qa-content-block">
    <h4 class="qa-subhead">2. Step-by-Step Cycle Execution Trace</h4>
    <table class="data-table">...</table>
  </div>

  <!-- 6. Comparative Parameter Analysis Table (5 to 8 Parameters) -->
  <div class="qa-content-block">
    <h4 class="qa-subhead">3. Architectural Comparative Matrix</h4>
    <table class="data-table">...</table>
  </div>

  <!-- 7. Examiner Mark Breakdown Rubric -->
  <div class="rubric-box">
    <div class="rubric-title">University Examiner Evaluation Rubric</div>
    <div class="rubric-grid">
      <div class="rubric-item"><strong>Architecture Diagram:</strong> 2 Marks</div>
      <div class="rubric-item"><strong>Working Principle:</strong> 3 Marks</div>
      <div class="rubric-item"><strong>Step Execution:</strong> 3 Marks</div>
      <div class="rubric-item"><strong>Derivation & Summary:</strong> 2 Marks</div>
    </div>
  </div>

  <!-- 8. Self-Assessment Practice Numerical (Boxed Result) -->
  <div class="practice-box">
    <div class="practice-title">Extra Practice Problem (Self-Assessment)</div>
    <p class="practice-desc">Problem statement with realistic engineering values...</p>
    <div class="boxed-result">Final Answer: AMAT = 2.4 ns (Speedup = 4.16x)</div>
  </div>
</div>
```

### Page Budget Rules
- **Minimum Page Fill**: `1.50` physical printed pages (no shallow 1-page summaries).
- **Maximum Page Fill**: `2.00` physical printed pages (must not spill onto a 3rd page with 2 orphaned lines).
- Questions must be sized by text density, table row count, and SVG height so the Puppeteer renderer produces an exact 2-page spread per question.

---

## 4. SVG Diagram Engineering Standards

All architectural diagrams, flowcharts, and datapath schematics must be **pure inline vector SVGs**.

### Technical Rules:
1. **ViewBox & Sizing**:
   - Standard width: `600px` to `650px`. Standard height: `180px` to `260px`.
   - SVG must use `viewBox="0 0 W H"` and CSS `width: 100%; height: auto; max-height: 220pt;`.
2. **Color Palette**:
   - Primary strokes: `#0B1020` (stroke width `1pt` to `1.5pt`).
   - Block backgrounds: `#F8F6F0` (neutral block), `#EBF3FB` (control/ALU), `#FEF7ED` (cache/registers).
   - Accents & Highlights: `#FFB02E` (active buses, critical paths).
   - Annotation text: `#5B6275` or `#0B1020`.
3. **Typography**:
   - `font-family="IBM Plex Sans, sans-serif"` for labels.
   - `font-family="IBM Plex Mono, monospace"` for bit widths, signals, and opcodes.
   - Text sizes: `8pt` for primary labels, `7pt` for signal annotations, `6.5pt` for bus bit-widths.
4. **Crisp Rendering**:
   - Use `shape-rendering="crispEdges"` on rectilinear boxes and buses to prevent sub-pixel blur.
   - Include standard SVG arrow markers (`<marker id="arrow" ...>`) for directed flow arrows.

---

## 5. Math Rendering Pipeline (KaTeX Server-Side)

### The Zero-Leak Guarantee
Raw LaTeX markup printed literally into PDFs (e.g. `$2\times$`, `\frac{A}{B}`, `_{i}`, `\sqrt{}`) is a blocking defect.

### Build Implementation:
- **Script**: `build/render_math.js`
- **Regex Patterns**:
  - Display Math: `/\$\$([\s\S]*?)\$\$/g` $\rightarrow$ `katex.renderToString(tex, { displayMode: true, throwOnError: false })`
  - Inline Math: `/\$([^$\n]+?)\$/g` $\rightarrow$ `katex.renderToString(tex, { displayMode: false, throwOnError: false })`
- **Scope**: Applied to the entire HTML string, including inside:
  - `<h1..h6>` headings and question titles
  - `<td>` and `<th>` table cells
  - `.callout` and `.rubric-box` text
  - Tag rows and micro-labels

### Build Gate Assertion (`build/check_math_leak.py`):
Extracts text from all pages of each compiled PDF using `pypdf`. Fails the build immediately with exit code 1 if any of the following tokens appear:
```python
LEAK_TOKENS = [
    r"$", r"\frac", r"\text", r"\times", r"\sqrt", 
    r"\lambda", r"\tau", r"\mathbf", r"\ceil", 
    r"_{", r"^{", r"\cdot", r"\approx"
]
```

---

## 6. QR Code & Deep-Link Dual Navigation Standards

Every course pack module includes interactive links and high-density 2D barcodes connecting readers directly to the LastBench platform.

### Standard URL Scheme:
```
https://lastbench.online/notes?q={Subject+Query}&utm_source=pdf&utm_medium={pack-slug}&utm_campaign=unit{N}
```
*Example for COA Unit 1:*  
`https://lastbench.online/notes?q=Computer+Organization+and+Architecture&utm_source=pdf&utm_medium=coa-pack&utm_campaign=unit1`

### QR Code Generator Requirements (`build/qrcode_gen.py`):
1. **Engine**: Standard ISO/IEC 18004 QR generator (`reportlab.graphics.barcode.qr.QrCodeWidget`).
2. **Quiet Zone**: Mandatory **4-module white margin** around the entire QR matrix. Hand-rolled QR algorithms missing quiet zones or RS codeword interleaving are prohibited.
3. **Colors**: `#0B1020` modules on `#FFFFFF` background.
4. **Dual Accessibility**:
   - **Mobile Users**: Scannable via camera at standard printed distances.
   - **Laptop/Tablet Users**: SVG wrapped in an active HTML hyperlink `<a href="{url}" target="_blank">` and backed by a PyPDF Annotation Rectangle so clicking anywhere on the QR code opens the notes view.

---

## 7. 1-Page High-Yield Revision Sheet Standard

Placed on the final page of every unit module (`break-before: page;`):
1. **Header Banner**: "HIGH-YIELD REVISION SHEET • FORMULAS & EXAM ESSENTIALS"
2. **2-Column Layout**:
   - **Column 1**: Key Mathematical Formulas, Derivations, and Speed Rules.
   - **Column 2**: Architectural Acronyms, Registers, and Examiner Gotchas/Pitfalls.
3. **Scannable QR Card**:
   - Crisp 60x60mm vector QR code with caption: *"Scan for PYQ solutions, animated simulations & online quizzes on LastBench"*.
4. **Page Constraint**: Exactly 1 printed page. Must never spill onto a subsequent page.

---

## 8. Directory Structure & File Conventions

When adding or generating a new Course Pack, follow this directory layout:

```
lastbench/
├── build/
│   ├── build.py                  # Master CLI build runner
│   ├── publish_coursepack.js     # Automated S3, Firestore & Supabase publisher
│   ├── check_math_leak.py        # Math leak verification gate
│   ├── postprocess_pdf.py        # Header/Footer links & PDF outline injector
│   ├── qrcode_gen.py             # ISO/IEC 18004 QR code SVG generator
│   ├── render_math.js            # Server-side KaTeX pre-renderer
│   ├── render_pages.py           # PNG rasterizer & contact sheet generator
│   ├── render_pdf.js             # Puppeteer/Chromium print renderer
│   ├── report_page_fill.py       # 1.50–2.00 answer page fill analyzer
│   │
│   ├── generate_unit{1..N}_html.py  # Unit HTML assemblers
│   ├── generate_unit{1..N}_svgs.py  # Unit vector SVG diagram generators
│   ├── unit{1..N}_qdata.py          # Unit 14-question structured data banks
│   └── unit{1..N}_revision.py       # Unit 1-page high-yield revision sheets
│
├── content/                      # Intermediate generated HTML files (cached)
│   ├── unit{N}.html
│   └── unit{N}_rendered.html
│
├── out/                          # Final compiled artifacts
│   ├── COA_Unit{N}.pdf           # Production PDFs
│   └── COA_Unit{N}_contact.png   # 4-column visual proof sheets
│
├── public/documents/             # Mirrored static copies for web downloads
│   └── COA_Unit_{N}_*.pdf
│
├── theme/                        # Design system & fonts
│   ├── theme.css                 # Master typography, variables, layout
│   ├── fonts.css                 # @font-face rules for local woff2 files
│   ├── fonts/                    # Source Serif 4, IBM Plex Sans, IBM Plex Mono
│   ├── katex/                    # KaTeX minified CSS & font files
│   └── components/               # Modular CSS (callouts, tables, code, qa-header)
│
└── theme/                        # Design system & fonts
    ├── theme.css                 # Master typography, variables, layout
    ├── fonts.css                 # @font-face rules for local woff2 files
    ├── fonts/                    # Source Serif 4, IBM Plex Sans, IBM Plex Mono
    └── components/               # Modular CSS (callouts, tables, code, qa-header)
```

---

## 9. Runbook: Generating & Publishing a Course Pack

### Step 1: Build & Verify Modules
Run the master build runner using the project virtual environment:
```bash
# Build all 6 units
./venv/bin/python3 build/build.py all

# Or build a specific unit
./venv/bin/python3 build/build.py 1
```

### Verification Criteria:
Every unit output must report:
- `LINKS: PASS` (100% of pages contain valid link annotations)
- `MATH: PASS` (0 unrendered LaTeX tokens in extracted PDF text)
- `PAGE-FILL: PASS` (All 14 model answers between 1.50 and 2.00 pages)

### Step 2: Publish to Production
Upload binaries to AWS S3, register Firestore metadata, and index rows in Supabase:
```bash
node build/publish_coursepack.js
```

### Step 3: Verify Search Indexing
Query the Supabase full-text search engine to confirm search availability:
```bash
node -e '
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from("materials").select("id, title, file_url").ilike("title", "%COA Unit%").then(r => console.log(r.data));
'
```

---

## 10. Token-Optimized Authoring Standard

To minimize LLM token overhead by **70–80%** when authoring new subjects:

1. **Use `build/common_engine.py`**:
   - Never output repetitive HTML tags, styling boilerplate, or `<article>` wrappers in LLM prompts.
   - Author purely structured data dictionaries adhering to `skeleton`:
     ```python
     from common_engine import render_coursepack_document, render_model_answer
     ```

2. **Automated LaTeX Sanitizer in `build/render_math.js`**:
   - KaTeX parsing issues (`\mathbf{\text{...}}`, trailing `}}`, `%` in `\text{}`) are automatically sanitized pre-flight by `render_math.js`. No token-heavy manual regex edit turns are needed.

3. **Standard Component Word/Character Budget (Turn-1 1.5–2.0 Page Guarantee)**:
   - `direct_answer`: 60–80 words
   - `explanation`: 220–260 words + 4–6 display math equations
   - `advantages_tradeoffs`: 6–8 rows $\times$ 3 columns table
   - `practice_problem` & `practice_answer`: 40–50 words + 2 lines of verified math
   - This calibration guarantees a vertical fill of 1.60–1.75 pages on the initial generation, eliminating trial-and-error rebuild cycles.
