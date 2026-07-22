"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";

type AuthorOption = {
  id: string;
  name: string;
  gender?: { id: string; name: string } | null;
  nationalities?: Array<{ nationality: { id: string; name: string } }>;
};

/**
 * Props for selecting an existing author or creating a new one inline.
 */
type AuthorSelectProps = {
  authors: AuthorOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  isLoading?: boolean;
  onOpenCreateDialog?: () => void;
  className?: string;
};

/**
 * Author selector with optional inline creation and metadata selection.
 *
 * Used by book create/edit flows to avoid context switching.
 */
export function AuthorSelect({
  authors,
  value,
  onChange,
  placeholder,
  isLoading = false,
  onOpenCreateDialog,
  className,
}: AuthorSelectProps) {
  const t = useTranslations("author");
  const tCommon = useTranslations("common");

  /**
   * Compose a short author description for select items.
   */
  const getDescription = (author: AuthorOption) => {
    const gender = author.gender?.name ?? t("unknownGender");
    const nationalityNames =
      author.nationalities?.map((entry) => entry.nationality.name) ?? [];
    const nationalityLabel =
      nationalityNames.length > 0
        ? nationalityNames.join(", ")
        : t("unknownNationality");
    return `${gender} · ${nationalityLabel}`;
  };

  const options = authors.map((author) => ({
    value: author.id,
    label: author.name,
    description: getDescription(author),
  }));

  return (
    <div className={cn("w-full space-y-3", className)}>
      <MultiSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={isLoading}
      />
      {isLoading && (
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      )}
      {onOpenCreateDialog && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenCreateDialog()}
          className="w-fit"
        >
          {t("addInline")}
        </Button>
      )}
    </div>
  );
}
