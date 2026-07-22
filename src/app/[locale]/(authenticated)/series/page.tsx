"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  RiArrowRightSLine,
  RiBookOpenLine,
  RiDeleteBinLine,
  RiEditLine,
  RiMore2Line,
} from "@remixicon/react";

import { CreateSeriesDialog } from "@/components/series/create-series-dialog";
import { BookCover } from "@/components/ui/book-cover";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPageText,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination";
import { Link, useRouter } from "@/i18n/routing";
import type { PageResult } from "@/types/pagination";

type Series = {
  id: string;
  name: string;
  slug: string;
  _count: { books: number };
  books: Array<{ id: string; title: string; coverUrl: string | null }>;
};

export default function SeriesPage() {
  const t = useTranslations("series");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const router = useRouter();

  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalSeries, setTotalSeries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 24;

  const [editTarget, setEditTarget] = useState<Series | null>(null);
  const [editName, setEditName] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Series | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSeries = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/series?page=${page}&pageSize=${pageSize}`,
          signal ? { signal } : undefined
        );
        if (response.ok) {
          const data = (await response.json()) as PageResult<Series>;
          setSeries(data.items);
          setTotalSeries(data.total);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch series:", error);
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize]
  );

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    fetchSeries(controller.signal).catch((error) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (isActive) {
        console.error("Failed to fetch series:", error);
      }
    });
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [fetchSeries]);

  const openEdit = (item: Series) => {
    setEditTarget(item);
    setEditName(item.name);
  };

  const handleEdit = async () => {
    if (!editTarget || !editName.trim()) return;
    setEditSaving(true);
    try {
      const response = await fetch(`/api/series/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (response.ok) {
        const updated = await response.json();
        setSeries((prev) =>
          prev.map((item) =>
            item.id === editTarget.id
              ? { ...item, name: updated.name, slug: updated.slug }
              : item
          )
        );
        setEditTarget(null);
      }
    } catch (error) {
      console.error("Failed to update series:", error);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/series/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setDeleteTarget(null);
        await fetchSeries();
      }
    } catch (error) {
      console.error("Failed to delete series:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {tNav("series")}
        </h1>
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          {t("create")}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">{tCommon("loading")}</p>
      ) : series.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10">
            <RiBookOpenLine className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">{t("empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {series.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between gap-4">
                  <Link
                    href={`/series/${item.slug}`}
                    className="flex min-w-0 flex-1 items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("booksCount", { count: item._count.books })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.books.length > 0 && (
                        <div className="hidden gap-2 sm:flex">
                          {item.books.map((book) => (
                            <div key={book.id} className="w-[52px]">
                              <BookCover
                                coverUrl={book.coverUrl}
                                title={book.title}
                                size="xs"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <RiArrowRightSLine className="size-5 shrink-0 text-muted-foreground" />
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("actions")}
                        />
                      }
                    >
                      <RiMore2Line />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/series/${item.slug}`)}
                      >
                        {t("view")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(item)}>
                        <RiEditLine />
                        {tCommon("edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <RiDeleteBinLine />
                        {tCommon("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <PaginationRoot
                count={totalSeries}
                pageSize={pageSize}
                page={page}
                onPageChange={(e) => setPage(e.page)}
              >
                <PaginationPrevTrigger />
                <PaginationPageText className="px-1" />
                <PaginationItems />
                <PaginationNextTrigger />
              </PaginationRoot>
            </div>
          )}
        </div>
      )}

      <CreateSeriesDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={() => {
          fetchSeries();
        }}
      />

      <Dialog
        open={!!editTarget}
        onOpenChange={(next) => !next && setEditTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-series-name">{t("namePlaceholder")}</Label>
            <Input
              id="edit-series-name"
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
              onClick={() => setEditTarget(null)}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="button" onClick={handleEdit} disabled={editSaving}>
              {editSaving ? tCommon("loading") : tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm", {
                count: deleteTarget?._count.books ?? 0,
              })}
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
