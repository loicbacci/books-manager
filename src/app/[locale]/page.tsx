import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/home/feature-card";
import { Link } from "@/i18n/routing";

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
    <div className="bg-background">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 px-4 py-20 text-center sm:px-6 lg:px-8">
        {/* Hero header */}
        <div className="space-y-4">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
            {t("appName")}
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            {tHome("heroSubtitle")}
          </p>
        </div>

        {/* Primary calls-to-action */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            render={<Link href="/login" />}
            nativeButton={false}
          >
            {tAuth("login")}
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/register" />}
            nativeButton={false}
          >
            {tAuth("register")}
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="space-y-8 pt-8">
          <h2 className="font-heading text-2xl font-semibold">
            {tHome("featuresTitle")}
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
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
          </div>
        </div>
      </div>
    </div>
  );
}
