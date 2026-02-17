import { useEffect, useState } from "react";

export type Author = {
  id: string;
  name: string;
  gender?: { id: string; name: string } | null;
  nationalities?: Array<{ nationality: { id: string; name: string } }>;
};

export type Genre = {
  id: string;
  name: string;
};

export type Format = {
  id: string;
  name: string;
};

export function useMetadata(step: number) {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [genders, setGenders] = useState<Array<{ id: string; name: string }>>([]);
  const [nationalities, setNationalities] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [isMetaLoading, setIsMetaLoading] = useState(false);

  useEffect(() => {
    if (step < 1) return;
    
    // Prevent refetching if we already have data
    if (authors.length > 0 && genres.length > 0) return;

    const controller = new AbortController();
    let isActive = true;
    setIsMetaLoading(true);

    Promise.all([
      // fetch("/api/authors?page=1&pageSize=500", {
      //   signal: controller.signal,
      // }).then((r) => r.json()),
      fetch("/api/genders", { signal: controller.signal }).then((r) =>
        r.json()
      ),
      fetch("/api/nationalities", { signal: controller.signal }).then((r) =>
        r.json()
      ),
      fetch("/api/genres", { signal: controller.signal }).then((r) => r.json()),
      fetch("/api/formats", { signal: controller.signal }).then((r) => r.json()),
    ])
      .then(
        ([gendersData, nationalitiesData, genresData, formatsData]) => {
          if (!isActive) return;
          // const authorsItems = Array.isArray(authorsData)
          //   ? authorsData
          //   : (authorsData as PageResult<Author>).items;
          setAuthors([]); // authorsItems ?? []
          setGenders(gendersData ?? []);
          setNationalities(nationalitiesData ?? []);
          setGenres(genresData ?? []);
          setFormats(formatsData ?? []);
        }
      )
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to load metadata:", error);
      })
      .finally(() => {
        if (!isActive) return;
        setIsMetaLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [step, authors.length, genres.length]);

  return {
    authors,
    genders,
    nationalities,
    genres,
    formats,
    isMetaLoading,
  };
}
