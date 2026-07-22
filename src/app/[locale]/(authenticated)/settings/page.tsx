"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  RiBookLine,
  RiGlobalLine,
  RiGroupLine,
  RiLoaderLine,
  RiLockPasswordLine,
  RiPriceTag3Line,
  RiUserLine,
} from "@remixicon/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  colorPalettes,
  resolvePalette,
  type ColorPalette,
} from "@/lib/color-palettes";

type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

type Genre = {
  id: string;
  name: string;
  color: string | null;
  _count?: { books: number };
};
type Format = { id: string; name: string; _count?: { books: number } };
type Gender = {
  id: string;
  name: string;
  color: string | null;
  _count?: { authors: number };
};
type Nationality = {
  id: string;
  name: string;
  color: string | null;
  _count?: { authors: number };
};

type EntityWithCount = { id: string; name: string; color?: string | null };
type EntityType = "genres" | "formats" | "genders" | "nationalities";

const colorSwatchClasses: Record<ColorPalette, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  cyan: "bg-cyan-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
};

function ColorSwatchPicker({
  value,
  onChange,
  label,
}: {
  value: ColorPalette;
  onChange: (color: ColorPalette) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex flex-wrap items-center gap-1.5"
    >
      {colorPalettes.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          onClick={() => onChange(color)}
          className={cn(
            "size-6 shrink-0 rounded-full transition-transform",
            colorSwatchClasses[color],
            value === color
              ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
              : "opacity-70 hover:opacity-100"
          )}
        />
      ))}
    </div>
  );
}

