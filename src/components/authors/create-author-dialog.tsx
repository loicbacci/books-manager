"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Flex,
  Input,
  Stack,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import { Tag } from "@/components/ui/tag";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "@/components/ui/dialog";
import {
  ComboboxRoot,
  ComboboxControl,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxItemText,
} from "@/components/ui/combobox";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type CreatedAuthor = {
  id: string;
  name: string;
  gender: { id: string; name: string } | null;
  nationalities: Array<{ nationality: { id: string; name: string } }>;
};

type CreateAuthorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (author: CreatedAuthor) => void;
};

export function CreateAuthorDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateAuthorDialogProps) {
  const t = useTranslations("author");
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [genders, setGenders] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [nationalities, setNationalities] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [genderId, setGenderId] = useState("none");
  const [nationalityIds, setNationalityIds] = useState<string[]>([]);
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const [isAddingGender, setIsAddingGender] = useState(false);
  const [newGenderName, setNewGenderName] = useState("");
  const [isAddingNationality, setIsAddingNationality] = useState(false);
  const [newNationalityName, setNewNationalityName] = useState("");
  const [savingGender, setSavingGender] = useState(false);
  const [savingNationality, setSavingNationality] = useState(false);
  const [nationalityQuery, setNationalityQuery] = useState("");

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

  const filteredNationalities = useMemo(() => {
    const query = nationalityQuery.trim().toLowerCase();
    return nationalities.filter((nat) =>
      nat.name.toLowerCase().includes(query)
    );
  }, [nationalities, nationalityQuery]);

  const nationalityCollection = useMemo(
    () =>
      createListCollection({
        items: filteredNationalities.map((nat) => ({
          value: nat.id,
          label: nat.name,
        })),
      }),
    [filteredNationalities]
  );

  const selectedNationalities = useMemo(
    () => nationalities.filter((nat) => nationalityIds.includes(nat.id)),
    [nationalities, nationalityIds]
  );

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          genderId: genderId === "none" ? null : genderId,
          nationalityIds,
        }),
      });
      if (response.ok) {
        const created = (await response.json()) as CreatedAuthor;
        setName("");
        setGenderId("none");
        setNationalityIds([]);
        onCreated?.(created);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to create author:", error);
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
    <DialogRoot
      open={open}
      onOpenChange={(e) => !e.open && onOpenChange(false)}
    >
      <DialogContent maxW="md">
        <DialogHeader>
          <DialogTitle>{t("createTitle")}</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <Stack gap={3}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              aria-label={t("namePlaceholder")}
            />
            {/* Gender selection + inline add */}
            {/* Nationality selection + inline add */}
            <Stack gap={2}>
              <Text fontSize="sm" color="fg.muted">
                {t("gender")}
              </Text>
              <SelectRoot
                collection={genderCollection}
                value={[genderId]}
                onValueChange={(e) => setGenderId(e.value[0] || "none")}
              >
                <SelectTrigger>
                  <SelectValueText placeholder={t("gender")} />
                </SelectTrigger>
                <SelectContent>
                  {genderCollection.items.map((item) => (
                    <SelectItem key={item.value} item={item}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
              {isMetaLoading && (
                <Text fontSize="sm" color="fg.muted">
                  {tCommon("loading")}
                </Text>
              )}
              {!isAddingGender ? (
                <Button
                  variant="outline"
                  size="sm"
                  width="fit-content"
                  onClick={() => setIsAddingGender(true)}
                >
                  {tSettings("addGender")}
                </Button>
              ) : (
                <Flex gap={2} wrap="wrap">
                  <Input
                    value={newGenderName}
                    onChange={(e) => setNewGenderName(e.target.value)}
                    placeholder={tSettings("addGender")}
                    aria-label={tSettings("addGender")}
                    flex={1}
                    minW="200px"
                  />
                  <Button
                    size="sm"
                    colorPalette="brand"
                    onClick={handleCreateGender}
                    loading={savingGender}
                    loadingText={tCommon("loading")}
                  >
                    {tCommon("add")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingGender(false);
                      setNewGenderName("");
                    }}
                  >
                    {tCommon("cancel")}
                  </Button>
                </Flex>
              )}
            </Stack>
            <Stack gap={2}>
              <Text fontSize="sm" color="fg.muted">
                {t("nationality")}
              </Text>
              <ComboboxRoot
                collection={nationalityCollection}
                value={nationalityIds}
                multiple
                selectionBehavior="clear"
                closeOnSelect={false}
                inputValue={nationalityQuery}
                onValueChange={(e) => setNationalityIds(e.value)}
                onInputValueChange={(e) => setNationalityQuery(e.inputValue)}
              >
                <ComboboxControl clearable>
                  <ComboboxInput
                    placeholder={t("nationality")}
                    disabled={isMetaLoading}
                  />
                </ComboboxControl>
                <ComboboxContent>
                  {nationalityCollection.items.map((item) => (
                    <ComboboxItem key={item.value} item={item}>
                      <ComboboxItemText>{item.label}</ComboboxItemText>
                    </ComboboxItem>
                  ))}
                </ComboboxContent>
              </ComboboxRoot>
              {selectedNationalities.length > 0 && (
                <Flex wrap="wrap" gap={2}>
                  {selectedNationalities.map((nat) => (
                    <Tag
                      key={nat.id}
                      size="sm"
                      colorPalette="ink"
                      closable
                      onClose={() =>
                        setNationalityIds((prev) =>
                          prev.filter((id) => id !== nat.id)
                        )
                      }
                    >
                      {nat.name}
                    </Tag>
                  ))}
                </Flex>
              )}
              {isMetaLoading && (
                <Text fontSize="sm" color="fg.muted">
                  {tCommon("loading")}
                </Text>
              )}
              {!isAddingNationality ? (
                <Button
                  variant="outline"
                  size="sm"
                  width="fit-content"
                  onClick={() => setIsAddingNationality(true)}
                >
                  {tSettings("addNationality")}
                </Button>
              ) : (
                <Flex gap={2} wrap="wrap">
                  <Input
                    value={newNationalityName}
                    onChange={(e) => setNewNationalityName(e.target.value)}
                    placeholder={tSettings("addNationality")}
                    aria-label={tSettings("addNationality")}
                    flex={1}
                    minW="200px"
                  />
                  <Button
                    size="sm"
                    colorPalette="brand"
                    onClick={handleCreateNationality}
                    loading={savingNationality}
                    loadingText={tCommon("loading")}
                  >
                    {tCommon("add")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingNationality(false);
                      setNewNationalityName("");
                    }}
                  >
                    {tCommon("cancel")}
                  </Button>
                </Flex>
              )}
            </Stack>
          </Stack>
        </DialogBody>
        {/* Dialog actions */}
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
            {t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
