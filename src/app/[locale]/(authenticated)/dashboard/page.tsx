"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  RiBookLine,
  RiBookOpenLine,
  RiCloseLine,
  RiFileTextLine,
  RiHeartLine,
  RiLoaderLine,
} from "@remixicon/react";

import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StarRating } from "@/components/books/star-rating";
import { cn } from "@/lib/utils";

type CurrentlyReadingBook = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  currentPage: number;
  totalPages: number | null;
  authors: string[];
  progress: number;
};

type MiniBook = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  status: string;
  rating: number | null;
  authors: string[];
};

type Stats = {
  booksReading: number;
  booksReadThisYear: number;
  booksReadThisMonth: number;
  pagesReadThisYear: number;
  pagesReadThisMonth: number;
  wishlistCount: number;
  currentlyReading: CurrentlyReadingBook[];
  wishlistBooks: MiniBook[];
  recentFinishedBooks: MiniBook[];
};

export default function DashboardPage() {
  const tStats = useTranslations("stats");
  const tBook = useTranslations("book");
  const tCommon = useTranslations("common");

  const [stats, setStats] = useState<Stats | null>(null);
  const [wishlistBooks, setWishlistBooks] = useState<MiniBook[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    async function fetchStats() {
      try {
        const response = await fetch("/api/stats", {
          signal: controller.signal,
        });
        if (response.ok) {
          const data: Stats = await response.json();
          if (isActive) {
            setStats(data);
            setWishlistBooks(data.wishlistBooks);
            setWishlistCount(data.wishlistCount);
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch stats:", error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }
    fetchStats();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const handleRemoveFromWishlist = async (book: MiniBook) => {
    setWishlistBooks((prev) => prev.filter((b) => b.id !== book.id));
    setWishlistCount((prev) => Math.max(0, prev - 1));

    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isWishlist: false }),
      });
      if (!response.ok) {
        throw new Error("Request failed");
      }
      toast.success(tBook("removedFromWishlist"));
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
      // Roll back the optimistic update on failure.
      setWishlistBooks((prev) => [book, ...prev]);
      setWishlistCount((prev) => prev + 1);
      toast.error(tCommon("saveFailed"));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RiLoaderLine className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* KPI summary cards — 4 only */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={RiBookOpenLine}
          label={tStats("booksRead")}
          subLabel={tStats("thisYear")}
          value={stats?.booksReadThisYear ?? 0}
        />
        <KpiCard
          icon={RiBookLine}
          label={tStats("booksReading")}
          value={stats?.booksReading ?? 0}
        />
        <KpiCard
          icon={RiFileTextLine}
          label={tStats("pagesRead")}
          subLabel={tStats("thisYear")}
          value={stats?.pagesReadThisYear ?? 0}
        />
        <KpiCard
          icon={RiHeartLine}
          label={tBook("wishlist")}
          value={wishlistCount}
        />
      </div>

      {stats?.currentlyReading && stats.currentlyReading.length > 0 && (
        <Button
          size="lg"
          className="w-full sm:w-auto"
          render={
            <Link href={`/books/${stats.currentlyReading[0].slug}`} />
          }
          nativeButton={false}
        >
          <RiBookOpenLine />
          {tBook("continueReading", { title: stats.currentlyReading[0].title })}
        </Button>
      )}

      {/* Currently reading — always visible */}
      <Card>
        <CardHeader>
          <CardTitle>{tStats("booksReading")}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.currentlyReading && stats.currentlyReading.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stats.currentlyReading.map((book) => (
                <Link
                  key={book.id}
                  href={`/books/${book.slug}`}
                  className="flex gap-3 rounded-2xl p-3 ring-1 ring-foreground/5 transition hover:bg-muted/60"
                >
                  <MiniCover
                    coverUrl={book.coverUrl}
                    title={book.title}
                    className="w-16 shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="line-clamp-2 text-sm font-medium">
                        {book.title}
                      </p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {book.authors.join(", ") || tBook("unknownAuthor")}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{tBook("progress")}</span>
                        <span className="font-medium text-foreground">
                          {book.progress}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {book.currentPage} / {book.totalPages ?? "?"}{" "}
                        {tBook("pages")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={RiBookLine}
              text={tBook("currentlyReadingEmpty")}
              actionHref="/library"
              actionLabel={tBook("addBook")}
            />
          )}
        </CardContent>
      </Card>

      {/* Wishlist */}
      <Card>
        <CardHeader>
          <CardTitle>{tBook("wishlist")}</CardTitle>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/library?wishlist=1" />}
              nativeButton={false}
            >
              {tCommon("viewAll")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {wishlistBooks.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {wishlistBooks.map((book) => (
                <div key={book.id} className="group relative">
                  <button
                    type="button"
                    aria-label={tBook("removeFromWishlist")}
                    onClick={() => handleRemoveFromWishlist(book)}
                    className="absolute top-1.5 right-1.5 z-10 flex size-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm ring-1 ring-foreground/10 transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <RiCloseLine className="size-3.5" />
                  </button>
                  <Link
                    href={`/books/${book.slug}`}
                    className="block space-y-2 rounded-2xl p-2 ring-1 ring-foreground/5 transition hover:bg-muted/60"
                  >
                    <MiniCover coverUrl={book.coverUrl} title={book.title} />
                    <div>
                      <p className="line-clamp-2 text-sm font-medium">
                        {book.title}
                      </p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {book.authors.join(", ") || tBook("unknownAuthor")}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={RiHeartLine}
              text={tBook("noBooks")}
              actionHref="/library"
              actionLabel={tBook("addBook")}
            />
          )}
        </CardContent>
      </Card>

      {/* Recently finished */}
      <Card>
        <CardHeader>
          <CardTitle>{tStats("recentFinished")}</CardTitle>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/library" />}
              nativeButton={false}
            >
              {tCommon("viewAll")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {stats?.recentFinishedBooks && stats.recentFinishedBooks.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {stats.recentFinishedBooks.map((book) => (
                <Link
                  key={book.id}
                  href={`/books/${book.slug}`}
                  className="block space-y-2 rounded-2xl p-2 ring-1 ring-foreground/5 transition hover:bg-muted/60"
                >
                  <MiniCover coverUrl={book.coverUrl} title={book.title} />
                  <div>
                    <p className="line-clamp-2 text-sm font-medium">
                      {book.title}
                    </p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {book.authors.join(", ") || tBook("unknownAuthor")}
                    </p>
                  </div>
                  {book.rating != null && (
                    <StarRating value={book.rating} readOnly size={12} />
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={RiBookOpenLine}
              text={tBook("noBooks")}
              actionHref="/library"
              actionLabel={tBook("addBook")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  subLabel,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  subLabel?: string;
  value: number;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <Icon className="size-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-xl font-semibold leading-tight">
            {value.toLocaleString()}
          </p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          {subLabel && (
            <p className="truncate text-xs text-muted-foreground">
              {subLabel}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniCover({
  coverUrl,
  title,
  className,
}: {
  coverUrl: string | null;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted",
        className
      )}
    >
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={title}
          fill
          sizes="200px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <RiBookLine className="size-6" />
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  text,
  actionHref,
  actionLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <Icon className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{text}</p>
      <Button render={<Link href={actionHref} />} nativeButton={false}>
        {actionLabel}
      </Button>
    </div>
  );
}
