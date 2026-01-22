"use client";

import { useState, type ComponentProps } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Button,
  Flex,
  Input,
  Spinner,
  Stack,
  Text,
  createListCollection,
  type InputProps,
} from "@chakra-ui/react";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type AuthorOption = {
  id: string;
  name: string;
  gender?: { id: string; name: string } | null;
  nationality?: { id: string; name: string } | null;
};

type AuthorSelectProps = {
  authors: AuthorOption[];
  genders: Array<{ id: string; name: string }>;
  nationalities: Array<{ id: string; name: string }>;
  value: string | null;
  onChange: (value: string | null) => void;
  onAuthorCreated: (author: AuthorOption) => void;
  placeholder: string;
  triggerProps?: ComponentProps<typeof SelectTrigger>;
  inputProps?: InputProps;
  isLoading?: boolean;
};

export function AuthorSelect({
  authors,
  genders,
  nationalities,
  value,
  onChange,
  onAuthorCreated,
  placeholder,
  triggerProps,
  inputProps,
  isLoading = false,
}: AuthorSelectProps) {
  const t = useTranslations("author");
  const tCommon = useTranslations("common");
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [genderId, setGenderId] = useState<string>("none");
  const [nationalityId, setNationalityId] = useState<string>("none");
  const [saving, setSaving] = useState(false);

  const authorsCollection = createListCollection({
    items: authors.map((author) => ({
      value: author.id,
      label: author.name,
    })),
  });
  const genderCollection = createListCollection({
    items: [
      { value: "none", label: t("unknownGender") },
      ...genders.map((gender) => ({ value: gender.id, label: gender.name })),
    ],
  });
  const nationalityCollection = createListCollection({
    items: [
      { value: "none", label: t("unknownNationality") },
      ...nationalities.map((nat) => ({ value: nat.id, label: nat.name })),
    ],
  });

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);

    try {
      const response = await fetch("/api/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          genderId: genderId === "none" ? null : genderId,
          nationalityId: nationalityId === "none" ? null : nationalityId,
        }),
      });

      if (response.ok) {
        const created = (await response.json()) as AuthorOption;
        onAuthorCreated(created);
        onChange(created.id);
        setName("");
        setGenderId("none");
        setNationalityId("none");
        setIsAdding(false);
      }
    } catch (error) {
      console.error("Failed to create author:", error);
    } finally {
      setSaving(false);
    }
  };

  const getDescription = (author: AuthorOption) => {
    const gender = author.gender?.name ?? t("unknownGender");
    const nationality = author.nationality?.name ?? t("unknownNationality");
    return `${gender} · ${nationality}`;
  };

  return (
    <Stack gap={3}>
      <SelectRoot
        collection={authorsCollection}
        value={value ? [value] : []}
        onValueChange={(e) => onChange(e.value[0] || null)}
      >
        <SelectTrigger disabled={isLoading} {...triggerProps}>
          <SelectValueText placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {authorsCollection.items.map((item) => {
            const author = authors.find((entry) => entry.id === item.value);
            return (
              <SelectItem key={item.value} item={item}>
                <Stack gap={0}>
                  <Text>{item.label}</Text>
                  {author && (
                    <Text color="fg.muted" fontSize="xs">
                      {getDescription(author)}
                    </Text>
                  )}
                </Stack>
              </SelectItem>
            );
          })}
        </SelectContent>
      </SelectRoot>
      {isLoading && (
        <Flex align="center" gap={2}>
          <Spinner size="sm" />
          <Text fontSize="sm" color="fg.muted">
            {tCommon("loading")}
          </Text>
        </Flex>
      )}

      {!isAdding ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          width="fit-content"
        >
          {t("addInline")}
        </Button>
      ) : (
        <Box>
          <Text fontSize="sm" color="fg.muted" mb={2}>
            {t("namePlaceholder")}
          </Text>
          <Flex gap={2} wrap="wrap">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              flex={1}
              minW="200px"
              {...inputProps}
            />
            <Button
              size="sm"
              colorPalette="brand"
              onClick={handleCreate}
              loading={saving}
              loadingText={tCommon("loading")}
            >
              {t("addAction")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setName("");
              }}
            >
              {tCommon("cancel")}
            </Button>
          </Flex>
          <Stack gap={3} mt={3}>
            <Box>
              <Text fontSize="sm" color="fg.muted" mb={1}>
                {t("gender")}
              </Text>
              <SelectRoot
                collection={genderCollection}
                value={[genderId]}
                onValueChange={(e) => setGenderId(e.value[0] || "none")}
              >
                <SelectTrigger {...triggerProps}>
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
            </Box>
            <Box>
              <Text fontSize="sm" color="fg.muted" mb={1}>
                {t("nationality")}
              </Text>
              <SelectRoot
                collection={nationalityCollection}
                value={[nationalityId]}
                onValueChange={(e) => setNationalityId(e.value[0] || "none")}
              >
                <SelectTrigger {...triggerProps}>
                  <SelectValueText placeholder={t("nationality")} />
                </SelectTrigger>
                <SelectContent>
                  {nationalityCollection.items.map((item) => (
                    <SelectItem key={item.value} item={item}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </Box>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
