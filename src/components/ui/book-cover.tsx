"use client";

import Image from "next/image";
import { RiBook2Line } from "@remixicon/react";

import { cn } from "@/lib/utils";

type BookCoverProps = {
  coverUrl: string | null;
  title: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const iconSizeClassNames = {
  xs: "size-8",
  sm: "size-10",
  md: "size-14",
  lg: "size-20",
};

export function BookCover({
  coverUrl,
  title,
  size = "md",
  className,
}: BookCoverProps) {
  return (
    <div
      className={cn(
        "relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-xl bg-muted",
        className
      )}
    >
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 50vw, 250px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <RiBook2Line
          className={cn("text-muted-foreground", iconSizeClassNames[size])}
          aria-label={`${title} cover placeholder`}
          role="img"
        />
      )}
    </div>
  );
}
