"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { RiFileExcel2Line } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileSelectStepProps = {
  isParsingFile: boolean;
  fileError: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function FileSelectStep({
  isParsingFile,
  fileError,
  onFileChange,
}: FileSelectStepProps) {
  const t = useTranslations("sheetImport");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBoxClick = () => {
    if (!isParsingFile) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-medium">
          {t("steps.upload.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("steps.upload.description")}
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={handleBoxClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBoxClick();
          }
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed bg-muted/40 p-10 text-center transition-colors",
          fileError ? "border-destructive" : "border-border",
          isParsingFile
            ? "cursor-wait"
            : "cursor-pointer hover:border-primary"
        )}
      >
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={onFileChange}
          ref={fileInputRef}
          className="hidden"
          tabIndex={-1}
        />
        <RiFileExcel2Line className="size-12 text-primary" />
        <div className="space-y-1">
          <p className="text-lg font-semibold">
            {isParsingFile ? t("parsing") : t("dragDrop")}
          </p>
          {!isParsingFile && (
            <p className="text-sm text-muted-foreground">
              {t("supportedFormats")}
            </p>
          )}
        </div>
        {!isParsingFile && (
          <Button type="button" size="sm" variant="outline">
            {t("browseFiles")}
          </Button>
        )}
      </div>

      {fileError && (
        <p className="text-center text-sm text-destructive">{fileError}</p>
      )}
    </div>
  );
}
