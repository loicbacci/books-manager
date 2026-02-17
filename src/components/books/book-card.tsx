import { BookCover } from "@/components/ui/book-cover";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "@/i18n/routing";
import { resolvePalette } from "@/lib/color-palettes";
import { Badge, Box, Card, Flex, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { FiStar } from "react-icons/fi";
import type { BookGridBook } from "./book-grid";
import type { BookCardFields } from "./book-grid-controls";

type BookCardProps = {
  book: BookGridBook;
  fields: BookCardFields;
};

export function BookCard({ book, fields }: BookCardProps) {
  const t = useTranslations("book");

  /**
   * Reading progress percentage for the progress bar.
   */
  const progress = book.totalPages
    ? Math.round((book.currentPage / book.totalPages) * 100)
    : 0;

  return (
    <Card.Root
      asChild
      transition="all 0.2s"
      _hover={{ transform: "translateY(-4px)", shadow: "lg" }}
    >
      <Link href={`/books/${book.slug}`}>
        <Card.Body p={3}>
          <Stack gap={2}>
            {fields.cover && (
              <Box position="relative">
                <BookCover coverUrl={book.coverUrl} title={book.title} />
                {book.isWishlist && (
                  <Box
                    position="absolute"
                    top={1}
                    right={1}
                    bg="gold.400"
                    borderRadius="full"
                    p={1}
                    fontSize="sm"
                    color="white"
                    shadow="sm"
                  >
                    <FiStar />
                  </Box>
                )}
              </Box>
            )}
            <Box>
              {fields.title && (
                <Text fontSize="sm" fontWeight="semibold" lineClamp={2}>
                  {book.title}
                </Text>
              )}
              {fields.author && (
                <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                  {book.authors.map((a) => a.author.name).join(", ") ||
                    t("unknownAuthor")}
                </Text>
              )}
              {fields.genres && book.genres.length > 0 && (
                <Flex gap={1} wrap="wrap" mt={1}>
                  {book.genres.map(({ genre }) => (
                    <Badge
                      key={genre.id}
                      colorPalette={resolvePalette(genre.name, genre.color)}
                      variant="subtle"
                      size="sm"
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </Flex>
              )}
              {fields.format && book.format && (
                <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                  {book.format.name}
                </Text>
              )}
            </Box>
            {book.status === "READING" && book.totalPages && (
              <Box>
                <ProgressBar value={progress} size="sm" colorScheme="brand" />
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  {progress}%
                </Text>
              </Box>
            )}
            {fields.rating && book.rating !== null && (
              <Flex gap={1}>
                {Array.from({ length: 5 }).map((_, index) => {
                  const rating = book.rating ?? 0;
                  const filledCount = Math.min(5, Math.round(rating));
                  const fillColor =
                    index < filledCount
                      ? "var(--chakra-colors-gold-500)"
                      : "var(--chakra-colors-fg-muted)";
                  return (
                    <FiStar
                      key={index}
                      size={14}
                      color={fillColor}
                      style={{
                        stroke: "currentColor",
                        strokeWidth: 1.5,
                        fill: index < filledCount ? "currentColor" : "none",
                      }}
                    />
                  );
                })}
              </Flex>
            )}
            {fields.status && <StatusBadge status={book.status} size="sm" />}
          </Stack>
        </Card.Body>
      </Link>
    </Card.Root>
  );
}
