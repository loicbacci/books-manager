"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
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
  Icon,
} from "@chakra-ui/react";
import { FiArrowLeft, FiBookOpen } from "react-icons/fi";
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
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const t = useTranslations("author");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    async function fetchAuthor() {
      try {
        const response = await fetch(`/api/authors/${id}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          if (isActive) {
            setAuthor(data);
          }
        } else if (response.status === 404) {
          router.push("/authors");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch author:", error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchAuthor();
    return () => {
      isActive = false;
      controller.abort();
    };
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
                <Icon as={FiBookOpen} boxSize={8} color="brand.fg" />
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

