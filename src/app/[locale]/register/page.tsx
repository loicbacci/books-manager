import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { RegisterForm } from "./register-form";
import { Link } from "@/i18n/routing";

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
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {tAuth("register")}
          </h1>
        </div>

        <Card>
          <CardContent>
            <RegisterForm locale={locale} />
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          {tAuth("hasAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {tAuth("login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
