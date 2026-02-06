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
import { FeatureCard } from "@/components/home/feature-card";

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
  const tHome = await getTranslations("home");

  return (
    // Page shell
    <Box minH="100vh" bg="surface.base">
      <Container maxW="container.xl" py={20}>
        <Stack gap={12} align="center" textAlign="center">
          {/* Hero header */}
          <Stack gap={4}>
            <Heading as="h1" size={{ base: "2xl", md: "4xl" }} color="brand.fg">
              {t("appName")}
            </Heading>
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              color="fg.muted"
              maxW="600px"
            >
              {tHome("heroSubtitle")}
            </Text>
          </Stack>

          {/* Primary calls-to-action */}
          <Flex gap={4}>
            <Button asChild colorPalette="brand" size="lg">
              <Link href={`/${locale}/login`}>{tAuth("login")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/${locale}/register`}>{tAuth("register")}</Link>
            </Button>
          </Flex>

          {/* Feature highlights */}
          <Stack gap={8} pt={8}>
            <Heading as="h2" size="xl">
              {tHome("featuresTitle")}
            </Heading>
            <Flex gap={6} wrap="wrap" justify="center">
              <FeatureCard
                icon="library"
                title={tHome("featureLibraryTitle")}
                description={tHome("featureLibraryDescription")}
              />
              <FeatureCard
                icon="stats"
                title={tHome("featureStatsTitle")}
                description={tHome("featureStatsDescription")}
              />
              <FeatureCard
                icon="rating"
                title={tHome("featureRatingTitle")}
                description={tHome("featureRatingDescription")}
              />
              <FeatureCard
                icon="language"
                title={tHome("featureLanguageTitle")}
                description={tHome("featureLanguageDescription")}
              />
            </Flex>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

