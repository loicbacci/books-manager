import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Button,
  Flex,
} from "@chakra-ui/react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  // Redirect authenticated users to dashboard
  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations("common");
  const tAuth = await getTranslations("auth");

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={20}>
        <Stack gap={12} align="center" textAlign="center">
          <Stack gap={4}>
            <Heading as="h1" size={{ base: "2xl", md: "4xl" }} color="brand.fg">
              {t("appName")}
            </Heading>
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              color="gray.600"
              maxW="600px"
            >
              Track your reading journey. Manage books you&apos;ve read, are
              reading, or want to read. Get insights into your reading habits
              with beautiful statistics.
            </Text>
          </Stack>

          <Flex gap={4}>
            <Button asChild colorPalette="brand" size="lg">
              <Link href={`/${locale}/login`}>{tAuth("login")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/${locale}/register`}>{tAuth("register")}</Link>
            </Button>
          </Flex>

          <Stack gap={8} pt={8}>
            <Heading as="h2" size="xl">
              Features
            </Heading>
            <Flex gap={6} wrap="wrap" justify="center">
              <FeatureCard
                icon="📚"
                title="Track Your Library"
                description="Organize books by status: reading, to read, completed, or dropped"
              />
              <FeatureCard
                icon="📊"
                title="Reading Statistics"
                description="Visualize your reading habits with charts and insights"
              />
              <FeatureCard
                icon="⭐"
                title="Rate & Review"
                description="Rate books and save your favorite quotes and moments"
              />
              <FeatureCard
                icon="🌍"
                title="Multi-language"
                description="Available in English and French"
              />
            </Flex>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Box
      bg="white"
      p={6}
      borderRadius="lg"
      boxShadow="md"
      maxW="250px"
      textAlign="center"
    >
      <Text fontSize="3xl" mb={2}>
        {icon}
      </Text>
      <Heading as="h3" size="md" mb={2}>
        {title}
      </Heading>
      <Text color="gray.600" fontSize="sm">
        {description}
      </Text>
    </Box>
  );
}
