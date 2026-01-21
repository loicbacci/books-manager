"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Stack, Input, Button, Text, Field } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

export function RegisterForm({ locale }: { locale: string }) {
  const router = useRouter();
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
          inviteCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("registerError"));
        return;
      }

      // Auto-login after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Registration succeeded but login failed - redirect to login page
        router.push(`/${locale}/login`);
      } else {
        router.push(`/${locale}/dashboard`);
        router.refresh();
      }
    } catch {
      setError(t("registerError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
        <Field.Root>
          <Field.Label>{t("name")} (Optional)</Field.Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </Field.Root>

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
            autoComplete="new-password"
            minLength={8}
          />
          <Field.HelperText>At least 8 characters</Field.HelperText>
        </Field.Root>

        <Field.Root>
          <Field.Label>{t("confirmPassword")}</Field.Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>{t("inviteCode")}</Field.Label>
          <Input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
          />
          <Field.HelperText>Required for registration</Field.HelperText>
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
          {t("register")}
        </Button>
      </Stack>
    </form>
  );
}
