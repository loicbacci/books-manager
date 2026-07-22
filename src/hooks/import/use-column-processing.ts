import {
    guessFieldFromHeader,
    guessStatusFromValue,
    normalizeHeader,
    type FieldKey,
    type ReadingStatus,
} from "@/lib/import/header-guessing";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import type { SheetRow } from "./use-sheet-parser";

export type ColumnOption = {
  index: number;
  label: string;
  letter: string;
};

export type ColumnMapping = Record<FieldKey, number | null>;

export type RowOverride = {
  title?: string;
  authors?: string;
  skip?: boolean;
};

// ... copy-paste of types from original file (ParsedBookRow, etc.)
export type ParsedBookRow = {
  rowIndex: number;
  title: string;
  authors: string[];
  totalPages: number | null;
  currentPage: number | null;
  status: ReadingStatus | null;
  formatId: string | null;
  genreIds: string[];
  rating: number | null;
  summary: string | null;
  favoriteQuote: string | null;
  favoriteMoment: string | null;
  startDate: string | null;
  endDate: string | null;
  skip: boolean;
};

const defaultMapping: ColumnMapping = {
  title: null,
  authors: null,
  totalPages: null,
  currentPage: null,
  rating: null,
  summary: null,
  favoriteQuote: null,
  favoriteMoment: null,
  startDate: null,
  endDate: null,
  genre: null,
  status: null,
  format: null,
};

const columnLetter = (index: number) => {
  let letter = "";
  let i = index;
  while (i >= 0) {
    letter = String.fromCharCode((i % 26) + 65) + letter;
    i = Math.floor(i / 26) - 1;
  }
  return letter;
};

type SheetCell = string | number | boolean | Date | null | undefined;

const cellToString = (value: SheetCell) => {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
};

const isEmptyCell = (value: SheetCell) => cellToString(value) === "";

const splitAuthors = (value: string) =>
  value
    .split(/[,&]/)
    .map((item) => item.trim())
    .filter(Boolean);

const splitGenres = (value: string) =>
  value
    .split(/[,;|\/]/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseNumber = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toIsoDate = (value: SheetCell) => {
  if (value == null) return null;
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString();
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const date = new Date(
        Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S)
      );
      return Number.isNaN(date.valueOf()) ? null : date.toISOString();
    }
  }
  const text = cellToString(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
};

