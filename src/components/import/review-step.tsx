"use client";

import { useTranslations } from "next-intl";
import { RiDeleteBinLine, RiLoaderLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ParsedBookRow } from "@/hooks/import/use-column-processing";
import { cn } from "@/lib/utils";

type ReviewStepProps = {
  paginatedRows: ParsedBookRow[];
  totalRows: number;
  validRowsCount: number;
  previewPage: number;
  totalPreviewPages: number;
  setPreviewPage: (page: number) => void;
  onRemoveRow: (rowIndex: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export function ReviewStep({
  paginatedRows,
  totalRows,
  validRowsCount,
  previewPage,
  totalPreviewPages,
  setPreviewPage,
  onRemoveRow,
  onSubmit,
  isSubmitting,
}: ReviewStepProps) {
  const t = useTranslations("sheetImport");
  const tBook = useTranslations("book");
  const tCommon = useTranslations("common");

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-medium">
          {t("steps.review.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("steps.review.description")}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-muted/40 p-4">
        <div className="space-y-0.5">
          <p className="text-sm text-muted-foreground">{t("rowsToImport")}</p>
          <p className="text-2xl font-semibold">
            {validRowsCount} / {totalRows}
          </p>
        </div>
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={validRowsCount === 0 || isSubmitting}
        >
          {isSubmitting && (
            <RiLoaderLine className="animate-spin" data-icon="inline-start" />
          )}
          {t("startImport")}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="w-10 px-3 py-2 text-left font-medium" />
              <th className="px-3 py-2 text-left font-medium">
                {tBook("title")}
              </th>
              <th className="px-3 py-2 text-left font-medium">
                {tBook("authors")}
              </th>
              <th className="px-3 py-2 text-left font-medium">
                {tBook("status")}
              </th>
              <th className="px-3 py-2 text-left font-medium">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr
                key={row.rowIndex}
                className={cn(
                  "border-b last:border-0",
                  row.skip && "opacity-50"
                )}
              >
                <td className="px-3 py-2">
                  <Checkbox
                    checked={!row.skip}
                    onCheckedChange={() => onRemoveRow(row.rowIndex)}
                    aria-label={t("skipRow")}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-0.5">
                    {row.title ? (
                      <span className="line-clamp-1 font-medium">
                        {row.title}
                      </span>
                    ) : (
                      <Badge variant="destructive">{t("missing")}</Badge>
                    )}
                    {row.totalPages != null && (
                      <span className="text-xs text-muted-foreground">
                        {row.totalPages} {tBook("pages").toLowerCase()}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {row.authors.length > 0 ? (
                    row.authors.join(", ")
                  ) : (
                    <Badge variant="destructive">{t("missing")}</Badge>
                  )}
                </td>
                <td className="px-3 py-2">
                  {row.status ? (
                    <Badge variant="secondary">{row.status}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label={t("remove")}
                    onClick={() => onRemoveRow(row.rowIndex)}
                  >
                    <RiDeleteBinLine />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPreviewPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            size="sm"
            variant="outline"
            disabled={previewPage === 1}
            onClick={() => setPreviewPage(previewPage - 1)}
          >
            {tCommon("previous")}
          </Button>
          <span className="text-sm">
            {previewPage} / {totalPreviewPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={previewPage === totalPreviewPages}
            onClick={() => setPreviewPage(previewPage + 1)}
          >
            {tCommon("next")}
          </Button>
        </div>
      )}
    </div>
  );
}
