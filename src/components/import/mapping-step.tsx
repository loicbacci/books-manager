import type {
    ColumnMapping,
    ColumnOption,
} from "@/hooks/import/use-column-processing";
import type { FieldKey } from "@/lib/import/header-guessing";
import {
    Badge,
    Box,
    Heading,
    HStack,
    IconButton,
    NativeSelect,
    Table,
    Text,
    VStack,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { FaTrash } from "react-icons/fa";

type MappingStepProps = {
  skipRows: number;
  setSkipRows: (val: number) => void;
  columnOptions: ColumnOption[];
  columnMapping: ColumnMapping;
  setColumnMapping: (mapping: ColumnMapping) => void;
  setMappingTouched: (touched: boolean) => void;
  columnPreviews: Record<number, string>;
  rowsLength: number;
};

export function MappingStep({
  skipRows,
  setSkipRows,
  columnOptions,
  columnMapping,
  setColumnMapping,
  setMappingTouched,
  columnPreviews,
  rowsLength,
}: MappingStepProps) {
  const t = useTranslations("sheetImport");

  const updateMapping = (field: FieldKey, columnIndex: number | null) => {
    setMappingTouched(true);
    setColumnMapping({ ...columnMapping, [field]: columnIndex });
  };

  const fields: { key: FieldKey; label: string; required?: boolean }[] = [
    { key: "title", label: t("fields.title"), required: true },
    { key: "authors", label: t("fields.authors"), required: true },
    { key: "status", label: t("fields.status") },
    { key: "totalPages", label: t("fields.totalPages") },
    { key: "currentPage", label: t("fields.currentPage") },
    { key: "rating", label: t("fields.rating") },
    { key: "summary", label: t("fields.summary") },
    { key: "startDate", label: t("fields.startDate") },
    { key: "endDate", label: t("fields.endDate") },
    { key: "genre", label: t("fields.genre") },
    { key: "format", label: t("fields.format") },
    { key: "favoriteQuote", label: t("fields.favoriteQuote") },
    { key: "favoriteMoment", label: t("fields.favoriteMoment") },
  ];

  return (
    <VStack gap={6} align="stretch" w="full">
      <Heading size="md">{t("steps.mapping.title")}</Heading>
      <Text color="fg.muted">{t("steps.mapping.description")}</Text>

      <HStack align="center" gap={4} p={4} borderWidth={1} borderRadius="md">
        <Text fontWeight="medium">{t("skipRows")}</Text>
        <NativeSelect.Root size="sm" width="100px">
          <NativeSelect.Field
            value={skipRows}
            onChange={(e) => setSkipRows(Number(e.target.value))}
          >
            {[0, 1, 2, 3, 4, 5, 10].map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <Text fontSize="sm" color="fg.muted">
          {t("rowsDetected", { count: rowsLength })}
        </Text>
      </HStack>

      <Box overflowX="auto" borderWidth={1} borderRadius="md">
        <Table.Root size="sm" striped>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader width="200px">
                {t("field")}
              </Table.ColumnHeader>
              <Table.ColumnHeader>{t("column")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("preview")}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {fields.map((field) => {
              const selectedColIndex = columnMapping[field.key];
              const previewValue =
                selectedColIndex != null
                  ? columnPreviews[selectedColIndex]
                  : "—";

              return (
                <Table.Row key={field.key}>
                  <Table.Cell>
                    <HStack>
                      <Text fontWeight="medium">{field.label}</Text>
                      {field.required && (
                        <Badge size="sm" colorPalette="red" variant="subtle">
                          *
                        </Badge>
                      )}
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack>
                      <NativeSelect.Root size="sm" width="300px">
                        <NativeSelect.Field
                          placeholder={t("selectColumn")}
                          value={selectedColIndex ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateMapping(
                              field.key,
                              val === "" ? null : Number(val)
                            );
                          }}
                        >
                          <option value="">{t("ignore")}</option>
                          {columnOptions.map((opt) => (
                            <option key={opt.index} value={opt.index}>
                              {opt.label}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                      {selectedColIndex != null && (
                        <IconButton
                          aria-label={t("clear")}
                          size="xs"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => updateMapping(field.key, null)}
                        >
                          <FaTrash />
                        </IconButton>
                      )}
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Text
                      fontSize="sm"
                      color="fg.muted"
                      userSelect="none"
                      fontFamily="mono"
                    >
                      {previewValue}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>
    </VStack>
  );
}
