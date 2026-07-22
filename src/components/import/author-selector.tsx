"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { RiCheckLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Author = {
  id: string;
  name: string;
};

type AuthorSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  initialAuthors?: Author[];
};

export function AuthorSelector({
  value,
  onChange,
  initialAuthors = [],
}: AuthorSelectorProps) {
  const t = useTranslations("sheetImport");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Author[]>(initialAuthors);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setItems(initialAuthors);
  }, [initialAuthors]);

  const selected = items.find((item) => item.id === value) ??
    initialAuthors.find((item) => item.id === value);

  const handleSearch = useCallback(async (query: string) => {
    setSearch(query);
    if (!query || query.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/authors?query=${encodeURIComponent(query)}&pageSize=20`
      );
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Failed to search authors", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-[300px] justify-between font-normal"
          />
        }
      >
        <span
          className={cn(
            "truncate text-left",
            !selected && "text-muted-foreground"
          )}
        >
          {selected?.name ?? t("searchAuthor")}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) min-w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("searchAuthor")}
            value={search}
            onValueChange={handleSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? t("searchAuthor") : t("noResults")}
            </CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="__create__"
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  {t("createNewAuthor")}
                </CommandItem>
              )}
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  <span className="flex-1 truncate">{item.name}</span>
                  {value === item.id && <RiCheckLine className="size-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
