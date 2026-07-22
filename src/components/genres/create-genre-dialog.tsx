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

type CreatedGenre = {
  id: string;
  name: string;
  color: string | null;
};

type CreateGenreDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (genre: CreatedGenre) => void;
};

export function CreateGenreDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateGenreDialogProps) {
  const t = useTranslations("book");
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const response = await fetch("/api/genres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (response.ok) {
        const created = (await response.json()) as CreatedGenre;
        setName("");
        onCreated?.(created);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to create genre:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tSettings("addGenre")}</DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("genresPlaceholder")}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="button" onClick={handleCreate} disabled={saving}>
            {saving ? tCommon("loading") : tCommon("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
