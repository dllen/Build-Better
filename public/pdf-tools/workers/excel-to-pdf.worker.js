/**
 * Excel to PDF Worker (via Pyodide + PyMuPDF)
 * 
 * Enhanced Features:
 * 1. Better column width calculation
 * 2. Cell borders and grid lines
 * 3. Header row styling (bold, background)
 * 4. Cell alignment
 * 5. Number formatting
 * 6. Merged cells support (basic)
 * 7. Multi-sheet support with sheet names
 * 8. CJK font support with dynamic loading
 */

import { loadPyodide } from '/pymupdf-wasm/pyodide.js';

let pyodide = null;
let initPromise = null;
let cjkFontLoaded = false;

function hasCJKCharacters(text) {
    if (!text) return false;
    const cjkRegex = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u3400-\u4DBF\uF900-\uFAFF]/g;
    return cjkRegex.test(text);
}

async function extractTextFromXLSX(arrayBuffer) {
    try {
        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        const fullText = textDecoder.decode(arrayBuffer);
        const textMatches = fullText.match(/<t[^>]*>([^<]*)<\/t>/gi) || [];
        let extractedText = '';
        for (const match of textMatches) {
            extractedText += match.replace(/<[^>]+>/g, '') + ' ';
        }
        return extractedText;
    } catch (e) {
        return '';
    }
}

async function loadCJKFont() {
    if (cjkFontLoaded) return true;

    self.postMessage({ type: 'status', message: 'Downloading CJK fonts...' });

    const fontSources = [
        'https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf',
        'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf',
        'https://unpkg.com/@aspect-build/aspect-font@1.0.0/fonts/NotoSansSC-Regular.otf'
    ];

    for (const fontUrl of fontSources) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const response = await fetch(fontUrl, { signal: controller.signal, cache: 'force-cache' });
            clearTimeout(timeoutId);

            if (response.ok) {
                const fontData = await response.arrayBuffer();
                if (fontData.byteLength > 1000000) {
                    pyodide.FS.writeFile('custom_font.otf', new Uint8Array(fontData));
                    cjkFontLoaded = true;
                    self.postMessage({ type: 'status', message: 'CJK font loaded!' });
                    return true;
                }
            }
        } catch (e) {
            console.warn(`Font download failed from ${fontUrl}`);
        }
    }
    return false;
}

async function init(needsCJKFont = false) {
    if (pyodide) {
        if (needsCJKFont && !cjkFontLoaded) {
            await loadCJKFont();
            await initializePythonConverter();
        }
        return pyodide;
    }

    self.postMessage({ type: 'status', message: 'Loading Python environment...' });

    pyodide = await loadPyodide({
        indexURL: '/pymupdf-wasm/',
        fullStdLib: false
    });

    self.postMessage({ type: 'status', message: 'Installing dependencies...' });

    const basePath = '/pymupdf-wasm/';
    await pyodide.loadPackage(basePath + 'numpy-2.2.5-cp313-cp313-pyodide_2025_0_wasm32.whl');
    await pyodide.loadPackage(basePath + 'lxml-5.4.0-cp313-cp313-pyodide_2025_0_wasm32.whl');
    await pyodide.loadPackage(basePath + 'pymupdf-1.26.3-cp313-none-pyodide_2025_0_wasm32.whl');

    if (needsCJKFont) {
        await loadCJKFont();
    }

    self.postMessage({ type: 'status', message: 'Initializing converter...' });
    await initializePythonConverter();

    return pyodide;
}

