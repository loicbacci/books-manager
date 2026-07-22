"use client";

import { useTranslations } from "next-intl";
import { RiFilterLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Card layout toggles for the book grid.
 */
export type BookCardFields = {
  cover: boolean;
  title: boolean;
  author: boolean;
  genres: boolean;
  rating: boolean;
  status: boolean;
  format: boolean;
};

/**
 * Reading status filters exposed in the UI.
 */
export type FilterStatus =
  | "ALL"
  | "TO_READ"
  | "READING"
  | "READ"
  | "DROPPED"
  | "WISHLIST";

export type SortOption =
  | "title-asc"
  | "title-desc"
  | "author-asc"
  | "author-desc"
  | "created-asc"
  | "created-desc"
  | "start-asc"
  | "start-desc"
  | "end-asc"
  | "end-desc"
  | "updated-asc"
  | "updated-desc"
  | "progress-asc"
  | "progress-desc";

/**
 * Group-by options for segmented sections in the grid.
 */
export type GroupOption =
  | "none"
  | "series"
  | "author"
  | "status"
  | "rating"
  | "format";

export type SortOptionItem = { value: SortOption; label: string };
export type GroupOptionItem = { value: GroupOption; label: string };
export type FilterOptionItem = { value: FilterStatus; label: string };

const cardFieldKeys: Array<{ key: keyof BookCardFields; labelKey: string }> = [
  { key: "cover", labelKey: "cardDisplayCover" },
  { key: "title", labelKey: "cardDisplayTitle" },
  { key: "author", labelKey: "cardDisplayAuthor" },
  { key: "genres", labelKey: "cardDisplayGenres" },
  { key: "rating", labelKey: "cardDisplayRating" },
  { key: "status", labelKey: "cardDisplayStatus" },
  { key: "format", labelKey: "cardDisplayFormat" },
];

type BookGridControlsProps = {
  areControlsOpen: boolean;
  onToggleControls: () => void;
  isDisplayOpen: boolean;
  onToggleDisplay: () => void;
  cardFields: BookCardFields;
  onToggleCardField: (field: keyof BookCardFields) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  sortItems: SortOptionItem[];
  groupBy: GroupOption;
  onGroupByChange: (value: GroupOption) => void;
  groupItems: GroupOptionItem[];
  filter: FilterStatus;
  onFilterChange: (value: FilterStatus) => void;
  filterItems: FilterOptionItem[];
  showGroupActions: boolean;
  onCollapseAll: () => void;
  onExpandAll: () => void;
};

/**
 * Controls for sorting, grouping, filtering, and card-field toggles.
 *
 * Collapses on mobile behind a "Filters & display" button.
 */
export function BookGridControls({
  areControlsOpen,
  onToggleControls,
  isDisplayOpen,
  onToggleDisplay,
  cardFields,
  onToggleCardField,
  sort,
  onSortChange,
  sortItems,
  groupBy,
  onGroupByChange,
  groupItems,
  filter,
  onFilterChange,
  filterItems,
  showGroupActions,
  onCollapseAll,
  onExpandAll,
}: BookGridControlsProps) {
  const t = useTranslations("book");
  const tCommon = useTranslations("common");

  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="inline-flex w-full md:hidden"
          onClick={onToggleControls}
        >
          <span>{t("filtersButton")}</span>
          <RiFilterLine />
        </Button>

        <div className={cn(areControlsOpen ? "block" : "hidden", "md:block")}>
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
            <Popover
              open={isDisplayOpen}
              onOpenChange={(open) => {
                if (open !== isDisplayOpen) onToggleDisplay();
              }}
            >
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full md:w-auto"
                  />
                }
              >
                {t("cardDisplay")}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56">
                <div className="space-y-2">
                  {cardFieldKeys.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={cardFields[item.key]}
                        onCheckedChange={() => onToggleCardField(item.key)}
                      />
                      {t(item.labelKey)}
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Select
              items={sortItems}
              value={sort}
              onValueChange={(value) => onSortChange(value as SortOption)}
            >
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder={tCommon("sort")} />
              </SelectTrigger>
              <SelectContent>
                {sortItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <span className="text-sm text-muted-foreground">
                {t("groupingLabel")}
              </span>
              <Select
                items={groupItems}
                value={groupBy}
                onValueChange={(value) => onGroupByChange(value as GroupOption)}
              >
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder={t("groupBy")} />
                </SelectTrigger>
                <SelectContent>
                  {groupItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <span className="text-sm text-muted-foreground">
                {t("filteringLabel")}
              </span>
              <Select
                items={filterItems}
                value={filter}
                onValueChange={(value) => onFilterChange(value as FilterStatus)}
              >
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder={t("filterBy")} />
                </SelectTrigger>
                <SelectContent>
                  {filterItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showGroupActions && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full md:w-auto"
                  onClick={onCollapseAll}
                >
                  {t("groupCollapseAll")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full md:w-auto"
                  onClick={onExpandAll}
                >
                  {t("groupExpandAll")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
