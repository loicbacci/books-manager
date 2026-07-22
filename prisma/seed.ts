import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { slugify } from "../src/lib/slugify";
const prisma = new PrismaClient();

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

async function createUserDefaults(userId: string) {
  await Promise.all([
    prisma.format.createMany({
      data: DEFAULT_FORMATS.map((format) => ({ ...format, userId })),
      skipDuplicates: true,
    }),
    prisma.gender.createMany({
      data: DEFAULT_GENDERS.map((gender) => ({ ...gender, userId })),
      skipDuplicates: true,
    }),
    prisma.genre.createMany({
      data: DEFAULT_GENRES.map((genre) => ({ ...genre, userId })),
      skipDuplicates: true,
    }),
    prisma.nationality.createMany({
      data: DEFAULT_NATIONALITIES.map((nat) => ({ ...nat, userId })),
      skipDuplicates: true,
    }),
  ]);
}

async function upsertAuthor(params: {
  userId: string;
  name: string;
  genderId?: string;
  nationalityIds?: string[];
}) {
  const { userId, name, genderId, nationalityIds = [] } = params;
  const author = await prisma.author.upsert({
    where: { userId_name: { userId, name } },
    update: { genderId },
    create: {
      userId,
      name,
      genderId,
      nationalities: {
        create: nationalityIds.map((nationalityId) => ({
          nationalityId,
        })),
      },
    } as any,
  });
  await (prisma as any).authorNationality.deleteMany({
    where: { authorId: author.id },
  });
  if (nationalityIds.length > 0) {
    await (prisma as any).authorNationality.createMany({
      data: nationalityIds.map((nationalityId) => ({
        authorId: author.id,
        nationalityId,
      })),
      skipDuplicates: true,
    });
  }
  return author;
}

async function upsertSeries(params: { userId: string; name: string }) {
  const { userId, name } = params;
  const slug = slugify(name);
  return prisma.series.upsert({
    where: { userId_name: { userId, name } },
    update: { slug },
    create: { userId, name, slug },
  });
}

