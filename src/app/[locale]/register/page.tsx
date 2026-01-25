import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { RegisterForm } from "./register-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Box, Container, Heading, Stack, Text, Link as ChakraLink } from "@chakra-ui/react";
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

  return (
    // Page shell
    <Box minH="calc(100vh - 64px)" bg="surface.base" display="flex" alignItems="center">
      <Container maxW="md">
        <Stack gap={8}>
          {/* Page header */}
          <Stack gap={2} textAlign="center">
            <Heading as="h1" size="2xl">
              {tAuth("register")}
            </Heading>
          </Stack>

          {/* Registration form card */}
          <Box bg="surface.raised" p={8} borderRadius="xl" boxShadow="card">
            <RegisterForm locale={locale} />
          </Box>

          {/* Footer link to login */}
          <Text textAlign="center" color="text.secondary">
            {tAuth("hasAccount")}{" "}
            <ChakraLink
              asChild
              color="brand.fg"
              fontWeight="medium"
              variant="underline"
            >
              <Link href={`/${locale}/login`}>{tAuth("login")}</Link>
            </ChakraLink>
          </Text>
          <LanguageSwitcher />
        </Stack>
      </Container>
    </Box>
  );
}
