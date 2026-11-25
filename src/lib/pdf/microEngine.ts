import { PDFDocument, rgb, StandardFonts, PDFPage, PDFEmbeddedPage } from 'pdf-lib';

export interface MicroOptions {
  layout: '4-in-1' | '8-in-1';
  imposition?: 'sequential' | 'duplex-flip';
  showCutGuides?: boolean;
  showBorders?: boolean;
  margin?: number;
  gap?: number;
  targetPages?: number[]; // Optional list of 0-based page indices to include
}

export interface MicroStats {
  originalPageCount: number;
  microSheetsCount: number;
  paperSavedPercent: number;
  layout: '4-in-1' | '8-in-1';
}

function sanitizeWinAnsi(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2022\u2219]/g, '-')
    .replace(/[^\x00-\x7F]/g, ' ');
}

// A4 Dimensions in Points (72 DPI)
const A4_PORTRAIT_WIDTH = 595.28;
const A4_PORTRAIT_HEIGHT = 841.89;

/**
 * Calculates page stats and savings for a given source PDF and layout
 */
export async function calculateMicroStats(
  sourcePdfBytes: Uint8Array | ArrayBuffer,
  layout: '4-in-1' | '8-in-1'
): Promise<MicroStats> {
  const srcDoc = await PDFDocument.load(sourcePdfBytes, { ignoreEncryption: true });
  const originalPageCount = srcDoc.getPageCount();
  const perSheet = layout === '4-in-1' ? 4 : 8;
  const microSheetsCount = Math.ceil(originalPageCount / perSheet);
  const paperSaved = Math.max(0, originalPageCount - microSheetsCount);
  const paperSavedPercent = originalPageCount > 0 ? Math.round((paperSaved / originalPageCount) * 100) : 0;

  return {
    originalPageCount,
    microSheetsCount,
    paperSavedPercent,
    layout,
  };
}

/**
 * Generates an ultra-crisp LastBench Micro PDF from any source PDF
 */
