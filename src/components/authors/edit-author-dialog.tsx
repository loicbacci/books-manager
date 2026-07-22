"use client";

import { useEffect, useState } from "react";
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
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AuthorForEdit = {
  id: string;
  name: string;
  gender: { id: string; name: string } | null;
  nationalities: Array<{ nationality: { id: string; name: string } }>;
};

type UpdatedAuthor = {
  id: string;
  name: string;
  gender: { id: string; name: string } | null;
  nationalities: Array<{ nationality: { id: string; name: string } }>;
};

type EditAuthorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  author: AuthorForEdit;
  onUpdated?: (author: UpdatedAuthor) => void;
};

const NONE_GENDER = "none";

export function EditAuthorDialog({
  open,
  onOpenChange,
  author,
  onUpdated,
}: EditAuthorDialogProps) {
  const t = useTranslations("author");
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");

  const [name, setName] = useState(author.name);
  const [saving, setSaving] = useState(false);
  const [genders, setGenders] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [nationalities, setNationalities] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [genderId, setGenderId] = useState(
    author.gender?.id ?? NONE_GENDER
  );
  const [nationalityIds, setNationalityIds] = useState<string[]>(
    author.nationalities.map((entry) => entry.nationality.id)
  );
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const [isAddingGender, setIsAddingGender] = useState(false);
  const [newGenderName, setNewGenderName] = useState("");
  const [isAddingNationality, setIsAddingNationality] = useState(false);
  const [newNationalityName, setNewNationalityName] = useState("");
  const [savingGender, setSavingGender] = useState(false);
  const [savingNationality, setSavingNationality] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(author.name);
    setGenderId(author.gender?.id ?? NONE_GENDER);
    setNationalityIds(
      author.nationalities.map((entry) => entry.nationality.id)
    );
    setIsAddingGender(false);
    setIsAddingNationality(false);
    setNewGenderName("");
    setNewNationalityName("");
  }, [open, author]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let isActive = true;
    setIsMetaLoading(true);
    Promise.all([
      fetch("/api/genders", { signal: controller.signal }).then((r) =>
        r.json()
      ),
      fetch("/api/nationalities", { signal: controller.signal }).then((r) =>
        r.json()
      ),
    ])
      .then(([gendersData, nationalitiesData]) => {
        if (!isActive) return;
        setGenders(gendersData);
        setNationalities(nationalitiesData);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch metadata:", error);
      })
      .finally(() => {
        if (!isActive) return;
        setIsMetaLoading(false);
      });
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [open]);

  const genderItems = [
    { value: NONE_GENDER, label: t("unknownGender") },
    ...genders.map((gender) => ({ value: gender.id, label: gender.name })),
  ];

  const nationalityOptions = nationalities.map((nat) => ({
    value: nat.id,
    label: nat.name,
  }));

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/authors/${author.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          genderId: genderId === NONE_GENDER ? null : genderId,
          nationalityIds,
        }),
      });
      if (response.ok) {
        const updated = (await response.json()) as UpdatedAuthor;
        onUpdated?.(updated);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to update author:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateGender = async () => {
    const trimmed = newGenderName.trim();
    if (!trimmed) return;
    setSavingGender(true);
    try {
      const response = await fetch("/api/genders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (response.ok) {
        const created = await response.json();
        setGenders((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        setGenderId(created.id);
        setNewGenderName("");
        setIsAddingGender(false);
      }
    } catch (error) {
      console.error("Failed to create gender:", error);
    } finally {
      setSavingGender(false);
    }
  };

  const handleCreateNationality = async () => {
    const trimmed = newNationalityName.trim();
    if (!trimmed) return;
    setSavingNationality(true);
    try {
      const response = await fetch("/api/nationalities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (response.ok) {
        const created = await response.json();
        setNationalities((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        setNationalityIds((prev) =>
          prev.includes(created.id) ? prev : [...prev, created.id]
        );
        setNewNationalityName("");
        setIsAddingNationality(false);
      }
    } catch (error) {
      console.error("Failed to create nationality:", error);
    } finally {
      setSavingNationality(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            aria-label={t("namePlaceholder")}
          />

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("gender")}</p>
            <Select
              items={genderItems}
              value={genderId}
              onValueChange={(value) => {
                if (value) setGenderId(value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("gender")} />
              </SelectTrigger>
              <SelectContent>
                {genderItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isMetaLoading && (
              <p className="text-sm text-muted-foreground">
                {tCommon("loading")}
              </p>
            )}
            {!isAddingGender ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setIsAddingGender(true)}
              >
                {tSettings("addGender")}
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Input
                  value={newGenderName}
                  onChange={(e) => setNewGenderName(e.target.value)}
                  placeholder={tSettings("addGender")}
                  aria-label={tSettings("addGender")}
                  className="min-w-[200px] flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateGender}
                  disabled={savingGender}
                >
                  {savingGender ? tCommon("loading") : tCommon("add")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingGender(false);
                    setNewGenderName("");
                  }}
                >
                  {tCommon("cancel")}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("nationality")}</p>
            <MultiSelect
              options={nationalityOptions}
              value={nationalityIds}
              onChange={setNationalityIds}
              placeholder={t("nationality")}
              disabled={isMetaLoading}
            />
            {isMetaLoading && (
              <p className="text-sm text-muted-foreground">
                {tCommon("loading")}
              </p>
            )}
            {!isAddingNationality ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setIsAddingNationality(true)}
              >
                {tSettings("addNationality")}
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Input
                  value={newNationalityName}
                  onChange={(e) => setNewNationalityName(e.target.value)}
                  placeholder={tSettings("addNationality")}
                  aria-label={tSettings("addNationality")}
                  className="min-w-[200px] flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateNationality}
                  disabled={savingNationality}
                >
                  {savingNationality ? tCommon("loading") : tCommon("add")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingNationality(false);
                    setNewNationalityName("");
                  }}
                >
                  {tCommon("cancel")}
                </Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? tCommon("loading") : tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