export function useColumnProcessing({
  rows,
  step,
  formats,
  genres,
}: {
  rows: SheetRow[];
  step: number;
  formats: Array<{ id: string; name: string }>;
  genres: Array<{ id: string; name: string }>;
}) {
  const [skipRows, setSkipRows] = useState(1);
  const [mappingTouched, setMappingTouched] = useState(false);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>(defaultMapping);
  const [rowOverrides, setRowOverrides] = useState<Record<number, RowOverride>>({});
  const [isGuessingColumns, setIsGuessingColumns] = useState(false);

  const [statusValueMapping, setStatusValueMapping] = useState<
    Record<string, ReadingStatus | null>
  >({});
  const [formatValueMapping, setFormatValueMapping] = useState<
    Record<string, string | null>
  >({});
  const [genreValueMapping, setGenreValueMapping] = useState<
    Record<string, string | null>
  >({});

  const headerRowIndex = Math.max(
    0,
    Math.min(skipRows - 1, Math.max(0, rows.length - 1))
  );

  const headerRows = useMemo(
    () => rows.slice(0, Math.max(skipRows, 1)),
    [rows, skipRows]
  );

  const columnOptions = useMemo<ColumnOption[]>(() => {
    if (!rows.length) return [];
    const maxColumns = Math.max(
      ...headerRows.map((row) => row.length),
      rows[headerRowIndex]?.length ?? 0
    );
    const columnHasData = new Array(maxColumns).fill(false);
    headerRows.forEach((row) => {
      row.forEach((cell, index) => {
        if (!isEmptyCell(cell)) columnHasData[index] = true;
      });
    });
    return Array.from({ length: maxColumns }, (_, index) => {
      const headerLabel =
        headerRows.map((row) => cellToString(row[index])).find(Boolean) ?? "";
      const letter = columnLetter(index);
      const label = headerLabel ? `${letter} · ${headerLabel}` : letter;
      return {
        index,
        label,
        letter,
      };
    }).filter((item) => columnHasData[item.index]);
  }, [rows, headerRowIndex, headerRows]);

  const guessMapping = useMemo<ColumnMapping>(() => {
    if (!rows.length) return defaultMapping;
    const mapping: ColumnMapping = { ...defaultMapping };
    const maxColumns = Math.max(
      ...headerRows.map((row) => row.length),
      rows[headerRowIndex]?.length ?? 0
    );
    for (let index = 0; index < maxColumns; index += 1) {
      for (const row of headerRows) {
        const header = cellToString(row[index]);
        const field = guessFieldFromHeader(header);
        if (field && mapping[field] == null) {
          mapping[field] = index;
          break;
        }
      }
    }
    return mapping;
  }, [rows, headerRowIndex, headerRows]);

  useEffect(() => {
    if (!mappingTouched) {
      setColumnMapping(guessMapping);
    }
  }, [guessMapping, mappingTouched]);

  const nonEmptyRowIndices = useMemo(() => {
    if (!rows.length) return [];
    const indices: number[] = [];
    rows.forEach((row, index) => {
      if (row.some((cell) => !isEmptyCell(cell))) {
        indices.push(index);
      }
    });
    return indices;
  }, [rows]);

  const dataRows = useMemo(() => {
    if (!rows.length || nonEmptyRowIndices.length === 0) return [];
    let startIndex = 0;
    while (
      startIndex < nonEmptyRowIndices.length &&
      nonEmptyRowIndices[startIndex] < skipRows
    ) {
      startIndex += 1;
    }
    if (startIndex >= nonEmptyRowIndices.length) return [];
    return nonEmptyRowIndices.slice(startIndex).map((rowIndex) => ({
      row: rows[rowIndex],
      rowIndex,
    }));
  }, [rows, skipRows, nonEmptyRowIndices]);

  const columnPreviews = useMemo<Record<number, string>>(() => {
    const firstRow = dataRows[0]?.row ?? [];
    const previews: Record<number, string> = {};
    columnOptions.forEach((col) => {
      const raw = cellToString(firstRow[col.index]);
      const trimmed = raw.trim();
      const display =
        trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed || "—";
      previews[col.index] = display;
    });
    return previews;
  }, [columnOptions, dataRows]);

  /* -------------------------------------------------------------------------------------------------
   * Value Mappings
   * -----------------------------------------------------------------------------------------------*/
  const shouldComputeValueMappings = step >= 1;

  const statusValues = useMemo(() => {
    if (!shouldComputeValueMappings) return [];
    if (columnMapping.status == null) return [];
    const index = columnMapping.status;
    const values = new Map<string, string>();
    dataRows.forEach(({ row }) => {
      const raw = cellToString(row[index]).trim();
      if (!raw) return;
      const key = normalizeHeader(raw);
      if (!values.has(key)) values.set(key, raw);
    });
    return Array.from(values.entries()).map(([key, label]) => ({
      key,
      label,
    }));
  }, [columnMapping.status, dataRows, shouldComputeValueMappings]);

  const formatValues = useMemo(() => {
    if (!shouldComputeValueMappings) return [];
    if (columnMapping.format == null) return [];
    const index = columnMapping.format;
    const values = new Map<string, string>();
    dataRows.forEach(({ row }) => {
      const raw = cellToString(row[index]).trim();
      if (!raw) return;
      const key = normalizeHeader(raw);
      if (!values.has(key)) values.set(key, raw);
    });
    return Array.from(values.entries()).map(([key, label]) => ({
      key,
      label,
    }));
  }, [columnMapping.format, dataRows, shouldComputeValueMappings]);

  const genreValues = useMemo(() => {
    if (!shouldComputeValueMappings) return [];
    if (columnMapping.genre == null) return [];
    const index = columnMapping.genre;
    const values = new Map<string, string>();
    dataRows.forEach(({ row }) => {
      const raw = cellToString(row[index]).trim();
      if (!raw) return;
      splitGenres(raw).forEach((token) => {
        const key = normalizeHeader(token);
        if (!key) return;
        if (!values.has(key)) values.set(key, token);
      });
    });
    return Array.from(values.entries()).map(([key, label]) => ({
      key,
      label,
    }));
  }, [columnMapping.genre, dataRows, shouldComputeValueMappings]);

  const formatByKey = useMemo(() => {
    const lookup = new Map<string, string>();
    formats.forEach((format) => {
      lookup.set(normalizeHeader(format.name), format.id);
    });
    return lookup;
  }, [formats]);

  const genreByKey = useMemo(() => {
    const lookup = new Map<string, string>();
    genres.forEach((genre) => {
      lookup.set(normalizeHeader(genre.name), genre.id);
    });
    return lookup;
  }, [genres]);

  useEffect(() => {
    if (!shouldComputeValueMappings) return;
    setStatusValueMapping((prev) => {
      const next: Record<string, ReadingStatus | null> = {};
      statusValues.forEach(({ key, label }) => {
        const existing = prev[key];
        if (existing !== undefined) {
          next[key] = existing;
          return;
        }
        next[key] = guessStatusFromValue(label);
      });
      return next;
    });
  }, [statusValues, shouldComputeValueMappings]);

  useEffect(() => {
    if (!shouldComputeValueMappings || formats.length === 0) return;
    setFormatValueMapping((prev) => {
      const next: Record<string, string | null> = {};
      formatValues.forEach(({ key, label }) => {
        const existing = prev[key];
        if (existing !== undefined) {
          next[key] = existing;
          return;
        }
        next[key] = formatByKey.get(normalizeHeader(label)) ?? null;
      });
      return next;
    });
  }, [formatValues, formatByKey, formats.length, shouldComputeValueMappings]);

  useEffect(() => {
    if (!shouldComputeValueMappings || genres.length === 0) return;
    setGenreValueMapping((prev) => {
      const next: Record<string, string | null> = {};
      genreValues.forEach(({ key, label }) => {
        const existing = prev[key];
        if (existing !== undefined) {
          next[key] = existing;
          return;
        }
        next[key] = genreByKey.get(normalizeHeader(label)) ?? null;
      });
      return next;
    });
  }, [genreValues, genreByKey, genres.length, shouldComputeValueMappings]);

  const shouldComputeParsedRows = step >= 1; // Or check showPreview if needed

  const parsedRows = useMemo<ParsedBookRow[]>(() => {
    if (!shouldComputeParsedRows) return [];
    return dataRows.map(({ row, rowIndex }) => {
      const overrides = rowOverrides[rowIndex] ?? {};
      const titleColumn = columnMapping.title;
      const authorsColumn = columnMapping.authors;
      const titleValue =
        overrides.title ??
        (titleColumn != null ? cellToString(row[titleColumn]) : "");
      const authorsValue =
        overrides.authors ??
        (authorsColumn != null ? cellToString(row[authorsColumn]) : "");
      const authorsList = splitAuthors(authorsValue);
      const totalPagesValue =
        columnMapping.totalPages != null
          ? parseNumber(cellToString(row[columnMapping.totalPages]))
          : null;
      const currentPageValue =
        columnMapping.currentPage != null
          ? parseNumber(cellToString(row[columnMapping.currentPage]))
          : null;
      const statusValue =
        columnMapping.status != null
          ? cellToString(row[columnMapping.status])
          : "";
      const statusKey = normalizeHeader(statusValue);
      const statusMapped =
        statusKey && statusKey in statusValueMapping
          ? statusValueMapping[statusKey]
          : null;
      const formatValue =
        columnMapping.format != null
          ? cellToString(row[columnMapping.format])
          : "";
      const formatKey = normalizeHeader(formatValue);
      const formatMapped =
        formatKey && formatKey in formatValueMapping
          ? formatValueMapping[formatKey]
          : null;
      const genreValue =
        columnMapping.genre != null
          ? cellToString(row[columnMapping.genre])
          : "";
      const genreIds = Array.from(
        new Set(
          splitGenres(genreValue)
            .map((token) => genreValueMapping[normalizeHeader(token)] ?? null)
            .filter((id): id is string => !!id)
        )
      );
      const ratingValue =
        columnMapping.rating != null
          ? parseNumber(cellToString(row[columnMapping.rating]))
          : null;
      const summaryValue =
        columnMapping.summary != null
          ? cellToString(row[columnMapping.summary]) || null
          : null;
      const quoteValue =
        columnMapping.favoriteQuote != null
          ? cellToString(row[columnMapping.favoriteQuote]) || null
          : null;
      const momentValue =
        columnMapping.favoriteMoment != null
          ? cellToString(row[columnMapping.favoriteMoment]) || null
          : null;
      const startDateValue =
        columnMapping.startDate != null
          ? toIsoDate(row[columnMapping.startDate])
          : null;
      const endDateValue =
        columnMapping.endDate != null
          ? toIsoDate(row[columnMapping.endDate])
          : null;

      const totalPages = totalPagesValue
        ? Math.max(1, Math.round(totalPagesValue))
        : null;
      const currentPage =
        currentPageValue != null
          ? Math.max(0, Math.round(currentPageValue))
          : null;
      const boundedCurrentPage =
        totalPages != null && currentPage != null
          ? Math.min(currentPage, totalPages)
          : currentPage;

      return {
        rowIndex,
        title: titleValue,
        authors: authorsList,
        totalPages,
        currentPage: boundedCurrentPage,
        status: statusMapped,
        formatId: formatMapped,
        genreIds,
        rating: ratingValue
          ? (() => {
              const rounded = Math.round(ratingValue);
              // 1–5 columns → half-star 1–10; values >5 already on 1–10
              return rounded >= 1 && rounded <= 5
                ? Math.min(10, Math.max(1, rounded * 2))
                : Math.min(10, Math.max(1, rounded));
            })()
          : null,
        summary: summaryValue,
        favoriteQuote: quoteValue,
        favoriteMoment: momentValue,
        startDate: startDateValue,
        endDate: endDateValue,
        skip: !!overrides.skip,
      };
    });
  }, [
    dataRows,
    rowOverrides,
    columnMapping,
    statusValueMapping,
    formatValueMapping,
    genreValueMapping,
    shouldComputeParsedRows,
  ]);

  return {
    skipRows,
    setSkipRows,
    columnMapping,
    setColumnMapping,
    rowOverrides,
    setRowOverrides,
    mappingTouched,
    setMappingTouched,
    isGuessingColumns,
    setIsGuessingColumns,
    columnOptions,
    guessMapping,
    parsedRows,
    dataRows,
    columnPreviews,
    // ... expose mapping setters
    statusValueMapping,
    setStatusValueMapping,
    formatValueMapping,
    setFormatValueMapping,
    genreValueMapping,
    setGenreValueMapping
  };
}
