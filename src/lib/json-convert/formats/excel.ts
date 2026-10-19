import type { JsonValue } from "../types.ts";

let _jszipModule: typeof import("jszip") | null = null;

async function ensureJSZip() {
  if (!_jszipModule) {
    _jszipModule = (await import("jszip")).default;
  }
  return _jszipModule;
}

/**
 * Convert a JSON array of objects to a minimal .xlsx file (returned as base64).
 * Produces a real .xlsx using JSZip (no Excel library needed — we hand-build the XML).
 *
 * Output is a base64 string; the tool page is responsible for triggering the download.
 */
export async function jsonToExcelBase64(parsed: JsonValue, options?: { sheetName?: string }): Promise<string> {
  const records = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : [];
  if (records.length === 0) return "";

  const sheetName = (options?.sheetName as string) || "Sheet1";
  const headers = Object.keys(records[0] as Record<string, JsonValue>);

  const escapeXml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const cellValue = (v: JsonValue): string => {
    if (v === null) return "";
    if (typeof v === "number") return String(v);
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    return escapeXml(String(v));
  };

  // Build sheet1.xml
  const rows: string[] = [];
  // Header row
  rows.push(
    `<row r="1">${headers.map((h, i) => {
      const col = String.fromCharCode(65 + i);
      return `<c r="${col}1" t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>`;
    }).join("")}</row>`,
  );
  // Data rows
  records.forEach((r, rowIdx) => {
    const row = r as Record<string, JsonValue>;
    const rowNum = rowIdx + 2;
    const cells = headers.map((h, i) => {
      const col = String.fromCharCode(65 + i);
      const v = row[h];
      const isNum = typeof v === "number";
      const t = isNum ? "" : ` t="inlineStr"`;
      return `<c r="${col}${rowNum}"${t}>${isNum ? `<v>${v}</v>` : `<is><t>${cellValue(v)}</t></is>`}</c>`;
    }).join("");
    rows.push(`<row r="${rowNum}">${cells}</row>`);
  });

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${rows.join("")}</sheetData>
</worksheet>`;

  const JSZip = await ensureJSZip();
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`);
  zip.folder("_rels")!.file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
  zip.folder("xl")!.file("workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`);
  zip.folder("xl")!.folder("_rels")!.file("workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`);
  zip.folder("xl")!.folder("worksheets")!.file("sheet1.xml", sheet1Xml);

  const blob = await zip.generateAsync({ type: "base64" });
  return blob;
}