export async function generateMicroPdf(
  sourcePdfBytes: Uint8Array | ArrayBuffer,
  options: MicroOptions
): Promise<Uint8Array> {
  const {
    layout = '4-in-1',
    imposition = 'sequential',
    showCutGuides = true,
    showBorders = true,
    margin = 10,
    gap = 4,
    targetPages,
  } = options;

  const srcDoc = await PDFDocument.load(sourcePdfBytes, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  
  if (totalPages === 0) {
    throw new Error('The provided PDF contains no pages.');
  }

  const outDoc = await PDFDocument.create();
  const fontMono = await outDoc.embedStandardFont(StandardFonts.Helvetica);
  const fontMonoBold = await outDoc.embedStandardFont(StandardFonts.HelveticaBold);

  const pagesToProcess = targetPages && targetPages.length > 0
    ? targetPages.filter((idx) => idx >= 0 && idx < totalPages)
    : Array.from({ length: totalPages }, (_, i) => i);

  // Embed all required source pages
  const embeddedPages: PDFEmbeddedPage[] = await outDoc.embedPdf(srcDoc, pagesToProcess);

  const is4Up = layout === '4-in-1';
  const perSheet = is4Up ? 4 : 8;
  const cols = is4Up ? 2 : 4;
  const rows = 2;

  // Sheet dimensions: 4-up uses Portrait A4, 8-up uses Landscape A4
  const sheetW = is4Up ? A4_PORTRAIT_WIDTH : A4_PORTRAIT_HEIGHT;
  const sheetH = is4Up ? A4_PORTRAIT_HEIGHT : A4_PORTRAIT_WIDTH;

  const usableW = sheetW - margin * 2;
  const usableH = sheetH - margin * 2;

  const cellW = (usableW - gap * (cols - 1)) / cols;
  const cellH = (usableH - gap * (rows - 1)) / rows;

  const totalSheets = Math.ceil(embeddedPages.length / perSheet);

  for (let sIdx = 0; sIdx < totalSheets; sIdx++) {
    const sheet = outDoc.addPage([sheetW, sheetH]);
    const isBackSide = sIdx % 2 === 1;
    const startIndex = sIdx * perSheet;

    // 1. Draw Cutting & Folding Guides
    if (showCutGuides) {
      const guideColor = rgb(0.78, 0.78, 0.82);
      const dash = [3, 4];

      // Horizontal central cut/fold line
      const midY = margin + cellH + gap / 2;
      sheet.drawLine({
        start: { x: margin - 6, y: midY },
        end: { x: sheetW - margin + 6, y: midY },
        thickness: 0.5,
        color: guideColor,
        dashArray: dash,
      });

      // Vertical cut/fold lines
      for (let c = 1; c < cols; c++) {
        const lineX = margin + c * cellW + (c - 0.5) * gap;
        sheet.drawLine({
          start: { x: lineX, y: margin - 6 },
          end: { x: lineX, y: margin + usableH + 6 },
          thickness: 0.5,
          color: guideColor,
          dashArray: dash,
        });
      }

      // Vector Cut Indicator (clean tick lines on border)
      sheet.drawLine({
        start: { x: margin - 8, y: midY - 3 },
        end: { x: margin - 2, y: midY + 3 },
        thickness: 0.75,
        color: rgb(0.5, 0.5, 0.55),
      });
      sheet.drawLine({
        start: { x: margin - 8, y: midY + 3 },
        end: { x: margin - 2, y: midY - 3 },
        thickness: 0.75,
        color: rgb(0.5, 0.5, 0.55),
      });
    }

    // 3. Place Embedded Pages onto the Grid
    for (let slot = 0; slot < perSheet; slot++) {
      const pageIndexInBatch = startIndex + slot;
      
      let col = slot % cols;
      const row = rows - 1 - Math.floor(slot / cols); // rows - 1 is top row in PDF coordinate system

      // If duplex flip is enabled on back pages, invert column to align double-sided prints
      if (imposition === 'duplex-flip' && isBackSide) {
        col = cols - 1 - col;
      }

      const cellX = margin + col * (cellW + gap);
      const cellY = margin + row * (cellH + gap);

      // Card outer frame / border
      if (showBorders) {
        sheet.drawRectangle({
          x: cellX,
          y: cellY,
          width: cellW,
          height: cellH,
          borderColor: rgb(0.88, 0.88, 0.91),
          borderWidth: 0.75,
          color: rgb(1, 1, 1),
        });
      }

      if (pageIndexInBatch < embeddedPages.length) {
        const embPage = embeddedPages[pageIndexInBatch];
        const pageW = embPage.width;
        const pageH = embPage.height;

        // Content padding inside card (leave room for tiny page tag)
        const padX = 4;
        const padY = 4;
        const maxContentW = cellW - padX * 2;
        const maxContentH = cellH - padY * 2;

        const scale = Math.min(maxContentW / pageW, maxContentH / pageH);
        const drawW = pageW * scale;
        const drawH = pageH * scale;

        const posX = cellX + (cellW - drawW) / 2;
        const posY = cellY + (cellH - drawH) / 2;

        sheet.drawPage(embPage, {
          x: posX,
          y: posY,
          width: drawW,
          height: drawH,
        });

        // Micro corner page badge
        const pageBadge = `P.${pageIndexInBatch + 1}`;
        sheet.drawText(pageBadge, {
          x: cellX + cellW - 22,
          y: cellY + 3,
          size: 5.5,
          font: fontMonoBold,
          color: rgb(0.55, 0.58, 0.65),
        });
      } else {
        // Empty slot - kept clean and unmarked
      }
    }
  }

  return await outDoc.save();
}

/**
 * Creates a micro PDF directly from structured text/formula cards
 */
export async function generateMicroFromTextCards(
  cards: { title: string; subtitle?: string; formula?: string; points: string[] }[],
  options: Omit<MicroOptions, 'targetPages'>
): Promise<Uint8Array> {
  const intermediateDoc = await PDFDocument.create();
  const fontSans = await intermediateDoc.embedStandardFont(StandardFonts.Helvetica);
  const fontSansBold = await intermediateDoc.embedStandardFont(StandardFonts.HelveticaBold);
  const fontMono = await intermediateDoc.embedStandardFont(StandardFonts.CourierBold);

  // Create single standard A4 pages for each card
  for (const card of cards) {
    const page = intermediateDoc.addPage([A4_PORTRAIT_WIDTH, A4_PORTRAIT_HEIGHT]);
    const { width, height } = page.getSize();
    let yPos = height - 60;

    // Card Header Bar
    page.drawRectangle({
      x: 40,
      y: yPos - 10,
      width: width - 80,
      height: 48,
      color: rgb(0.06, 0.08, 0.14),
    });

    page.drawText(sanitizeWinAnsi(card.title).toUpperCase(), {
      x: 52,
      y: yPos + 16,
      size: 16,
      font: fontSansBold,
      color: rgb(1, 1, 1),
    });

    if (card.subtitle) {
      page.drawText(sanitizeWinAnsi(card.subtitle), {
        x: 52,
        y: yPos - 2,
        size: 10,
        font: fontSans,
        color: rgb(0.8, 0.82, 0.88),
      });
    }

    yPos -= 70;

    // Formula Callout Box if present
    if (card.formula) {
      page.drawRectangle({
        x: 40,
        y: yPos - 35,
        width: width - 80,
        height: 44,
        borderColor: rgb(0.2, 0.22, 0.28),
        borderWidth: 1,
        color: rgb(0.96, 0.96, 0.98),
      });

      page.drawText('KEY FORMULA / RELATION:', {
        x: 52,
        y: yPos - 2,
        size: 8,
        font: fontSansBold,
        color: rgb(0.4, 0.42, 0.48),
      });

      page.drawText(sanitizeWinAnsi(card.formula), {
        x: 52,
        y: yPos - 22,
        size: 12,
        font: fontMono,
        color: rgb(0.05, 0.06, 0.12),
      });

      yPos -= 60;
    }

    // High Yield Points
    page.drawText('HIGH-YIELD CORE CONCEPTS & EXAM POINTS:', {
      x: 40,
      y: yPos,
      size: 10,
      font: fontSansBold,
      color: rgb(0.2, 0.22, 0.28),
    });

    yPos -= 24;

    for (const pt of card.points) {
      // Bullet dot
      page.drawCircle({
        x: 46,
        y: yPos + 4,
        size: 2.5,
        color: rgb(0.1, 0.12, 0.2),
      });

      page.drawText(sanitizeWinAnsi(pt), {
        x: 58,
        y: yPos,
        size: 11,
        font: fontSans,
        color: rgb(0.12, 0.14, 0.18),
        maxWidth: width - 110,
        lineHeight: 16,
      });

      yPos -= 28;
    }
  }

  const intermediateBytes = await intermediateDoc.save();
  return generateMicroPdf(intermediateBytes, options);
}
