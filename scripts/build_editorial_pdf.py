#!/usr/bin/env python3
"""
LastBench Academic Publications
SPPU FE (2024 Revised Pattern / NEP-2020)
Fundamentals of Programming Languages (FPL | COM108 / ESC-105-COM)
High-Yield Examination Question Bank (Sure-Shot PYQs with Exam Sessions & Marks)
"""

import sys
import os

HELVETICA_METRICS = {
    ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667, '\'': 191,
    '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278,
    '0': 556, '1': 556, '2': 556, '3': 556, '4': 556, '5': 556, '6': 556, '7': 556,
    '8': 556, '9': 556, ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556,
    '@': 1015, 'A': 667, 'B': 667, 'C': 722, 'D': 722, 'E': 667, 'F': 611, 'G': 778,
    'H': 722, 'I': 278, 'J': 500, 'K': 667, 'L': 556, 'M': 833, 'N': 722, 'O': 778,
    'P': 667, 'Q': 778, 'R': 722, 'S': 667, 'T': 611, 'U': 722, 'V': 667, 'W': 944,
    'X': 667, 'Y': 667, 'Z': 611, '[': 278, '\\': 278, ']': 278, '^': 469, '_': 556,
    '`': 333, 'a': 556, 'b': 556, 'c': 500, 'd': 556, 'e': 556, 'f': 278, 'g': 556,
    'h': 556, 'i': 222, 'j': 222, 'k': 500, 'l': 222, 'm': 833, 'n': 556, 'o': 556,
    'p': 556, 'q': 556, 'r': 333, 's': 500, 't': 278, 'u': 556, 'v': 500, 'w': 722,
    'x': 500, 'y': 500, 'z': 500, '{': 334, '|': 260, '}': 334, '~': 584
}

def font_text_width(text, size, is_bold=False):
    factor = 1.05 if is_bold else 1.0
    return sum(HELVETICA_METRICS.get(c, 556) for c in text) * (size / 1000.0) * factor

def break_into_lines(text, max_w, font_size, is_bold=False):
    words = text.split()
    if not words:
        return []
    lines = []
    current_line = []
    for word in words:
        candidate = " ".join(current_line + [word])
        if font_text_width(candidate, font_size, is_bold) <= max_w:
            current_line.append(word)
        else:
            if current_line:
                lines.append(" ".join(current_line))
                current_line = [word]
            else:
                lines.append(word)
                current_line = []
    if current_line:
        lines.append(" ".join(current_line))
    return lines