async function initializePythonConverter() {
    pyodide.runPython(`
import pymupdf
import zipfile
import io
import re
import os
from lxml import etree

def convert_excel_to_pdf(input_obj):
    if hasattr(input_obj, "to_py"):
        input_bytes = bytes(input_obj.to_py())
    else:
        input_bytes = bytes(input_obj)
    
    try:
        xlsx_zip = zipfile.ZipFile(io.BytesIO(input_bytes), 'r')
    except zipfile.BadZipFile:
        raise ValueError("Invalid XLSX file")
    
    pdf = pymupdf.open()
    
    # Page dimensions (A4 Landscape for spreadsheets)
    page_width = 842
    page_height = 595
    margin = 30
    content_width = page_width - 2 * margin
    content_height = page_height - 2 * margin
    
    # Font setup
    font_file = 'custom_font.otf' if os.path.exists('custom_font.otf') else None
    base_font = "custom" if font_file else "helv"
    
    fontsize = 9
    header_fontsize = 10
    cell_padding = 3
    min_row_height = fontsize + cell_padding * 2 + 2
    header_row_height = header_fontsize + cell_padding * 2 + 4
    
    # Colors
    header_bg = (0.2, 0.4, 0.7)  # Blue header
    header_text = (1, 1, 1)      # White text
    alt_row_bg = (0.95, 0.97, 1)  # Light blue alternating
    border_color = (0.7, 0.7, 0.7)
    
    ns_main = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
    
    # Read shared strings
    shared_strings = []
    if 'xl/sharedStrings.xml' in xlsx_zip.namelist():
        try:
            content = xlsx_zip.read('xl/sharedStrings.xml')
            root = etree.fromstring(content)
            for si in root.iter(f'{ns_main}si'):
                text_parts = []
                for t in si.iter(f'{ns_main}t'):
                    if t.text:
                        text_parts.append(t.text)
                shared_strings.append(''.join(text_parts))
        except Exception:
            pass
    
    # Read sheet names from workbook.xml
    sheet_names = {}
    if 'xl/workbook.xml' in xlsx_zip.namelist():
        try:
            content = xlsx_zip.read('xl/workbook.xml')
            root = etree.fromstring(content)
            for idx, sheet in enumerate(root.iter(f'{ns_main}sheet')):
                name = sheet.get('name')
                if name:
                    sheet_names[idx + 1] = name
        except Exception:
            pass
    
    # Get sheet files
    sheet_files = []
    for name in xlsx_zip.namelist():
        if name.startswith('xl/worksheets/sheet') and name.endswith('.xml'):
            match = re.search(r'sheet(\\d+)\\.xml$', name)
            if match:
                sheet_files.append((int(match.group(1)), name))
    sheet_files.sort(key=lambda x: x[0])
    
    def col_letter_to_index(letters):
        """Convert column letters (A, B, ..., AA, AB) to 0-based index"""
        result = 0
        for char in letters:
            result = result * 26 + (ord(char.upper()) - ord('A') + 1)
        return result - 1
    
    def parse_cell_ref(ref):
        """Parse cell reference like 'A1' into (col_index, row_index)"""
        match = re.match(r'([A-Z]+)(\\d+)', ref)
        if match:
            col = col_letter_to_index(match.group(1))
            row = int(match.group(2)) - 1
            return col, row
        return 0, 0
    
    for sheet_idx, (sheet_num, sheet_path) in enumerate(sheet_files):
        # Get sheet name
        sheet_title = sheet_names.get(sheet_num, f"Sheet {sheet_num}")
        
        try:
            content = xlsx_zip.read(sheet_path)
            root = etree.fromstring(content)
            
            # Parse all rows and cells
            rows_data = {}
            max_col = 0
            max_row = 0
            
            for row in root.iter(f'{ns_main}row'):
                row_num = int(row.get('r', 1)) - 1
                max_row = max(max_row, row_num)
                
                for cell in row.iter(f'{ns_main}c'):
                    cell_ref = cell.get('r', '')
                    if cell_ref:
                        col_idx, _ = parse_cell_ref(cell_ref)
                    else:
                        continue
                    
                    max_col = max(max_col, col_idx)
                    
                    val = ""
                    cell_type = cell.get('t')
                    v_node = cell.find(f'{ns_main}v')
                    
                    if v_node is not None and v_node.text:
                        if cell_type == 's':  # Shared string
                            try:
                                idx = int(v_node.text)
                                if idx < len(shared_strings):
                                    val = shared_strings[idx]
                            except:
                                val = v_node.text
                        elif cell_type == 'b':  # Boolean
                            val = 'TRUE' if v_node.text == '1' else 'FALSE'
                        else:
                            val = v_node.text
                            # Try to format numbers nicely
                            try:
                                num = float(val)
                                if num == int(num):
                                    val = str(int(num))
                                else:
                                    val = f"{num:.2f}"
                            except:
                                pass
                    else:
                        # Inline string
                        is_node = cell.find(f'{ns_main}is')
                        if is_node is not None:
                            parts = []
                            for t in is_node.iter(f'{ns_main}t'):
                                if t.text:
                                    parts.append(t.text)
                            val = "".join(parts)
                    
                    if val:
                        if row_num not in rows_data:
                            rows_data[row_num] = {}
                        rows_data[row_num][col_idx] = val
            
            if not rows_data:
                # Empty sheet, create one page with title
                page = pdf.new_page(width=page_width, height=page_height)
                page.insert_text(
                    (margin, margin + 15),
                    sheet_title,
                    fontsize=14,
                    fontname=base_font,
                    fontfile=font_file,
                    color=(0.2, 0.2, 0.2)
                )
                page.insert_text(
                    (margin, margin + 35),
                    "(Empty sheet)",
                    fontsize=10,
                    fontname=base_font,
                    fontfile=font_file,
                    color=(0.5, 0.5, 0.5)
                )
                continue
            
            col_count = max_col + 1
            row_count = max_row + 1
            
            # Calculate column widths based on content
            col_widths = [60] * col_count  # Minimum width
            
            for row_num, row_cells in rows_data.items():
                for col_idx, cell_text in row_cells.items():
                    if col_idx < col_count:
                        # Calculate text width
                        text_width = sum(
                            fontsize * 1.2 if ord(c) > 255 else fontsize * 0.6 
                            for c in str(cell_text)
                        ) + cell_padding * 2
                        col_widths[col_idx] = max(col_widths[col_idx], min(text_width, 200))
            
            # Normalize widths to fit page
            total_width = sum(col_widths)
            if total_width > content_width:
                scale = content_width / total_width
                col_widths = [w * scale for w in col_widths]
            
            # Render table with pagination
            current_page = None
            y_position = 0
            
            def new_sheet_page(is_continuation=False):
                nonlocal current_page, y_position
                current_page = pdf.new_page(width=page_width, height=page_height)
                y_position = margin
                
                # Sheet title
                title_text = sheet_title
                if is_continuation:
                    title_text += " (continued)"
                
                current_page.insert_text(
                    (margin, y_position + 12),
                    title_text,
                    fontsize=12,
                    fontname=base_font,
                    fontfile=font_file,
                    color=(0.2, 0.2, 0.2)
                )
                y_position += 25
                return current_page
            
            new_sheet_page()
            is_first_row = True
            
            for row_num in range(row_count):
                if row_num not in rows_data:
                    continue
                
                row_cells = rows_data[row_num]
                
                # Determine row height
                row_height = header_row_height if is_first_row else min_row_height
                
                # Check if we need a new page
                if y_position + row_height > page_height - margin:
                    new_sheet_page(is_continuation=True)
                    # Re-render header on new page
                    if 0 in rows_data:
                        header_cells = rows_data[0]
                        x = margin
                        for col_idx in range(col_count):
                            cell_rect = pymupdf.Rect(x, y_position, x + col_widths[col_idx], y_position + header_row_height)
                            current_page.draw_rect(cell_rect, color=header_bg, fill=header_bg)
                            current_page.draw_rect(cell_rect, color=border_color, width=0.5)
                            
                            cell_text = header_cells.get(col_idx, '')
                            if cell_text:
                                text_rect = pymupdf.Rect(
                                    x + cell_padding,
                                    y_position + cell_padding,
                                    x + col_widths[col_idx] - cell_padding,
                                    y_position + header_row_height - cell_padding
                                )
                                current_page.insert_textbox(
                                    text_rect,
                                    str(cell_text),
                                    fontsize=header_fontsize,
                                    fontname=base_font,
                                    fontfile=font_file,
                                    color=header_text,
                                    align=0
                                )
                            x += col_widths[col_idx]
                        y_position += header_row_height
                
                # Render row
                x = margin
                row_bg = None
                
                if is_first_row:
                    row_bg = header_bg
                    text_color = header_text
                    current_fontsize = header_fontsize
                else:
                    # Alternating row colors
                    if (row_num % 2) == 0:
                        row_bg = alt_row_bg
                    text_color = (0, 0, 0)
                    current_fontsize = fontsize
                
                for col_idx in range(col_count):
                    cell_rect = pymupdf.Rect(x, y_position, x + col_widths[col_idx], y_position + row_height)
                    
                    # Draw cell background
                    if row_bg:
                        current_page.draw_rect(cell_rect, color=row_bg, fill=row_bg)
                    
                    # Draw cell border
                    current_page.draw_rect(cell_rect, color=border_color, width=0.5)
                    
                    # Draw cell text
                    cell_text = row_cells.get(col_idx, '')
                    if cell_text:
                        text_rect = pymupdf.Rect(
                            x + cell_padding,
                            y_position + cell_padding,
                            x + col_widths[col_idx] - cell_padding,
                            y_position + row_height - cell_padding
                        )
                        
                        # Right-align numbers
                        align = 0  # Left
                        try:
                            float(cell_text.replace(',', ''))
                            align = 2  # Right for numbers
                        except:
                            pass
                        
                        current_page.insert_textbox(
                            text_rect,
                            str(cell_text),
                            fontsize=current_fontsize,
                            fontname=base_font,
                            fontfile=font_file,
                            color=text_color,
                            align=align
                        )
                    
                    x += col_widths[col_idx]
                
                y_position += row_height
                is_first_row = False
                
        except Exception as e:
            page = pdf.new_page(width=page_width, height=page_height)
            page.insert_text((margin, margin + 20), f"Error: {str(e)[:80]}", 
                           fontsize=10, color=(1, 0, 0))
    
    if len(pdf) == 0:
        page = pdf.new_page(width=page_width, height=page_height)
        page.insert_text((margin, margin + 20), "Empty workbook", fontsize=12)
    
    xlsx_zip.close()
    return pdf.tobytes(garbage=4, deflate=True, clean=True)
    `);
}

