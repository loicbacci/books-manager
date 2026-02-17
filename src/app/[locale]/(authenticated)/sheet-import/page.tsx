"use client";

import { toaster } from "@/components/ui/toaster";
import {
    Box,
    Button,
    Container,
    Heading,
    HStack,
    Text,
    VStack
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Hooks
import { useColumnProcessing } from "@/hooks/import/use-column-processing";
import { useDataPreview } from "@/hooks/import/use-data-preview";
import { useMetadata } from "@/hooks/import/use-metadata";
import { useSheetParser } from "@/hooks/import/use-sheet-parser";

// Components
import { AuthorResolutionStep } from "@/components/import/author-resolution-step";
import { FileSelectStep } from "@/components/import/file-select-step";
import { MappingStep } from "@/components/import/mapping-step";
import { ReviewStep } from "@/components/import/review-step";

export default function SheetImportPage() {
  const t = useTranslations("sheetImport");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [authorResolutions, setAuthorResolutions] = useState<
    Record<string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Parsing Hook
  const {
    isParsingFile,
    fileError,
    rows,
    handleFileChange,
    resetParser,
  } = useSheetParser();

  // 2. Metadata Hook
  const { authors, formats, genres } = useMetadata(step);

  // 3. Processing Hook
  const {
    skipRows,
    setSkipRows,
    columnOptions,
    columnMapping,
    setColumnMapping,
    setMappingTouched,
    columnPreviews,
    parsedRows,
    rowOverrides,
    setRowOverrides,
  } = useColumnProcessing({
    rows,
    step,
    formats,
    genres,
  });

  // 4. Data Preview Hook
  const {
    previewPage,
    setPreviewPage,
    paginatedRows,
    totalPreviewPages,
  } = useDataPreview(parsedRows);

  const steps = [
    { title: t("steps.upload.label"), value: 0 },
    { title: t("steps.mapping.label"), value: 1 },
    { title: t("steps.authors.label"), value: 2 },
    { title: t("steps.review.label"), value: 3 },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      resetParser(); // Clear file if going back from step 0 (effectively reset)
    }
  };

  const handleFileResolved = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e).then(() => {
        // Automatically move to next step if parse success is handled in hook 
        // We watch `rows`.
    });
  };
  
  const handleRemoveRow = (rowIndex: number) => {
    const current = rowOverrides[rowIndex] || {};
    setRowOverrides({
      ...rowOverrides,
      [rowIndex]: { ...current, skip: !current.skip },
    });
  };

  // Submission Logic
  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => !r.skip);
    if (validRows.length === 0) return;

    // Validate Authors
    const uniqueAuthorsInRows = new Set<string>();
    validRows.forEach((r) => r.authors.forEach((a) => uniqueAuthorsInRows.add(a)));
    
    setIsSubmitting(true);
    try {
      const payload = {
        authors: Array.from(uniqueAuthorsInRows).map((name) => {
          const existingId = authorResolutions[name];
          if (existingId) {
            return {
              key: name,
              name,
              mode: "existing" as const, // explicit const for TS
              id: existingId,
            };
          }
          return {
            key: name,
            name,
            mode: "create" as const,
          };
        }),
        books: validRows.map((row) => ({
          title: row.title,
          authors: row.authors.map((a) => ({ key: a })),
          totalPages: row.totalPages,
          currentPage: row.currentPage,
          status: row.status,
          formatId: row.formatId,
          genreIds: row.genreIds,
          rating: row.rating,
          summary: row.summary,
          favoriteQuote: row.favoriteQuote,
          favoriteMoment: row.favoriteMoment,
          startDate: row.startDate,
          endDate: row.endDate,
        })),
      };

      const res = await fetch("/api/books/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || t("importFailed"));
      }

      const data = await res.json();
      toaster.create({
        title: t("importSuccess"),
        description: t("importSuccessDescription", {
          count: data.bookCount,
        }),
        type: "success",
      });

      router.push("/books");
      router.refresh();
    } catch (error: unknown) {
      toaster.create({
        title: t("importError"),
        description: error instanceof Error ? error.message : String(error),
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="6xl" py={8}>
      <VStack gap={8} align="stretch">
        <HStack justify="space-between">
          <Heading size="xl">{t("title")}</Heading>
        </HStack>

        <Box>
           <HStack gap={4} w="full">
             {steps.map((s, index) => {
               const isActive = index === step;
               const isCompleted = index < step;
               return (
                 <HStack key={index} gap={2} opacity={isActive || isCompleted ? 1 : 0.5}>
                   <Box
                     w={8}
                     h={8}
                     borderRadius="full"
                     bg={isActive ? "blue.500" : isCompleted ? "green.500" : "gray.200"}
                     color={isActive || isCompleted ? "white" : "gray.500"}
                     display="flex"
                     alignItems="center"
                     justifyContent="center"
                     fontWeight="bold"
                   >
                     {isCompleted ? "✓" : index + 1}
                   </Box>
                   <Text fontWeight={isActive ? "bold" : "medium"}>{s.title}</Text>
                   {index < steps.length - 1 && (
                     <Box h="1px" w={10} bg="gray.200" flex={1} display={{ base: "none", md: "block" }} />
                   )}
                 </HStack>
               );
             })}
           </HStack>
        </Box>

        <Box minH="400px" borderWidth={1} borderRadius="lg" p={6} bg="bg.panel">
          {step === 0 && (
            <FileSelectStep
              isParsingFile={isParsingFile}
              fileError={fileError}
              onFileChange={handleFileResolved}
            />
          )}
          {step === 1 && (
            <MappingStep
              skipRows={skipRows}
              setSkipRows={setSkipRows}
              columnOptions={columnOptions}
              columnMapping={columnMapping}
              setColumnMapping={setColumnMapping}
              setMappingTouched={setMappingTouched}
              columnPreviews={columnPreviews}
              rowsLength={rows.length}
            />
          )}
          {step === 2 && (
            <AuthorResolutionStep
              parsedRows={parsedRows}
              authors={authors}
              authorResolutions={authorResolutions}
              setAuthorResolutions={setAuthorResolutions}
            />
          )}
          {step === 3 && (
            <ReviewStep
              paginatedRows={paginatedRows}
              totalRows={parsedRows.length}
              validRowsCount={parsedRows.filter(r => !r.skip).length}
              previewPage={previewPage}
              totalPreviewPages={totalPreviewPages}
              setPreviewPage={setPreviewPage}
              onRemoveRow={handleRemoveRow} 
              onSubmit={handleImport}
              isSubmitting={isSubmitting}
            />
          )}
        </Box>

        <HStack justify="flex-end" pt={4}>
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={isParsingFile || isSubmitting}
          >
            {step === 0 ? t("cancel") : t("back")}
          </Button>
          
          {step > 0 && step < 3 && (
             <Button onClick={handleNext}>
                 {t("next")}
             </Button>
          )}
          
           {step === 0 && rows.length > 0 && (
              <Button onClick={() => setStep(1)}>
                  {t("next")}
              </Button>
           )}
        </HStack>
      </VStack>
    </Container>
  );
}
