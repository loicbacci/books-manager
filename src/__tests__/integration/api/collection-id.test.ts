/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import {
  PATCH as patchFormat,
  DELETE as deleteFormat,
} from "@/app/api/formats/[id]/route";
import {
  PATCH as patchGenre,
  DELETE as deleteGenre,
} from "@/app/api/genres/[id]/route";
import {
  PATCH as patchGender,
  DELETE as deleteGender,
} from "@/app/api/genders/[id]/route";
import {
  PATCH as patchNationality,
  DELETE as deleteNationality,
} from "@/app/api/nationalities/[id]/route";

const mockAuth = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    format: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    genre: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    gender: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    nationality: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const getDb = () =>
  (jest.requireMock("@/lib/db") as {
    db: {
      format: { findFirst: jest.Mock; update: jest.Mock; delete: jest.Mock };
      genre: { findFirst: jest.Mock; update: jest.Mock; delete: jest.Mock };
      gender: { findFirst: jest.Mock; update: jest.Mock; delete: jest.Mock };
      nationality: { findFirst: jest.Mock; update: jest.Mock; delete: jest.Mock };
    };
  }).db;

const patchRequest = (body: object) =>
  new NextRequest("http://localhost/api/item", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

const params = { params: Promise.resolve({ id: "item-1" }) };

const resources = () => [
  {
    label: "formats",
    patch: patchFormat,
    del: deleteFormat,
    model: getDb().format,
    validBody: { name: "Hardcover", icon: "book" },
    countKey: "books",
  },
  {
    label: "genres",
    patch: patchGenre,
    del: deleteGenre,
    model: getDb().genre,
    validBody: { name: "Fantasy", color: "blue" },
    countKey: "books",
  },
  {
    label: "genders",
    patch: patchGender,
    del: deleteGender,
    model: getDb().gender,
    validBody: { name: "Woman", color: "pink" },
    countKey: "authors",
  },
  {
    label: "nationalities",
    patch: patchNationality,
    del: deleteNationality,
    model: getDb().nationality,
    validBody: { name: "French", color: "blue" },
    countKey: "authors",
  },
];

describe("collection [id] routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  for (const resource of resources()) {
    describe(resource.label, () => {
      it("returns 401 when unauthorized", async () => {
        mockAuth.mockResolvedValue(null);

        expect((await resource.patch(patchRequest(resource.validBody), params)).status).toBe(401);
        expect((await resource.del(patchRequest({}), params)).status).toBe(401);
      });

      it("updates when input is valid", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        resource.model.findFirst.mockResolvedValue({ id: "item-1" });
        resource.model.update.mockResolvedValue({ id: "item-1" });

        const response = await resource.patch(
          patchRequest(resource.validBody),
          params
        );

        expect(response.status).toBe(200);
        expect(resource.model.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: "item-1" },
          })
        );
      });

      it("returns 400 for invalid input", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });

        const response = await resource.patch(patchRequest({}), params);

        expect(response.status).toBe(400);
      });

      it("returns 404 when item not found", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        resource.model.findFirst.mockResolvedValue(null);

        const response = await resource.del(patchRequest({}), params);

        expect(response.status).toBe(404);
      });

      it("returns 400 when item is in use", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        resource.model.findFirst.mockResolvedValue({
          id: "item-1",
          _count: { [resource.countKey]: 1 },
        });

        const response = await resource.del(patchRequest({}), params);

        expect(response.status).toBe(400);
      });

      it("deletes when item is unused", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        resource.model.findFirst.mockResolvedValue({
          id: "item-1",
          _count: { [resource.countKey]: 0 },
        });

        const response = await resource.del(patchRequest({}), params);

        expect(response.status).toBe(200);
        expect(resource.model.delete).toHaveBeenCalledWith({
          where: { id: "item-1" },
        });
      });
    });
  }
});