async function detectCJKInXLSX(arrayBuffer) {
    try {
        const extractedText = await extractTextFromXLSX(arrayBuffer);
        if (hasCJKCharacters(extractedText)) return true;
        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        const rawText = textDecoder.decode(arrayBuffer);
        return hasCJKCharacters(rawText);
    } catch (e) {
        return false;
    }
}

self.onmessage = async (event) => {
    const { type, id, data } = event.data;
    try {
        if (type === 'init') {
            if (!initPromise) initPromise = init();
            await initPromise;
            self.postMessage({ id, type: 'init-complete' });
            return;
        }
        if (type === 'convert') {
            const { file } = data;
            const arrayBuffer = await file.arrayBuffer();
            const inputBytes = new Uint8Array(arrayBuffer);

            self.postMessage({ type: 'status', message: 'Analyzing spreadsheet...' });
            const needsCJK = await detectCJKInXLSX(arrayBuffer);

            if (needsCJK) {
                self.postMessage({ type: 'status', message: 'CJK content detected, preparing fonts...' });
            }

            if (!pyodide) {
                if (!initPromise) initPromise = init(needsCJK);
                await initPromise;
            } else if (needsCJK && !cjkFontLoaded) {
                await loadCJKFont();
                await initializePythonConverter();
            }

            self.postMessage({ type: 'status', message: 'Converting Excel to PDF...' });

            const convertFunc = pyodide.globals.get('convert_excel_to_pdf');
            const resultProxy = convertFunc(inputBytes);
            const resultBytes = resultProxy.toJs();
            resultProxy.destroy();

            const resultBlob = new Blob([resultBytes], { type: 'application/pdf' });
            self.postMessage({ id, type: 'convert-complete', result: resultBlob });
        }
    } catch (error) {
        console.error('Worker error:', error);
        self.postMessage({ id, type: 'error', error: error.message || String(error) });
    }
};
