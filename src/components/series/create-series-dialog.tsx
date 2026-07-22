"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CreatedSeries = {
  id: string;
  name: string;
  slug: string;
};

type CreateSeriesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (series: CreatedSeries) => void;
};

export function CreateSeriesDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateSeriesDialogProps) {
  const t = useTranslations("series");
  const tCommon = useTranslations("common");

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (response.ok) {
        const created = (await response.json()) as CreatedSeries;
        setName("");
        onCreated?.(created);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to create series:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("createTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="create-series-name">{t("namePlaceholder")}</Label>
          <Input
            id="create-series-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="button" onClick={handleCreate} disabled={saving}>
            {saving ? tCommon("loading") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
