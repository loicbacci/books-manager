"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SeriesOption = {
  id: string;
  name: string;
};

/**
 * Props for selecting or creating a series inline.
 */
type SeriesSelectProps = {
  series: SeriesOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  onSeriesCreated: (series: SeriesOption) => void;
  placeholder: string;
  isLoading?: boolean;
  className?: string;
};

const NONE_VALUE = "__none__";

/**
 * Series selector with an inline "add series" flow.
 */
export function SeriesSelect({
  series,
  value,
  onChange,
  onSeriesCreated,
  placeholder,
  isLoading = false,
  className,
}: SeriesSelectProps) {
  const t = useTranslations("series");
  const tCommon = useTranslations("common");
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const items = [
    { value: NONE_VALUE, label: tCommon("none") },
    ...series.map((item) => ({ value: item.id, label: item.name })),
  ];

  /**
   * Create a new series on the server and update parent state.
   */
  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);

    try {
      const response = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (response.ok) {
        const created = (await response.json()) as SeriesOption;
        onSeriesCreated(created);
        onChange(created.id);
        setName("");
        setIsAdding(false);
      }
    } catch (error) {
      console.error("Failed to create series:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Select
        items={items}
        value={value ?? NONE_VALUE}
        onValueChange={(next) => onChange(next === NONE_VALUE ? null : next)}
      >
        <SelectTrigger disabled={isLoading} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoading && (
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      )}

      {!isAdding ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-fit"
        >
          {t("addInline")}
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {t("namePlaceholder")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="min-w-[200px] flex-1"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? tCommon("loading") : t("addAction")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setName("");
              }}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