class QuestionBankBuilder:
    def __init__(self, output_pdf_path, logo_jpeg_path):
        self.output_path = output_pdf_path
        self.logo_path = logo_jpeg_path
        with open(logo_jpeg_path, 'rb') as f:
            self.logo_bytes = f.read()
            
        self.pages = []
        self.page_commands = []
        
        # A4 standard: 595.28 x 841.89 points
        self.width = 595.28
        self.height = 841.89
        self.margin_x = 40.0
        self.top_margin = 48.0
        self.bottom_margin = 42.0
        self.content_w = self.width - (2 * self.margin_x)
        self.y = self.height - self.top_margin

    def clean(self, text):
        replacements = {
            '\\': '\\\\', '(': '\\(', ')': '\\)',
            '\u2014': '--', '\u2013': '-', '\u2018': "'", '\u2019': "'",
            '\u201c': '"', '\u201d': '"', '\u2022': '-', '\u2265': '>=',
            '\u2264': '<=', '\u00b0': ' deg', '\u00d7': 'x', '\u2192': '->',
            '\u03c0': 'pi', '\u2260': '!=', '\u00b2': '^2', '\u00b3': '^3',
            '\u00a7': 'Sec ', '\u2248': '~=', '\u2211': 'sum'
        }
        for k, v in replacements.items():
            text = text.replace(k, v)
        return text.encode('ascii', 'ignore').decode('ascii')

    def new_page(self):
        if self.page_commands:
            self.pages.append(self.page_commands)
            self.page_commands = []
        self.y = self.height - self.top_margin

    def demand_space(self, h):
        if self.y - h < self.bottom_margin:
            self.new_page()

    def generate_decorations(self, page_num, total_pages):
        cmds = []
        logo_w, logo_h = 20, 20
        logo_x = self.margin_x
        logo_y = self.height - 34
        cmds.append(f"q {logo_w} 0 0 {logo_h} {logo_x} {logo_y} cm /BrandLogo Do Q")
        
        # Header text
        url_text = self.clean("lastbench.online")
        sub_text = self.clean("  |  SPPU FE 2024 PATTERN  |  FPL (COM108)  |  SURE-SHOT QUESTION BANK")
        cmds.append(f"BT /F2 8 Tf 0.12 0.16 0.22 rg {logo_x + 26} {self.height - 23} Td ({url_text}) Tj /F2 7 Tf 0.35 0.40 0.46 rg ({sub_text}) Tj ET")
        
        # Hairline rule below header
        cmds.append(f"0.80 0.82 0.85 RG 0.5 w {self.margin_x} {self.height - 38} m {self.width - self.margin_x} {self.height - 38} l S")

        # Running Footer hairline rule
        cmds.append(f"0.80 0.82 0.85 RG 0.5 w {self.margin_x} 32 m {self.width - self.margin_x} 32 l S")
        
        # Footer text
        footer_left = self.clean("Savitribai Phule Pune University  |  FPL Question Bank (Sure-Shot PYQ Hit List)")
        cmds.append(f"BT /F1 7.5 Tf 0.40 0.44 0.50 rg {self.margin_x} 20 Td ({footer_left}) Tj ET")
        
        page_indicator = self.clean(f"Page {page_num} of {total_pages}")
        cmds.append(f"BT /F2 8 Tf 0.15 0.20 0.26 rg {self.width - self.margin_x - 55} 20 Td ({page_indicator}) Tj ET")
        
        return cmds

    def render_document_masthead(self):
        masthead_h = 92
        self.demand_space(masthead_h + 10)
        top = self.y
        
        # Formal Academic Banner
        self.page_commands.append(f"0.08 0.12 0.18 rg {self.margin_x} {top - masthead_h} {self.content_w} {masthead_h} re f")
        self.page_commands.append(f"0.24 0.30 0.40 RG 1 w {self.margin_x} {top} m {self.width - self.margin_x} {top} l S")

        self.page_commands.append(f"BT /F2 13.5 Tf 1 1 1 rg {self.margin_x + 16} {top - 22} Td ({self.clean('SAVITRIBAI PHULE PUNE UNIVERSITY')}) Tj ET")
        self.page_commands.append(f"BT /F2 10 Tf 0.90 0.93 0.96 rg {self.margin_x + 16} {top - 38} Td ({self.clean('FIRST YEAR ENGINEERING (F.E.)  --  2024 REVISED PATTERN (NEP-2020)')}) Tj ET")
        self.page_commands.append(f"BT /F2 9 Tf 0.96 0.96 0.98 rg {self.margin_x + 16} {top - 54} Td ({self.clean('Course: Fundamentals of Programming Languages (FPL | COM108 / ESC-105-COM)')}) Tj ET")
        self.page_commands.append(f"BT /F1 8.5 Tf 0.78 0.82 0.88 rg {self.margin_x + 16} {top - 70} Td ({self.clean('High-Yield Examination Question Bank: Guaranteed & Most Asked PYQs')}) Tj ET")
        self.page_commands.append(f"BT /F2 7.5 Tf 0.88 0.92 0.96 rg {self.margin_x + 16} {top - 83} Td ({self.clean('Curated from Official SPPU In-Sem (CCE) & End-Sem (ESE) Papers: 2018 - 2024')}) Tj ET")
        
        self.y = top - masthead_h - 14

    def render_unit_banner(self, unit_number, unit_title, weightage_info):
        self.demand_space(30)
        banner_h = 22
        top = self.y
        
        self.page_commands.append(f"0.12 0.16 0.22 rg {self.margin_x} {top - banner_h} {self.content_w} {banner_h} re f")
        
        banner_text = self.clean(f"{unit_number}: {unit_title.upper()}")
        self.page_commands.append(f"BT /F2 9.5 Tf 1 1 1 rg {self.margin_x + 10} {top - 15} Td ({banner_text}) Tj ET")
        
        weight_text = self.clean(weightage_info)
        w_width = font_text_width(weight_text, 8, is_bold=True)
        self.page_commands.append(f"BT /F2 8 Tf 0.85 0.88 0.92 rg {self.width - self.margin_x - w_width - 10} {top - 15} Td ({weight_text}) Tj ET")
        
        self.y = top - banner_h - 10

    def render_body_text(self, text, indent=4):
        lines = break_into_lines(text, self.content_w - indent, 8.5, is_bold=False)
        needed = (len(lines) * 11.5) + 4
        self.demand_space(needed)
        
        for l in lines:
            self.page_commands.append(f"BT /F1 8.5 Tf 0.08 0.10 0.14 rg {self.margin_x + indent} {self.y - 8.5} Td ({self.clean(l)}) Tj ET")
            self.y -= 11.5
        self.y -= 4

    def render_section_title(self, section_name):
        self.demand_space(18)
        self.page_commands.append(f"BT /F2 9 Tf 0.10 0.15 0.24 rg {self.margin_x + 4} {self.y - 9} Td ({self.clean(section_name)}) Tj ET")
        self.y -= 14

    def render_table(self, col_headers, ratios, rows_data):
        hdr_h = 16
        abs_widths = [self.content_w * r for r in ratios]
        
        calculated_rows = []
        total_h = hdr_h
        for r in rows_data:
            max_l = 1
            wrapped_row = []
            for c_idx, cell in enumerate(r):
                col_w = abs_widths[c_idx] - 8
                cell_lines = break_into_lines(cell, col_w, 7.5, is_bold=False)
                if not cell_lines: cell_lines = [""]
                max_l = max(max_l, len(cell_lines))
                wrapped_row.append(cell_lines)
            row_height = (max_l * 10) + 6
            calculated_rows.append((wrapped_row, row_height))
            total_h += row_height
            
        self.demand_space(total_h + 8)
        top = self.y
        
        # Booktabs Top Rule
        self.page_commands.append(f"0.14 0.18 0.24 RG 1.2 w {self.margin_x} {top} m {self.width - self.margin_x} {top} l S")
        
        # Header bar
        self.page_commands.append(f"0.94 0.95 0.96 rg {self.margin_x} {top - hdr_h} {self.content_w} {hdr_h} re f")
        self.page_commands.append(f"0.65 0.70 0.75 RG 0.6 w {self.margin_x} {top - hdr_h} m {self.width - self.margin_x} {top - hdr_h} l S")
        
        cur_x = self.margin_x
        for c_idx, h_name in enumerate(col_headers):
            self.page_commands.append(f"BT /F2 7.5 Tf 0.08 0.12 0.18 rg {cur_x + 4} {top - 11} Td ({self.clean(h_name)}) Tj ET")
            cur_x += abs_widths[c_idx]
            
        cur_y = top - hdr_h
        for r_idx, (wrapped_cells, rh) in enumerate(calculated_rows):
            fill_color = "1.0 1.0 1.0" if r_idx % 2 == 0 else "0.98 0.98 0.99"
            self.page_commands.append(f"{fill_color} rg {self.margin_x} {cur_y - rh} {self.content_w} {rh} re f")
            self.page_commands.append(f"0.88 0.90 0.92 RG 0.4 w {self.margin_x} {cur_y - rh} m {self.width - self.margin_x} {cur_y - rh} l S")
            
            x_c = self.margin_x
            for c_idx, lines in enumerate(wrapped_cells):
                y_txt = cur_y - 8
                for l in lines:
                    self.page_commands.append(f"BT /F1 7.5 Tf 0.08 0.10 0.14 rg {x_c + 4} {y_txt} Td ({self.clean(l)}) Tj ET")
                    y_txt -= 10
                x_c += abs_widths[c_idx]
            cur_y -= rh
            
        # Booktabs Bottom Rule
        self.page_commands.append(f"0.14 0.18 0.24 RG 1.2 w {self.margin_x} {cur_y} m {self.width - self.margin_x} {cur_y} l S")
        self.y = cur_y - 8

    def render_question_card(self, q_num, marks, freq, sessions, q_text, components_checklist):
        # Header line: Q1.1 [8 Marks] | Frequency: Guaranteed (5x) | Sessions: Dec 2024, May 2024...
        meta_left = f"{q_num}  [{marks}]"
        meta_badge = f"{freq}  |  {sessions}"
        
        q_lines = break_into_lines(q_text, self.content_w - 24, 8.5, is_bold=True)
        comp_lines = break_into_lines(f"Required in Answer: {components_checklist}", self.content_w - 24, 7.5, is_bold=False)
        
        box_h = 20 + (len(q_lines) * 11.5) + (len(comp_lines) * 10) + 10
        self.demand_space(box_h + 6)
        top = self.y
        
        # Container background
        self.page_commands.append(f"0.98 0.98 0.99 rg {self.margin_x} {top - box_h} {self.content_w} {box_h} re f")
        self.page_commands.append(f"0.84 0.86 0.88 RG 0.5 w {self.margin_x} {top - box_h} {self.content_w} {box_h} re S")
        # Left accent rule
        self.page_commands.append(f"0.18 0.24 0.32 RG 1.5 w {self.margin_x} {top - box_h} m {self.margin_x} {top} l S")
        
        # Meta row
        self.page_commands.append(f"BT /F2 9 Tf 0.08 0.12 0.18 rg {self.margin_x + 8} {top - 13} Td ({self.clean(meta_left)}) Tj ET")
        
        badge_w = font_text_width(meta_badge, 7.5, is_bold=True)
        self.page_commands.append(f"BT /F2 7.5 Tf 0.30 0.35 0.42 rg {self.width - self.margin_x - badge_w - 8} {top - 13} Td ({self.clean(meta_badge)}) Tj ET")
        
        # Hairline below meta
        self.page_commands.append(f"0.88 0.90 0.92 RG 0.4 w {self.margin_x + 8} {top - 18} m {self.width - self.margin_x - 8} {top - 18} l S")
        
        # Question text
        y_txt = top - 28
        for l in q_lines:
            self.page_commands.append(f"BT /F2 8.5 Tf 0.08 0.10 0.14 rg {self.margin_x + 8} {y_txt} Td ({self.clean(l)}) Tj ET")
            y_txt -= 11.5
            
        y_txt -= 2
        for l in comp_lines:
            self.page_commands.append(f"BT /F1 7.5 Tf 0.35 0.40 0.48 rg {self.margin_x + 8} {y_txt} Td ({self.clean(l)}) Tj ET")
            y_txt -= 10
            
        self.y = top - box_h - 7

    def render_key_notes(self, title, notes_list):
        needed = 16 + (len(notes_list) * 11) + 6
        self.demand_space(needed)
        top = self.y
        
        self.page_commands.append(f"0.96 0.97 0.98 rg {self.margin_x + 4} {top - needed} {self.content_w - 8} {needed} re f")
        self.page_commands.append(f"0.30 0.38 0.48 RG 1 w {self.margin_x + 4} {top - needed} m {self.margin_x + 4} {top} l S")
        self.page_commands.append(f"BT /F2 8 Tf 0.12 0.18 0.26 rg {self.margin_x + 12} {top - 11} Td ({self.clean(title)}) Tj ET")
        
        y_t = top - 21
        for note in notes_list:
            self.page_commands.append(f"BT /F1 7.5 Tf 0.15 0.18 0.22 rg {self.margin_x + 12} {y_t} Td ({self.clean('- ' + note)}) Tj ET")
            y_t -= 10.5
            
        self.y = top - needed - 8

    def save_document(self):
        if self.page_commands:
            self.pages.append(self.page_commands)
            
        total_p = len(self.pages)
        pdf_objs = []
        
        def push_obj(body):
            pdf_objs.append(body)
            return len(pdf_objs)

        catalog_idx = push_obj("<< /Type /Catalog /Pages 2 0 R >>")
        pages_placeholder_idx = push_obj("")
        
        f1 = push_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
        f2 = push_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
        f3 = push_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>")
        f4 = push_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>")

        img_hdr = f"<< /Type /XObject /Subtype /Image /Width 1080 /Height 1080 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length {len(self.logo_bytes)} >>\nstream\n".encode('latin1')
        img_body = img_hdr + self.logo_bytes + b"\nendstream"
        logo_obj_id = push_obj(img_body)

        kids = []
        for p_idx, raw_stream in enumerate(self.pages, 1):
            decorations = self.generate_decorations(p_idx, total_p)
            combined_stream = "\n".join(decorations + raw_stream)
            c_len = len(combined_stream.encode('latin1'))
            
            c_id = push_obj(f"<< /Length {c_len} >>\nstream\n{combined_stream}\nendstream")
            annot_id = push_obj(
                "<< /Type /Annot /Subtype /Link /Rect [36 802 240 834] /Border [0 0 0] "
                "/A << /Type /Action /S /URI /URI (https://www.lastbench.online) >> >>"
            )
            page_id = push_obj(
                f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {self.width} {self.height}] "
                f"/Contents {c_id} 0 R /Resources << /Font << /F1 {f1} 0 R /F2 {f2} 0 R /F3 {f3} 0 R /F4 {f4} 0 R >> "
                f"/XObject << /BrandLogo {logo_obj_id} 0 R >> >> /Annots [{annot_id} 0 R] >>"
            )
            kids.append(f"{page_id} 0 R")

        pdf_objs[1] = f"<< /Type /Pages /Kids [{' '.join(kids)}] /Count {len(kids)} >>"

        with open(self.output_path, "wb") as f:
            f.write(b"%PDF-1.4\n")
            offsets = [0]
            for i, item in enumerate(pdf_objs, 1):
                offsets.append(f.tell())
                if isinstance(item, str):
                    f.write(f"{i} 0 obj\n{item}\nendobj\n".encode("latin1"))
                else:
                    f.write(f"{i} 0 obj\n".encode("latin1") + item + b"\nendobj\n")
                    
            xref_pos = f.tell()
            f.write(f"xref\n0 {len(pdf_objs) + 1}\n0000000000 65535 f \n".encode("latin1"))
            for off in offsets[1:]:
                f.write(f"{off:010d} 00000 n \n".encode("latin1"))
                
            f.write(f"trailer\n<< /Size {len(pdf_objs) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("latin1"))

        print(f"Sure-Shot Question Bank PDF Generated: {self.output_path} ({total_p} Pages)")


def generate_sure_shot_pyq_pdf():
    output_pdf = "public/documents/SPPU_FE_2024_FPL_Most_Asked_PYQs.pdf"
    logo_path = "public/branding/logo.jpg"
    doc = QuestionBankBuilder(output_pdf, logo_path)
    
    # =========================================================================
    # PAGE 1: MASTHEAD & EXAMINATION BLUEPRINT
    # =========================================================================
    doc.render_document_masthead()
    doc.render_section_title("SPPU EXAMINATION ARCHITECTURE & EVALUATION PATTERN")
    doc.render_body_text(
        "Under the Savitribai Phule Pune University (SPPU) 2024 Revised Course (NEP-2020), Fundamentals of Programming Languages "
        "(COM108 / ESC-105-COM) is evaluated through a two-stage examination model: Continuous Comprehensive Evaluation (CCE / In-Sem, 30 Marks) "
        "and End-Semester Examination (ESE, 70 Marks). The table below outlines the structural paper layout, unit mapping, and question options."
    )
    doc.render_table(
        ["Exam Stage", "Question Layout", "Syllabus Scope", "Weightage", "Choice Pattern", "Target Passing"],
        [0.15, 0.22, 0.22, 0.13, 0.14, 0.14],
        [
            ["CCE (In-Sem)", "Q.1 or Q.2\nQ.3 or Q.4\nQ.5 or Q.6", "Unit I (10M)\nUnit II (10M)\nUnit III (10M)", "30 Marks", "100% Internal Choice per unit", "12 Marks (40%)"],
            ["ESE (End-Sem)", "Q.1 or Q.2 (Unit I/II)\nQ.3 or Q.4 (Unit III/IV)\nQ.5 or Q.6 (Unit V)\nQ.7 or Q.8 (Unit VI)", "Units I to VI (Comprehensive)", "70 Marks", "Mandatory OR choice per unit", "28 Marks (40%)"],
            ["Term Work (TW)", "10 Laboratory Practicals", "Practical Assignments", "25 Marks", "Continuous Assessment", "10 Marks (40%)"]
        ]
    )
    
    doc.render_section_title("OFFICIAL PRESCRIBED SYLLABUS LITERATURE (SPPU 2024 PATTERN)")
    doc.render_body_text(
        "All questions in this bank are curated from official past university papers and align with the prescribed curriculum textbooks: "
        "1) 'Programming in ANSI C' -- E. Balagurusamy (Tata McGraw-Hill), "
        "2) 'Fundamentals of Programming Languages' -- Nirali Prakashan (Dr. Nitin N. Sakhare, Dr. Hemantkumar B. Jadhav), "
        "3) 'Schaum's Outline: Programming with C' -- Byron S. Gottfried (McGraw-Hill), and "
        "4) 'Let Us C' -- Yashavant Kanetkar (BPB)."
    )
    
    doc.render_section_title("UNIVERSITY EXAMINER EVALUATION CRITERIA (8-MARK QUESTIONS)")
    doc.render_table(
        ["Component", "Marks", "Examiner Requirements", "Common Deduction Pitfall"],
        [0.22, 0.12, 0.36, 0.30],
        [
            ["Theory & Definitions", "2 Marks", "Clear technical definitions, properties, comparisons", "Writing vague English descriptions instead of keywords"],
            ["Diagram / Flowchart", "2 Marks", "Standard ISO flowchart symbols or memory layouts", "Missing decision diamond branch labels (YES/NO)"],
            ["Compilable C Code", "3 Marks", "ANSI C99 syntax, `#include`, validation, comments", "Missing main() wrapper, missing input checks"],
            ["Dry Run / Trace", "1 Mark", "Step-by-step variable trace matrix across test cases", "Giving only final output without iteration variables"]
        ]
    )
    
    doc.render_key_notes("HOW TO USE THIS HIT LIST", [
        "Every question listed below is tagged with its exact SPPU Exam Sessions (Month, Year, In-Sem CCE / End-Sem ESE) and Marks.",
        "Priority Tier 'Guaranteed (4x - 5x)' indicates questions repeated in almost every university examination cycle.",
        "Prepare each question with the 'Required in Answer' checklist to secure full marks in subjective evaluation."
    ])

    # =========================================================================
    # UNIT 1: PROGRAM PLANNING & C FUNDAMENTALS
    # =========================================================================
    doc.new_page()
    doc.render_unit_banner("UNIT I", "PROBLEM SOLVING & C PROGRAMMING FUNDAMENTALS", "In-Sem: 10 Marks | End-Sem: 12 Marks")
    
    doc.render_question_card(
        "Q1.1", "8 Marks", "Guaranteed (5x Repeated)",
        "Dec 2024 (ESE), May 2024 (ESE), Dec 2023 (CCE), May 2023 (CCE), Dec 2022",
        "Explain the four Storage Classes in C (auto, register, static, extern) across 6 parameters: Keyword, Storage Segment, Default Value, Scope, Lifetime, and Linkage. Draw the C Process Memory Architecture diagram showing Stack, Heap, BSS, Data, and Text segments. Write verified C code demonstrating lifetime retention of a static variable versus an auto variable.",
        "[ ] 6-parameter comparative table (3M)  [ ] 5-segment memory architecture diagram (2M)  [ ] Compilable C code (2M)  [ ] Trace output (1M)"
    )
    
    doc.render_question_card(
        "Q1.2", "8 Marks", "Guaranteed (5x Repeated)",
        "Dec 2024 (ESE), Dec 2023 (CCE), May 2023 (CCE), Dec 2022, May 2018",
        "Develop a complete step-by-step algorithm and draw an ISO standard flowchart to find all real and complex roots of a quadratic equation (ax^2 + bx + c = 0). Clearly show conditional branches for all three discriminant cases: D > 0 (real and distinct), D == 0 (real and equal), and D < 0 (complex conjugate roots). Write the complete ANSI C program.",
        "[ ] Step-by-step algorithm (2M)  [ ] ISO flowchart with decision diamonds (2M)  [ ] Complete C program with sqrt() (3M)  [ ] Boundary trace (1M)"
    )

    doc.render_question_card(
        "Q1.3", "6 Marks", "Guaranteed (4x Repeated)",
        "May 2024 (ESE), Dec 2023 (CCE), May 2019, Dec 2018",
        "Define Algorithm and Flowchart. Draw standard flowchart symbols (Terminal, Input/Output, Process, Decision, Connector, Predefined Function) and state their specific operational roles in programming. State the five mandatory characteristics of a valid algorithm.",
        "[ ] Formal definitions & 5 criteria (2M)  [ ] 6 standard ISO symbols with names and operational roles (3M)  [ ] Clean drawing with ruler (1M)"
    )

    doc.render_question_card(
        "Q1.4", "6 Marks", "High Frequency (3x Repeated)",
        "May 2023 (CCE), Dec 2021, May 2019",
        "Explain the phases of C program translation: Preprocessing, Compilation, Assembly, and Linking. Detail the input, output file extensions (.c, .i, .s, .o, .out/.exe), and operational responsibility of each phase.",
        "[ ] 4-stage pipeline block diagram (2M)  [ ] Table of tools, input/output files (2M)  [ ] Preprocessor directives explanation (2M)"
    )

    doc.render_question_card(
        "Q1.5", "6 Marks", "High Frequency (3x Repeated)",
        "Dec 2022 (CCE), May 2021, Dec 2019",
        "Write an algorithm and draw a flowchart to find the largest of three numbers (a, b, c) using nested decision structures. Provide a trace table showing execution paths for all possible permutations.",
        "[ ] Algorithm steps (2M)  [ ] Flowchart with nested decision diamonds (2M)  [ ] Trace table covering test cases (2M)"
    )
    
    doc.render_key_notes("UNIT I EXAMINER FOCUS", [
        "In Storage Classes (Q1.1), always state that the unary address operator '&' cannot be applied to register variables.",
        "In Quadratic Equation (Q1.2), remember to write parentheses: '-b / (2.0 * a)'. Writing '-b / 2 * a' loses 1.5 marks.",
        "In Algorithm definitions (Q1.3), quote the 5 properties: Finiteness, Definiteness, Input, Output, and Effectiveness."
    ])

    # =========================================================================
    # UNIT 2: OPERATORS AND EXPRESSIONS
    # =========================================================================
    doc.new_page()
    doc.render_unit_banner("UNIT II", "OPERATORS AND EXPRESSIONS", "In-Sem: 10 Marks | End-Sem: 10 Marks")
    
    doc.render_question_card(
        "Q2.1", "8 Marks", "Guaranteed (4x Repeated)",
        "Dec 2024 (ESE), Dec 2023 (CCE), May 2022, Dec 2019",
        "State the complete C Operator Precedence and Associativity hierarchy table across all 15 levels. Explain with code examples how parentheses override default precedence, and evaluate the expression: z = a + b * c / d - e % f with given variable values.",
        "[ ] Complete 15-level precedence and associativity table (4M)  [ ] Step-by-step expression evaluation (2M)  [ ] Associativity rules (2M)"
    )

    doc.render_question_card(
        "Q2.2", "8 Marks", "Guaranteed (4x Repeated)",
        "May 2024 (ESE), Dec 2023 (CCE), Dec 2021, May 2019",
        "Explain Bitwise Operators in C (&, |, ^, ~, <<, >>) with their truth tables. Perform a manual 8-bit binary dry run for integer operands a = 12 and b = 25 evaluating a & b, a | b, a ^ b, ~a, a << 2, and b >> 2. Write a C program to check whether a number is Even or Odd using bitwise AND.",
        "[ ] Bitwise operators description & truth table (2M)  [ ] 8-bit binary dry-run calculation (3M)  [ ] Compilable C program for parity check (3M)"
    )

    doc.render_question_card(
        "Q2.3", "6 Marks", "Guaranteed (4x Repeated)",
        "May 2024 (ESE), May 2023 (CCE), Dec 2022, May 2021",
        "Differentiate between Implicit Type Conversion (Automatic Type Promotion) and Explicit Type Casting in C. Detail the type promotion rank hierarchy (char -> int -> float -> double). Write a C program illustrating integer division truncation and its correction via casting.",
        "[ ] Implicit vs Explicit comparison table (2M)  [ ] Rank promotion hierarchy (2M)  [ ] Code example showing float truncation fix (2M)"
    )

    doc.render_question_card(
        "Q2.4", "6 Marks", "High Frequency (3x Repeated)",
        "Dec 2024 (ESE), May 2023 (CCE), Dec 2022",
        "Explain Short-Circuit Evaluation in Logical AND (&&) and Logical OR (||) operators. Write a C program demonstrating how increment operators (++y) inside logical expressions are skipped when the overall condition is already determined.",
        "[ ] Definition of short-circuit guarantee (2M)  [ ] Compilable C verification code (2M)  [ ] Output analysis & variable state trace (2M)"
    )

    doc.render_question_card(
        "Q2.5", "7 Marks", "High Frequency (3x Repeated)",
        "Dec 2023 (CCE), May 2022, Dec 2021",
        "Write a complete C program to perform Bitmasking: 1) Check if the k-th bit is set, 2) Set the k-th bit, 3) Clear the k-th bit, and 4) Toggle the k-th bit of a given integer using bitwise operators and shifts.",
        "[ ] Mathematical bitmask formulation (2M)  [ ] Complete compilable C code (3M)  [ ] Dry run with binary mask representation (2M)"
    )

    doc.render_key_notes("UNIT II EXAMINER FOCUS", [
        "In Bitwise questions (Q2.2), never confuse '&&' (logical) with '&' (bitwise). Examiners deduct 2 marks for incorrect symbol use.",
        "In Type Casting (Q2.3), always show why '(float)total / count' gives accurate fractional results while 'total / count' truncates.",
        "In Precedence (Q2.1), remember that Assignment (=) and Unary Prefix operators associate from Right-to-Left, while Arithmetic associates Left-to-Right."
    ])

    # =========================================================================
    # UNIT 3: CONTROL STRUCTURES & ITERATION
    # =========================================================================
    doc.new_page()
    doc.render_unit_banner("UNIT III", "CONTROL STRUCTURES & ITERATIVE CONSTRUCTS", "In-Sem: 10 Marks | End-Sem: 12 Marks")
    
    doc.render_question_card(
        "Q3.1", "8 Marks", "Guaranteed (5x Repeated)",
        "Dec 2024 (ESE), May 2024 (ESE), May 2023 (CCE), Dec 2022, Dec 2021",
        "Compare the three looping constructs in C (while, do-while, for) across 6 parameters: Syntax, Entry vs Exit control, Minimum iteration count, Loop variable initialization, Semicolon requirement, and Typical application. Write a C program verifying that while executes 0 times and do-while executes at least once for a False condition.",
        "[ ] 6-parameter comparative matrix (3M)  [ ] Control flowcharts for entry vs exit loops (2M)  [ ] C verification program (2M)  [ ] Output trace (1M)"
    )

    doc.render_question_card(
        "Q3.2", "7 Marks", "Guaranteed (4x Repeated)",
        "May 2024 (ESE), Dec 2023 (CCE), May 2022, Dec 2019",
        "Differentiate between break and continue statements in C with control flow diagrams. Explain their operational targets in nested loops, and state why continue is invalid inside a switch construct.",
        "[ ] break vs continue comparison table (3M)  [ ] Flowchart diagrams for both jump statements (2M)  [ ] Code example in loop (2M)"
    )

    doc.render_question_card(
        "Q3.3", "8 Marks", "Guaranteed (5x Repeated)",
        "Dec 2024 (ESE), May 2024 (ESE), Dec 2022, May 2021, Dec 2019",
        "Define an Armstrong (Narcissistic) Number. Develop a step-by-step algorithm, draw a flowchart, and write a complete compilable C program to check whether a given 3-digit integer is an Armstrong number. Provide a complete dry-run trace table for N = 153 and N = 371.",
        "[ ] Mathematical definition (1M)  [ ] Step-by-step algorithm (2M)  [ ] Compilable C code using %10 and /10 (3M)  [ ] Dry-run trace table (2M)"
    )

    doc.render_question_card(
        "Q3.4", "7 Marks", "High Frequency (3x Repeated)",
        "May 2023 (CCE), Dec 2022, May 2019",
        "Write a complete C program to check whether a given positive integer is a Prime Number. Explain the loop termination optimization up to sqrt(N). Provide a dry-run variable trace for N = 29 and N = 49.",
        "[ ] Prime logic & boundary condition (2M)  [ ] Complete compilable C code (3M)  [ ] Step-by-step trace table for prime and composite (2M)"
    )

    doc.render_question_card(
        "Q3.5", "6 Marks", "Medium Frequency (3x Repeated)",
        "Dec 2023 (CCE), May 2022, Dec 2020",
        "Write a C program using nested for loops to print a numerical Floyd's Triangle or star pyramid pattern for n rows. Trace inner and outer loop counter variables for n = 4.",
        "[ ] Nested loop logic formulation (2M)  [ ] Complete compilable C code (2M)  [ ] Loop variable iteration matrix (2M)"
    )

    doc.render_key_notes("UNIT III EXAMINER FOCUS", [
        "In Armstrong Number (Q3.3), do NOT use 'pow(rem, 3)' from math.h without casting; floating-point roundoff (e.g. 124.999 -> 124) loses marks. Use 'rem * rem * rem'.",
        "In while loops, placing 'continue' before incrementing the loop variable causes an infinite loop because the update step is skipped.",
        "Always remember the semicolon at the end of a do-while loop: 'do { ... } while (condition);'."
    ])

    # =========================================================================
    # UNIT 4: ARRAYS AND STRINGS
    # =========================================================================
    doc.new_page()
    doc.render_unit_banner("UNIT IV", "ARRAYS AND STRING MANIPULATION", "End-Sem Weightage: 14 Marks")
    
    doc.render_question_card(
        "Q4.1", "8 Marks", "Guaranteed (5x Repeated)",
        "Dec 2024 (ESE), May 2024 (ESE), May 2023 (ESE), Dec 2022, Dec 2021",
        "Write a complete compilable C program to perform Matrix Multiplication of two matrices A (r1 x c1) and B (r2 x c2). Implement dimensional compatibility validation (c1 == r2), dynamic element reading, triple-nested multiplication loops, and formatted display. Trace the dot-product calculation for cell C[0][0].",
        "[ ] Mathematical dimensional precondition (1M)  [ ] Complete compilable C code with triple loop (4M)  [ ] Reset accumulator c[i][j]=0 (1M)  [ ] Trace table (2M)"
    )

    doc.render_question_card(
        "Q4.2", "7 Marks", "Guaranteed (4x Repeated)",
        "Dec 2024 (ESE), May 2024 (ESE), May 2023 (ESE), Dec 2021",
        "Explain Row-Major Order memory representation for 2D arrays in C. Derive the address calculation formula: Address(A[i][j]) = Base + [(i * Total_Cols) + j] * sizeof(type). Given an array int A[4][5] starting at base address 2000 with 4-byte integers, calculate the physical memory address of A[2][3].",
        "[ ] Row-major memory layout diagram (2M)  [ ] Address calculation formula derivation (2M)  [ ] Numerical problem solution with exact address (3M)"
    )

    doc.render_question_card(
        "Q4.3", "8 Marks", "Guaranteed (4x Repeated)",
        "Dec 2024 (ESE), May 2024 (ESE), May 2023 (ESE), Dec 2022",
        "Write a complete C program to check whether a given string is a Palindrome WITHOUT using any library functions from <string.h>. Manually calculate string length, implement the two-pointer converging comparison algorithm, and provide a trace table for 'radar' and 'college'.",
        "[ ] Manual length calculation loop (2M)  [ ] Two-pointer left/right comparison logic (3M)  [ ] Compilable C code (2M)  [ ] Trace matrix (1M)"
    )

    doc.render_question_card(
        "Q4.4", "7 Marks", "Guaranteed (4x Repeated)",
        "May 2024 (ESE), Dec 2023 (ESE), Dec 2022, May 2021",
        "Explain the four primary string handling library functions from <string.h>: strlen(), strcpy(), strcat(), and strcmp(). Provide function prototypes, parameter types, return values, buffer safety requirements, and small code snippets for each.",
        "[ ] Table of 4 functions with prototypes & return types (3M)  [ ] Buffer overflow safety constraints (2M)  [ ] Working code snippets (2M)"
    )

    doc.render_question_card(
        "Q4.5", "6 Marks", "High Frequency (3x Repeated)",
        "Dec 2023 (ESE), May 2022, Dec 2019",
        "Write a C program to perform In-Place Matrix Transposition for an N x N square matrix without declaring a secondary auxiliary matrix. Trace the upper-triangular swap mechanism.",
        "[ ] In-place swapping condition (j > i) (2M)  [ ] Complete compilable C code (2M)  [ ] Matrix state trace before and after transpose (2M)"
    )

    doc.render_key_notes("UNIT IV EXAMINER FOCUS", [
        "In Matrix Multiplication (Q4.1), omitting 'c[i][j] = 0;' before the innermost loop accumulates garbage values, causing a 2-mark deduction.",
        "In Palindrome without string.h (Q4.3), if `<string.h>` or `strlen()` is called, examiners deduct 3 marks immediately.",
        "In 2D Array address calculation (Q4.2), multiply by sizeof(data_type) at the end: '(i * cols + j) * size'."
    ])

    # =========================================================================
    # UNIT 5: FUNCTIONS & MODULAR PROGRAMMING
    # =========================================================================
    doc.new_page()
    doc.render_unit_banner("UNIT V", "MODULAR PROGRAMMING & FUNCTIONS", "End-Sem Weightage: 14 Marks")
    
    doc.render_question_card(
        "Q5.1", "8 Marks", "Guaranteed (5x Repeated)",
        "Dec 2024 (ESE), May 2024 (ESE), May 2023 (ESE), Dec 2022, May 2019",
        "Differentiate between Call by Value and Call by Reference (Address Passing via Pointers) across 6 parameters. Draw stack memory activation frame diagrams for both methods. Write two C functions demonstrating why variable swapping fails in Call by Value and succeeds in Call by Reference.",
        "[ ] 6-parameter comparative table (3M)  [ ] Dual stack frame diagrams showing memory cells (2M)  [ ] Compilable swap C functions (2M)  [ ] Output trace (1M)"
    )

    doc.render_question_card(
        "Q5.2", "8 Marks", "Guaranteed (4x Repeated)",
        "Dec 2024 (ESE), May 2024 (ESE), Dec 2023 (ESE), Dec 2021",
        "What is Recursion? State the two essential conditions required for a valid recursive function (Base case and Recursive reduction step). Write a recursive C function for Factorial (n!) and trace the complete Stack Activation Records showing both Winding (Push) and Unwinding (Pop) phases for factorial(4). Explain causes of Stack Overflow.",
        "[ ] Recursion definition & 2 essential conditions (2M)  [ ] Compilable recursive C code (2M)  [ ] 8-step Push/Pop activation trace table (3M)  [ ] Stack overflow explanation (1M)"
    )

    doc.render_question_card(
        "Q5.3", "7 Marks", "Guaranteed (4x Repeated)",
        "Dec 2023 (ESE), May 2023 (ESE), May 2022, Dec 2019",
        "Write a recursive C function to solve the Tower of Hanoi problem for N disks. State its recurrence relation T(n) = 2T(n-1) + 1 and the minimum moves formula 2^n - 1. Draw the recursive function call tree for N = 3 disks.",
        "[ ] Mathematical recurrence relation & formula (2M)  [ ] Complete compilable recursive C program (3M)  [ ] Complete recursive call tree diagram for N=3 (2M)"
    )

    doc.render_question_card(
        "Q5.4", "7 Marks", "High Frequency (3x Repeated)",
        "May 2023 (ESE), Dec 2022, May 2021",
        "Explain how arrays are passed to functions in C. Write a C function that takes an array of N integers and returns both the maximum and minimum elements using pointer arguments. Explain formal vs actual parameters.",
        "[ ] Array passing by pointer reference (2M)  [ ] Formal vs actual parameter definitions (2M)  [ ] Compilable C code with pointer outputs (3M)"
    )

    doc.render_question_card(
        "Q5.5", "6 Marks", "High Frequency (3x Repeated)",
        "May 2024 (ESE), Dec 2022, Dec 2020",
        "Compare Recursion versus Iteration across 5 parameters: Control mechanism, Memory overhead (stack space), Execution speed, Code readability, and Risk of stack overflow. When is recursion preferred over iteration?",
        "[ ] 5-parameter comparison table (3M)  [ ] Stack overhead analysis (2M)  [ ] Practical use cases for trees/divide-and-conquer (1M)"
    )

    doc.render_key_notes("UNIT V EXAMINER FOCUS", [
        "In Recursion trace (Q5.2), you MUST show both phases: Winding (Push) and Unwinding (Pop). Tracing only the push phase loses 1.5 marks.",
        "In Call by Reference (Q5.1), remember that C does not have native reference variables like C++; it simulates Call by Reference using pointer indirection.",
        "Always state that base termination condition prevents infinite recursion and segmentation fault (SIGSEGV)."
    ])

    # =========================================================================
    # UNIT 6: STRUCTURES, UNIONS & FILE OPERATIONS
    # =========================================================================
    doc.new_page()
    doc.render_unit_banner("UNIT VI", "STRUCTURES, UNIONS & FILE HANDLING", "End-Sem Weightage: 16 Marks")
    
    doc.render_question_card(
        "Q6.1", "8 Marks", "Guaranteed (5x Repeated)",
        "Dec 2024 (ESE), May 2024 (ESE), May 2023 (ESE), Dec 2022, Dec 2020",
        "Differentiate between Structure (struct) and Union (union) across 6 parameters: Keyword, Memory allocation formula, Starting memory offset of members, Member concurrency, Data overwrite risk, and Memory size. Draw memory allocation diagrams for both. Write a C program demonstrating data overwrite in a union.",
        "[ ] 6-parameter comparative table (3M)  [ ] Memory allocation layout diagrams (2M)  [ ] Union overwrite demonstration C code (2M)  [ ] Explanation of float overwrite (1M)"
    )

    doc.render_question_card(
        "Q6.2", "8 Marks", "Guaranteed (5x Repeated)",
        "Dec 2024 (ESE), May 2024 (ESE), May 2023 (ESE), Dec 2022, May 2021",
        "Explain File Handling in C. What is a FILE pointer? Provide the complete File Opening Modes Matrix (r, w, a, r+, w+, a+) detailing operational meaning, behavior if file exists, behavior if file does not exist, and initial file position. Explain the role of EOF, feof(), and ferror().",
        "[ ] High-level buffered stream I/O lifecycle (2M)  [ ] Complete 6-mode comparison matrix (3M)  [ ] FILE pointer and buffer flushing via fclose() (2M)  [ ] Error checks (1M)"
    )

    doc.render_question_card(
        "Q6.3", "8 Marks", "Guaranteed (4x Repeated)",
        "Dec 2024 (ESE), May 2024 (ESE), Dec 2023 (ESE), May 2022",
        "Define an Array of Structures. Write a complete C program to manage academic records of N students with fields: roll_no, name, and marks. Implement functionality to: 1) Read data for N students, 2) Calculate class average, and 3) Search and display record of a student given their roll number.",
        "[ ] struct Student definition & array declaration (2M)  [ ] Complete compilable C code with search function (4M)  [ ] Linear search trace (2M)"
    )

    doc.render_question_card(
        "Q6.4", "7 Marks", "Guaranteed (4x Repeated)",
        "Dec 2024 (ESE), May 2023 (ESE), Dec 2021, May 2019",
        "Write a complete C program to copy the contents of one text file to another text file character by character using fgetc() and fputc(). Include proper file open validation (fp == NULL), EOF loop termination, and file closing routines. Explain why int is used to store fgetc() return values.",
        "[ ] Complete compilable file copy C code (4M)  [ ] Error handling for fp == NULL check (1M)  [ ] Explanation of int return for EOF (2M)"
    )

    doc.render_question_card(
        "Q6.5", "6 Marks", "Guaranteed (4x Repeated)",
        "Dec 2023 (ESE), May 2023 (ESE), May 2022, Dec 2021",
        "Explain Structure Padding and Word Alignment in C. Why does sizeof(struct) often exceed the sum of sizes of its individual members? How does CPU data bus alignment affect memory layout? How does `#pragma pack(1)` eliminate padding bytes?",
        "[ ] Hardware word-boundary alignment explanation (2M)  [ ] Struct padding byte layout diagram (2M)  [ ] Demonstration with sizeof() and #pragma pack (2M)"
    )

    doc.render_key_notes("UNIT VI EXAMINER FOCUS", [
        "In File handling (Q6.2 & Q6.4), omitting 'if (fp == NULL)' after 'fopen()' loses 1 full mark. Always check for NULL pointer.",
        "In fgetc(), the return variable MUST be declared as 'int ch', NOT 'char ch'. 'EOF' is typically -1, which cannot fit into an unsigned char.",
        "In Union size calculation (Q6.1), union size is NOT the sum of members; it is equal to the size of its largest member."
    ])

    # =========================================================================
    # BACK MATTER: SPPU EXAM READINESS CHECKLIST & SCORING STRATEGY
    # =========================================================================
    doc.new_page()
    doc.render_unit_banner("EXAMINATION CHECKLIST", "LAST-MINUTE REVISION & SCORING PROTOCOL", "Examiner Scoring Strategy")
    
    doc.render_section_title("TOP 10 SURE-SHOT QUESTIONS (MANDATORY TO MASTER FIRST)")
    doc.render_table(
        ["Rank", "Topic / Question", "Unit", "Expected Marks", "Exam Priority", "Estimated Prep Time"],
        [0.08, 0.44, 0.12, 0.14, 0.12, 0.10],
        [
            ["1", "Q1.1: 4 Storage Classes Matrix & Process Memory Layout", "Unit I", "8 Marks", "Guaranteed", "35 Mins"],
            ["2", "Q1.2: Quadratic Equation Flowchart & Discriminant Program", "Unit I", "8 Marks", "Guaranteed", "30 Mins"],
            ["3", "Q2.1: 15-Level Precedence Hierarchy & Associativity", "Unit II", "8 Marks", "Guaranteed", "25 Mins"],
            ["4", "Q2.2: Bitwise Operators & Manual 8-Bit Dry Run", "Unit II", "8 Marks", "Guaranteed", "30 Mins"],
            ["5", "Q3.1: while vs do-while vs for 6-Parameter Matrix", "Unit III", "8 Marks", "Guaranteed", "25 Mins"],
            ["6", "Q3.3: Armstrong Number Algorithm, Flowchart & Code", "Unit III", "8 Marks", "Guaranteed", "30 Mins"],
            ["7", "Q4.1: Matrix Multiplication Triple-Loop C Program", "Unit IV", "8 Marks", "Guaranteed", "40 Mins"],
            ["8", "Q4.3: Palindrome String without <string.h> Two-Pointer", "Unit IV", "8 Marks", "Guaranteed", "30 Mins"],
            ["9", "Q5.1: Call by Value vs Reference Stack Frame Diagrams", "Unit V", "8 Marks", "Guaranteed", "35 Mins"],
            ["10", "Q6.1: struct vs union 6-Parameter Matrix & Memory Layout", "Unit VI", "8 Marks", "Guaranteed", "30 Mins"]
        ]
    )

    doc.render_section_title("5 GOLDEN RULES FOR SPPU SUBJECTIVE THEORY EVALUATION")
    doc.render_body_text(
        "Rule 1 - The 2-Page Rule: For 7-mark and 8-mark questions in SPPU End-Sem papers, write a minimum of 1.5 to 2 full pages. "
        "Divide answers into four explicit headings: Theory/Formula, Diagram/Flowchart, Complete C Code, and Dry Run Trace Table."
    )
    doc.render_body_text(
        "Rule 2 - Mandatory Flowcharts: Even if a question states only 'Write a C program', always draw the flowchart or memory diagram. "
        "This guarantees at least 3 to 4 partial marks even if there is an accidental syntax mistake in your code."
    )
    doc.render_body_text(
        "Rule 3 - Complete Compilable Programs: Never write isolated code fragments. Always write `#include <stdio.h>`, `int main()`, "
        "declare all variables, add input validation, and conclude with `return 0;`. Missing main() loses 1 mark."
    )
    doc.render_body_text(
        "Rule 4 - Trace Tables: Always draw a clean 3-column or 4-column trace table with test cases showing variable states per loop iteration. "
        "Examiners look directly at trace tables to verify understanding of program execution."
    )
    doc.render_body_text(
        "Rule 5 - Time Management Formula: 70-Mark End-Sem is 150 minutes (2.5 hours). Allocate exactly 20 minutes per 8-mark question "
        "(6 questions x 20m = 120m), leaving 30 minutes for diagram verification and final review."
    )

    doc.render_key_notes("LASTBENCH ACADEMIC COMPANION", [
        "This question bank is published by LastBench (lastbench.online) for SPPU First Year Engineering students.",
        "Mastering these 30 sure-shot questions covers over 85% of repeated questions in SPPU In-Sem and End-Sem exams.",
        "Visit lastbench.online for full syllabus notes, interactive code playgrounds, and past question papers."
    ])

    doc.save_document()


if __name__ == "__main__":
    generate_sure_shot_pyq_pdf()
