"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FiArrowLeft } from "react-icons/fi";
import { BookGridView, BookGridBook } from "@/components/books/book-grid";

type Author = {
  id: string;
  name: string;
  gender: { id: string; name: string } | null;
  nationalities: Array<{ nationality: { id: string; name: string } }>;
  books: BookGridBook[];
};

export default function AuthorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("author");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuthor() {
      try {
        const response = await fetch(`/api/authors/${id}`);
        if (response.ok) {
          setAuthor(await response.json());
        } else if (response.status === 404) {
          router.push("/authors");
        }
      } catch (error) {
        console.error("Failed to fetch author:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAuthor();
  }, [id, router]);

  // Loading state
  if (loading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text color="fg.muted">{tCommon("loading")}</Text>
      </Container>
    );
  }

  if (!author) {
    return null;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Stack gap={6}>
        {/* Back navigation */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Button variant="ghost" onClick={() => router.push("/authors")}>
            <FiArrowLeft /> {tNav("authors")}
          </Button>
        </Flex>

        {/* Author header + metadata */}
        <Box>
          <Heading as="h1" size="2xl">
            {author.name}
          </Heading>
          <Flex gap={2} wrap="wrap" mt={2}>
            {author.gender && (
              <Badge variant="subtle" colorPalette="green">
                {t("gender")}: {author.gender.name}
              </Badge>
            )}
            {author.nationalities.map((entry) => (
              <Badge
                key={entry.nationality.id}
                variant="subtle"
                colorPalette="orange"
              >
                {t("nationality")}: {entry.nationality.name}
              </Badge>
            ))}
          </Flex>
        </Box>

        {/* Books list / empty state */}
        {author.books.length === 0 ? (
          <Card.Root>
            <Card.Body>
              <Stack align="center" py={10}>
                <Text fontSize="4xl">📚</Text>
                <Text color="fg.muted">{t("emptyBooks")}</Text>
              </Stack>
            </Card.Body>
          </Card.Root>
        ) : (
          <BookGridView books={author.books} cookieKey="authorBooksViewPrefs" />
        )}
      </Stack>
    </Container>
  );
}

