import { useMemo, useState } from "react";
import type { ParsedBookRow } from "./use-column-processing";

export function useDataPreview(parsedRows: ParsedBookRow[]) {
  const [previewPage, setPreviewPage] = useState(1);
  const previewPageSize = 10;

  const paginatedRows = useMemo(() => {
    const start = (previewPage - 1) * previewPageSize;
    return parsedRows.slice(start, start + previewPageSize);
  }, [parsedRows, previewPage]);

  const totalPreviewPages = Math.ceil(parsedRows.length / previewPageSize);

  return {
    previewPage,
    setPreviewPage,
    previewPageSize,
    paginatedRows,
    totalPreviewPages,
  };
}
