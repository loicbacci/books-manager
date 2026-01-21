"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Stack, Input, Button, Text, Field } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

export function LoginForm({ locale }: { locale: string }) {
  const router = useRouter();
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("loginError"));
      } else {
        router.push(`/${locale}/dashboard`);
        router.refresh();
      }
    } catch {
      setError(t("loginError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
        <Field.Root>
          <Field.Label>{t("email")}</Field.Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>{t("password")}</Field.Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </Field.Root>

        {error && (
          <Text color="error.500" fontSize="sm">
            {error}
          </Text>
        )}

        <Button
          type="submit"
          colorPalette="brand"
          size="lg"
          width="full"
          loading={isLoading}
        >
          {t("login")}
        </Button>
      </Stack>
    </form>
  );
}
