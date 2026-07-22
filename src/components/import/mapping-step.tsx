"use client";

import { useTranslations } from "next-intl";
import { RiDeleteBinLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ColumnMapping,
  ColumnOption,
} from "@/hooks/import/use-column-processing";
import type { FieldKey } from "@/lib/import/header-guessing";

type MappingStepProps = {
  skipRows: number;
  setSkipRows: (val: number) => void;
  columnOptions: ColumnOption[];
  columnMapping: ColumnMapping;
  setColumnMapping: (mapping: ColumnMapping) => void;
  setMappingTouched: (touched: boolean) => void;
  columnPreviews: Record<number, string>;
  rowsLength: number;
};

const SKIP_OPTIONS = [0, 1, 2, 3, 4, 5, 10];

export function MappingStep({
  skipRows,
  setSkipRows,
  columnOptions,
  columnMapping,
  setColumnMapping,
  setMappingTouched,
  columnPreviews,
  rowsLength,
}: MappingStepProps) {
  const t = useTranslations("sheetImport");
  const tBook = useTranslations("book");
  const tCommon = useTranslations("common");

  const updateMapping = (field: FieldKey, columnIndex: number | null) => {
    setMappingTouched(true);
    setColumnMapping({ ...columnMapping, [field]: columnIndex });
  };

  const fields: { key: FieldKey; label: string; required?: boolean }[] = [
    { key: "title", label: tBook("title"), required: true },
    { key: "authors", label: tBook("authors"), required: true },
    { key: "status", label: tBook("status") },
    { key: "totalPages", label: tBook("totalPages") },
    { key: "currentPage", label: tBook("currentPage") },
    { key: "rating", label: tBook("rating") },
    { key: "summary", label: tBook("summary") },
    { key: "startDate", label: tBook("startDate") },
    { key: "endDate", label: tBook("endDate") },
    { key: "genre", label: tBook("genre") },
    { key: "format", label: tBook("format") },
    { key: "favoriteQuote", label: tBook("favoriteQuote") },
    { key: "favoriteMoment", label: tBook("favoriteMoment") },
  ];

  const skipItems = SKIP_OPTIONS.map((val) => ({
    value: String(val),
    label: String(val),
  }));

  const IGNORE_VALUE = "__ignore__";

  const columnItems = [
    { value: IGNORE_VALUE, label: t("ignore") },
    ...columnOptions.map((opt) => ({
      value: String(opt.index),
      label: opt.label,
    })),
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-medium">
          {t("steps.mapping.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("steps.mapping.description")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 p-4">
        <span className="text-sm font-medium">{t("skipRows")}</span>
        <Select
          items={skipItems}
          value={String(skipRows)}
          onValueChange={(value) => setSkipRows(Number(value))}
        >
          <SelectTrigger size="sm" className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {skipItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {t("rowsDetected", { count: rowsLength })}
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="w-[200px] px-3 py-2 text-left font-medium">
                {t("field")}
              </th>
              <th className="px-3 py-2 text-left font-medium">{t("column")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("preview")}</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => {
              const selectedColIndex = columnMapping[field.key];
              const previewValue =
                selectedColIndex != null
                  ? columnPreviews[selectedColIndex]
                  : "—";

              return (
                <tr key={field.key} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{field.label}</span>
                      {field.required && (
                        <Badge variant="destructive">*</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Select
                        items={columnItems}
                        value={
                          selectedColIndex != null
                            ? String(selectedColIndex)
                            : IGNORE_VALUE
                        }
                        onValueChange={(value) => {
                          updateMapping(
                            field.key,
                            value === IGNORE_VALUE || value == null
                              ? null
                              : Number(value)
                          );
                        }}
                      >
                        <SelectTrigger size="sm" className="w-[300px]">
                          <SelectValue placeholder={t("selectColumn")} />
                        </SelectTrigger>
                        <SelectContent>
                          {columnItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedColIndex != null && (
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          aria-label={tCommon("clear")}
                          onClick={() => updateMapping(field.key, null)}
                        >
                          <RiDeleteBinLine />
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-sm text-muted-foreground select-none">
                      {previewValue}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
