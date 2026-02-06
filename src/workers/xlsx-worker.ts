import * as XLSX from "xlsx";

type ParseMessage = { type: "parse"; buffer: ArrayBuffer };
type ParsedMessage = { type: "parsed"; workbook: XLSX.WorkBook };
type ErrorMessage = { type: "error"; message: string };

const ctx = self as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<ParseMessage>) => {
  if (event.data.type !== "parse") return;
  try {
    const data = new Uint8Array(event.data.buffer);
    const workbook = XLSX.read(data, { type: "array", cellDates: true });
    const response: ParsedMessage = { type: "parsed", workbook };
    ctx.postMessage(response);
  } catch (error) {
    const response: ErrorMessage = {
      type: "error",
      message: error instanceof Error ? error.message : "Parse failed",
    };
    ctx.postMessage(response);
  }
};

export {};