async function main() {
  console.log("🌱 Starting database seed...");

  // Check if demo user already exists
  let user = await prisma.user.findUnique({
    where: { email: "demo@example.com" },
  });

  if (user) {
    console.log(`Demo user already exists: ${user.email}`);
  } else {
    // Create demo user
    const hashedPassword = await hash("password123", 12);
    user = await prisma.user.create({
      data: {
        email: "demo@example.com",
        hashedPassword,
        name: "Demo User",
        locale: "en",
      },
    });

    console.log(`✅ Created demo user: ${user.email}`);
  }

  // Create defaults
  await createUserDefaults(user.id);
  console.log("✅ Created default formats, genders, genres, and nationalities");

  // Get created entities for reference
  const [formats, genders, genres, nationalities] = await Promise.all([
    prisma.format.findMany({ where: { userId: user.id } }),
    prisma.gender.findMany({ where: { userId: user.id } }),
    prisma.genre.findMany({ where: { userId: user.id } }),
    prisma.nationality.findMany({ where: { userId: user.id } }),
  ]);

  const bookFormat = formats.find((f) => f.name === "Book")!;
  const ebookFormat = formats.find((f) => f.name === "E-book")!;
  const audiobookFormat = formats.find((f) => f.name === "Audiobook")!;

  const manGender = genders.find((g) => g.name === "Man")!;
  const womanGender = genders.find((g) => g.name === "Woman")!;

  const fictionGenre = genres.find((g) => g.name === "Fiction")!;
  const fantasyGenre = genres.find((g) => g.name === "Fantasy")!;
  const sciFiGenre = genres.find((g) => g.name === "Science Fiction")!;
  const mysteryGenre = genres.find((g) => g.name === "Mystery")!;
  const romanceGenre = genres.find((g) => g.name === "Romance")!;
  const nonFictionGenre = genres.find((g) => g.name === "Non-Fiction")!;
  const graphicNovelGenre = genres.find((g) => g.name === "Graphic Novel")!;
  const youngAdultGenre = genres.find((g) => g.name === "Young Adult")!;
  const poetryGenre = genres.find((g) => g.name === "Poetry")!;

  const frenchNat = nationalities.find((n) => n.name === "French")!;
  const japaneseNat = nationalities.find((n) => n.name === "Japanese")!;
  const americanNat = nationalities.find((n) => n.name === "American")!;
  const australianNat = nationalities.find((n) => n.name === "Australian")!;

  // Create authors
  const nicolasMathieu = await upsertAuthor({
    name: "Nicolas Mathieu",
    userId: user.id,
    genderId: manGender.id,
    nationalityIds: [frenchNat.id],
  });
  const lynetteNoni = await upsertAuthor({
    name: "Lynette Noni",
    userId: user.id,
    genderId: womanGender.id,
    nationalityIds: [australianNat.id],
  });
  const sabrinaErinGin = await upsertAuthor({
    name: "Sabrina Erin Gin",
    userId: user.id,
    genderId: womanGender.id,
    nationalityIds: [frenchNat.id],
  });
  const harperLee = await upsertAuthor({
    name: "Harper Lee",
    userId: user.id,
    genderId: womanGender.id,
    nationalityIds: [americanNat.id],
  });
  const hollyBlack = await upsertAuthor({
    name: "Holly Black",
    userId: user.id,
    genderId: womanGender.id,
    nationalityIds: [americanNat.id],
  });
  const gengorohTagame = await upsertAuthor({
    name: "Gengoroh Tagame",
    userId: user.id,
    genderId: manGender.id,
    nationalityIds: [japaneseNat.id],
  });
  const hitoshiIwaaki = await upsertAuthor({
    name: "Hitoshi Iwaaki",
    userId: user.id,
    genderId: manGender.id,
    nationalityIds: [japaneseNat.id],
  });
  const soleneKate = await upsertAuthor({
    name: "Solène Kate",
    userId: user.id,
    genderId: womanGender.id,
    nationalityIds: [frenchNat.id],
  });
  const tomiAdeyemi = await upsertAuthor({
    name: "Tomi Adeyemi",
    userId: user.id,
    genderId: womanGender.id,
    nationalityIds: [americanNat.id],
  });
  const caseyMcQuiston = await upsertAuthor({
    name: "Casey McQuiston",
    userId: user.id,
    genderId: womanGender.id,
    nationalityIds: [americanNat.id],
  });

  console.log("✅ Created sample authors");

  const parasiteSeries = await upsertSeries({
    name: "Parasite Kiseju",
    userId: user.id,
  });

  // Manually create curated books from Excel data
  const sampleBooks = [
    // Finished books
    {
      title: "Leurs enfants après eux",
      slug: "leurs-enfants-apres-eux",
      status: "READ" as const,
      totalPages: 432,
      currentPage: 432,
      rating: 10,
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-05-12"),
      formatId: audiobookFormat.id,
      authors: [nicolasMathieu.id],
      genres: [fictionGenre.id],
    },
    {
      title: "The prison healer : La princesse se rebelle",
      slug: "the-prison-healer-la-princesse-se-rebelle",
      status: "READ" as const,
      totalPages: 512,
      currentPage: 512,
      rating: 8,
      startDate: new Date("2025-05-27"),
      endDate: new Date("2025-05-29"),
      formatId: bookFormat.id,
      authors: [lynetteNoni.id],
      genres: [fantasyGenre.id, youngAdultGenre.id],
    },
    {
      title: "The prison healer : Le sang de la trahison",
      slug: "the-prison-healer-le-sang-de-la-trahison",
      status: "READ" as const,
      totalPages: 495,
      currentPage: 495,
      rating: 8,
      startDate: new Date("2025-05-28"),
      endDate: new Date("2025-06-05"),
      formatId: bookFormat.id,
      authors: [lynetteNoni.id],
      genres: [fantasyGenre.id, youngAdultGenre.id],
    },
    {
      title: "Les hommes ont tué l'amour",
      slug: "les-hommes-ont-tue-lamour",
      status: "READ" as const,
      totalPages: 208,
      currentPage: 208,
      rating: 10,
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      formatId: bookFormat.id,
      authors: [sabrinaErinGin.id],
      genres: [nonFictionGenre.id],
    },
    {
      title: "Ne tirez pas sur l'oiseau moqueur",
      slug: "ne-tirez-pas-sur-loiseau-moqueur",
      status: "READ" as const,
      totalPages: 448,
      currentPage: 448,
      rating: 10,
      startDate: new Date("2025-02-10"),
      endDate: new Date("2025-08-29"),
      formatId: audiobookFormat.id,
      authors: [harperLee.id],
      genres: [fictionGenre.id],
    },
    {
      title: "Au plus profond de la forêt",
      slug: "au-plus-profond-de-la-foret",
      status: "READ" as const,
      totalPages: 432,
      currentPage: 432,
      rating: 8,
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-02-04"),
      formatId: bookFormat.id,
      authors: [hollyBlack.id],
      genres: [fantasyGenre.id, youngAdultGenre.id],
    },
    {
      title: "The cruel prince : Le prince cruel",
      slug: "the-cruel-prince-le-prince-cruel",
      status: "DROPPED" as const,
      totalPages: 380,
      currentPage: 120,
      rating: 4,
      startDate: new Date("2025-03-01"),
      endDate: new Date("2025-03-05"),
      formatId: bookFormat.id,
      authors: [hollyBlack.id],
      genres: [fantasyGenre.id, youngAdultGenre.id],
    },
    {
      title: "Children of blood and bones : De sang et de rage",
      slug: "children-of-blood-and-bones-de-sang-et-de-rage",
      status: "READ" as const,
      totalPages: 560,
      currentPage: 560,
      rating: 10,
      startDate: new Date("2025-02-22"),
      endDate: new Date("2025-02-28"),
      formatId: bookFormat.id,
      authors: [tomiAdeyemi.id],
      genres: [fantasyGenre.id, youngAdultGenre.id],
    },
    {
      title: "Children of blood and bones : Les ombres de l'exil",
      slug: "children-of-blood-and-bones-les-ombres-de-lexil",
      status: "READ" as const,
      totalPages: 540,
      currentPage: 540,
      rating: 6,
      startDate: new Date("2025-03-10"),
      endDate: new Date("2025-03-20"),
      formatId: bookFormat.id,
      authors: [tomiAdeyemi.id],
      genres: [fantasyGenre.id, youngAdultGenre.id],
    },
    // Manga series - Le mari de mon frère
    {
      title: "Le mari de mon frère T1",
      slug: "le-mari-de-mon-frere-t1",
      status: "READ" as const,
      totalPages: 180,
      currentPage: 180,
      rating: 10,
      startDate: new Date("2025-10-09"),
      endDate: new Date("2025-10-09"),
      formatId: bookFormat.id,
      authors: [gengorohTagame.id],
      genres: [graphicNovelGenre.id],
    },
    {
      title: "Le mari de mon frère T2",
      slug: "le-mari-de-mon-frere-t2",
      status: "READ" as const,
      totalPages: 180,
      currentPage: 180,
      rating: 10,
      startDate: new Date("2025-10-09"),
      endDate: new Date("2025-10-09"),
      formatId: bookFormat.id,
      authors: [gengorohTagame.id],
      genres: [graphicNovelGenre.id],
    },
    // Parasite series (a few volumes)
    {
      title: "Parasite Kiseju : T1",
      slug: "parasite-kiseju-t1",
      status: "READ" as const,
      totalPages: 192,
      currentPage: 192,
      rating: 8,
      startDate: new Date("2025-11-01"),
      endDate: new Date("2025-12-12"),
      formatId: bookFormat.id,
      seriesId: parasiteSeries.id,
      seriesOrder: 1,
      authors: [hitoshiIwaaki.id],
      genres: [graphicNovelGenre.id, sciFiGenre.id],
    },
    {
      title: "Parasite Kiseju : T2",
      slug: "parasite-kiseju-t2",
      status: "READ" as const,
      totalPages: 192,
      currentPage: 192,
      rating: 8,
      startDate: new Date("2025-11-01"),
      endDate: new Date("2025-12-12"),
      formatId: bookFormat.id,
      seriesId: parasiteSeries.id,
      seriesOrder: 2,
      authors: [hitoshiIwaaki.id],
      genres: [graphicNovelGenre.id, sciFiGenre.id],
    },
    {
      title: "Parasite Kiseju : T0.5",
      slug: "parasite-kiseju-t0-5",
      status: "READ" as const,
      totalPages: 180,
      currentPage: 180,
      rating: 2,
      startDate: new Date("2025-10-20"),
      endDate: new Date("2025-10-21"),
      formatId: bookFormat.id,
      seriesId: parasiteSeries.id,
      seriesOrder: 0.5,
      authors: [hitoshiIwaaki.id],
      genres: [graphicNovelGenre.id, sciFiGenre.id],
    },
    // Currently reading
    {
      title: "Parasite Kiseju : T3",
      slug: "parasite-kiseju-t3",
      status: "READING" as const,
      totalPages: 192,
      currentPage: 95,
      formatId: bookFormat.id,
      seriesId: parasiteSeries.id,
      seriesOrder: 3,
      authors: [hitoshiIwaaki.id],
      genres: [graphicNovelGenre.id, sciFiGenre.id],
    },
    // To read
    {
      title: "Other girls",
      slug: "other-girls",
      status: "TO_READ" as const,
      totalPages: 423,
      currentPage: 0,
      formatId: bookFormat.id,
      authors: [soleneKate.id],
      genres: [romanceGenre.id, youngAdultGenre.id],
    },
    {
      title: "I kissed Shara Wheeler",
      slug: "i-kissed-shara-wheeler",
      status: "TO_READ" as const,
      totalPages: 356,
      currentPage: 0,
      formatId: bookFormat.id,
      authors: [caseyMcQuiston.id],
      genres: [romanceGenre.id, youngAdultGenre.id],
    },
    {
      title: "Children of blood and bones : D'ombre et de vengeance",
      slug: "children-of-blood-and-bones-dombre-et-de-vengeance",
      status: "TO_READ" as const,
      totalPages: 480,
      currentPage: 0,
      formatId: bookFormat.id,
      authors: [tomiAdeyemi.id],
      genres: [fantasyGenre.id, youngAdultGenre.id],
    },
    {
      title: "The stolen heir : Le trône du prisonnier",
      slug: "the-stolen-heir-le-trone-du-prisonnier",
      status: "READ" as const,
      totalPages: 512,
      currentPage: 512,
      rating: 8,
      startDate: new Date("2024-02-15"),
      endDate: new Date("2024-02-19"),
      formatId: bookFormat.id,
      authors: [hollyBlack.id],
      genres: [fantasyGenre.id, youngAdultGenre.id],
    },
    {
      title: "Book of night : Le livre de la nuit",
      slug: "book-of-night-le-livre-de-la-nuit",
      status: "TO_READ" as const,
      totalPages: 480,
      currentPage: 0,
      formatId: bookFormat.id,
      authors: [hollyBlack.id],
      genres: [fantasyGenre.id],
    },
    {
      title: "Un compte de fae moderne : l'Offrande",
      slug: "un-compte-de-fae-moderne-loffrande",
      status: "TO_READ" as const,
      totalPages: 384,
      currentPage: 0,
      formatId: bookFormat.id,
      authors: [hollyBlack.id],
      genres: [fantasyGenre.id],
    },
  ];

  const existingBooksCount = await prisma.book.count({
    where: { userId: user.id },
  });

  if (existingBooksCount > 0) {
    console.log(
      `Demo user already has ${existingBooksCount} books, skipping book seed.`
    );
  } else {
    // Create books
    for (const bookData of sampleBooks) {
      const { authors: authorIds, genres: genreIds, ...rest } = bookData;
      await prisma.book.create({
        data: {
          ...rest,
          userId: user.id,
          authors: {
            create: authorIds.map((authorId) => ({ authorId })),
          },
          genres: {
            create: genreIds.map((genreId) => ({ genreId })),
          },
        },
      });
    }

    console.log(`✅ Created ${sampleBooks.length} sample books`);
  }
  console.log("\n🎉 Database seed completed successfully!");
  console.log("\n📝 Demo credentials:");
  console.log("   Email: demo@example.com");
  console.log("   Password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
