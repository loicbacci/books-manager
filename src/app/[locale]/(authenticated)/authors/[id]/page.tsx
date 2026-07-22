"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  RiArrowLeftLine,
  RiBookOpenLine,
  RiDeleteBinLine,
  RiEditLine,
} from "@remixicon/react";

import { EditAuthorDialog } from "@/components/authors/edit-author-dialog";
import { useSetPageBreadcrumbs } from "@/components/layout/page-header-context";
import { BookGridBook, BookGridView, slimBookGridFields } from "@/components/books/book-grid";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "@/i18n/routing";

type Author = {
  id: string;
  name: string;
  gender: { id: string; name: string } | null;
  nationalities: Array<{ nationality: { id: string; name: string } }>;
  books: BookGridBook[];
};

export default function AuthorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("author");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const pageBreadcrumbs = useMemo(
    () =>
      author
        ? [
            { label: tNav("authors"), href: "/authors" },
            { label: author.name },
          ]
        : null,
    [author, tNav]
  );
  useSetPageBreadcrumbs(pageBreadcrumbs);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    async function fetchAuthor() {
      try {
        const response = await fetch(`/api/authors/${id}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          if (isActive) {
            setAuthor(data);
          }
        } else if (response.status === 404) {
          router.push("/authors");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch author:", error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchAuthor();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [id, router]);

  const handleDelete = async () => {
    if (!author) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/authors/${author.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.push("/authors");
      }
    } catch (error) {
      console.error("Failed to delete author:", error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">{tCommon("loading")}</p>
      </div>
    );
  }

  if (!author) {
    return null;
  }

  const bookCount = author.books.length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/authors")}
        >
          <RiArrowLeftLine />
          {tNav("authors")}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditOpen(true)}
          >
            <RiEditLine />
            {tCommon("edit")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
          >
            <RiDeleteBinLine />
            {tCommon("delete")}
          </Button>
        </div>
      </div>

      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {author.name}
        </h1>
        <div className="mt-2 flex flex-wrap gap-2">
          {author.gender && (
            <Badge variant="secondary">
              {t("gender")}: {author.gender.name}
            </Badge>
          )}
          {author.nationalities.map((entry) => (
            <Badge key={entry.nationality.id} variant="outline">
              {t("nationality")}: {entry.nationality.name}
            </Badge>
          ))}
        </div>
      </div>

      {author.books.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10">
            <RiBookOpenLine className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">{t("emptyBooks")}</p>
          </CardContent>
        </Card>
      ) : (
        <BookGridView
          books={author.books}
          defaultFields={slimBookGridFields}
          cookieKey="authorBooksViewPrefs"
        />
      )}

      <EditAuthorDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        author={author}
        onUpdated={(updated) => {
          setAuthor((prev) =>
            prev
              ? {
                  ...prev,
                  name: updated.name,
                  gender: updated.gender,
                  nationalities: updated.nationalities,
                }
              : prev
          );
        }}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm", { count: bookCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? tCommon("loading") : tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
