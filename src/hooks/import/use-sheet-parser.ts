import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

const MAX_FILE_BYTES = 200 * 1024 * 1024; // 200MB

export type SheetRow = (string | number | boolean | Date | null | undefined)[];

type UseSheetParserReturn = {
  isParsingFile: boolean;
  fileError: string;
  workbook: XLSX.WorkBook | null;
  sheetName: string;
  setSheetName: (name: string) => void;
  isLoadingSheet: boolean;
  rows: SheetRow[];
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  fileName: string;
  resetParser: () => void;
};

export function useSheetParser(): UseSheetParserReturn {
  const t = useTranslations("sheetImport");
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof Worker === "undefined") return;
    const worker = new Worker(
      new URL("../../workers/xlsx-worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const payload = event.data as
        | { type: "parsed"; workbook: XLSX.WorkBook }
        | { type: "error"; message: string };

      if (payload.type === "parsed") {
        setWorkbook(payload.workbook);
        setSheetName("");
      } else {
        setFileError(payload.message || t("fileReadFailed"));
      }
      setIsParsingFile(false);
    };

    worker.onerror = () => {
      setIsParsingFile(false);
      setFileError(t("fileReadFailed"));
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [t]);

  useEffect(() => {
    if (!workbook || !sheetName) {
      setRows([]);
      setIsLoadingSheet(false);
      return;
    }

    setIsLoadingSheet(true);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet["!ref"]) {
      setRows([]);
      setIsLoadingSheet(false);
      return;
    }

    // Process sheet in main thread for now as it's usually fast enough for single sheet
    // Could move to worker if needed
    const rawRows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: "",
    }) as SheetRow[];

    const range = XLSX.utils.decode_range(sheet["!ref"]);
    const columnCount = range.e.c - range.s.c + 1;

    const normalizedRows = rawRows.map((row) => {
      const filled = Array.from({ length: columnCount }, (_, index) =>
        index < row.length ? row[index] : ""
      );
      return filled;
    });

    setRows(normalizedRows);
    setIsLoadingSheet(false);
  }, [workbook, sheetName]);

  const resetParser = () => {
    setFileName("");
    setFileError("");
    setWorkbook(null);
    setSheetName("");
    setRows([]);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    if (file.size > MAX_FILE_BYTES) {
      setFileError(
        t("fileTooLarge", { size: Math.round(MAX_FILE_BYTES / 1024 / 1024) })
      );
      setIsParsingFile(false);
      return;
    }

    setFileError("");
    setFileName(file.name);
    setWorkbook(null);
    setSheetName("");
    setRows([]);

    try {
      const buffer = await file.arrayBuffer();
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "parse", buffer }, [buffer]);
      } else {
        // Fallback if worker not supported
        const data = new Uint8Array(buffer);
        const parsed = XLSX.read(data, { type: "array", cellDates: true });
        setWorkbook(parsed);
        setSheetName("");
        setIsParsingFile(false);
      }
    } catch (error) {
      setIsParsingFile(false);
      setFileError(t("fileReadFailed"));
      console.error("Failed to read file:", error);
    }
  };

  return {
    isParsingFile,
    fileError,
    workbook,
    sheetName,
    setSheetName,
    isLoadingSheet,
    rows,
    handleFileChange,
    fileName,
    resetParser,
  };
}
