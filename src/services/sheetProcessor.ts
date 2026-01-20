import { read, utils, WorkBook } from "xlsx";

/**
 * Supported file types for sheet processing
 */
export enum FileType {
  XLSX = "xlsx",
  CSV = "csv",
  UNKNOWN = "unknown",
}

/**
 * File type detection result
 */
export interface FileTypeResult {
  type: FileType;
  mimeType: string;
}

/**
 * Processed sheet data
 */
export interface ProcessedSheetData {
  content: string;
  sheetCount: number;
  fileType: FileType;
}

/**
 * Detects file type using magic bytes and MIME type
 */
export async function detectFileType(file: File): Promise<FileTypeResult> {
  const buffer = await file.slice(0, 512).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check for Excel file signatures (magic bytes)
  // XLSX/XLSM files start with PK (ZIP format)
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  ) {
    return {
      type: FileType.XLSX,
      mimeType:
        file.type ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  // Check MIME type for CSV
  const mimeType = file.type.toLowerCase();
  if (
    mimeType === "text/csv" ||
    mimeType === "text/plain" ||
    mimeType === "application/csv"
  ) {
    // Additional check: look for CSV-like content in first few bytes
    const textDecoder = new TextDecoder("utf-8");
    const sample = textDecoder.decode(bytes.slice(0, 100));
    const hasCommas = (sample.match(/,/g) || []).length > 2;
    const hasNewlines = sample.includes("\n") || sample.includes("\r");

    if (hasCommas && hasNewlines) {
      return {
        type: FileType.CSV,
        mimeType: file.type,
      };
    }
  }

  // Check file extension as fallback
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "csv") {
    return {
      type: FileType.CSV,
      mimeType: file.type || "text/csv",
    };
  }

  return {
    type: FileType.UNKNOWN,
    mimeType: file.type,
  };
}

/**
 * Processes Excel workbook into formatted string content
 */
function processExcelWorkbook(workbook: WorkBook): string {
  const sheets = workbook.SheetNames;
  let content = "";

  for (const sheet of sheets) {
    if (content) {
      content += "\n\n";
    }
    content += `Sheet: ${sheet}\n`;
    content += JSON.stringify(
      utils.sheet_to_json(workbook.Sheets[sheet], { blankrows: false })
    );
  }

  return content;
}

/**
 * Processes CSV file content
 */
function processCSVContent(csvText: string): string {
  // Simple CSV parsing - for more complex CSV with quoted fields,
  // consider using a dedicated CSV parser library
  const lines = csvText.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return "";

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });

  return JSON.stringify(rows);
}

/**
 * Processes a spreadsheet file (Excel or CSV) and returns formatted content
 */
export async function processSheetFile(
  file: File
): Promise<ProcessedSheetData> {
  const fileTypeResult = await detectFileType(file);

  if (fileTypeResult.type === FileType.UNKNOWN) {
    throw new Error(
      `Unsupported file type. Detected MIME type: ${fileTypeResult.mimeType}`
    );
  }

  let content: string;
  let sheetCount: number;

  if (fileTypeResult.type === FileType.CSV) {
    // Process CSV file
    const text = await file.text();
    content = processCSVContent(text);
    sheetCount = 1; // CSV has one "sheet"
  } else {
    // Process Excel file
    const workbook = read(await file.arrayBuffer());
    content = processExcelWorkbook(workbook);
    sheetCount = workbook.SheetNames.length;
  }

  return {
    content,
    sheetCount,
    fileType: fileTypeResult.type,
  };
}