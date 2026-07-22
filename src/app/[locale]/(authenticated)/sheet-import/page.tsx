import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

/** Sheet import is temporarily disabled; send users back to the library. */
export default async function SheetImportPage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/library`);
}
