import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

type Props = {
  children: React.ReactNode;
};

export default async function AuthenticatedLayout({ children }: Props) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}

