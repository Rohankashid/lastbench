# LastBench Engineering & Course Pack Publishing Guidelines

This project contains the Next.js web platform for LastBench (`lastbench.online`) as well as the **Academic Publishing Engine** that produces high-yield, publication-grade university course packs and study notes.

For the full detailed specifications, refer to [COURSE_PACK_SPECIFICATION.md](file:///Users/rohan/Desktop/lastbench/COURSE_PACK_SPECIFICATION.md).

---

## 1. Core Architecture Rules

1. **Headless Chromium & KaTeX Engine (Mandatory)**:
   - NEVER use ReportLab Platypus (`SimpleDocTemplate`, `Paragraph`, etc.) for generating course packs or multi-page study guides.
   - All course packs must use the HTML + CSS $\rightarrow$ KaTeX (`render_math.js`) $\rightarrow$ Puppeteer (`render_pdf.js`) $\rightarrow$ PyPDF (`postprocess_pdf.py`) pipeline located in `build/`.
   - Python virtual environment is at `./venv/bin/python3`. Always use `./venv/bin/python3` for build scripts requiring `reportlab`, `pypdf`, or `PIL`.

2. **Zero Math Leaks**:
   - Inline math (`$...$`) and display math (`$$...$$`) must ALWAYS be pre-rendered to HTML/CSS via KaTeX server-side before Chromium renders the PDF.
   - Raw LaTeX tokens (`$`, `\frac`, `\text`, `\times`, `\sqrt`, `\lambda`, `\tau`, `\mathbf`, `\ceil`, `_{`, `^{`) must NEVER appear in the compiled PDF text.
   - The build gate `build/check_math_leak.py` must pass with 0 hits.

3. **Question Bank 1.50 – 2.00 Page Standard**:
   - Each unit contains 14 model answers.
   - Every answer must follow the 8-point rubric:
     1. Header block (micro-label, university tags, marks)
     2. Core principle executive callout
     3. Crisp vector SVG diagram
     4. Theoretical/mathematical breakdown
     5. Step-by-step cycle execution trace or state table
     6. Comparative parameter matrix
     7. Examiner mark breakdown rubric (`[2 Marks]`, `[3 Marks]`, etc.)
     8. Self-assessment practice problem with boxed result
   - Target answer length must strictly fill **1.50 to 2.00 printed pages** (no 1-page stubs, no accidental 3-page spillover with 2 orphaned lines).

4. **Scannable QR Codes & Dual Navigation**:
   - Use `build/qrcode_gen.py` backed by `reportlab.graphics.barcode.qr.QrCodeWidget`.
   - Strict **4-module quiet zone** (white margin) is required for camera scan recognition.
   - Deep-link format: `https://lastbench.online/notes?q={Subject}&utm_source=pdf&utm_medium={pack-slug}&utm_campaign=unit{N}`.
   - Wrap QR in `<a href="..." target="_blank">` so desktop/tablet PDF users can click it directly.

5. **Design System & Palette**:
   - Ink: `#0B1020`
   - Body: `#1F2433`
   - Muted: `#5B6275`
   - Rule: `#D9D4C7`
   - Surface: `#F3EEE4`
   - Accent: `#FFB02E`
   - Typography: Local embedded WOFF2 files only (`theme/fonts/`): `Source Serif 4`, `IBM Plex Sans`, `IBM Plex Mono`.

---

## 2. Directory Hygiene & Build Conventions

- **Generator Scripts**: Place in `build/` following the symmetrical structure:
  - `generate_unit{N}_html.py`
  - `generate_unit{N}_svgs.py`
  - `unit{N}_qdata.py`
  - `unit{N}_revision.py`
- **Output Artifacts**: Placed in `out/` (`out/COA_Unit{N}.pdf`, `out/COA_Unit{N}_contact.png`).
- **Temporary / Intermediate Files**:
  - `content/` holds intermediate HTML.
  - Do NOT commit heavy raster image dumps (`out/pages/`) or temporary debug crops to git. Keep `scratch/` clean.
- **Production Publishing**: Use `build/publish_coursepack.js` to sync AWS S3, Firestore, and Supabase search indexes.
