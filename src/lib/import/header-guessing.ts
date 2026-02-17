export type FieldKey =
  | "title"
  | "authors"
  | "totalPages"
  | "currentPage"
  | "rating"
  | "summary"
  | "favoriteQuote"
  | "favoriteMoment"
  | "startDate"
  | "endDate"
  | "genre"
  | "status"
  | "format";

export type ReadingStatus = "TO_READ" | "READING" | "READ" | "DROPPED";

export const normalizeHeader = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");

export const guessFieldFromHeader = (header: string): FieldKey | null => {
  const normalized = normalizeHeader(header);
  if (!normalized) return null;
  if (/(title|titre)/.test(normalized)) return "title";
  if (/(author|authors|auteur|autrice|auteure|auteurs|auteurices)/.test(
    normalized
  )) {
    return "authors";
  }
  if (
    /pages|page|nombre de pages|nb pages|total pages|total des pages|nombre total de pages/.test(
      normalized
    )
  ) {
    return "totalPages";
  }
  if (
    /current page|page actuelle|page en cours|page courante|progress|avancement/.test(
      normalized
    )
  ) {
    return "currentPage";
  }
  if (/(rating|note|notes|score|etoiles|classement)/.test(normalized)) {
    return "rating";
  }
  if (
    /summary|resume|description|synopsis|resume court|resume bref/.test(
      normalized
    )
  ) {
    return "summary";
  }
  if (/(quote|citation|citations|extrait)/.test(normalized)) {
    return "favoriteQuote";
  }
  if (/(moment|passage|extrait prefere|extrait favori)/.test(normalized)) {
    return "favoriteMoment";
  }
  if (
    /start date|date de debut|date debut|started|debut lecture/.test(normalized)
  ) {
    return "startDate";
  }
  if (
    /end date|date de fin|finished|ended|fin lecture|termine|date fin/.test(
      normalized
    )
  ) {
    return "endDate";
  }
  if (/(genre|genres|categorie|categories)/.test(normalized)) {
    return "genre";
  }
  if (
    /status|reading status|statut|statut lecture|etat|etat lecture/.test(
      normalized
    )
  ) {
    return "status";
  }
  if (/(format|support|media|book format|format livre)/.test(normalized)) {
    return "format";
  }
  return null;
};

export const guessStatusFromValue = (value: string): ReadingStatus | null => {
  const normalized = normalizeHeader(value);
  if (!normalized) return null;
  if (/to read|toread|a lire|to-read|wishlist|envie/.test(normalized)) {
    return "TO_READ";
  }
  if (/reading|en cours|lecture|en lecture/.test(normalized)) {
    return "READING";
  }
  if (/read|finished|termine|terminee|lu|acheve/.test(normalized)) {
    return "READ";
  }
  if (/dropped|abandon|abandonne|abandonnee|arrete|stop/.test(normalized)) {
    return "DROPPED";
  }
  return null;
};
