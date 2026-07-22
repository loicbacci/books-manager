"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  RiArrowLeftLine,
  RiBookOpenLine,
  RiDeleteBinLine,
  RiEditLine,
} from "@remixicon/react";

import { BookGridBook, BookGridView, slimBookGridFields } from "@/components/books/book-grid";
import { useSetPageBreadcrumbs } from "@/components/layout/page-header-context";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/routing";

type Series = {
  id: string;
  name: string;
  slug?: string;
  books: BookGridBook[];
};

export default function SeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("series");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");

  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const pageBreadcrumbs = useMemo(
    () =>
      series
        ? [
            { label: tNav("series"), href: "/series" },
            { label: series.name },
          ]
        : null,
    [series, tNav]
  );
  useSetPageBreadcrumbs(pageBreadcrumbs);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    async function fetchSeries() {
      try {
        const response = await fetch(`/api/series/${id}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          if (isActive) {
            setSeries(data);
            setEditName(data.name);
          }
        } else if (response.status === 404) {
          router.push("/series");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch series:", error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchSeries();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [id, router]);

  const handleEdit = async () => {
    if (!series || !editName.trim()) return;
    setEditSaving(true);
    try {
      const response = await fetch(`/api/series/${series.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (response.ok) {
        const updated = await response.json();
        setSeries((prev) =>
          prev
            ? { ...prev, name: updated.name, slug: updated.slug }
            : prev
        );
        setIsEditOpen(false);
        if (updated.slug && updated.slug !== id) {
          router.replace(`/series/${updated.slug}`);
        }
      }
    } catch (error) {
      console.error("Failed to update series:", error);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!series) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/series/${series.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.push("/series");
      }
    } catch (error) {
      console.error("Failed to delete series:", error);
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

  if (!series) {
    return null;
  }

  const bookCount = series.books.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/series")}
        >
          <RiArrowLeftLine />
          {tNav("series")}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEditName(series.name);
              setIsEditOpen(true);
            }}
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
          {series.name}
        </h1>
        <p className="text-muted-foreground">
          {t("booksCount", { count: bookCount })}
        </p>
      </div>

      {series.books.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10">
            <RiBookOpenLine className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">{t("emptyBooks")}</p>
          </CardContent>
        </Card>
      ) : (
        <BookGridView
          books={series.books}
          defaultFields={slimBookGridFields}
          cookieKey={`seriesBooksViewPrefs-${series.id}`}
        />
      )}

      <Dialog
        open={isEditOpen}
        onOpenChange={(next) => !next && setIsEditOpen(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="series-edit-name">{t("namePlaceholder")}</Label>
            <Input
              id="series-edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={t("namePlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEdit();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditOpen(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="button" onClick={handleEdit} disabled={editSaving}>
              {editSaving ? tCommon("loading") : tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
