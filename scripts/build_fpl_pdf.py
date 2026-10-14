#!/usr/bin/env python3
"""
High-Yield PDF Generator for SPPU FE 2024 Revised Pattern:
Subject: Fundamentals of Programming Languages (FPL)
Created for LastBench (lastbench.online)
"""

import sys
import os

class SimplePDF:
    def __init__(self, output_path):
        self.output_path = output_path
        self.pages = []
        self.current_page_commands = []
        # Page dimensions: A4 is 595.28 x 841.89 points
        self.page_width = 595.28
        self.page_height = 841.89
        self.margin_x = 42
        self.margin_top = 46
        self.margin_bottom = 46
        self.usable_width = self.page_width - (2 * self.margin_x)
        self.y = self.page_height - self.margin_top

    def new_page(self):
        if self.current_page_commands:
            self.pages.append(self.current_page_commands)
            self.current_page_commands = []
        self.y = self.page_height - self.margin_top

    def escape_text(self, text):
        replacements = {
            '\\': '\\\\', '(': '\\(', ')': '\\)',
            '\u2014': '--', '\u2013': '-', '\u2018': "'", '\u2019': "'",
            '\u201c': '"', '\u201d': '"', '\u2022': '-', '\u2265': '>=',
            '\u2264': '<=', '\u00b0': ' deg'
        }
        for k, v in replacements.items():
            text = text.replace(k, v)
        # Strip any remaining non-ascii characters
        return text.encode('ascii', 'ignore').decode('ascii')

    def draw_header_footer(self, page_num, total_pages):
        cmds = []
        # Header banner line
        cmds.append("0.2 0.2 0.2 RG 0.5 w")
        cmds.append(f"{self.margin_x} {self.page_height - 30} m {self.page_width - self.margin_x} {self.page_height - 30} l S")
        
        # Header text
        header_text = self.escape_text("LastBench.online | SPPU FE Engineering 2024 Pattern | FPL High-Frequency PYQ Guide")
        cmds.append(f"BT /F1 8 Tf 0.4 0.4 0.4 rg {self.margin_x} {self.page_height - 25} Td ({header_text}) Tj ET")

        # Footer line
        cmds.append(f"{self.margin_x} 32 m {self.page_width - self.margin_x} 32 l S")
        
        # Footer text
        footer_text = self.escape_text("Free Academic Study Guide - Prepared for SPPU Engineering Students")
        cmds.append(f"BT /F1 8 Tf 0.4 0.4 0.4 rg {self.margin_x} 20 Td ({footer_text}) Tj ET")
        
        page_str = self.escape_text(f"Page {page_num} of {total_pages}")
        cmds.append(f"BT /F2 8 Tf 0.2 0.2 0.2 rg {self.page_width - self.margin_x - 55} 20 Td ({page_str}) Tj ET")
        return cmds

    def ensure_space(self, needed_height):
        if self.y - needed_height < self.margin_bottom:
            self.new_page()

    def add_title_block(self):
        # Decorative top box
        box_height = 80
        self.ensure_space(box_height + 15)
        
        y_top = self.y
        # Fill dark container
        self.current_page_commands.append(f"0.08 0.08 0.1 rg {self.margin_x} {y_top - box_height} {self.usable_width} {box_height} re f")
        
        # Title text
        self.current_page_commands.append(f"BT /F2 15 Tf 1 1 1 rg {self.margin_x + 16} {y_top - 24} Td ({self.escape_text('SAVITRIBAI PHULE PUNE UNIVERSITY (SPPU)')}) Tj ET")
        self.current_page_commands.append(f"BT /F2 12 Tf 0.95 0.77 0.25 rg {self.margin_x + 16} {y_top - 42} Td ({self.escape_text('F.E. 2024 REVISED PATTERN | FUNDAMENTALS OF PROGRAMMING LANGUAGES (FPL)')}) Tj ET")
        self.current_page_commands.append(f"BT /F1 9 Tf 0.8 0.8 0.8 rg {self.margin_x + 16} {y_top - 62} Td ({self.escape_text('Most Asked PYQs, Exam Blueprint & High-Yield Blueprint (In-Sem & End-Sem)')}) Tj ET")
        
        self.y = y_top - box_height - 18

    def add_section_header(self, title):
        self.ensure_space(32)
        # Background bar
        bar_height = 20
        self.current_page_commands.append(f"0.93 0.94 0.96 rg {self.margin_x} {self.y - bar_height} {self.usable_width} {bar_height} re f")
        self.current_page_commands.append(f"0.1 0.1 0.1 RG 1 w {self.margin_x} {self.y - bar_height} m {self.margin_x} {self.y} l S")
        self.current_page_commands.append(f"BT /F2 11 Tf 0.1 0.1 0.1 rg {self.margin_x + 8} {self.y - 14} Td ({self.escape_text(title)}) Tj ET")
        self.y -= bar_height + 10

    def add_question(self, q_num, text, marks, freq="High", is_code=False):
        self.ensure_space(36)
        # Frequency badge color
        badge_text = f"[{freq} Frequency | {marks}]"
        
        self.current_page_commands.append(f"BT /F2 10 Tf 0.05 0.05 0.05 rg {self.margin_x} {self.y} Td ({self.escape_text(q_num + '.')}) Tj ET")
        
        # Word wrap question text
        words = text.split()
        lines = []
        cur_line = []
        cur_len = 0
        max_len = 65
        
        for w in words:
            if cur_len + len(w) + 1 > max_len:
                lines.append(" ".join(cur_line))
                cur_line = [w]
                cur_len = len(w)
            else:
                cur_line.append(w)
                cur_len += len(w) + 1
        if cur_line:
            lines.append(" ".join(cur_line))

        # First line with badge
        for i, line in enumerate(lines):
            self.ensure_space(14)
            if i == 0:
                self.current_page_commands.append(f"BT /F2 9.5 Tf 0.1 0.1 0.1 rg {self.margin_x + 20} {self.y} Td ({self.escape_text(line)}) Tj ET")
                self.current_page_commands.append(f"BT /F2 8.5 Tf 0.75 0.35 0.05 rg {self.page_width - self.margin_x - 110} {self.y} Td ({self.escape_text(badge_text)}) Tj ET")
            else:
                self.current_page_commands.append(f"BT /F2 9.5 Tf 0.1 0.1 0.1 rg {self.margin_x + 20} {self.y} Td ({self.escape_text(line)}) Tj ET")
            self.y -= 13
        self.y -= 4

    def add_key_points(self, points):
        for pt in points:
            self.ensure_space(16)
            self.current_page_commands.append(f"BT /F1 9 Tf 0.25 0.25 0.25 rg {self.margin_x + 22} {self.y} Td ({self.escape_text('- ' + pt)}) Tj ET")
            self.y -= 12
        self.y -= 6

    def add_code_block(self, lines):
        block_height = (len(lines) * 11) + 14
        self.ensure_space(block_height + 8)
        
        # Gray background box for code
        y_top = self.y
        self.current_page_commands.append(f"0.96 0.96 0.97 rg {self.margin_x + 20} {y_top - block_height} {self.usable_width - 20} {block_height} re f")
        self.current_page_commands.append(f"0.85 0.85 0.87 RG 0.5 w {self.margin_x + 20} {y_top - block_height} {self.usable_width - 20} {block_height} re S")
        
        y_code = y_top - 12
        for line in lines:
            escaped = self.escape_text(line)
            self.current_page_commands.append(f"BT /F3 8 Tf 0.1 0.15 0.25 rg {self.margin_x + 28} {y_code} Td ({escaped}) Tj ET")
            y_code -= 11
        
        self.y = y_top - block_height - 10

    def add_table(self, headers, rows):
        col_width = (self.usable_width - 20) / len(headers)
        row_height = 16
        total_height = (len(rows) + 1) * row_height
        self.ensure_space(total_height + 10)
        
        y_top = self.y
        # Header row
        self.current_page_commands.append(f"0.15 0.15 0.18 rg {self.margin_x + 20} {y_top - row_height} {self.usable_width - 20} {row_height} re f")
        for c_idx, h in enumerate(headers):
            x = self.margin_x + 25 + (c_idx * col_width)
            self.current_page_commands.append(f"BT /F2 8.5 Tf 1 1 1 rg {x} {y_top - 11} Td ({self.escape_text(h)}) Tj ET")
        
        y_row = y_top - row_height
        for r_idx, r in enumerate(rows):
            bg = "0.98 0.98 0.99" if r_idx % 2 == 0 else "0.94 0.95 0.97"
            self.current_page_commands.append(f"{bg} rg {self.margin_x + 20} {y_row - row_height} {self.usable_width - 20} {row_height} re f")
            for c_idx, val in enumerate(r):
                x = self.margin_x + 25 + (c_idx * col_width)
                self.current_page_commands.append(f"BT /F1 8 Tf 0.15 0.15 0.15 rg {x} {y_row - 11} Td ({self.escape_text(val)}) Tj ET")
            y_row -= row_height
            
        self.y = y_row - 10

    def save(self):
        if self.current_page_commands:
            self.pages.append(self.current_page_commands)
            
        total_pages = len(self.pages)
        objects = []
        
        def add_obj(data):
            objects.append(data)
            return len(objects)

        # 1: Catalog
        catalog_id = add_obj("<< /Type /Catalog /Pages 2 0 R >>")
        
        # Reserve slot 2 for Pages Root
        pages_id = add_obj("") # placeholder
        
        # Fonts
        f1_id = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
        f2_id = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
        f3_id = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>")
        f4_id = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>")

        page_obj_ids = []
        for p_idx, page_cmds in enumerate(self.pages, 1):
            full_cmds = self.draw_header_footer(p_idx, total_pages) + page_cmds
            stream_data = "\n".join(full_cmds)
            
            content_id = add_obj(f"<< /Length {len(stream_data.encode('latin1'))} >>\nstream\n{stream_data}\nendstream")
            page_id = add_obj(
                f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {self.page_width} {self.page_height}] "
                f"/Contents {content_id} 0 R /Resources << /Font << /F1 {f1_id} 0 R /F2 {f2_id} 0 R /F3 {f3_id} 0 R /F4 {f4_id} 0 R >> >> >>"
            )
            page_obj_ids.append(page_id)

        # Update slot 2 (Pages root)
        kids_str = " ".join([f"{pid} 0 R" for pid in page_obj_ids])
        objects[1] = f"<< /Type /Pages /Kids [{kids_str}] /Count {len(page_obj_ids)} >>"

        # Write file
        with open(self.output_path, "wb") as f:
            f.write(b"%PDF-1.4\n")
            offsets = [0]
            for i, obj in enumerate(objects, 1):
                offsets.append(f.tell())
                f.write(f"{i} 0 obj\n{obj}\nendobj\n".encode("latin1"))
            
            xref_pos = f.tell()
            f.write(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode("latin1"))
            for off in offsets[1:]:
                f.write(f"{off:010d} 00000 n \n".encode("latin1"))
            
            f.write(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("latin1"))

        print(f"Document successfully written to: {self.output_path} ({total_pages} pages)")


