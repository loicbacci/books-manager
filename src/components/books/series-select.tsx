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
  triggerProps?: ComponentProps<typeof SelectTrigger>;
  inputProps?: InputProps;
  isLoading?: boolean;
};

/**
 * Series selector with an inline "add series" flow.
 */
export function SeriesSelect({
  series,
  value,
  onChange,
  onSeriesCreated,
  placeholder,
  triggerProps,
  inputProps,
  isLoading = false,
}: SeriesSelectProps) {
  const t = useTranslations("series");
  const tCommon = useTranslations("common");
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const seriesCollection = createListCollection({
    items: series.map((item) => ({ value: item.id, label: item.name })),
  });

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
    <Stack gap={3}>
      <SelectRoot
        collection={seriesCollection}
        value={value ? [value] : []}
        onValueChange={(e) => onChange(e.value[0] || null)}
      >
        <SelectTrigger disabled={isLoading} {...triggerProps}>
          <SelectValueText placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {seriesCollection.items.map((item) => (
            <SelectItem key={item.value} item={item}>
              {item.label}
            </SelectItem>
          ))}
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
        </Box>
      )}
    </Stack>
  );
}
