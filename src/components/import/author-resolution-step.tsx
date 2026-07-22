"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import type { ParsedBookRow } from "@/hooks/import/use-column-processing";
import type { Author } from "@/hooks/import/use-metadata";
import { AuthorSelector } from "./author-selector";

type AuthorResolutionStepProps = {
  parsedRows: ParsedBookRow[];
  authors: Author[];
  authorResolutions: Record<string, string>;
  setAuthorResolutions: (resolutions: Record<string, string>) => void;
};

export function AuthorResolutionStep({
  parsedRows,
  authorResolutions,
  setAuthorResolutions,
}: AuthorResolutionStepProps) {
  const t = useTranslations("sheetImport");
  const [uniqueAuthors, setUniqueAuthors] = useState<string[]>([]);
  const [knownAuthors, setKnownAuthors] = useState<Author[]>([]);
  const [batchChecked, setBatchChecked] = useState(false);

  useEffect(() => {
    const set = new Set<string>();
    parsedRows.forEach((row) => {
      if (row.skip) return;
      row.authors.forEach((author) => set.add(author));
    });
    setUniqueAuthors(Array.from(set).sort());
  }, [parsedRows]);

  useEffect(() => {
    if (uniqueAuthors.length === 0 || batchChecked) return;

    const checkAuthors = async () => {
      try {
        const names = uniqueAuthors.join(",");
        if (!names) return;

        const params = new URLSearchParams();
        params.append("names", names);

        const res = await fetch(`/api/authors?${params.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        const foundAuthors: Author[] = data.items || [];

        setKnownAuthors(foundAuthors);

        const newResolutions = { ...authorResolutions };
        let hasChanges = false;

        foundAuthors.forEach((author) => {
          const originalName = uniqueAuthors.find(
            (n) => n.toLowerCase() === author.name.toLowerCase()
          );
          if (originalName && !newResolutions[originalName]) {
            newResolutions[originalName] = author.id;
            hasChanges = true;
          }
        });

        if (hasChanges) {
          setAuthorResolutions(newResolutions);
        }
      } catch (err) {
        console.error("Failed to batch check authors", err);
      } finally {
        setBatchChecked(true);
      }
    };

    void checkAuthors();
  }, [uniqueAuthors, batchChecked, authorResolutions, setAuthorResolutions]);

  const handleResolutionChange = (name: string, authorId: string) => {
    setAuthorResolutions({
      ...authorResolutions,
      [name]: authorId,
    });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-medium">
          {t("steps.authors.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("steps.authors.description")}
        </p>
      </div>

      <div className="max-h-[500px] overflow-auto rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium">
                {t("authorInFile")}
              </th>
              <th className="px-3 py-2 text-left font-medium">
                {t("matchWith")}
              </th>
            </tr>
          </thead>
          <tbody>
            {uniqueAuthors.map((name) => {
              const selectedId = authorResolutions[name] || "";
              const match = knownAuthors.find((a) => a.id === selectedId);
              const isNew = !selectedId;

              return (
                <tr key={name} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <span className="font-medium">{name}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <AuthorSelector
                        value={selectedId}
                        onChange={(val) => handleResolutionChange(name, val)}
                        initialAuthors={knownAuthors}
                      />
                      {match && (
                        <Badge variant="secondary">{t("autoMatched")}</Badge>
                      )}
                      {isNew && (
                        <Badge variant="outline">{t("willCreate")}</Badge>
                      )}
                    </div>
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
