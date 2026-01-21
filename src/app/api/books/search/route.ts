import { NextResponse } from "next/server";
import { searchBooks } from "@/lib/book-metadata";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const results = await searchBooks(query);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching books:", error);
    return NextResponse.json(
      { error: "Failed to search books" },
      { status: 500 }
    );
  }
}
