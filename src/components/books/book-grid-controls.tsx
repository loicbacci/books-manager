import { Checkbox } from "@/components/ui/checkbox";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import {
  Box,
  Button,
  Card,
  Flex,
  ListCollection,
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { FiFilter } from "react-icons/fi";

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

type BookGridControlsProps = {
  areControlsOpen: boolean;
  onToggleControls: () => void;
  isDisplayOpen: boolean;
  onToggleDisplay: () => void;
  cardFields: BookCardFields;
  onToggleCardField: (field: keyof BookCardFields) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  sortCollection: ListCollection<SortOptionItem>;
  groupBy: GroupOption;
  onGroupByChange: (value: GroupOption) => void;
  groupCollection: ListCollection<GroupOptionItem>;
  filter: FilterStatus;
  onFilterChange: (value: FilterStatus) => void;
  filterCollection: ListCollection<FilterOptionItem>;
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
  sortCollection,
  groupBy,
  onGroupByChange,
  groupCollection,
  filter,
  onFilterChange,
  filterCollection,
  showGroupActions,
  onCollapseAll,
  onExpandAll,
}: BookGridControlsProps) {
  const t = useTranslations("book");
  const tCommon = useTranslations("common");
  const controlBg = "bg.input";
  const controlBorder = { base: "border.default", _dark: "border.default" };
  const cardBg = { base: "bg.panel", _dark: "bg.card" };

  return (
    <Card.Root bg={cardBg}>
      <Card.Body>
        <Stack gap={4}>
          <Flex
            gap={4}
            wrap="wrap"
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "center" }}
          >
            <Button
              variant="outline"
              width={{ base: "full", md: "auto" }}
              onClick={onToggleControls}
              display={{ base: "inline-flex", md: "none" }}
            >
              <Flex align="center" gap={2}>
                <Text as="span">{t("filtersButton")}</Text>
                <Box display="flex" alignItems="center">
                  <FiFilter />
                </Box>
              </Flex>
            </Button>
          </Flex>

          <Box
            display={{
              base: areControlsOpen ? "block" : "none",
              md: "block",
            }}
          >
            <Flex
              gap={4}
              wrap="wrap"
              direction={{ base: "column", md: "row" }}
              align={{ base: "stretch", md: "center" }}
            >
              <PopoverRoot
                open={isDisplayOpen}
                onOpenChange={(details) => {
                  if (details.open !== isDisplayOpen) {
                    onToggleDisplay();
                  }
                }}
                positioning={{ placement: "bottom-start" }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    width={{ base: "full", md: "auto" }}
                  >
                    {t("cardDisplay")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverBody>
                    <Stack gap={2}>
                      {[
                        { key: "cover", label: t("cardDisplayCover") },
                        { key: "title", label: t("cardDisplayTitle") },
                        { key: "author", label: t("cardDisplayAuthor") },
                        { key: "genres", label: t("cardDisplayGenres") },
                        { key: "rating", label: t("cardDisplayRating") },
                        { key: "status", label: t("cardDisplayStatus") },
                        { key: "format", label: t("cardDisplayFormat") },
                      ].map((item) => (
                        <Checkbox
                          key={item.key}
                          checked={cardFields[item.key as keyof BookCardFields]}
                          onCheckedChange={() =>
                            onToggleCardField(item.key as keyof BookCardFields)
                          }
                        >
                          {item.label}
                        </Checkbox>
                      ))}
                    </Stack>
                  </PopoverBody>
                </PopoverContent>
              </PopoverRoot>
              <SelectRoot
                collection={sortCollection}
                value={[sort]}
                onValueChange={(e) => onSortChange(e.value[0] as SortOption)}
                width={{ base: "full", md: "220px" }}
              >
                <SelectTrigger bg={controlBg} borderColor={controlBorder}>
                  <SelectValueText placeholder={tCommon("sort")} />
                </SelectTrigger>
                <SelectContent>
                  {sortCollection.items.map((item) => (
                    <SelectItem key={item.value} item={item}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
              <Flex
                align={{ base: "stretch", md: "center" }}
                gap={2}
                direction={{ base: "column", md: "row" }}
                width={{ base: "full", md: "auto" }}
              >
                <Text fontSize="sm" color="fg.muted">
                  {t("groupingLabel")}
                </Text>
                <SelectRoot
                  collection={groupCollection}
                  value={[groupBy]}
                  onValueChange={(e) =>
                    onGroupByChange(e.value[0] as GroupOption)
                  }
                  width={{ base: "full", md: "220px" }}
                >
                  <SelectTrigger bg={controlBg} borderColor={controlBorder}>
                    <SelectValueText placeholder={t("groupBy")} />
                  </SelectTrigger>
                  <SelectContent>
                    {groupCollection.items.map((item) => (
                      <SelectItem key={item.value} item={item}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </Flex>
              <Flex
                align={{ base: "stretch", md: "center" }}
                gap={2}
                direction={{ base: "column", md: "row" }}
                width={{ base: "full", md: "auto" }}
              >
                <Text fontSize="sm" color="fg.muted">
                  {t("filteringLabel")}
                </Text>
                <SelectRoot
                  collection={filterCollection}
                  value={[filter]}
                  onValueChange={(e) =>
                    onFilterChange(e.value[0] as FilterStatus)
                  }
                  width={{ base: "full", md: "220px" }}
                >
                  <SelectTrigger bg={controlBg} borderColor={controlBorder}>
                    <SelectValueText placeholder={t("filterBy")} />
                  </SelectTrigger>
                  <SelectContent>
                    {filterCollection.items.map((item) => (
                      <SelectItem key={item.value} item={item}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </Flex>
              {showGroupActions && (
                <Flex gap={2} width={{ base: "full", md: "auto" }}>
                  <Button
                    size="sm"
                    variant="outline"
                    width={{ base: "full", md: "auto" }}
                    onClick={onCollapseAll}
                  >
                    {t("groupCollapseAll")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    width={{ base: "full", md: "auto" }}
                    onClick={onExpandAll}
                  >
                    {t("groupExpandAll")}
                  </Button>
                </Flex>
              )}
            </Flex>
          </Box>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
