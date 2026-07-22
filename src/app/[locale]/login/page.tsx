import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "./login-form";
import { Link } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  // Redirect authenticated users to dashboard
  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  }

  const tAuth = await getTranslations("auth");

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {tAuth("login")}
          </h1>
        </div>

        <Card>
          <CardContent>
            <LoginForm locale={locale} />
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          {tAuth("noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {tAuth("register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
