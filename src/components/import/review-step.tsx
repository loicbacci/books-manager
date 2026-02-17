import type { ParsedBookRow } from "@/hooks/import/use-column-processing";
import {
    Badge,
    Box,
    Button,
    Heading,
    HStack,
    IconButton,
    Table,
    Text,
    VStack
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { FaTrash } from "react-icons/fa";

type ReviewStepProps = {
  paginatedRows: ParsedBookRow[];
  totalRows: number;
  validRowsCount: number;
  previewPage: number;
  totalPreviewPages: number;
  setPreviewPage: (page: number) => void;
  onRemoveRow: (rowIndex: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export function ReviewStep({
  paginatedRows,
  totalRows,
  validRowsCount,
  previewPage,
  totalPreviewPages,
  setPreviewPage,
  onRemoveRow,
  onSubmit,
  isSubmitting,
}: ReviewStepProps) {
  const t = useTranslations("sheetImport");

  return (
    <VStack gap={6} align="stretch" w="full">
      <Heading size="md">{t("steps.review.title")}</Heading>
      <Text color="fg.muted">{t("steps.review.description")}</Text>

      <HStack justify="space-between" bg="bg.subtle" p={4} borderRadius="md">
        <VStack align="start" gap={0}>
          <Text fontSize="sm" color="fg.muted">
            {t("rowsToImport")}
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {validRowsCount} / {totalRows}
          </Text>
        </VStack>
        <Button
          loading={isSubmitting}
          colorPalette="blue"
          size="lg"
          onClick={onSubmit}
          disabled={validRowsCount === 0}
        >
          {t("startImport")}
        </Button>
      </HStack>

      <Box overflowX="auto" borderWidth={1} borderRadius="md">
        <Table.Root size="sm" striped>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{t("fields.title")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("fields.authors")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("fields.status")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("actions")}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {paginatedRows.map((row) => (
              <Table.Row key={row.rowIndex} opacity={row.skip ? 0.5 : 1}>
                <Table.Cell>
                  <VStack align="start" gap={0}>
                    <Text fontWeight="medium" lineClamp={1}>
                      {row.title || <Badge colorPalette="red">{t("missing")}</Badge>}
                    </Text>
                    {row.totalPages && (
                      <Text fontSize="xs" color="fg.muted">
                        {row.totalPages} pages
                      </Text>
                    )}
                  </VStack>
                </Table.Cell>
                <Table.Cell>
                  {row.authors.length > 0 ? (
                    row.authors.join(", ")
                  ) : (
                    <Badge colorPalette="red">{t("missing")}</Badge>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {row.status ? (
                    <Badge colorPalette="blue" variant="subtle">
                      {row.status}
                    </Badge>
                  ) : (
                    <Text fontSize="xs" color="fg.muted">
                      —
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <IconButton
                    aria-label={t("remove")}
                    colorPalette="red"
                    variant="ghost"
                    size="xs"
                    onClick={() => onRemoveRow(row.rowIndex)}
                  >
                    <FaTrash />
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {totalPreviewPages > 1 && (
        <HStack justify="center" gap={4}>
          <Button
            size="sm"
            variant="outline"
            disabled={previewPage === 1}
            onClick={() => setPreviewPage(previewPage - 1)}
          >
            {t("previous")}
          </Button>
          <Text fontSize="sm">
            {previewPage} / {totalPreviewPages}
          </Text>
          <Button
            size="sm"
            variant="outline"
            disabled={previewPage === totalPreviewPages}
            onClick={() => setPreviewPage(previewPage + 1)}
          >
            {t("next")}
          </Button>
        </HStack>
      )}
    </VStack>
  );
}
