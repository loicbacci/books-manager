import {
    ComboboxContent,
    ComboboxControl,
    ComboboxInput,
    ComboboxItem,
    ComboboxItemText,
    ComboboxRoot,
} from "@/components/ui/combobox";
import { createListCollection } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

type Author = {
  id: string;
  name: string;
};

type AuthorSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  initialAuthors?: Author[]; // Suggesting authors already known
};

export function AuthorSelector({
  value,
  onChange,
  initialAuthors = [],
}: AuthorSelectorProps) {
  const t = useTranslations("sheetImport");
  const [items, setItems] = useState<Author[]>(initialAuthors);
  const [loading, setLoading] = useState(false);

  // Sync items when initialAuthors changes (e.g. batch fetch completes)
  // We merge/override to ensure selected item is present
  useState(() => {
     // Initial state set above
  });
  // Actually standard effect
  const [prevInitial, setPrevInitial] = useState(initialAuthors);
  if (initialAuthors !== prevInitial) {
      setItems(initialAuthors);
      setPrevInitial(initialAuthors);
  }

  const collection = createListCollection({
    items: items,
    itemToString: (item) => item.name,
    itemToValue: (item) => item.id,
  });

  const handleInputChange = useCallback(
    async (details: { inputValue: string }) => {
      const value = details.inputValue;
      if (!value || value.length < 2) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/authors?query=${encodeURIComponent(value)}&pageSize=20`
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
    },
    []
  );

  const handleValueChange = (e: { value: string[]; items: Author[] }) => {
     if (e.value.length > 0) {
         onChange(e.value[0]);
     } else {
         onChange("");
     }
  };

  return (
    <ComboboxRoot
      collection={collection}
      onInputValueChange={handleInputChange}
      onValueChange={handleValueChange}
      value={value ? [value] : []}
      selectionBehavior="replace"
      size="sm"
      width="300px"
    >
      <ComboboxControl>
        <ComboboxInput placeholder={t("searchAuthor")} />
      </ComboboxControl>
      <ComboboxContent>
        {items.map((item) => (
          <ComboboxItem key={item.id} item={item}>
            <ComboboxItemText>{item.name}</ComboboxItemText>
          </ComboboxItem>
        ))}
        {items.length === 0 && !loading && (
            <ComboboxItem item={{ id: "new", name: t("createNewAuthor") }}>
                <ComboboxItemText>{t("noResults")}</ComboboxItemText>
            </ComboboxItem>
        )}
      </ComboboxContent>
    </ComboboxRoot>
  );
}
