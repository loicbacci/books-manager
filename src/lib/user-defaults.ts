import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type DbClient = Prisma.TransactionClient | typeof db;

const DEFAULT_FORMATS = [
  { name: "Book", icon: "book", isDefault: true },
  { name: "Audiobook", icon: "headphones", isDefault: true },
  { name: "E-book", icon: "tablet", isDefault: true },
  { name: "Wattpad", icon: "smartphone", isDefault: true },
];

const DEFAULT_GENDERS = [
  { name: "Man" },
  { name: "Woman" },
  { name: "Non-binary" },
  { name: "Other" },
];

const DEFAULT_GENRES = [
  { name: "Fiction", color: "#3B82F6" },
  { name: "Non-Fiction", color: "#10B981" },
  { name: "Fantasy", color: "#8B5CF6" },
  { name: "Science Fiction", color: "#06B6D4" },
  { name: "Mystery", color: "#F59E0B" },
  { name: "Thriller", color: "#EF4444" },
  { name: "Romance", color: "#EC4899" },
  { name: "Horror", color: "#1F2937" },
  { name: "Biography", color: "#6366F1" },
  { name: "History", color: "#84CC16" },
  { name: "Self-Help", color: "#F97316" },
  { name: "Poetry", color: "#A855F7" },
  { name: "Young Adult", color: "#14B8A6" },
  { name: "Children", color: "#FBBF24" },
  { name: "Graphic Novel", color: "#E11D48" },
];

const DEFAULT_NATIONALITIES = [
  { name: "American", code: "US" },
  { name: "British", code: "GB" },
  { name: "French", code: "FR" },
  { name: "German", code: "DE" },
  { name: "Canadian", code: "CA" },
  { name: "Australian", code: "AU" },
  { name: "Japanese", code: "JP" },
  { name: "Spanish", code: "ES" },
  { name: "Italian", code: "IT" },
  { name: "Russian", code: "RU" },
];

export async function createUserDefaults(
  userId: string,
  client: DbClient = db
) {
  await Promise.all([
    // Create default formats
    client.format.createMany({
      data: DEFAULT_FORMATS.map((format) => ({
        ...format,
        userId,
      })),
    }),
    // Create default genders
    client.gender.createMany({
      data: DEFAULT_GENDERS.map((gender) => ({
        ...gender,
        userId,
      })),
    }),
    // Create default genres
    client.genre.createMany({
      data: DEFAULT_GENRES.map((genre) => ({
        ...genre,
        userId,
      })),
    }),
    // Create default nationalities
    client.nationality.createMany({
      data: DEFAULT_NATIONALITIES.map((nationality) => ({
        ...nationality,
        userId,
      })),
    }),
  ]);
}
