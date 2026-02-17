import type { ParsedBookRow } from "@/hooks/import/use-column-processing";
import type { Author } from "@/hooks/import/use-metadata";
import {
    Badge,
    Box,
    Heading,
    HStack,
    Table,
    Text,
    VStack,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AuthorSelector } from "./author-selector";

type AuthorResolutionStepProps = {
  parsedRows: ParsedBookRow[];
  authors: Author[]; // Kept for interface compatibility but unused/empty now
  authorResolutions: Record<string, string>; // name -> authorId
  setAuthorResolutions: (resolutions: Record<string, string>) => void;
};

export function AuthorResolutionStep({
  parsedRows,
  authorResolutions,
  setAuthorResolutions,
}: AuthorResolutionStepProps) {
  const t = useTranslations("sheetImport");
  const [uniqueAuthors, setUniqueAuthors] = useState<string[]>([]);
  const [knownAuthors, setKnownAuthors] = useState<Author[]>([]);
  const [batchChecked, setBatchChecked] = useState(false);

  useEffect(() => {
    const set = new Set<string>();
    parsedRows.forEach((row) => {
      if (row.skip) return;
      row.authors.forEach((author) => set.add(author));
    });
    const authorsList = Array.from(set).sort();
    setUniqueAuthors(authorsList);
  }, [parsedRows]);

  // Batch check existing authors
  useEffect(() => {
    if (uniqueAuthors.length === 0 || batchChecked) return;

    const checkAuthors = async () => {
      try {
        const names = uniqueAuthors.join(",");
        if (!names) return; // Should not happen given length check

        // Check if query length is too long for GET
        // If so, we might need to chunk or use POST (but we updated GET only)
        // Let's assume typical usage is okay, or we chunk 20 by 20.
        // For robustness, let's just do one request and hope.
        // Ideally we would chunk.
        
        const params = new URLSearchParams();
        params.append("names", names);
        
        const res = await fetch(`/api/authors?${params.toString()}`);
        if (!res.ok) return;
        
        const data = await res.json();
        const foundAuthors: Author[] = data.items || [];
        
        setKnownAuthors(foundAuthors);
        
        // Auto-match
        const newResolutions = { ...authorResolutions };
        let hasChanges = false;
        
        foundAuthors.forEach(author => {
            // Find which original name matches this author (case insensitive)
            const originalName = uniqueAuthors.find(n => n.toLowerCase() === author.name.toLowerCase());
            if (originalName && !newResolutions[originalName]) {
                newResolutions[originalName] = author.id;
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            setAuthorResolutions(newResolutions);
        }
      } catch (err) {
        console.error("Failed to batch check authors", err);
      } finally {
        setBatchChecked(true);
      }
    };

    checkAuthors();
  }, [uniqueAuthors, batchChecked, authorResolutions, setAuthorResolutions]);

  const handleResolutionChange = (name: string, authorId: string) => {
    setAuthorResolutions({
      ...authorResolutions,
      [name]: authorId,
    });
  };

  return (
    <VStack gap={6} align="stretch" w="full">
      <Heading size="md">{t("steps.authors.title")}</Heading>
      <Text color="fg.muted">{t("steps.authors.description")}</Text>

      <Box overflowX="auto" borderWidth={1} borderRadius="md" maxHeight="500px">
        <Table.Root size="sm" stickyHeader>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{t("authorInFile")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("matchWith")}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {uniqueAuthors.map((name) => {
              const selectedId = authorResolutions[name] || "";
              // Check if we have this author in our known list (batch fetched or otherwise)
              const match = knownAuthors.find(
                (a) => a.id === selectedId
              );
              // Or match by name from batch result if not selected yet (should be handled by effect though)
              
              const isNew = !selectedId;

              return (
                <Table.Row key={name}>
                  <Table.Cell>
                    <Text fontWeight="medium">{name}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack>
                      <AuthorSelector 
                        value={selectedId}
                        onChange={(val) => handleResolutionChange(name, val)}
                        initialAuthors={knownAuthors}
                      />
                      {match && (
                        <Badge colorPalette="green" variant="subtle">
                          {t("autoMatched")}
                        </Badge>
                      )}
                      {isNew && (
                        <Badge colorPalette="gray" variant="subtle">
                          {t("willCreate")}
                        </Badge>
                      )}
                    </HStack>
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
