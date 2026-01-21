/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET as getAuthors, POST as postAuthors } from "@/app/api/authors/route";
import { GET as getFormats, POST as postFormats } from "@/app/api/formats/route";
import { GET as getGenres, POST as postGenres } from "@/app/api/genres/route";
import { GET as getGenders, POST as postGenders } from "@/app/api/genders/route";
import {
  GET as getNationalities,
  POST as postNationalities,
} from "@/app/api/nationalities/route";
import { GET as getSeries, POST as postSeries } from "@/app/api/series/route";

const mockAuth = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    author: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    format: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    genre: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    gender: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    nationality: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    series: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/slugify", () => ({
  generateUniqueSlug: jest.fn(),
}));

const getDb = () =>
  (jest.requireMock("@/lib/db") as {
    db: {
      author: { findMany: jest.Mock; create: jest.Mock };
      format: { findMany: jest.Mock; create: jest.Mock };
      genre: { findMany: jest.Mock; create: jest.Mock };
      gender: { findMany: jest.Mock; create: jest.Mock };
      nationality: { findMany: jest.Mock; create: jest.Mock };
      series: { findMany: jest.Mock; create: jest.Mock };
    };
  }).db;

const getSlugifyMock = () =>
  (jest.requireMock("@/lib/slugify") as {
    generateUniqueSlug: jest.Mock;
  }).generateUniqueSlug;

const jsonRequest = (url: string, body: object) =>
  new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

describe("collection routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 for unauthorized collection GETs", async () => {
    mockAuth.mockResolvedValue(null);

    expect((await getAuthors()).status).toBe(401);
    expect((await getFormats()).status).toBe(401);
    expect((await getGenres()).status).toBe(401);
    expect((await getGenders()).status).toBe(401);
    expect((await getNationalities()).status).toBe(401);
    expect((await getSeries()).status).toBe(401);
  });

  it("lists authors for the current user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    db.author.findMany.mockResolvedValue([{ id: "a1" }]);

    const response = await getAuthors();

    expect(response.status).toBe(200);
    expect(getDb().author.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
      })
    );
  });

  it("creates an author and validates input", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().author.create.mockResolvedValue({ id: "a1" });

    const okResponse = await postAuthors(
      jsonRequest("http://localhost/api/authors", {
        name: "Author",
        genderId: "gender-1",
        nationalityId: "nat-1",
      })
    );
    expect(okResponse.status).toBe(201);

    const badResponse = await postAuthors(
      jsonRequest("http://localhost/api/authors", {})
    );
    expect(badResponse.status).toBe(400);
  });

  it("lists formats and creates a format", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    db.format.findMany.mockResolvedValue([{ id: "f1" }]);
    db.format.create.mockResolvedValue({ id: "f1" });

    expect((await getFormats()).status).toBe(200);
    expect(
      await postFormats(
        jsonRequest("http://localhost/api/formats", { name: "Paper" })
      )
    ).toHaveProperty("status", 201);
  });

  it("validates format input", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const response = await postFormats(
      jsonRequest("http://localhost/api/formats", {})
    );

    expect(response.status).toBe(400);
  });

  it("lists genres and creates a genre", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    db.genre.findMany.mockResolvedValue([{ id: "g1" }]);
    db.genre.create.mockResolvedValue({ id: "g1" });

    expect((await getGenres()).status).toBe(200);
    expect(
      await postGenres(
        jsonRequest("http://localhost/api/genres", {
          name: "Fantasy",
          color: "blue",
        })
      )
    ).toHaveProperty("status", 201);
  });

  it("validates genre input", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const response = await postGenres(
      jsonRequest("http://localhost/api/genres", {})
    );

    expect(response.status).toBe(400);
  });

  it("lists genders and creates a gender", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    db.gender.findMany.mockResolvedValue([{ id: "g1" }]);
    db.gender.create.mockResolvedValue({ id: "g1" });

    expect((await getGenders()).status).toBe(200);
    expect(
      await postGenders(
        jsonRequest("http://localhost/api/genders", {
          name: "Woman",
          color: "pink",
        })
      )
    ).toHaveProperty("status", 201);
  });

  it("validates gender input", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const response = await postGenders(
      jsonRequest("http://localhost/api/genders", {})
    );

    expect(response.status).toBe(400);
  });

  it("lists nationalities and creates a nationality", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    db.nationality.findMany.mockResolvedValue([{ id: "n1" }]);
    db.nationality.create.mockResolvedValue({ id: "n1" });

    expect((await getNationalities()).status).toBe(200);
    expect(
      await postNationalities(
        jsonRequest("http://localhost/api/nationalities", {
          name: "French",
          code: "FR",
          color: "blue",
        })
      )
    ).toHaveProperty("status", 201);
  });

  it("validates nationality input", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const response = await postNationalities(
      jsonRequest("http://localhost/api/nationalities", {})
    );

    expect(response.status).toBe(400);
  });

  it("lists series and creates a series", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    db.series.findMany.mockResolvedValue([{ id: "s1" }]);
    db.series.create.mockResolvedValue({ id: "s1" });
    getSlugifyMock().mockResolvedValue("series-slug");

    expect((await getSeries()).status).toBe(200);

    const response = await postSeries(
      jsonRequest("http://localhost/api/series", { name: "Series" })
    );

    expect(response.status).toBe(201);
    expect(getDb().series.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Series",
          slug: "series-slug",
        }),
      })
    );
  });

  it("validates series input", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const response = await postSeries(
      jsonRequest("http://localhost/api/series", {})
    );

    expect(response.status).toBe(400);
  });
});
