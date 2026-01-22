"use client";

import Image from "next/image";
import { Box, Text } from "@chakra-ui/react";

type BookCoverProps = {
  coverUrl: string | null;
  title: string;
  size?: "xs" | "sm" | "md" | "lg";
};

export function BookCover({ coverUrl, title, size = "md" }: BookCoverProps) {
  const sizes = {
    xs: { fontSize: "xl", iconSize: "xl" },
    sm: { fontSize: "2xl", iconSize: "2xl" },
    md: { fontSize: "3xl", iconSize: "3xl" },
    lg: { fontSize: "4xl", iconSize: "4xl" },
  };

  return (
    <Box
      aspectRatio={2 / 3}
      bg="bg.muted"
      borderRadius="md"
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      position="relative"
    >
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 50vw, 250px"
          style={{ objectFit: "cover" }}
          unoptimized
        />
      ) : (
        <Text fontSize={sizes[size].iconSize}>📕</Text>
      )}
    </Box>
  );
}