def build_guide():
    pdf = SimplePDF("public/documents/SPPU_FE_2024_FPL_Most_Asked_PYQs.pdf")
    pdf.add_title_block()

    # Exam Overview & Pattern Section
    pdf.add_section_header("EXAMINATION BLUEPRINT & MARKS BREAKDOWN (2024 PATTERN)")
    pdf.add_table(
        ["Component", "Marks", "Units Covered", "Weightage Strategy"],
        [
            ["CCE (In-Sem Exam)", "30 Marks", "Units I, II, III", "Focus on Flowcharts, Operators, Loops"],
            ["ESE (End-Sem Exam)", "70 Marks", "All Units (Focus IV, V, VI)", "Focus on Arrays, Functions, Structs, Files"],
            ["Term Work (TW)", "25 Marks", "Lab Assignments", "Continuous journal & execution assessment"]
        ]
    )

    # UNIT 1
    pdf.add_section_header("UNIT I: PROGRAM PLANNING & C BASICS")
    pdf.add_question("Q1", "Define Algorithm and Flowchart. Draw standard flowchart symbols. Draw flowchart for Roots of Quadratic Equation.", "7 Marks", "100% Guaranteed")
    pdf.add_key_points([
        "Flowchart symbols: Terminal (Oval), Input/Output (Parallelogram), Process (Rectangle), Decision (Diamond), Connector (Circle).",
        "Quadratic formula: Discriminant D = b*b - 4*a*c. If D >= 0 real roots; if D < 0 imaginary roots.",
        "Algorithm steps must be numbered, finite, unambiguous, with defined inputs and single termination."
    ])

    pdf.add_question("Q2", "Explain 4 Storage Classes in C with Scope, Lifetime, Default Value, and Memory Location.", "8 Marks", "Repeated 6 Times")
    pdf.add_table(
        ["Storage Class", "Location", "Default Value", "Scope", "Lifetime"],
        [
            ["auto", "Stack Memory", "Garbage", "Local block", "Within function/block"],
            ["register", "CPU Register", "Garbage", "Local block", "Within function/block"],
            ["static", "Data Segment", "Zero (0)", "Local to file/block", "Throughout program execution"],
            ["extern", "Data Segment", "Zero (0)", "Global / Multi-file", "Throughout program execution"]
        ]
    )

    pdf.add_question("Q3", "Explain C Tokens, Identifiers, Keywords, and Constants with Naming Rules.", "6 Marks", "Frequent")
    pdf.add_key_points([
        "Tokens: Smallest individual unit in C (Keywords, Identifiers, Constants, Strings, Special Symbols, Operators).",
        "Rules: Identifier must begin with alphabet or underscore (_). Cannot contain special characters or spaces. Case sensitive."
    ])

    # UNIT 2
    pdf.add_section_header("UNIT II: OPERATORS AND EXPRESSIONS")
    pdf.add_question("Q4", "Explain Bitwise Operators in C with Truth Tables and Numerical Examples (&, |, ^, ~, <<, >>).", "7 Marks", "High Frequency")
    pdf.add_key_points([
        "Bitwise AND (&): 1 only if both bits 1. Bitwise OR (|): 1 if either bit 1. Bitwise XOR (^): 1 if bits differ.",
        "Left shift (x << n) multiplies x by 2^n. Right shift (x >> n) divides x by 2^n (integer division)."
    ])
    pdf.add_code_block([
        "/* Example: a = 12 (00001100), b = 25 (00011001) */",
        "int a = 12, b = 25;",
        "printf(\"a & b  = %d\\n\", a & b);  /* Output: 8  (00001000) */",
        "printf(\"a | b  = %d\\n\", a | b);  /* Output: 29 (00011101) */",
        "printf(\"a ^ b  = %d\\n\", a ^ b);  /* Output: 21 (00010101) */",
        "printf(\"a << 2 = %d\\n\", a << 2); /* Output: 48 (12 * 4)   */"
    ])

    pdf.add_question("Q5", "Differentiate Pre-increment (++i) vs Post-increment (i++) with Code Demonstration.", "5 Marks", "Frequent")
    pdf.add_key_points([
        "Pre-increment (++i): Value is incremented FIRST, then used in the expression.",
        "Post-increment (i++): Current value is used in the expression FIRST, then incremented."
    ])

    pdf.add_question("Q6", "Evaluate Arithmetic Expression using Precedence & Associativity rules.", "5 Marks", "Frequent")
    pdf.add_key_points([
        "Precedence order: 1) Parentheses ()  2) Unary (++ --)  3) Multiplicative (* / %)  4) Additive (+ -)  5) Assignment (=).",
        "Associativity: Multiplication, Division, and Modulus are Left-to-Right."
    ])

    # UNIT 3
    pdf.add_section_header("UNIT III: CONTROL FLOW (DECISION MAKING & LOOPS)")
    pdf.add_question("Q7", "Compare while loop, do-while loop, and for loop. Explain Entry vs Exit controlled.", "6 Marks", "100% Guaranteed")
    pdf.add_table(
        ["Feature", "while loop", "do-while loop", "for loop"],
        [
            ["Control Type", "Entry-controlled", "Exit-controlled", "Entry-controlled"],
            ["Min Iterations", "0 (if condition false initially)", "1 (condition checked at end)", "0"],
            ["Semicolon", "No semicolon after condition", "Must end with semicolon ;", "No semicolon at loop header"],
            ["Best Use", "When iterations unknown", "Menu-driven programs", "Known iteration count"]
        ]
    )

    pdf.add_question("Q8", "Explain switch-case statement with syntax and restrictions. Compare with else-if ladder.", "7 Marks", "High Frequency")
    pdf.add_key_points([
        "Restrictions: Case expression must be integral constant (int or char). Float/string not allowed.",
        "Duplicate case values are illegal. 'break' prevents fall-through execution to subsequent cases."
    ])

    pdf.add_question("Q9", "Write C Programs for: Armstrong Number, Prime Number Check, and Fibonacci Series.", "7 Marks", "Core Code PYQ")
    pdf.add_code_block([
        "/* 1. Armstrong Number Check (e.g. 153 = 1^3 + 5^3 + 3^3) */",
        "#include <stdio.h>",
        "int main() {",
        "    int num, original, rem, sum = 0;",
        "    scanf(\"%d\", &num);",
        "    original = num;",
        "    while (num > 0) {",
        "        rem = num % 10;",
        "        sum += (rem * rem * rem);",
        "        num /= 10;",
        "    }",
        "    if (sum == original) printf(\"Armstrong Number\\n\");",
        "    else printf(\"Not Armstrong\\n\");",
        "    return 0;",
        "}"
    ])

    # UNIT 4
    pdf.add_section_header("UNIT IV: ARRAYS AND STRINGS")
    pdf.add_question("Q10", "Write a C Program to Multiply Two Matrices (3x3) with compatibility check.", "8 Marks", "Repeated Every End-Sem")
    pdf.add_code_block([
        "/* Condition: Columns of Matrix A == Rows of Matrix B (c1 == r2) */",
        "for (int i = 0; i < r1; i++) {",
        "    for (int j = 0; j < c2; j++) {",
        "        mult[i][j] = 0;",
        "        for (int k = 0; k < c1; k++) {",
        "            mult[i][j] += a[i][k] * b[k][j];",
        "        }",
        "    }",
        "}"
    ])

    pdf.add_question("Q11", "Implement Binary Search algorithm on sorted 1D array. Give time complexity.", "7 Marks", "High Frequency")
    pdf.add_key_points([
        "Pre-requisite: Array MUST be sorted in ascending or descending order.",
        "Logic: Calculate mid = (low + high)/2. If key == arr[mid] found; if key < arr[mid] search left; else search right.",
        "Time Complexity: Best Case O(1), Average Case O(log n), Worst Case O(log n). (Linear search is O(n))."
    ])

    pdf.add_question("Q12", "Explain string library functions from <string.h> and Palindrome WITHOUT library function.", "7 Marks", "Core PYQ")
    pdf.add_key_points([
        "strlen(s): Returns length excluding '\\0'. strcpy(dest, src): Copies string. strcat(s1, s2): Appends s2 to s1.",
        "strcmp(s1, s2): Returns 0 if equal, positive if s1 > s2 (ASCII), negative if s1 < s2."
    ])

    # UNIT 5
    pdf.add_section_header("UNIT V: USER-DEFINED FUNCTIONS")
    pdf.add_question("Q13", "Differentiate Call by Value vs Call by Reference with Swapping Program & Memory Diagrams.", "8 Marks", "100% Recurring")
    pdf.add_table(
        ["Parameter", "Call by Value", "Call by Reference (Pointers)"],
        [
            ["Values Passed", "Actual value copies passed", "Memory address of variables passed"],
            ["Modifications", "Changes inside function do NOT affect original", "Changes directly affect original variables"],
            ["Memory Overhead", "Creates duplicate variables in stack", "Reuses same memory locations"],
            ["Syntax", "swap(a, b);", "swap(&a, &b); with pointer parameters *x, *y"]
        ]
    )

    pdf.add_question("Q14", "What is Recursion? Write Recursive Function for Factorial and explain Stack Execution.", "7 Marks", "High Frequency")
    pdf.add_code_block([
        "int factorial(int n) {",
        "    if (n <= 1) return 1;          /* Base Condition */",
        "    return n * factorial(n - 1);  /* Recursive Call */",
        "}",
        "/* Stack Trace for factorial(3):",
        "   Push: fact(3) -> fact(2) -> fact(1)",
        "   Pop:  fact(1)=1 -> fact(2)=2*1=2 -> fact(3)=3*2=6 */"
    ])

    # UNIT 6
    pdf.add_section_header("UNIT VI: STRUCTURES, UNIONS & FILE HANDLING")
    pdf.add_question("Q15", "Differentiate Structure vs Union with Syntax and Memory Allocation Diagrams.", "8 Marks", "Repeated Every Exam")
    pdf.add_table(
        ["Criterion", "Structure (struct)", "Union (union)"],
        [
            ["Keyword", "struct keyword used", "union keyword used"],
            ["Memory Allocation", "Sum of sizes of all members (+ padding)", "Size of the LARGEST member only"],
            ["Member Access", "All members can be accessed simultaneously", "Only ONE member can be accessed at a time"],
            ["Data Integrity", "Altering one member does not affect others", "Altering one member overwrites other members"]
        ]
    )

    pdf.add_question("Q16", "Write C Program using Array of Structures for 5 Students and find Topper.", "8 Marks", "Core Practical & Theory")
    pdf.add_code_block([
        "struct Student {",
        "    int roll;",
        "    char name[30];",
        "    float marks;",
        "};",
        "struct Student s[5]; int topper_idx = 0;",
        "for(int i=0; i<5; i++) {",
        "    scanf(\"%d %s %f\", &s[i].roll, s[i].name, &s[i].marks);",
        "    if (s[i].marks > s[topper_idx].marks) topper_idx = i;",
        "}",
        "printf(\"Topper: %s, Marks: %.2f\\n\", s[topper_idx].name, s[topper_idx].marks);"
    ])

    pdf.add_question("Q17", "Explain File Opening Modes in C (r, w, a, r+, w+) and Standard File I/O Functions.", "6 Marks", "Frequent")
    pdf.add_key_points([
        "Modes: 'r' = Read only (file must exist); 'w' = Write (creates or truncates file); 'a' = Append (writes at end of file).",
        "Functions: fopen() opens stream, fclose() flushes and closes stream, fprintf()/fscanf() formatted file I/O."
    ])

    # EXAM DAY STRATEGY
    pdf.add_section_header("EXAMINER SCORING HACKS FOR SPPU 2024 PATTERN")
    pdf.add_key_points([
        "Always write Algorithm and Flowchart together even if only one is asked—evaluators give instant partial marks.",
        "For 8-mark code questions, structure your answer: 1) Problem Statement  2) Logic & Algorithm  3) Clean Indented C Code  4) Sample Input & Output.",
        "Always mention header files (#include <stdio.h>, #include <string.h>, #include <math.h>) and return 0; in every code snippet."
    ])

    pdf.save()

if __name__ == "__main__":
    build_guide()
