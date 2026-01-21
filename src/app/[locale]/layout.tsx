import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ChakraProvider } from "@/components/providers/chakra-provider";
import { Navigation } from "@/components/navigation";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/lib/auth";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Books Manager",
  description: "Manage your reading list and track your books",
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as "en" | "fr")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const session = await auth();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ChakraProvider>
            <Navigation isAuthenticated={!!session?.user} />
            <Toaster />
            {children}
          </ChakraProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
