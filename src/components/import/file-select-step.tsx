import { Box, Button, Heading, Input, Text, VStack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { FaFileExcel } from "react-icons/fa";

type FileSelectStepProps = {
  isParsingFile: boolean;
  fileError: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function FileSelectStep({
  isParsingFile,
  fileError,
  onFileChange,
}: FileSelectStepProps) {
  const t = useTranslations("sheetImport");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBoxClick = () => {
    if (!isParsingFile) {
      fileInputRef.current?.click();
    }
  };

  return (
    <VStack gap={6} align="stretch">
      <Heading size="md">{t("steps.upload.title")}</Heading>
      <Text color="fg.muted">{t("steps.upload.description")}</Text>

      <Box
        borderWidth={2}
        borderStyle="dashed"
        borderColor={fileError ? "red.500" : "border"}
        borderRadius="lg"
        p={10}
        textAlign="center"
        cursor={isParsingFile ? "wait" : "pointer"}
        _hover={{ borderColor: isParsingFile ? "border" : "blue.500" }}
        onClick={handleBoxClick}
        transition="all 0.2s"
        bg="bg.subtle"
      >
        <Input
          type="file"
          accept=".xlsx, .xls"
          onChange={onFileChange}
          ref={fileInputRef}
          display="none"
        />
        <VStack gap={4}>
          <Box color="blue.500" fontSize="4xl">
            <FaFileExcel />
          </Box>
          <VStack gap={1}>
            <Text fontWeight="bold" fontSize="lg">
              {isParsingFile ? t("parsing") : t("dragDrop")}
            </Text>
            {!isParsingFile && (
              <Text fontSize="sm" color="fg.muted">
                {t("supportedFormats")}
              </Text>
            )}
          </VStack>
          {!isParsingFile && (
            <Button size="sm" variant="outline" colorPalette="blue">
              {t("browseFiles")}
            </Button>
          )}
        </VStack>
      </Box>

      {fileError && (
        <Text color="red.500" fontSize="sm" textAlign="center">
          {fileError}
        </Text>
      )}
    </VStack>
  );
}
