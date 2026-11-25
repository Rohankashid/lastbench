#!/usr/bin/env python3
"""
LastBench Academic Editorial Publishing
Micro Sheet Exporter (4-in-1 Quad & 8-in-1 Ultra Micro)
Converts full-size course packs into ultra-crisp, foldable pocket sheets.
"""

import sys
import os
import argparse
import pymupdf

A4_PORTRAIT = pymupdf.Rect(0, 0, 595.28, 841.89)
A4_LANDSCAPE = pymupdf.Rect(0, 0, 841.89, 595.28)

def export_micro_pdf(
    input_pdf_path: str,
    output_pdf_path: str,
    layout: str = "4-in-1",
    imposition: str = "sequential",
    show_cut_guides: bool = True,
    show_borders: bool = True,
    margin: float = 10.0,
    gap: float = 4.0,
):
    if not os.path.exists(input_pdf_path):
        raise FileNotFoundError(f"Input PDF not found: {input_pdf_path}")

    src_doc = pymupdf.open(input_pdf_path)
    total_pages = len(src_doc)
    if total_pages == 0:
        raise ValueError("Input PDF is empty.")

    out_doc = pymupdf.open()

    is_4up = (layout == "4-in-1")
    per_sheet = 4 if is_4up else 8
    cols = 2 if is_4up else 4
    rows = 2

    # Sheet dimensions: 4-up uses A4 Portrait, 8-up uses A4 Landscape
    sheet_rect = A4_PORTRAIT if is_4up else A4_LANDSCAPE
    sheet_w = sheet_rect.width
    sheet_h = sheet_rect.height

    usable_w = sheet_w - margin * 2
    usable_h = sheet_h - margin * 2

    cell_w = (usable_w - gap * (cols - 1)) / cols
    cell_h = (usable_h - gap * (rows - 1)) / rows

    total_sheets = (total_pages + per_sheet - 1) // per_sheet

    for s_idx in range(total_sheets):
        sheet_page = out_doc.new_page(width=sheet_w, height=sheet_h)
        is_back_side = (s_idx % 2 == 1)
        start_idx = s_idx * per_sheet

        # 1. Cut & Fold Guides
        if show_cut_guides:
            guide_color = (0.78, 0.78, 0.82)
            dash = "[3 4] 0"

            # Horizontal cut line across center
            mid_y = margin + cell_h + gap / 2
            sheet_page.draw_line(
                pymupdf.Point(margin - 6, mid_y),
                pymupdf.Point(sheet_w - margin + 6, mid_y),
                color=guide_color,
                width=0.5,
                dashes=dash,
            )

            # Vertical cut lines
            for c in range(1, cols):
                line_x = margin + c * cell_w + (c - 0.5) * gap
                sheet_page.draw_line(
                    pymupdf.Point(line_x, margin - 4),
                    pymupdf.Point(line_x, sheet_h - margin + 4),
                    color=guide_color,
                    width=0.5,
                    dashes=dash,
                )

        # 2. Place Pages
        for slot in range(per_sheet):
            page_idx = start_idx + slot
            col = slot % cols
            row = slot // cols

            if imposition == "duplex-flip" and is_back_side:
                col = cols - 1 - col

            cell_x = margin + col * (cell_w + gap)
            cell_y = margin + row * (cell_h + gap)

            card_rect = pymupdf.Rect(cell_x, cell_y, cell_x + cell_w, cell_y + cell_h)

            if show_borders:
                sheet_page.draw_rect(
                    card_rect,
                    color=(0.88, 0.88, 0.91),
                    width=0.75,
                )

            if page_idx < total_pages:
                pad = 4.0
                target_rect = pymupdf.Rect(
                    cell_x + pad,
                    cell_y + pad,
                    cell_x + cell_w - pad,
                    cell_y + cell_h - pad,
                )
                sheet_page.show_pdf_page(target_rect, src_doc, page_idx)

                # Page tag
                badge_text = f"P.{page_idx + 1}"
                sheet_page.insert_text(
                    pymupdf.Point(cell_x + cell_w - 24, cell_y + cell_h - 3),
                    badge_text,
                    fontsize=5.5,
                    color=(0.55, 0.58, 0.65),
                    fontname="helv",
                )
            else:
                pass

    out_doc.save(output_pdf_path)
    out_doc.close()
    src_doc.close()
    print(f"Exported {layout} Micro PDF ({total_sheets} sheets): {output_pdf_path}")

def main():
    parser = argparse.ArgumentParser(description="Export LastBench Course Pack as Foldable Micro Sheets")
    parser.add_argument("input_pdf", help="Path to input course pack PDF")
    parser.add_argument("--layout", choices=["4-in-1", "8-in-1"], default="4-in-1", help="Grid layout")
    parser.add_argument("--imposition", choices=["sequential", "duplex-flip"], default="sequential", help="Page ordering")
    parser.add_argument("--output", help="Output PDF path")

    args = parser.parse_args()

    out_path = args.output
    if not out_path:
        base, ext = os.path.splitext(args.input_pdf)
        suffix = "Micro4" if args.layout == "4-in-1" else "Micro8"
        out_path = f"{base}_{suffix}.pdf"

    export_micro_pdf(args.input_pdf, out_path, layout=args.layout, imposition=args.imposition)

if __name__ == "__main__":
    main()
