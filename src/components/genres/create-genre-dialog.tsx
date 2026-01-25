"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Stack } from "@chakra-ui/react";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "@/components/ui/dialog";

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
    <DialogRoot
      open={open}
      onOpenChange={(e) => !e.open && onOpenChange(false)}
    >
      <DialogContent maxW="md">
        <DialogHeader>
          <DialogTitle>{tSettings("addGenre")}</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <Stack gap={3}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("genresPlaceholder")}
            />
          </Stack>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button
            colorPalette="brand"
            onClick={handleCreate}
            loading={saving}
            loadingText={tCommon("loading")}
          >
            {tCommon("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
