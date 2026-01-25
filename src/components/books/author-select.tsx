"use client";

import { useState, type ComponentProps } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Flex,
  Spinner,
  Stack,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import { Tag } from "@/components/ui/tag";
import {
  ComboboxRoot,
  ComboboxControl,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxItemText,
} from "@/components/ui/combobox";

type AuthorOption = {
  id: string;
  name: string;
  gender?: { id: string; name: string } | null;
  nationalities?: Array<{ nationality: { id: string; name: string } }>;
};

/**
 * Props for selecting an existing author or creating a new one inline.
 */
type AuthorSelectProps = {
  authors: AuthorOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  triggerProps?: ComponentProps<typeof ComboboxControl>;
  isLoading?: boolean;
  onOpenCreateDialog?: () => void;
};

/**
 * Author selector with optional inline creation and metadata selection.
 *
 * Used by book create/edit flows to avoid context switching.
 */
export function AuthorSelect({
  authors,
  value,
  onChange,
  placeholder,
  triggerProps,
  isLoading = false,
  onOpenCreateDialog,
}: AuthorSelectProps) {
  const t = useTranslations("author");
  const tCommon = useTranslations("common");
  const [query, setQuery] = useState("");

  const filteredAuthors = authors.filter((author) =>
    author.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const authorsCollection = createListCollection({
    items: filteredAuthors.map((author) => ({
      value: author.id,
      label: author.name,
    })),
  });
  /**
   * Compose a short author description for select items.
   */
  const getDescription = (author: AuthorOption) => {
    const gender = author.gender?.name ?? t("unknownGender");
    const nationalityNames =
      author.nationalities?.map((entry) => entry.nationality.name) ?? [];
    const nationalityLabel =
      nationalityNames.length > 0
        ? nationalityNames.join(", ")
        : t("unknownNationality");
    return `${gender} · ${nationalityLabel}`;
  };

  const selectedAuthors = authors.filter((author) => value.includes(author.id));

  return (
    <Stack gap={3} width="100%">
      <ComboboxRoot
        collection={authorsCollection}
        value={value}
        multiple
        selectionBehavior="clear"
        closeOnSelect={false}
        inputValue={query}
        onValueChange={(e) => onChange(e.value)}
        onInputValueChange={(e) => setQuery(e.inputValue)}
      >
      <ComboboxControl
        {...triggerProps}
        clearable
      >
          <ComboboxInput
            placeholder={placeholder}
            disabled={isLoading}
          />
        </ComboboxControl>
        <ComboboxContent>
          {authorsCollection.items.map((item) => {
            const author = authors.find((entry) => entry.id === item.value);
            return (
              <ComboboxItem key={item.value} item={item}>
                <Stack gap={0}>
                  <ComboboxItemText>{item.label}</ComboboxItemText>
                  {author && (
                    <Text color="fg.muted" fontSize="xs">
                      {getDescription(author)}
                    </Text>
                  )}
                </Stack>
              </ComboboxItem>
            );
          })}
        </ComboboxContent>
      </ComboboxRoot>
      {isLoading && (
        <Flex align="center" gap={2}>
          <Spinner size="sm" />
          <Text fontSize="sm" color="fg.muted">
            {tCommon("loading")}
          </Text>
        </Flex>
      )}
      {selectedAuthors.length > 0 && (
        <Flex wrap="wrap" gap={2}>
          {selectedAuthors.map((author) => (
            <Tag
              key={author.id}
              size="sm"
              colorPalette="gray"
              closable
              onClose={() =>
                onChange(value.filter((authorId) => authorId !== author.id))
              }
            >
              {author.name}
            </Tag>
          ))}
        </Flex>
      )}

      {onOpenCreateDialog && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenCreateDialog()}
          width="fit-content"
        >
          {t("addInline")}
        </Button>
      )}
    </Stack>
  );
}