function EntitySection<T extends EntityWithCount>({
  items,
  hasColor,
  drafts,
  onDraftChange,
  colorDrafts,
  onColorChange,
  countOf,
  onSave,
  onDelete,
  newValue,
  onNewValueChange,
  newColor,
  onNewColorChange,
  onAdd,
  addPlaceholder,
  helpText,
  emptyText,
}: {
  items: T[];
  hasColor: boolean;
  drafts: Record<string, string>;
  onDraftChange: (id: string, value: string) => void;
  colorDrafts?: Record<string, ColorPalette>;
  onColorChange?: (id: string, color: ColorPalette) => void;
  countOf: (item: T) => number;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  newValue: string;
  onNewValueChange: (value: string) => void;
  newColor?: ColorPalette;
  onNewColorChange?: (color: ColorPalette) => void;
  onAdd: () => void;
  addPlaceholder: string;
  helpText?: string;
  emptyText: string;
}) {
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");

  return (
    <Card>
      <CardContent className="space-y-4">
        {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const blocked = countOf(item) > 0;
              const selectedColor =
                colorDrafts?.[item.id] ?? resolvePalette(item.name, item.color);

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-2xl bg-muted/40 p-2.5 sm:flex-row sm:items-center"
                >
                  <Input
                    value={drafts[item.id] ?? ""}
                    onChange={(e) => onDraftChange(item.id, e.target.value)}
                    className="sm:flex-1"
                  />
                  {hasColor && onColorChange && (
                    <ColorSwatchPicker
                      value={selectedColor}
                      onChange={(color) => onColorChange(item.id, color)}
                      label={tSettings("colorLabel")}
                    />
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onSave(item.id)}>
                      {tCommon("save")}
                    </Button>
                    {blocked ? (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="outline"
                              size="sm"
                              className="opacity-50"
                              onClick={(e) => e.preventDefault()}
                            />
                          }
                        >
                          {tCommon("delete")}
                        </TooltipTrigger>
                        <TooltipContent>
                          {tSettings("deleteBlocked")}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                      >
                        {tCommon("delete")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center">
          <Input
            placeholder={addPlaceholder}
            value={newValue}
            onChange={(e) => onNewValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onAdd();
            }}
            className="sm:flex-1"
          />
          {hasColor && newColor && onNewColorChange && (
            <ColorSwatchPicker
              value={newColor}
              onChange={onNewColorChange}
              label={tSettings("colorLabel")}
            />
          )}
          <Button onClick={onAdd}>{tCommon("add")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form
  const [name, setName] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // User entities
  const [genres, setGenres] = useState<Genre[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [nationalities, setNationalities] = useState<Nationality[]>([]);

  const [genreDrafts, setGenreDrafts] = useState<Record<string, string>>({});
  const [formatDrafts, setFormatDrafts] = useState<Record<string, string>>({});
  const [genderDrafts, setGenderDrafts] = useState<Record<string, string>>({});
  const [nationalityDrafts, setNationalityDrafts] = useState<
    Record<string, string>
  >({});
  const [genreColorDrafts, setGenreColorDrafts] = useState<
    Record<string, ColorPalette>
  >({});
  const [genderColorDrafts, setGenderColorDrafts] = useState<
    Record<string, ColorPalette>
  >({});
  const [nationalityColorDrafts, setNationalityColorDrafts] = useState<
    Record<string, ColorPalette>
  >({});

  // New entity forms
  const [newGenre, setNewGenre] = useState("");
  const [newFormat, setNewFormat] = useState("");
  const [newGender, setNewGender] = useState("");
  const [newNationality, setNewNationality] = useState("");
  const [newGenreColor, setNewGenreColor] = useState<ColorPalette>(
    colorPalettes[0]
  );
  const [newGenderColor, setNewGenderColor] = useState<ColorPalette>(
    colorPalettes[0]
  );
  const [newNationalityColor, setNewNationalityColor] = useState<ColorPalette>(
    colorPalettes[0]
  );

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    async function fetchData() {
      try {
        const [userRes, genresRes, formatsRes, gendersRes, natsRes] =
          await Promise.all([
            fetch("/api/user", { signal: controller.signal }),
            fetch("/api/genres", { signal: controller.signal }),
            fetch("/api/formats", { signal: controller.signal }),
            fetch("/api/genders", { signal: controller.signal }),
            fetch("/api/nationalities", { signal: controller.signal }),
          ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          if (isActive) {
            setUser(userData);
            setName(userData.name || "");
          }
        }

        if (genresRes.ok) {
          const data = await genresRes.json();
          if (isActive) {
            setGenres(data);
            setGenreDrafts(
              Object.fromEntries(data.map((item: Genre) => [item.id, item.name]))
            );
            setGenreColorDrafts(
              Object.fromEntries(
                data.map((item: Genre) => [
                  item.id,
                  resolvePalette(item.name, item.color),
                ])
              )
            );
          }
        }
        if (formatsRes.ok) {
          const data = await formatsRes.json();
          if (isActive) {
            setFormats(data);
            setFormatDrafts(
              Object.fromEntries(
                data.map((item: Format) => [item.id, item.name])
              )
            );
          }
        }
        if (gendersRes.ok) {
          const data = await gendersRes.json();
          if (isActive) {
            setGenders(data);
            setGenderDrafts(
              Object.fromEntries(
                data.map((item: Gender) => [item.id, item.name])
              )
            );
            setGenderColorDrafts(
              Object.fromEntries(
                data.map((item: Gender) => [
                  item.id,
                  resolvePalette(item.name, item.color),
                ])
              )
            );
          }
        }
        if (natsRes.ok) {
          const data = await natsRes.json();
          if (isActive) {
            setNationalities(data);
            setNationalityDrafts(
              Object.fromEntries(
                data.map((item: Nationality) => [item.id, item.name])
              )
            );
            setNationalityColorDrafts(
              Object.fromEntries(
                data.map((item: Nationality) => [
                  item.id,
                  resolvePalette(item.name, item.color),
                ])
              )
            );
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch data:", error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        toast.success(t("profileUpdatedMessage"));
      } else {
        toast.error(t("profileUpdateFailed"));
      }
    } catch {
      toast.error(t("profileUpdateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        toast.success(t("passwordChangedMessage"));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(t("passwordChangeFailed"));
      }
    } catch {
      toast.error(t("passwordChangeFailed"));
    } finally {
      setSaving(false);
    }
  };

  const addEntity = async <T extends EntityWithCount>(
    type: EntityType,
    entityName: string,
    color: string | null,
    setEntities: React.Dispatch<React.SetStateAction<T[]>>,
    setNewValue: React.Dispatch<React.SetStateAction<string>>,
    defaultCount?: Record<string, number>,
    setNewColor?: React.Dispatch<React.SetStateAction<ColorPalette>>
  ) => {
    if (!entityName.trim()) return;

    try {
      const response = await fetch(`/api/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: entityName.trim(), color }),
      });

      if (response.ok) {
        const newEntity = await response.json();
        const entityWithCount = defaultCount
          ? { ...newEntity, _count: defaultCount }
          : newEntity;
        setEntities((prev) => [...prev, entityWithCount]);
        setNewValue("");
        if (setNewColor) {
          setNewColor(colorPalettes[0]);
        }
      } else {
        toast.error(tCommon("saveFailed"));
      }
    } catch (error) {
      console.error(`Failed to add ${type}:`, error);
      toast.error(tCommon("saveFailed"));
    }
  };

  const updateEntity = async <T extends EntityWithCount>(
    type: EntityType,
    id: string,
    entityName: string,
    color: string | null,
    setEntities: React.Dispatch<React.SetStateAction<T[]>>,
    setDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    setColorDrafts?: React.Dispatch<
      React.SetStateAction<Record<string, ColorPalette>>
    >
  ) => {
    if (!entityName.trim()) return;

    try {
      const response = await fetch(`/api/${type}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: entityName.trim(), color }),
      });

      if (response.ok) {
        const updated = await response.json();
        setEntities((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, name: updated.name, color: updated.color }
              : item
          )
        );
        setDrafts((prev) => ({ ...prev, [id]: updated.name }));
        if (setColorDrafts) {
          setColorDrafts((prev) => ({
            ...prev,
            [id]: resolvePalette(updated.name, updated.color),
          }));
        }
        toast.success(tCommon("changesSaved"));
      } else {
        toast.error(tCommon("saveFailed"));
      }
    } catch (error) {
      console.error(`Failed to update ${type}:`, error);
      toast.error(tCommon("saveFailed"));
    }
  };

  const deleteEntity = async <T extends EntityWithCount>(
    type: EntityType,
    id: string,
    setEntities: React.Dispatch<React.SetStateAction<T[]>>,
    setDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>
  ) => {
    try {
      const response = await fetch(`/api/${type}/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEntities((prev) => prev.filter((item) => item.id !== id));
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        toast.success(tCommon("deleteSuccess"));
      } else {
        toast.error(tCommon("deleteFailed"));
      }
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
      toast.error(tCommon("deleteFailed"));
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
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Tabs defaultValue="profile">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="profile">
            <RiUserLine />
            {t("profile")}
          </TabsTrigger>
          <TabsTrigger value="password">
            <RiLockPasswordLine />
            {t("password")}
          </TabsTrigger>
          <TabsTrigger value="genres">
            <RiPriceTag3Line />
            {t("genres")}
          </TabsTrigger>
          <TabsTrigger value="formats">
            <RiBookLine />
            {t("formats")}
          </TabsTrigger>
          <TabsTrigger value="genders">
            <RiGroupLine />
            {t("genders")}
          </TabsTrigger>
          <TabsTrigger value="nationalities">
            <RiGlobalLine />
            {t("nationalities")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("profile")}</CardTitle>
              <CardDescription>
                {t("emailLabel", { email: user?.email ?? "" })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("nameLabel")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving && <RiLoaderLine className="animate-spin" />}
                {tCommon("save")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("changePassword")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-password">
                  {t("currentPassword")}
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">{t("newPassword")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">
                  {t("confirmPassword")}
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={
                  saving || !currentPassword || !newPassword || !confirmPassword
                }
              >
                {saving && <RiLoaderLine className="animate-spin" />}
                {t("changePassword")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="genres" className="mt-4">
          <EntitySection
            items={genres}
            hasColor
            drafts={genreDrafts}
            onDraftChange={(id, value) =>
              setGenreDrafts((prev) => ({ ...prev, [id]: value }))
            }
            colorDrafts={genreColorDrafts}
            onColorChange={(id, color) =>
              setGenreColorDrafts((prev) => ({ ...prev, [id]: color }))
            }
            countOf={(item) => item._count?.books ?? 0}
            onSave={(id) =>
              updateEntity(
                "genres",
                id,
                genreDrafts[id] || "",
                genreColorDrafts[id] ||
                  resolvePalette(
                    genres.find((g) => g.id === id)?.name ?? "",
                    null
                  ),
                setGenres,
                setGenreDrafts,
                setGenreColorDrafts
              )
            }
            onDelete={(id) => deleteEntity("genres", id, setGenres, setGenreDrafts)}
            newValue={newGenre}
            onNewValueChange={setNewGenre}
            newColor={newGenreColor}
            onNewColorChange={setNewGenreColor}
            onAdd={() =>
              addEntity(
                "genres",
                newGenre,
                newGenreColor,
                setGenres,
                setNewGenre,
                { books: 0 },
                setNewGenreColor
              )
            }
            addPlaceholder={t("addGenre")}
            emptyText={t("noItems")}
          />
        </TabsContent>

        <TabsContent value="formats" className="mt-4">
          <EntitySection
            items={formats}
            hasColor={false}
            drafts={formatDrafts}
            onDraftChange={(id, value) =>
              setFormatDrafts((prev) => ({ ...prev, [id]: value }))
            }
            countOf={(item) => item._count?.books ?? 0}
            onSave={(id) =>
              updateEntity(
                "formats",
                id,
                formatDrafts[id] || "",
                null,
                setFormats,
                setFormatDrafts
              )
            }
            onDelete={(id) =>
              deleteEntity("formats", id, setFormats, setFormatDrafts)
            }
            newValue={newFormat}
            onNewValueChange={setNewFormat}
            onAdd={() =>
              addEntity("formats", newFormat, null, setFormats, setNewFormat, {
                books: 0,
              })
            }
            addPlaceholder={t("addFormat")}
            emptyText={t("noItems")}
          />
        </TabsContent>

        <TabsContent value="genders" className="mt-4">
          <EntitySection
            items={genders}
            hasColor
            helpText={t("gendersHelp")}
            drafts={genderDrafts}
            onDraftChange={(id, value) =>
              setGenderDrafts((prev) => ({ ...prev, [id]: value }))
            }
            colorDrafts={genderColorDrafts}
            onColorChange={(id, color) =>
              setGenderColorDrafts((prev) => ({ ...prev, [id]: color }))
            }
            countOf={(item) => item._count?.authors ?? 0}
            onSave={(id) =>
              updateEntity(
                "genders",
                id,
                genderDrafts[id] || "",
                genderColorDrafts[id] ||
                  resolvePalette(
                    genders.find((g) => g.id === id)?.name ?? "",
                    null
                  ),
                setGenders,
                setGenderDrafts,
                setGenderColorDrafts
              )
            }
            onDelete={(id) =>
              deleteEntity("genders", id, setGenders, setGenderDrafts)
            }
            newValue={newGender}
            onNewValueChange={setNewGender}
            newColor={newGenderColor}
            onNewColorChange={setNewGenderColor}
            onAdd={() =>
              addEntity(
                "genders",
                newGender,
                newGenderColor,
                setGenders,
                setNewGender,
                { authors: 0 },
                setNewGenderColor
              )
            }
            addPlaceholder={t("addGender")}
            emptyText={t("noItems")}
          />
        </TabsContent>

        <TabsContent value="nationalities" className="mt-4">
          <EntitySection
            items={nationalities}
            hasColor
            helpText={t("nationalitiesHelp")}
            drafts={nationalityDrafts}
            onDraftChange={(id, value) =>
              setNationalityDrafts((prev) => ({ ...prev, [id]: value }))
            }
            colorDrafts={nationalityColorDrafts}
            onColorChange={(id, color) =>
              setNationalityColorDrafts((prev) => ({ ...prev, [id]: color }))
            }
            countOf={(item) => item._count?.authors ?? 0}
            onSave={(id) =>
              updateEntity(
                "nationalities",
                id,
                nationalityDrafts[id] || "",
                nationalityColorDrafts[id] ||
                  resolvePalette(
                    nationalities.find((n) => n.id === id)?.name ?? "",
                    null
                  ),
                setNationalities,
                setNationalityDrafts,
                setNationalityColorDrafts
              )
            }
            onDelete={(id) =>
              deleteEntity(
                "nationalities",
                id,
                setNationalities,
                setNationalityDrafts
              )
            }
            newValue={newNationality}
            onNewValueChange={setNewNationality}
            newColor={newNationalityColor}
            onNewColorChange={setNewNationalityColor}
            onAdd={() =>
              addEntity(
                "nationalities",
                newNationality,
                newNationalityColor,
                setNationalities,
                setNewNationality,
                { authors: 0 },
                setNewNationalityColor
              )
            }
            addPlaceholder={t("addNationality")}
            emptyText={t("noItems")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
