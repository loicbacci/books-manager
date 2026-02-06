"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import * as XLSX from "xlsx";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Input,
  Spinner,
  Span,
  Stack,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  AccordionRoot,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemText,
  ComboboxRoot,
} from "@/components/ui/combobox";
import { Radio, RadioGroup } from "@/components/ui/radio";
import {
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import {
  StepsContent,
  StepsItem,
  StepsList,
  StepsRoot,
} from "@/components/ui/steps";
import { StepperInput } from "@/components/ui/stepper-input";
import { Tag } from "@/components/ui/tag";
import { toaster } from "@/components/ui/toaster";
import type { PageResult } from "@/types/pagination";

type SheetCell = string | number | boolean | Date | null | undefined;
type SheetRow = SheetCell[];

type ColumnOption = {
  index: number;
  label: string;
  letter: string;
};

type FieldKey =
  | "title"
  | "authors"
  | "totalPages"
  | "currentPage"
  | "rating"
  | "summary"
  | "favoriteQuote"
  | "favoriteMoment"
  | "startDate"
  | "endDate"
  | "genre"
  | "status"
  | "format";

type ColumnMapping = Record<FieldKey, number | null>;

type RowOverride = {
  title?: string;
  authors?: string;
  skip?: boolean;
};

type ParsedBookRow = {
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

type ReadingStatus = "TO_READ" | "READING" | "READ" | "DROPPED";

type Author = {
  id: string;
  name: string;
  gender?: { id: string; name: string } | null;
  nationalities?: Array<{ nationality: { id: string; name: string } }>;
};

type Genre = {
  id: string;
  name: string;
};

type Format = {
  id: string;
  name: string;
};

type AuthorResolution = {
  key: string;
  mode: "existing" | "new";
  existingId?: string;
  name: string;
  genderId: string;
  nationalityIds: string[];
};

const PREVIEW_ROWS = 5;
const MAX_FILE_BYTES = 200 * 1024 * 1024;

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

const normalizeHeader = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");

const guessFieldFromHeader = (header: string): FieldKey | null => {
  const normalized = normalizeHeader(header);
  if (!normalized) return null;
  if (/(title|titre)/.test(normalized)) return "title";
  if (/(author|authors|auteur|autrice|auteure|auteurs|auteurices)/.test(
    normalized
  )) {
    return "authors";
  }
  if (
    /pages|page|nombre de pages|nb pages|total pages|total des pages|nombre total de pages/.test(
      normalized
    )
  ) {
    return "totalPages";
  }
  if (
    /current page|page actuelle|page en cours|page courante|progress|avancement/.test(
      normalized
    )
  ) {
    return "currentPage";
  }
  if (/(rating|note|notes|score|etoiles|classement)/.test(normalized)) {
    return "rating";
  }
  if (
    /summary|resume|description|synopsis|resume court|resume bref/.test(
      normalized
    )
  ) {
    return "summary";
  }
  if (/(quote|citation|citations|extrait)/.test(normalized)) {
    return "favoriteQuote";
  }
  if (/(moment|passage|extrait prefere|extrait favori)/.test(normalized)) {
    return "favoriteMoment";
  }
  if (
    /start date|date de debut|date debut|started|debut lecture/.test(normalized)
  ) {
    return "startDate";
  }
  if (
    /end date|date de fin|finished|ended|fin lecture|termine|date fin/.test(
      normalized
    )
  ) {
    return "endDate";
  }
  if (/(genre|genres|categorie|categories)/.test(normalized)) {
    return "genre";
  }
  if (
    /status|reading status|statut|statut lecture|etat|etat lecture/.test(
      normalized
    )
  ) {
    return "status";
  }
  if (/(format|support|media|book format|format livre)/.test(normalized)) {
    return "format";
  }
  return null;
};

const normalizeValue = (value: string) => normalizeHeader(value);

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

const guessStatusFromValue = (value: string): ReadingStatus | null => {
  const normalized = normalizeValue(value);
  if (!normalized) return null;
  if (/to read|toread|a lire|to-read|wishlist|envie/.test(normalized)) {
    return "TO_READ";
  }
  if (/reading|en cours|lecture|en lecture/.test(normalized)) {
    return "READING";
  }
  if (/read|finished|termine|terminee|lu|acheve/.test(normalized)) {
    return "READ";
  }
  if (/dropped|abandon|abandonne|abandonnee|arrete|stop/.test(normalized)) {
    return "DROPPED";
  }
  return null;
};

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

export default function SheetImportPage() {
  const t = useTranslations("sheetImport");
  const tBook = useTranslations("book");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [skipRows, setSkipRows] = useState(1);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [mappingTouched, setMappingTouched] = useState(false);
  const [columnMapping, setColumnMapping] =
    useState<ColumnMapping>(defaultMapping);
  const [rowOverrides, setRowOverrides] = useState<
    Record<number, RowOverride>
  >({});

  const [authors, setAuthors] = useState<Author[]>([]);
  const [genders, setGenders] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [nationalities, setNationalities] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [authorResolutions, setAuthorResolutions] = useState<
    Record<string, AuthorResolution>
  >({});
  const [statusValueMapping, setStatusValueMapping] = useState<
    Record<string, ReadingStatus | null>
  >({});
  const [formatValueMapping, setFormatValueMapping] = useState<
    Record<string, string | null>
  >({});
  const [genreValueMapping, setGenreValueMapping] = useState<
    Record<string, string | null>
  >({});
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isGuessingColumns, setIsGuessingColumns] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const stepTitles = [
    t("stepMap"),
    t("stepCategories"),
    t("stepMissing"),
    t("stepAuthors"),
    t("stepReview"),
  ];
  const stepDescriptions = [
    t("stepMapDescription"),
    t("stepCategoriesDescription"),
    t("stepMissingDescription"),
    t("stepAuthorsDescription"),
    t("stepReviewDescription"),
  ];
  const currentStepTitle = stepTitles[step] ?? stepTitles[0];
  const currentStepDescription =
    stepDescriptions[step] ?? stepDescriptions[0];

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
    if (typeof Worker === "undefined") return;
    const worker = new Worker(
      new URL("../../../../workers/xlsx-worker.ts", import.meta.url),
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
    if (!mappingTouched) {
      setColumnMapping(guessMapping);
    }
  }, [guessMapping, mappingTouched]);

  useEffect(() => {
    if (step < 1) return;
    const controller = new AbortController();
    let isActive = true;
    setIsMetaLoading(true);
    Promise.all([
      fetch("/api/authors?page=1&pageSize=500", {
        signal: controller.signal,
      }).then((r) => r.json()),
      fetch("/api/genders", { signal: controller.signal }).then((r) =>
        r.json()
      ),
      fetch("/api/nationalities", { signal: controller.signal }).then((r) =>
        r.json()
      ),
      fetch("/api/genres", { signal: controller.signal }).then((r) => r.json()),
      fetch("/api/formats", { signal: controller.signal }).then((r) => r.json()),
    ])
      .then(
        ([authorsData, gendersData, nationalitiesData, genresData, formatsData]) => {
        if (!isActive) return;
        const authorsItems = Array.isArray(authorsData)
          ? authorsData
          : (authorsData as PageResult<Author>).items;
        setAuthors(authorsItems ?? []);
        setGenders(gendersData ?? []);
        setNationalities(nationalitiesData ?? []);
        setGenres(genresData ?? []);
        setFormats(formatsData ?? []);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to load metadata:", error);
      })
      .finally(() => {
        if (!isActive) return;
        setIsMetaLoading(false);
      });
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [step]);
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

  const shouldComputeValueMappings = step >= 1;

  const statusValues = useMemo(
    () => {
      if (!shouldComputeValueMappings) return [];
      if (columnMapping.status == null) return [];
      const index = columnMapping.status;
      const values = new Map<string, string>();
      dataRows.forEach(({ row }) => {
        const raw = cellToString(row[index]).trim();
        if (!raw) return;
        const key = normalizeValue(raw);
        if (!values.has(key)) values.set(key, raw);
      });
      return Array.from(values.entries()).map(([key, label]) => ({
        key,
        label,
      }));
    },
    [columnMapping.status, dataRows, shouldComputeValueMappings]
  );

  const formatValues = useMemo(
    () => {
      if (!shouldComputeValueMappings) return [];
      if (columnMapping.format == null) return [];
      const index = columnMapping.format;
      const values = new Map<string, string>();
      dataRows.forEach(({ row }) => {
        const raw = cellToString(row[index]).trim();
        if (!raw) return;
        const key = normalizeValue(raw);
        if (!values.has(key)) values.set(key, raw);
      });
      return Array.from(values.entries()).map(([key, label]) => ({
        key,
        label,
      }));
    },
    [columnMapping.format, dataRows, shouldComputeValueMappings]
  );

  const genreValues = useMemo(
    () => {
      if (!shouldComputeValueMappings) return [];
      if (columnMapping.genre == null) return [];
      const index = columnMapping.genre;
      const values = new Map<string, string>();
      dataRows.forEach(({ row }) => {
        const raw = cellToString(row[index]).trim();
        if (!raw) return;
        splitGenres(raw).forEach((token) => {
          const key = normalizeValue(token);
          if (!key) return;
          if (!values.has(key)) values.set(key, token);
        });
      });
      return Array.from(values.entries()).map(([key, label]) => ({
        key,
        label,
      }));
    },
    [columnMapping.genre, dataRows, shouldComputeValueMappings]
  );

  const formatByKey = useMemo(() => {
    const lookup = new Map<string, string>();
    formats.forEach((format) => {
      lookup.set(normalizeValue(format.name), format.id);
    });
    return lookup;
  }, [formats]);

  const genreByKey = useMemo(() => {
    const lookup = new Map<string, string>();
    genres.forEach((genre) => {
      lookup.set(normalizeValue(genre.name), genre.id);
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
        next[key] = formatByKey.get(normalizeValue(label)) ?? null;
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
        next[key] = genreByKey.get(normalizeValue(label)) ?? null;
      });
      return next;
    });
  }, [genreValues, genreByKey, genres.length, shouldComputeValueMappings]);

  const shouldComputeParsedRows = showPreview || step >= 1;

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
      const statusKey = normalizeValue(statusValue);
      const statusMapped =
        statusKey && statusKey in statusValueMapping
          ? statusValueMapping[statusKey]
          : null;
      const formatValue =
        columnMapping.format != null
          ? cellToString(row[columnMapping.format])
          : "";
      const formatKey = normalizeValue(formatValue);
      const formatMapped =
        formatKey && formatKey in formatValueMapping
          ? formatValueMapping[formatKey]
          : null;
      const genreValue =
        columnMapping.genre != null ? cellToString(row[columnMapping.genre]) : "";
      const genreIds = Array.from(
        new Set(
          splitGenres(genreValue)
            .map((token) => genreValueMapping[normalizeValue(token)] ?? null)
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
          ? Math.min(5, Math.max(1, Math.round(ratingValue)))
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

  const previewRows = useMemo(() => {
    if (!showPreview) return [];
    return parsedRows.slice(0, PREVIEW_ROWS);
  }, [parsedRows, showPreview]);

  const missingRows = useMemo(() => {
    return parsedRows.filter((row) => !row.title || row.authors.length === 0);
  }, [parsedRows]);

  const unresolvedMissingRows = useMemo(() => {
    return missingRows.filter((row) => !row.skip);
  }, [missingRows]);


  const foundAuthorKeys = useMemo(() => {
    if (step < 3) return [];
    const keys = new Set<string>();
    parsedRows.forEach((row) => {
      if (row.skip) return;
      row.authors.forEach((author) => keys.add(author));
    });
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
  }, [parsedRows, step]);

  useEffect(() => {
    if (foundAuthorKeys.length === 0) {
      setAuthorResolutions({});
      return;
    }
    setAuthorResolutions((prev) => {
      const next: Record<string, AuthorResolution> = {};
      foundAuthorKeys.forEach((key) => {
        const existing = prev[key];
        const match = authors.find(
          (author) => author.name.toLowerCase() === key.toLowerCase()
        );
        if (existing) {
          if (
            match &&
            existing.mode === "new" &&
            existing.name === key &&
            existing.genderId === "none" &&
            existing.nationalityIds.length === 0
          ) {
            next[key] = {
              key,
              mode: "existing",
              existingId: match.id,
              name: match.name,
              genderId: "none",
              nationalityIds: [],
            };
          } else {
            next[key] = existing;
          }
          return;
        }
        if (match) {
          next[key] = {
            key,
            mode: "existing",
            existingId: match.id,
            name: match.name,
            genderId: "none",
            nationalityIds: [],
          };
        } else {
          next[key] = {
            key,
            mode: "new",
            existingId: undefined,
            name: key,
            genderId: "none",
            nationalityIds: [],
          };
        }
      });
      return next;
    });
  }, [foundAuthorKeys, authors]);

  const authorCollection = useMemo(
    () =>
      createListCollection({
        items: authors.map((author) => ({
          value: author.id,
          label: author.name,
        })),
      }),
    [authors]
  );

  const genderCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: "none", label: t("unknownGender") },
          ...genders.map((gender) => ({
            value: gender.id,
            label: gender.name,
          })),
        ],
      }),
    [genders, t]
  );

  const nationalityCollection = useMemo(
    () =>
      createListCollection({
        items: nationalities.map((nat) => ({
          value: nat.id,
          label: nat.name,
        })),
      }),
    [nationalities]
  );

  const statusMappingCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: "skip", label: t("skipValue") },
          { value: "TO_READ", label: tStatus("toRead") },
          { value: "READING", label: tStatus("reading") },
          { value: "READ", label: tStatus("read") },
          { value: "DROPPED", label: tStatus("dropped") },
        ],
      }),
    [t, tStatus]
  );

  const formatMappingCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: "skip", label: t("skipValue") },
          ...formats.map((format) => ({
            value: format.id,
            label: format.name,
          })),
        ],
      }),
    [formats, t]
  );

  const genreMappingCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: "skip", label: t("skipValue") },
          ...genres.map((genre) => ({
            value: genre.id,
            label: genre.name,
          })),
        ],
      }),
    [genres, t]
  );

  const canProceedStep1 = !!workbook && rows.length > 0;
  const canProceedStep3 = unresolvedMissingRows.length === 0;

  const booksToImport = parsedRows.filter(
    (row) => !row.skip && row.title && row.authors.length > 0
  );

  const authorsToCreate = Object.values(authorResolutions).filter(
    (resolution) => resolution.mode === "new" && resolution.name.trim()
  );

  const hasInvalidAuthorResolution = Object.values(authorResolutions).some(
    (resolution) =>
      resolution.mode === "existing"
        ? !resolution.existingId
        : !resolution.name.trim()
  );

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
    setMappingTouched(false);
    setColumnMapping(defaultMapping);
    setRowOverrides({});
    setStatusValueMapping({});
    setFormatValueMapping({});
    setGenreValueMapping({});
    setShowPreview(false);
    setSkipRows(1);
    try {
      const buffer = await file.arrayBuffer();
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "parse", buffer }, [buffer]);
      } else {
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

  const handleMappingChange = (field: FieldKey, value: string) => {
    setMappingTouched(true);
    setColumnMapping((prev) => ({
      ...prev,
      [field]: value === "skip" ? null : Number.parseInt(value, 10),
    }));
  };

  const handleOverrideChange = (
    rowIndex: number,
    field: keyof RowOverride,
    value: string | boolean
  ) => {
    setRowOverrides((prev) => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [field]: value,
      },
    }));
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const authorsPayload = Object.values(authorResolutions).map(
        (resolution) => ({
          key: resolution.key,
          mode: resolution.mode,
          existingId: resolution.existingId,
          name: resolution.name.trim() || resolution.key,
          genderId: resolution.genderId === "none" ? null : resolution.genderId,
          nationalityIds: resolution.nationalityIds,
        })
      );
      const booksPayload = booksToImport.map((book) => ({
        title: book.title,
        totalPages: book.totalPages,
        currentPage: book.currentPage,
        status: book.status ?? undefined,
        rating: book.rating,
        summary: book.summary,
        favoriteQuote: book.favoriteQuote,
        favoriteMoment: book.favoriteMoment,
        startDate: book.startDate,
        endDate: book.endDate,
        formatId: book.formatId,
        genreIds: book.genreIds.length ? book.genreIds : undefined,
        authorKeys: book.authors,
      }));
      const response = await fetch("/api/books/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authors: authorsPayload, books: booksPayload }),
      });
      if (!response.ok) {
        throw new Error("Import failed");
      }
      toaster.create({ title: t("importSuccess"), type: "success" });
      router.push("/library");
    } catch (error) {
      console.error("Import failed:", error);
      toaster.create({ title: t("importFailed"), type: "error" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Stack gap={6}>
        <Stack gap={2}>
          <Heading size="2xl">{t("title")}</Heading>
          <Text color="fg.muted">{t("subtitle")}</Text>
        </Stack>

        <StepsRoot
          step={step}
          count={5}
          onStepChange={(details) => setStep(details.step)}
          linear
        >
          <Box
            bg="surface.raised"
            borderWidth="1px"
            borderColor="border.muted"
            borderRadius="lg"
            p={{ base: 3, md: 4 }}
          >
            <Stack gap={3}>
              <Stack gap={1} display={{ base: "flex", md: "none" }}>
                <Badge colorPalette="brand" width="fit-content">
                  {step + 1} / 5
                </Badge>
                <Heading as="h2" size="md">
                  {currentStepTitle}
                </Heading>
                <Text fontSize="sm" color="fg.muted">
                  {currentStepDescription}
                </Text>
              </Stack>
              <Box display={{ base: "none", md: "block" }}>
                <StepsList>
                  <StepsItem
                    index={0}
                    title={t("stepMap")}
                    description={
                      <Text fontSize="sm" color="fg.muted">
                        {t("stepMapDescription")}
                      </Text>
                    }
                  />
                  <StepsItem
                    index={1}
                    title={t("stepCategories")}
                    description={
                      <Text fontSize="sm" color="fg.muted">
                        {t("stepCategoriesDescription")}
                      </Text>
                    }
                  />
                  <StepsItem
                    index={2}
                    title={t("stepMissing")}
                    description={
                      <Text fontSize="sm" color="fg.muted">
                        {t("stepMissingDescription")}
                      </Text>
                    }
                  />
                  <StepsItem
                    index={3}
                    title={t("stepAuthors")}
                    description={
                      <Text fontSize="sm" color="fg.muted">
                        {t("stepAuthorsDescription")}
                      </Text>
                    }
                  />
                  <StepsItem
                    index={4}
                    title={t("stepReview")}
                    description={
                      <Text fontSize="sm" color="fg.muted">
                        {t("stepReviewDescription")}
                      </Text>
                    }
                  />
                </StepsList>
              </Box>
            </Stack>
          </Box>
          <StepsContent index={0}>
            <Stack gap={6} mt={{ base: 4, md: 6 }}>
              <Stack
                gap={3}
                p={{ base: 4, md: 5 }}
                bg="surface.raised"
                borderRadius="lg"
                borderWidth="1px"
                borderColor="border.muted"
              >
                <Text fontWeight="semibold">{t("selectFile")}</Text>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  aria-label={t("selectFile")}
                  display="none"
                />
                <Flex
                  gap={3}
                  direction={{ base: "column", sm: "row" }}
                  align={{ base: "stretch", sm: "center" }}
                >
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    width={{ base: "full", sm: "auto" }}
                    loading={isParsingFile}
                    loadingText={tCommon("loading")}
                  >
                    {t("browseFiles")}
                  </Button>
                  <Text fontSize="sm" color="fg.muted">
                    {fileName || t("noFileSelected")}
                  </Text>
                </Flex>
                {isParsingFile && (
                  <Flex align="center" gap={2}>
                    <Spinner size="sm" color="brand.500" />
                    <Text fontSize="sm" color="fg.muted">
                      {t("loadingFile")}
                    </Text>
                  </Flex>
                )}
                {fileError && (
                  <Text fontSize="sm" color="error.600">
                    {fileError}
                  </Text>
                )}
              </Stack>

              {workbook && (
                <Stack gap={4}>
                  <Card.Root>
                    <Card.Body>
                      <Flex
                        gap={4}
                        wrap="wrap"
                        align={{ base: "stretch", md: "center" }}
                        direction={{ base: "column", md: "row" }}
                      >
                        <Box minW={{ base: "full", md: "240px" }}>
                          <Text fontSize="sm" color="fg.muted" mb={1}>
                            {t("sheetLabel")}
                          </Text>
                          <SelectRoot
                            collection={createListCollection({
                              items: workbook.SheetNames.map((name) => ({
                                value: name,
                                label: name,
                              })),
                            })}
                            width={{ base: "full", md: "260px" }}
                            value={sheetName ? [sheetName] : []}
                            onValueChange={(e) => {
                              setSheetName(e.value[0] || "");
                              setMappingTouched(false);
                              setRowOverrides({});
                              setStatusValueMapping({});
                              setFormatValueMapping({});
                              setGenreValueMapping({});
                              setShowPreview(false);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValueText placeholder={t("selectSheet")} />
                            </SelectTrigger>
                            <SelectContent>
                              {workbook.SheetNames.map((name) => (
                                <SelectItem
                                  key={name}
                                  item={{ value: name, label: name }}
                                >
                                  {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </SelectRoot>
                        </Box>
                      </Flex>
                    </Card.Body>
                  </Card.Root>

                  {sheetName ? (
                    isLoadingSheet ? (
                      <Card.Root>
                        <Card.Body>
                          <Flex align="center" gap={2} color="fg.muted">
                            <Spinner size="sm" />
                            <Text fontSize="sm">{tCommon("loading")}</Text>
                          </Flex>
                        </Card.Body>
                      </Card.Root>
                    ) : (
                      <>
                        <Card.Root>
                          <Card.Body>
                            <Stack gap={4}>
                              <Flex
                                gap={4}
                                wrap="wrap"
                                align={{ base: "stretch", md: "center" }}
                                direction={{ base: "column", md: "row" }}
                              >
                                <Box>
                                  <Text fontSize="sm" color="fg.muted" mb={1}>
                                    {t("skipRows")}
                                  </Text>
                                  <StepperInput
                                    min={0}
                                    max={Math.max(0, rows.length - 1)}
                                    value={String(skipRows)}
                                    onValueChange={(details) =>
                                      setSkipRows(details.valueAsNumber ?? 0)
                                    }
                                  />
                                </Box>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setIsGuessingColumns(true);
                                    setMappingTouched(false);
                                    window.setTimeout(() => {
                                      setColumnMapping(guessMapping);
                                      setIsGuessingColumns(false);
                                    }, 0);
                                  }}
                                  width={{ base: "full", md: "auto" }}
                                  loading={isGuessingColumns}
                                  loadingText={tCommon("loading")}
                                >
                                  {t("guessColumns")}
                                </Button>
                              </Flex>
                              {isGuessingColumns && (
                                <Text fontSize="sm" color="fg.muted">
                                  {t("guessingColumns")}
                                </Text>
                              )}

                              {rows.length === 0 ? (
                                <Text color="fg.muted">{t("noData")}</Text>
                              ) : (
                                <>
                                  <Stack gap={3}>
                                    <Text fontWeight="semibold">
                                      {t("columnMapping")}
                                    </Text>
                                    <Stack gap={3}>
                                      {([
                                        {
                                          key: "title",
                                          label: tBook("title"),
                                          required: true,
                                        },
                                        {
                                          key: "authors",
                                          label: tBook("authors"),
                                          required: true,
                                        },
                                        {
                                          key: "totalPages",
                                          label: tBook("totalPages"),
                                        },
                                        {
                                          key: "currentPage",
                                          label: tBook("currentPage"),
                                        },
                                        { key: "rating", label: tBook("rating") },
                                        { key: "summary", label: tBook("summary") },
                                        {
                                          key: "favoriteQuote",
                                          label: tBook("favoriteQuote"),
                                        },
                                        {
                                          key: "favoriteMoment",
                                          label: tBook("favoriteMoment"),
                                        },
                                        { key: "startDate", label: tBook("startDate") },
                                        { key: "endDate", label: tBook("endDate") },
                                        { key: "status", label: tBook("status") },
                                        { key: "format", label: tBook("format") },
                                        { key: "genre", label: tBook("genre") },
                                      ] as Array<{
                                        key: FieldKey;
                                        label: string;
                                        required?: boolean;
                                      }>).map((field) => (
                                        <Flex
                                          key={field.key}
                                          gap={3}
                                          wrap="wrap"
                                          align={{ base: "flex-start", md: "center" }}
                                          justify={{
                                            base: "flex-start",
                                            md: "space-between",
                                          }}
                                          direction={{ base: "column", md: "row" }}
                                        >
                                          <Flex align="center" gap={2}>
                                            <Text fontWeight="medium">
                                              {field.label}
                                            </Text>
                                            {field.required && (
                                              <Badge colorPalette="brand">
                                                {t("required")}
                                              </Badge>
                                            )}
                                          </Flex>
                                          <Box minW={{ base: "full", md: "260px" }}>
                                            <SelectRoot
                                              collection={createListCollection({
                                                items: [
                                                  {
                                                    value: "skip",
                                                    label: t("skipColumn"),
                                                  },
                                                  ...columnOptions.map((col) => ({
                                                    value: String(col.index),
                                                    label: col.label,
                                                  })),
                                                ],
                                              })}
                                              width="full"
                                              value={[
                                                columnMapping[field.key] == null
                                                  ? "skip"
                                                  : String(
                                                      columnMapping[field.key]
                                                    ),
                                              ]}
                                              onValueChange={(e) =>
                                                handleMappingChange(
                                                  field.key,
                                                  e.value[0] || "skip"
                                                )
                                              }
                                            >
                                              <SelectTrigger>
                                                <SelectValueText
                                                  placeholder={t("skipColumn")}
                                                />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem
                                                  item={{
                                                    value: "skip",
                                                    label: t("skipColumn"),
                                                  }}
                                                >
                                                  <SelectItemText>
                                                    {t("skipColumn")}
                                                  </SelectItemText>
                                                </SelectItem>
                                                {columnOptions.map((col) => (
                                                  <SelectItem
                                                    key={col.index}
                                                    item={{
                                                      value: String(col.index),
                                                      label: col.label,
                                                    }}
                                                  >
                                                    <Stack gap="0">
                                                      <SelectItemText>
                                                        {col.label}
                                                      </SelectItemText>
                                                      <Span
                                                        color="fg.muted"
                                                        textStyle="xs"
                                                      >
                                                        {columnPreviews[col.index]}
                                                      </Span>
                                                    </Stack>
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </SelectRoot>
                                          </Box>
                                        </Flex>
                                      ))}
                                    </Stack>
                                  </Stack>

                                  <AccordionRoot collapsible>
                                    <AccordionItem value="raw">
                                      <AccordionItemTrigger>
                                        <Text fontWeight="semibold">
                                          {t("rawTable")}
                                        </Text>
                                      </AccordionItemTrigger>
                                      <AccordionItemContent>
                                        <Box
                                          overflowX="auto"
                                          borderWidth="1px"
                                          borderColor="border.muted"
                                          borderRadius="md"
                                        >
                                          <Box
                                            as="table"
                                            width="100%"
                                            aria-label={t("rawTable")}
                                            style={{ borderCollapse: "collapse" }}
                                          >
                                            <Box as="thead" bg="bg.muted">
                                              <Box as="tr">
                                                {columnOptions.map((col) => (
                                                  <Box
                                                    as="th"
                                                    key={col.index}
                                                    textAlign="left"
                                                    p={2}
                                                    fontSize={{
                                                      base: "xs",
                                                      md: "sm",
                                                    }}
                                                  >
                                                    {col.label}
                                                  </Box>
                                                ))}
                                              </Box>
                                            </Box>
                                            <Box as="tbody">
                                              {rows
                                                .slice(0, PREVIEW_ROWS)
                                                .map((row, rowIndex) => (
                                                  <Box as="tr" key={rowIndex}>
                                                    {columnOptions.map((col) => (
                                                      <Box
                                                        as="td"
                                                        key={col.index}
                                                        p={2}
                                                        fontSize={{
                                                          base: "xs",
                                                          md: "sm",
                                                        }}
                                                      >
                                                        {cellToString(
                                                          row[col.index]
                                                        ) || "—"}
                                                      </Box>
                                                    ))}
                                                  </Box>
                                                ))}
                                            </Box>
                                          </Box>
                                        </Box>
                                      </AccordionItemContent>
                                    </AccordionItem>
                                  </AccordionRoot>
                                </>
                              )}
                            </Stack>
                          </Card.Body>
                        </Card.Root>

                        <Card.Root>
                          <Card.Body>
                            <Stack gap={3}>
                              <Flex
                                justify="space-between"
                                align={{ base: "flex-start", md: "center" }}
                                direction={{ base: "column", md: "row" }}
                                gap={2}
                              >
                                <Box>
                                  <Text fontWeight="semibold">{t("preview")}</Text>
                                  <Text fontSize="sm" color="fg.muted">
                                    {t("previewHelp", { count: PREVIEW_ROWS })}
                                  </Text>
                                </Box>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowPreview((prev) => !prev)}
                                  width={{ base: "full", md: "auto" }}
                                >
                                  {showPreview
                                    ? t("hidePreview")
                                    : t("showPreview")}
                                </Button>
                              </Flex>
                              {showPreview && (
                                <Stack gap={3}>
                                  {previewRows.map((row) => (
                                    <Box
                                      key={row.rowIndex}
                                      p={3}
                                      borderWidth="1px"
                                      borderColor="border.muted"
                                      borderRadius="md"
                                    >
                                      <Flex
                                        justify="space-between"
                                        align={{ base: "flex-start", md: "center" }}
                                        direction={{ base: "column", md: "row" }}
                                        gap={1}
                                      >
                                        <Text fontWeight="semibold">
                                          {row.title || t("untitled")}
                                        </Text>
                                        <Text fontSize="xs" color="fg.muted">
                                          {t("rowNumber", {
                                            row: row.rowIndex + 1,
                                          })}
                                        </Text>
                                      </Flex>
                                      <Text fontSize="sm" color="fg.muted">
                                        {row.authors.length
                                          ? row.authors.join(", ")
                                          : t("missingAuthors")}
                                      </Text>
                                      <Flex gap={2} mt={2} wrap="wrap">
                                        {row.totalPages != null && (
                                          <Badge>
                                            {tBook("totalPages")}: {row.totalPages}
                                          </Badge>
                                        )}
                                        {row.rating != null && (
                                          <Badge>
                                            {tBook("rating")}: {row.rating}
                                          </Badge>
                                        )}
                                        {row.startDate && (
                                          <Badge>{tBook("startDate")}</Badge>
                                        )}
                                        {row.endDate && (
                                          <Badge>{tBook("endDate")}</Badge>
                                        )}
                                      </Flex>
                                    </Box>
                                  ))}
                                </Stack>
                              )}
                            </Stack>
                          </Card.Body>
                        </Card.Root>

                      </>
                    )
                  ) : null}
                </Stack>
              )}
              <Flex
                justify="space-between"
                mt={4}
                direction={{ base: "column", sm: "row" }}
                gap={3}
              >
                <Button
                  variant="ghost"
                  onClick={() => router.push("/library")}
                  width={{ base: "full", sm: "auto" }}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  colorPalette="brand"
                  onClick={() => setStep(1)}
                  disabled={!canProceedStep1}
                  width={{ base: "full", sm: "auto" }}
                >
                  {tCommon("next")}
                </Button>
              </Flex>
            </Stack>
          </StepsContent>
          <StepsContent index={1}>
            <Stack gap={6} mt={6}>
              <Text color="fg.muted">{t("categoriesHelp")}</Text>
              <Stack gap={4}>
                <Card.Root>
                  <Card.Body>
                    <Stack gap={3}>
                      <Text fontWeight="semibold">{t("statusMappingTitle")}</Text>
                      {columnMapping.status == null ? (
                        <Text color="fg.muted">{t("noStatusColumn")}</Text>
                      ) : statusValues.length === 0 ? (
                        <Text color="fg.muted">{t("noValuesFound")}</Text>
                      ) : (
                        <Stack gap={3}>
                          {statusValues.map((value) => (
                            <Flex
                              key={value.key}
                              gap={3}
                              wrap="wrap"
                              align={{ base: "flex-start", md: "center" }}
                              justify={{
                                base: "flex-start",
                                md: "space-between",
                              }}
                              direction={{ base: "column", md: "row" }}
                            >
                              <Text fontWeight="medium">{value.label}</Text>
                              <Box minW={{ base: "full", md: "260px" }}>
                                <SelectRoot
                                  collection={statusMappingCollection}
                                  width="full"
                                  value={[
                                    statusValueMapping[value.key] ?? "skip",
                                  ]}
                                  onValueChange={(details) =>
                                    setStatusValueMapping((prev) => ({
                                      ...prev,
                                      [value.key]:
                                        details.value[0] === "skip"
                                          ? null
                                          : (details.value[0] as ReadingStatus),
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValueText
                                      placeholder={t("skipValue")}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statusMappingCollection.items.map((item) => (
                                      <SelectItem
                                        key={item.value}
                                        item={item}
                                      >
                                        {item.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </SelectRoot>
                              </Box>
                            </Flex>
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  </Card.Body>
                </Card.Root>

                <Card.Root>
                  <Card.Body>
                    <Stack gap={3}>
                      <Text fontWeight="semibold">{t("formatMappingTitle")}</Text>
                      {isMetaLoading ? (
                        <Flex align="center" gap={2} color="fg.muted">
                          <Spinner size="sm" />
                          <Text fontSize="sm">{tCommon("loading")}</Text>
                        </Flex>
                      ) : columnMapping.format == null ? (
                        <Text color="fg.muted">{t("noFormatColumn")}</Text>
                      ) : formatValues.length === 0 ? (
                        <Text color="fg.muted">{t("noValuesFound")}</Text>
                      ) : (
                        <Stack gap={3}>
                          {formatValues.map((value) => (
                            <Flex
                              key={value.key}
                              gap={3}
                              wrap="wrap"
                              align={{ base: "flex-start", md: "center" }}
                              justify={{
                                base: "flex-start",
                                md: "space-between",
                              }}
                              direction={{ base: "column", md: "row" }}
                            >
                              <Text fontWeight="medium">{value.label}</Text>
                              <Box minW={{ base: "full", md: "260px" }}>
                                <SelectRoot
                                  collection={formatMappingCollection}
                                  width="full"
                                  value={[
                                    formatValueMapping[value.key] ?? "skip",
                                  ]}
                                  onValueChange={(details) =>
                                    setFormatValueMapping((prev) => ({
                                      ...prev,
                                      [value.key]:
                                        details.value[0] === "skip"
                                          ? null
                                          : details.value[0] ?? null,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValueText
                                      placeholder={t("skipValue")}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {formatMappingCollection.items.map((item) => (
                                      <SelectItem
                                        key={item.value}
                                        item={item}
                                      >
                                        {item.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </SelectRoot>
                              </Box>
                            </Flex>
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  </Card.Body>
                </Card.Root>

                <Card.Root>
                  <Card.Body>
                    <Stack gap={3}>
                      <Text fontWeight="semibold">{t("genreMappingTitle")}</Text>
                      {isMetaLoading ? (
                        <Flex align="center" gap={2} color="fg.muted">
                          <Spinner size="sm" />
                          <Text fontSize="sm">{tCommon("loading")}</Text>
                        </Flex>
                      ) : columnMapping.genre == null ? (
                        <Text color="fg.muted">{t("noGenreColumn")}</Text>
                      ) : genreValues.length === 0 ? (
                        <Text color="fg.muted">{t("noValuesFound")}</Text>
                      ) : (
                        <Stack gap={3}>
                          {genreValues.map((value) => (
                            <Flex
                              key={value.key}
                              gap={3}
                              wrap="wrap"
                              align={{ base: "flex-start", md: "center" }}
                              justify={{
                                base: "flex-start",
                                md: "space-between",
                              }}
                              direction={{ base: "column", md: "row" }}
                            >
                              <Text fontWeight="medium">{value.label}</Text>
                              <Box minW={{ base: "full", md: "260px" }}>
                                <SelectRoot
                                  collection={genreMappingCollection}
                                  width="full"
                                  value={[
                                    genreValueMapping[value.key] ?? "skip",
                                  ]}
                                  onValueChange={(details) =>
                                    setGenreValueMapping((prev) => ({
                                      ...prev,
                                      [value.key]:
                                        details.value[0] === "skip"
                                          ? null
                                          : details.value[0] ?? null,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValueText
                                      placeholder={t("skipValue")}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {genreMappingCollection.items.map((item) => (
                                      <SelectItem
                                        key={item.value}
                                        item={item}
                                      >
                                        {item.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </SelectRoot>
                              </Box>
                            </Flex>
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  </Card.Body>
                </Card.Root>
              </Stack>

              <Flex
                justify="space-between"
                direction={{ base: "column", sm: "row" }}
                gap={3}
              >
                <Button
                  variant="ghost"
                  onClick={() => setStep(0)}
                  width={{ base: "full", sm: "auto" }}
                >
                  {tCommon("back")}
                </Button>
                <Button
                  colorPalette="brand"
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  width={{ base: "full", sm: "auto" }}
                >
                  {tCommon("next")}
                </Button>
              </Flex>
            </Stack>
          </StepsContent>

          <StepsContent index={2}>
            <Stack gap={6} mt={6}>
              <Card.Root>
                <Card.Body>
                  <Stack gap={3}>
                    <Text fontWeight="semibold">{t("missingInfo")}</Text>
                    <Text fontSize="sm" color="fg.muted">
                      {t("missingHelp")}
                    </Text>
                    {missingRows.length === 0 ? (
                      <Text color="fg.muted">{t("missingNone")}</Text>
                    ) : (
                      <Stack gap={3}>
                        {missingRows.map((row) => (
                          <Box
                            key={row.rowIndex}
                            p={3}
                            borderWidth="1px"
                            borderColor="border.muted"
                            borderRadius="md"
                          >
                            <Flex
                              justify="space-between"
                              align={{ base: "flex-start", md: "center" }}
                              direction={{ base: "column", md: "row" }}
                              gap={2}
                              mb={2}
                            >
                              <Text fontWeight="semibold">
                                {t("rowNumber", { row: row.rowIndex + 1 })}
                              </Text>
                              <Flex align="center" gap={3} wrap="wrap">
                                {rowOverrides[row.rowIndex]?.skip && (
                                  <Badge colorPalette="ink">
                                    {t("rowSkipped")}
                                  </Badge>
                                )}
                                <Checkbox
                                  checked={rowOverrides[row.rowIndex]?.skip ?? false}
                                  onCheckedChange={(details) =>
                                    handleOverrideChange(
                                      row.rowIndex,
                                      "skip",
                                      Boolean(details.checked)
                                    )
                                  }
                                >
                                  {t("skipRow")}
                                </Checkbox>
                              </Flex>
                            </Flex>
                            <Stack gap={2}>
                              {!row.title && (
                                <Input
                                  placeholder={t("manualTitle")}
                                  value={rowOverrides[row.rowIndex]?.title ?? ""}
                                  onChange={(e) =>
                                    handleOverrideChange(
                                      row.rowIndex,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                  aria-label={t("manualTitle")}
                                />
                              )}
                              {row.authors.length === 0 && (
                                <Input
                                  placeholder={t("manualAuthors")}
                                  value={rowOverrides[row.rowIndex]?.authors ?? ""}
                                  onChange={(e) =>
                                    handleOverrideChange(
                                      row.rowIndex,
                                      "authors",
                                      e.target.value
                                    )
                                  }
                                  aria-label={t("manualAuthors")}
                                />
                              )}
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Card.Body>
              </Card.Root>

              <Flex
                justify="space-between"
                direction={{ base: "column", sm: "row" }}
                gap={3}
              >
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  width={{ base: "full", sm: "auto" }}
                >
                  {tCommon("back")}
                </Button>
                <Button
                  colorPalette="brand"
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep3}
                  width={{ base: "full", sm: "auto" }}
                >
                  {tCommon("next")}
                </Button>
              </Flex>
            </Stack>
          </StepsContent>

          <StepsContent index={3}>
            <Stack gap={6} mt={6}>
              <Text color="fg.muted">{t("authorsStepHelp")}</Text>
              {foundAuthorKeys.length === 0 ? (
                <Text color="fg.muted">{t("authorsEmpty")}</Text>
              ) : (
                <Stack gap={4}>
                  {foundAuthorKeys.map((key) => {
                    const resolution = authorResolutions[key];
                    const selectedAuthor = authors.find(
                      (author) => author.id === resolution?.existingId
                    );
                    const nationalityItems = nationalities.filter((nat) =>
                      resolution?.nationalityIds?.includes(nat.id)
                    );
                    return (
                      <Box
                        key={key}
                        p={4}
                        borderWidth="1px"
                        borderColor="border.muted"
                        borderRadius="lg"
                        bg="surface.raised"
                        boxShadow="subtle"
                      >
                        <Stack gap={3}>
                          <Flex
                            justify="space-between"
                            align={{ base: "flex-start", sm: "center" }}
                            direction={{ base: "column", sm: "row" }}
                            gap={2}
                          >
                            <Text fontWeight="semibold">{key}</Text>
                            {isMetaLoading && (
                              <Text fontSize="sm" color="fg.muted">
                                {tCommon("loading")}
                              </Text>
                            )}
                          </Flex>
                          <RadioGroup
                            value={resolution?.mode ?? "existing"}
                            onValueChange={(details) =>
                              setAuthorResolutions((prev) => ({
                                ...prev,
                                [key]: {
                                  ...(prev[key] ?? {
                                    key,
                                    name: key,
                                    genderId: "none",
                                    nationalityIds: [],
                                  }),
                                  mode: details.value as "existing" | "new",
                                },
                              }))
                            }
                          >
                            <Stack gap={2} direction={{ base: "column", sm: "row" }}>
                              <Radio value="existing">{t("matchExisting")}</Radio>
                              <Radio value="new">{t("createNew")}</Radio>
                            </Stack>
                          </RadioGroup>

                          {resolution?.mode === "existing" ? (
                            <Box>
                              <SelectRoot
                                collection={authorCollection}
                                width={{ base: "full", md: "auto" }}
                                value={
                                  resolution.existingId
                                    ? [resolution.existingId]
                                    : []
                                }
                                onValueChange={(details) =>
                                  setAuthorResolutions((prev) => ({
                                    ...prev,
                                    [key]: {
                                      ...(prev[key] ?? {
                                        key,
                                        name: key,
                                        genderId: "none",
                                        nationalityIds: [],
                                      }),
                                      mode: "existing",
                                      existingId: details.value[0],
                                    },
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValueText
                                    placeholder={t("existingAuthor")}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {authorCollection.items.map((item) => (
                                    <SelectItem key={item.value} item={item}>
                                      {item.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </SelectRoot>
                              {selectedAuthor && (
                                <Text fontSize="sm" color="fg.muted" mt={2}>
                                  {selectedAuthor.gender?.name ?? t("unknownGender")}
                                </Text>
                              )}
                            </Box>
                          ) : (
                            <Stack gap={3}>
                              <Input
                                value={resolution?.name ?? key}
                                onChange={(e) =>
                                  setAuthorResolutions((prev) => ({
                                    ...prev,
                                    [key]: {
                                      ...(prev[key] ?? {
                                        key,
                                        existingId: undefined,
                                        genderId: "none",
                                        nationalityIds: [],
                                      }),
                                      mode: "new",
                                      name: e.target.value,
                                    },
                                  }))
                                }
                                placeholder={t("newAuthorName")}
                              />
                              <Box>
                                <Text fontSize="sm" color="fg.muted" mb={1}>
                                  {t("genderLabel")}
                                </Text>
                                <SelectRoot
                                  collection={genderCollection}
                                  width={{ base: "full", md: "auto" }}
                                  value={[resolution?.genderId ?? "none"]}
                                  onValueChange={(details) =>
                                    setAuthorResolutions((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...(prev[key] ?? {
                                          key,
                                          existingId: undefined,
                                          name: key,
                                          nationalityIds: [],
                                        }),
                                        mode: "new",
                                        genderId: details.value[0] ?? "none",
                                      },
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValueText
                                      placeholder={t("genderLabel")}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {genderCollection.items.map((item) => (
                                      <SelectItem key={item.value} item={item}>
                                        {item.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </SelectRoot>
                              </Box>
                              <Box>
                                <Text fontSize="sm" color="fg.muted" mb={1}>
                                  {t("nationalityLabel")}
                                </Text>
                                <ComboboxRoot
                                  collection={nationalityCollection}
                                  value={resolution?.nationalityIds ?? []}
                                  multiple
                                  selectionBehavior="clear"
                                  closeOnSelect={false}
                                  onValueChange={(details) =>
                                    setAuthorResolutions((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...(prev[key] ?? {
                                          key,
                                          existingId: undefined,
                                          name: key,
                                          genderId: "none",
                                        }),
                                        mode: "new",
                                        nationalityIds: details.value,
                                      },
                                    }))
                                  }
                                >
                                  <ComboboxControl clearable width="full">
                                    <ComboboxInput
                                      placeholder={t("nationalityLabel")}
                                    />
                                  </ComboboxControl>
                                  <ComboboxContent>
                                    {nationalityCollection.items.map((item) => (
                                      <ComboboxItem key={item.value} item={item}>
                                        <ComboboxItemText>
                                          {item.label}
                                        </ComboboxItemText>
                                      </ComboboxItem>
                                    ))}
                                  </ComboboxContent>
                                </ComboboxRoot>
                                {nationalityItems.length > 0 && (
                                  <Flex gap={2} wrap="wrap" mt={2}>
                                    {nationalityItems.map((nat) => (
                                      <Tag key={nat.id} size="sm" colorPalette="ink">
                                        {nat.name}
                                      </Tag>
                                    ))}
                                  </Flex>
                                )}
                              </Box>
                            </Stack>
                          )}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}
              {hasInvalidAuthorResolution && (
                <Text fontSize="sm" color="red.500">
                  {t("authorsIncomplete")}
                </Text>
              )}

              <Flex
                justify="space-between"
                direction={{ base: "column", sm: "row" }}
                gap={3}
              >
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  width={{ base: "full", sm: "auto" }}
                >
                  {tCommon("back")}
                </Button>
                <Button
                  colorPalette="brand"
                  onClick={() => setStep(4)}
                  disabled={
                    booksToImport.length === 0 || hasInvalidAuthorResolution
                  }
                  width={{ base: "full", sm: "auto" }}
                >
                  {tCommon("next")}
                </Button>
              </Flex>
            </Stack>
          </StepsContent>

          <StepsContent index={4}>
            <Stack gap={6} mt={6}>
              <Stack
                gap={2}
                p={{ base: 4, md: 5 }}
                bg="surface.raised"
                borderWidth="1px"
                borderColor="border.muted"
                borderRadius="lg"
              >
                <Text fontWeight="semibold">{t("summaryHeading")}</Text>
                <Text>{t("booksToImport", { count: booksToImport.length })}</Text>
                <Text>
                  {t("authorsToCreate", { count: authorsToCreate.length })}
                </Text>
              </Stack>

              <AccordionRoot collapsible>
                <AccordionItem value="preview">
                  <AccordionItemTrigger>
                    <Text fontWeight="semibold">{t("fullPreview")}</Text>
                  </AccordionItemTrigger>
                  <AccordionItemContent>
                    <Stack gap={4}>
                      <Stack gap={2}>
                        <Text fontWeight="semibold">{t("booksListPreview")}</Text>
                        {booksToImport.map((book) => (
                          <Box
                            key={`${book.rowIndex}-${book.title}`}
                            p={3}
                            borderWidth="1px"
                            borderColor="border.muted"
                            borderRadius="md"
                            bg="surface.raised"
                          >
                            <Text fontWeight="semibold">{book.title}</Text>
                            <Text fontSize="sm" color="fg.muted">
                              {book.authors.join(", ")}
                            </Text>
                          </Box>
                        ))}
                      </Stack>
                      <Stack gap={2}>
                        <Text fontWeight="semibold">{t("authorsListPreview")}</Text>
                        {Object.values(authorResolutions).map((resolution) => {
                          const existingAuthor = authors.find(
                            (author) => author.id === resolution.existingId
                          );
                          const displayName =
                            resolution.mode === "existing"
                              ? existingAuthor?.name ?? resolution.name
                              : resolution.name;
                          return (
                            <Box
                              key={resolution.key}
                              p={3}
                              borderWidth="1px"
                              borderColor="border.muted"
                              borderRadius="md"
                              bg="surface.raised"
                            >
                              <Text fontWeight="semibold">{displayName}</Text>
                              <Text fontSize="sm" color="fg.muted">
                                {resolution.mode === "existing"
                                  ? t("usesExisting")
                                  : t("createsNew")}
                              </Text>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Stack>
                  </AccordionItemContent>
                </AccordionItem>
              </AccordionRoot>

              <Flex
                justify="space-between"
                direction={{ base: "column", sm: "row" }}
                gap={3}
              >
                <Button
                  variant="ghost"
                  onClick={() => setStep(3)}
                  width={{ base: "full", sm: "auto" }}
                >
                  {tCommon("back")}
                </Button>
                <Button
                  colorPalette="brand"
                  onClick={handleImport}
                  loading={importing}
                  loadingText={tCommon("loading")}
                  width={{ base: "full", sm: "auto" }}
                >
                  {t("importButton")}
                </Button>
              </Flex>
            </Stack>
          </StepsContent>
        </StepsRoot>
      </Stack>
    </Container>
  );
}
