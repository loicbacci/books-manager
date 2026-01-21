import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { RegisterForm } from "./register-form";
import { Box, Container, Heading, Stack, Text } from "@chakra-ui/react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  // Redirect authenticated users to dashboard
  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  }

  const tAuth = await getTranslations("auth");
  const tCommon = await getTranslations("common");

  return (
    <Box minH="100vh" bg="surface.base" display="flex" alignItems="center">
      <Container maxW="md">
        <Stack gap={8}>
          <Stack gap={2} textAlign="center">
            <Heading as="h1" size="2xl" color="brand.fg">
              {tAuth("register")}
            </Heading>
            <Text color="text.secondary">{tCommon("appName")}</Text>
          </Stack>

          <Box bg="surface.raised" p={8} borderRadius="xl" boxShadow="card">
            <RegisterForm locale={locale} />
          </Box>

          <Text textAlign="center" color="text.secondary">
            {tAuth("hasAccount")}{" "}
            <Text
              as={Link}
              href={`/${locale}/login`}
              color="brand.fg"
              fontWeight="medium"
              _hover={{ textDecoration: "underline" }}
            >
              {tAuth("login")}
            </Text>
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
