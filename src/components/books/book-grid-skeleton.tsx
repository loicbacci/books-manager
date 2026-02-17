import { Grid, Skeleton, Stack } from "@chakra-ui/react";

export function BookGridSkeleton() {
  return (
    <Grid
      templateColumns={{
        base: "repeat(2, 1fr)",
        md: "repeat(3, 1fr)",
        lg: "repeat(4, 1fr)",
        xl: "repeat(5, 1fr)",
        "2xl": "repeat(6, 1fr)",
      }}
      gap={6}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <Stack key={i} gap={4}>
          <Skeleton height="300px" borderRadius="md" />
          <Skeleton height="20px" width="80%" />
          <Skeleton height="16px" width="60%" />
        </Stack>
      ))}
    </Grid>
  );
}
