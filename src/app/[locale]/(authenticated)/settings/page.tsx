"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Card,
  Flex,
  Button,
  Input,
  Spinner,
  Field,
  createListCollection,
  useSelectContext,
  Tooltip,
} from "@chakra-ui/react";
import { GroupToggle } from "@/components/ui/group-toggle";
import { toaster } from "@/components/ui/toaster";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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

const ColorSelectValue = ({ placeholder }: { placeholder?: string }) => {
  const select = useSelectContext();
  const items = (select.selectedItems ?? []) as Array<{
    value: ColorPalette;
    label: string;
  }>;
  const selected = items[0];
  const label = selected?.label ?? placeholder ?? "";
  const swatchColor = selected?.value ? `${selected.value}.solid` : "gray.300";

  return (
    <SelectValueText placeholder={placeholder}>
      <Flex align="center" gap={2}>
        <Box boxSize="12px" borderRadius="full" bg={swatchColor} />
        <Text fontSize="sm">{label}</Text>
      </Flex>
    </SelectValueText>
  );
};

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  const [sectionsOpen, setSectionsOpen] = useState({
    genres: false,
    formats: false,
    genders: false,
    nationalities: false,
  });

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

  const colorCollection = createListCollection({
    items: colorPalettes.map((color) => ({
      value: color,
      label: color.charAt(0).toUpperCase() + color.slice(1),
    })),
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, genresRes, formatsRes, gendersRes, natsRes] =
          await Promise.all([
            fetch("/api/user"),
            fetch("/api/genres"),
            fetch("/api/formats"),
            fetch("/api/genders"),
            fetch("/api/nationalities"),
          ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          setName(userData.name || "");
        }

        if (genresRes.ok) {
          const data = await genresRes.json();
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
        if (formatsRes.ok) {
          const data = await formatsRes.json();
          setFormats(data);
          setFormatDrafts(
            Object.fromEntries(data.map((item: Format) => [item.id, item.name]))
          );
        }
        if (gendersRes.ok) {
          const data = await gendersRes.json();
          setGenders(data);
          setGenderDrafts(
            Object.fromEntries(data.map((item: Gender) => [item.id, item.name]))
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
        if (natsRes.ok) {
          const data = await natsRes.json();
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
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setMessage({ type: "success", text: t("profileUpdatedMessage") });
        toaster.create({ title: tCommon("profileUpdated"), type: "success" });
      } else {
        setMessage({ type: "error", text: t("profileUpdateFailed") });
        toaster.create({ title: tCommon("saveFailed"), type: "error" });
      }
    } catch {
      setMessage({ type: "error", text: t("profileUpdateFailed") });
      toaster.create({ title: tCommon("saveFailed"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: t("passwordMismatch") });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: t("passwordChangedMessage") });
        toaster.create({ title: tCommon("passwordChanged"), type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: t("passwordChangeFailed") });
        toaster.create({ title: tCommon("saveFailed"), type: "error" });
      }
    } catch {
      setMessage({ type: "error", text: t("passwordChangeFailed") });
      toaster.create({ title: tCommon("saveFailed"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const addEntity = async <
    T extends { id: string; name: string; color?: string | null },
  >(
    type: "genres" | "formats" | "genders" | "nationalities",
    name: string,
    color: string | null,
    setEntities: React.Dispatch<React.SetStateAction<T[]>>,
    setNewValue: React.Dispatch<React.SetStateAction<string>>,
    defaultCount?: Record<string, number>,
    setNewColor?: React.Dispatch<React.SetStateAction<ColorPalette>>
  ) => {
    if (!name.trim()) return;

    try {
      const response = await fetch(`/api/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
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
      }
    } catch (error) {
      console.error(`Failed to add ${type}:`, error);
    }
  };

  const updateEntity = async <
    T extends { id: string; name: string; color?: string | null },
  >(
    type: "genres" | "formats" | "genders" | "nationalities",
    id: string,
    name: string,
    color: string | null,
    setEntities: React.Dispatch<React.SetStateAction<T[]>>,
    setDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    setColorDrafts?: React.Dispatch<
      React.SetStateAction<Record<string, ColorPalette>>
    >
  ) => {
    if (!name.trim()) return;

    try {
      const response = await fetch(`/api/${type}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
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
        toaster.create({ title: tCommon("changesSaved"), type: "success" });
      } else {
        toaster.create({ title: tCommon("saveFailed"), type: "error" });
      }
    } catch (error) {
      console.error(`Failed to update ${type}:`, error);
      toaster.create({ title: tCommon("saveFailed"), type: "error" });
    }
  };

  const deleteEntity = async <T extends { id: string; name: string }>(
    type: "genres" | "formats" | "genders" | "nationalities",
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
        toaster.create({ title: tCommon("deleteSuccess"), type: "success" });
      } else {
        toaster.create({ title: tCommon("deleteFailed"), type: "error" });
      }
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
      toaster.create({ title: tCommon("deleteFailed"), type: "error" });
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <Stack gap={8}>
        <Heading as="h1" size="2xl">
          {t("title")}
        </Heading>

        {message && (
          <Box
            p={3}
            bg={message.type === "success" ? "green.100" : "red.100"}
            color={message.type === "success" ? "green.800" : "red.800"}
            borderRadius="md"
          >
            {message.text}
          </Box>
        )}

        {/* Profile Section */}
        <Card.Root>
          <Card.Body>
            <Stack gap={4}>
              <Heading as="h2" size="lg">
                {t("profile")}
              </Heading>
              <Text color="fg.muted" fontSize="sm">
                {t("emailLabel", { email: user?.email ?? "" })}
              </Text>

              <Field.Root>
                <Field.Label>{t("nameLabel")}</Field.Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                />
              </Field.Root>

              <Button
                colorPalette="brand"
                onClick={handleSaveProfile}
                loading={saving}
                alignSelf="flex-start"
              >
                {tCommon("save")}
              </Button>
            </Stack>
          </Card.Body>
        </Card.Root>

        {/* Password Section */}
        <Card.Root>
          <Card.Body>
            <Stack gap={4}>
              <Heading as="h2" size="lg">
                {t("changePassword")}
              </Heading>

              <Field.Root>
                <Field.Label>{t("currentPassword")}</Field.Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>{t("newPassword")}</Field.Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>{t("confirmPassword")}</Field.Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                />
              </Field.Root>

              <Button
                colorPalette="brand"
                onClick={handleChangePassword}
                loading={saving}
                disabled={!currentPassword || !newPassword || !confirmPassword}
                alignSelf="flex-start"
              >
                {t("changePassword")}
              </Button>
            </Stack>
          </Card.Body>
        </Card.Root>

        {/* Genres Section */}
        <Card.Root>
          <Card.Body>
            <Stack gap={4}>
              <GroupToggle
                label={t("genres")}
                collapsed={!sectionsOpen.genres}
                onToggle={() =>
                  setSectionsOpen((prev) => ({ ...prev, genres: !prev.genres }))
                }
                color="fg.default"
                size="lg"
                buttonProps={{ px: 0, py: 0 }}
              />
              {sectionsOpen.genres && (
                <>
                  <Stack gap={2}>
                    {genres.map((genre) => {
                      const selectedColor =
                        genreColorDrafts[genre.id] ||
                        resolvePalette(genre.name, genre.color);

                      return (
                        <Flex
                          key={genre.id}
                          align="center"
                          gap={2}
                          wrap="nowrap"
                        >
                          <Input
                            value={genreDrafts[genre.id] || ""}
                            onChange={(e) =>
                              setGenreDrafts((prev) => ({
                                ...prev,
                                [genre.id]: e.target.value,
                              }))
                            }
                            size="sm"
                            flex="1"
                            minW="0"
                          />
                          <Flex align="center" gap={2}>
                            <SelectRoot
                              collection={colorCollection}
                              value={[selectedColor]}
                              onValueChange={(details) =>
                                setGenreColorDrafts((prev) => ({
                                  ...prev,
                                  [genre.id]: details.value[0] as ColorPalette,
                                }))
                              }
                              width="140px"
                            >
                              <SelectTrigger>
                                <ColorSelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {colorCollection.items.map((item) => (
                                  <SelectItem key={item.value} item={item}>
                                    <Flex align="center" gap={2}>
                                      <Box
                                        boxSize="12px"
                                        borderRadius="full"
                                        bg={`${item.value}.solid`}
                                      />
                                      <Text fontSize="sm">{item.label}</Text>
                                    </Flex>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </SelectRoot>
                          </Flex>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateEntity(
                                "genres",
                                genre.id,
                                genreDrafts[genre.id] || "",
                                selectedColor,
                                setGenres,
                                setGenreDrafts,
                                setGenreColorDrafts
                              )
                            }
                          >
                            {tCommon("save")}
                          </Button>
                          <Tooltip.Root
                            disabled={(genre._count?.books || 0) === 0}
                          >
                            <Tooltip.Trigger asChild>
                              <Box as="span" display="inline-block">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  colorPalette="red"
                                  disabled={(genre._count?.books || 0) > 0}
                                  onClick={() =>
                                    deleteEntity(
                                      "genres",
                                      genre.id,
                                      setGenres,
                                      setGenreDrafts
                                    )
                                  }
                                >
                                  {tCommon("delete")}
                                </Button>
                              </Box>
                            </Tooltip.Trigger>
                            <Tooltip.Positioner>
                              <Tooltip.Content>
                                <Tooltip.Arrow>
                                  <Tooltip.ArrowTip />
                                </Tooltip.Arrow>
                                {t("deleteBlocked")}
                              </Tooltip.Content>
                            </Tooltip.Positioner>
                          </Tooltip.Root>
                        </Flex>
                      );
                    })}
                  </Stack>
                  <Flex gap={2} wrap="nowrap" align="center">
                    <Input
                      placeholder={t("addGenre")}
                      value={newGenre}
                      onChange={(e) => setNewGenre(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addEntity(
                            "genres",
                            newGenre,
                            newGenreColor,
                            setGenres,
                            setNewGenre,
                            { books: 0 },
                            setNewGenreColor
                          );
                        }
                      }}
                      size="sm"
                      flex="1"
                      minW="0"
                    />
                    <Flex align="center" gap={2}>
                      <SelectRoot
                        collection={colorCollection}
                        value={[newGenreColor]}
                        onValueChange={(details) =>
                          setNewGenreColor(details.value[0] as ColorPalette)
                        }
                        width="140px"
                      >
                        <SelectTrigger>
                          <ColorSelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colorCollection.items.map((item) => (
                            <SelectItem key={item.value} item={item}>
                              <Flex align="center" gap={2}>
                                <Box
                                  boxSize="12px"
                                  borderRadius="full"
                                  bg={`${item.value}.solid`}
                                />
                                <Text fontSize="sm">{item.label}</Text>
                              </Flex>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </SelectRoot>
                    </Flex>
                    <Button
                      onClick={() =>
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
                    >
                      {tCommon("add")}
                    </Button>
                  </Flex>
                </>
              )}
            </Stack>
          </Card.Body>
        </Card.Root>

        {/* Formats Section */}
        <Card.Root>
          <Card.Body>
            <Stack gap={4}>
              <GroupToggle
                label={t("formats")}
                collapsed={!sectionsOpen.formats}
                onToggle={() =>
                  setSectionsOpen((prev) => ({
                    ...prev,
                    formats: !prev.formats,
                  }))
                }
                color="fg.default"
                size="lg"
                buttonProps={{ px: 0, py: 0 }}
              />
              {sectionsOpen.formats && (
                <>
                  <Stack gap={2}>
                    {formats.map((format) => (
                      <Flex key={format.id} align="center" gap={2}>
                        <Input
                          value={formatDrafts[format.id] || ""}
                          onChange={(e) =>
                            setFormatDrafts((prev) => ({
                              ...prev,
                              [format.id]: e.target.value,
                            }))
                          }
                        />
                        <Button
                          size="sm"
                          onClick={() =>
                            updateEntity(
                              "formats",
                              format.id,
                              formatDrafts[format.id] || "",
                              null,
                              setFormats,
                              setFormatDrafts
                            )
                          }
                        >
                          {tCommon("save")}
                        </Button>
                        <Tooltip.Root
                          disabled={(format._count?.books || 0) === 0}
                        >
                          <Tooltip.Trigger asChild>
                            <Box as="span" display="inline-block">
                              <Button
                                size="sm"
                                variant="outline"
                                colorPalette="red"
                                disabled={(format._count?.books || 0) > 0}
                                onClick={() =>
                                  deleteEntity(
                                    "formats",
                                    format.id,
                                    setFormats,
                                    setFormatDrafts
                                  )
                                }
                              >
                                {tCommon("delete")}
                              </Button>
                            </Box>
                          </Tooltip.Trigger>
                          <Tooltip.Positioner>
                            <Tooltip.Content>
                              <Tooltip.Arrow>
                                <Tooltip.ArrowTip />
                              </Tooltip.Arrow>
                              {t("deleteBlocked")}
                            </Tooltip.Content>
                          </Tooltip.Positioner>
                        </Tooltip.Root>
                      </Flex>
                    ))}
                  </Stack>
                  <Flex gap={2}>
                    <Input
                      placeholder={t("addFormat")}
                      value={newFormat}
                      onChange={(e) => setNewFormat(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addEntity(
                            "formats",
                            newFormat,
                            null,
                            setFormats,
                            setNewFormat
                          );
                        }
                      }}
                    />
                    <Button
                      onClick={() =>
                        addEntity(
                          "formats",
                          newFormat,
                          null,
                          setFormats,
                          setNewFormat,
                          { books: 0 }
                        )
                      }
                    >
                      {tCommon("add")}
                    </Button>
                  </Flex>
                </>
              )}
            </Stack>
          </Card.Body>
        </Card.Root>

        {/* Genders Section */}
        <Card.Root>
          <Card.Body>
            <Stack gap={4}>
              <GroupToggle
                label={t("genders")}
                collapsed={!sectionsOpen.genders}
                onToggle={() =>
                  setSectionsOpen((prev) => ({
                    ...prev,
                    genders: !prev.genders,
                  }))
                }
                color="fg.default"
                size="lg"
                buttonProps={{ px: 0, py: 0 }}
              />
              {sectionsOpen.genders && (
                <>
                  <Text color="fg.muted" fontSize="sm">
                    {t("gendersHelp")}
                  </Text>
                  <Stack gap={2}>
                    {genders.map((gender) => {
                      const selectedColor =
                        genderColorDrafts[gender.id] ||
                        resolvePalette(gender.name, gender.color);

                      return (
                        <Flex
                          key={gender.id}
                          align="center"
                          gap={2}
                          wrap="nowrap"
                        >
                          <Input
                            value={genderDrafts[gender.id] || ""}
                            onChange={(e) =>
                              setGenderDrafts((prev) => ({
                                ...prev,
                                [gender.id]: e.target.value,
                              }))
                            }
                            size="sm"
                            flex="1"
                            minW="0"
                          />
                          <Flex align="center" gap={2}>
                            <SelectRoot
                              collection={colorCollection}
                              value={[selectedColor]}
                              onValueChange={(details) =>
                                setGenderColorDrafts((prev) => ({
                                  ...prev,
                                  [gender.id]: details.value[0] as ColorPalette,
                                }))
                              }
                              width="140px"
                            >
                              <SelectTrigger>
                                <ColorSelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {colorCollection.items.map((item) => (
                                  <SelectItem key={item.value} item={item}>
                                    <Flex align="center" gap={2}>
                                      <Box
                                        boxSize="12px"
                                        borderRadius="full"
                                        bg={`${item.value}.solid`}
                                      />
                                      <Text fontSize="sm">{item.label}</Text>
                                    </Flex>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </SelectRoot>
                          </Flex>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateEntity(
                                "genders",
                                gender.id,
                                genderDrafts[gender.id] || "",
                                selectedColor,
                                setGenders,
                                setGenderDrafts,
                                setGenderColorDrafts
                              )
                            }
                          >
                            {tCommon("save")}
                          </Button>
                          <Tooltip.Root
                            disabled={(gender._count?.authors || 0) === 0}
                          >
                            <Tooltip.Trigger asChild>
                              <Box as="span" display="inline-block">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  colorPalette="red"
                                  disabled={(gender._count?.authors || 0) > 0}
                                  onClick={() =>
                                    deleteEntity(
                                      "genders",
                                      gender.id,
                                      setGenders,
                                      setGenderDrafts
                                    )
                                  }
                                >
                                  {tCommon("delete")}
                                </Button>
                              </Box>
                            </Tooltip.Trigger>
                            <Tooltip.Positioner>
                              <Tooltip.Content>
                                <Tooltip.Arrow>
                                  <Tooltip.ArrowTip />
                                </Tooltip.Arrow>
                                {t("deleteBlocked")}
                              </Tooltip.Content>
                            </Tooltip.Positioner>
                          </Tooltip.Root>
                        </Flex>
                      );
                    })}
                  </Stack>
                  <Flex gap={2} wrap="nowrap" align="center">
                    <Input
                      placeholder={t("addGender")}
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addEntity(
                            "genders",
                            newGender,
                            newGenderColor,
                            setGenders,
                            setNewGender,
                            { authors: 0 },
                            setNewGenderColor
                          );
                        }
                      }}
                      size="sm"
                      flex="1"
                      minW="0"
                    />
                    <Flex align="center" gap={2}>
                      <SelectRoot
                        collection={colorCollection}
                        value={[newGenderColor]}
                        onValueChange={(details) =>
                          setNewGenderColor(details.value[0] as ColorPalette)
                        }
                        width="140px"
                      >
                        <SelectTrigger>
                          <ColorSelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colorCollection.items.map((item) => (
                            <SelectItem key={item.value} item={item}>
                              <Flex align="center" gap={2}>
                                <Box
                                  boxSize="12px"
                                  borderRadius="full"
                                  bg={`${item.value}.solid`}
                                />
                                <Text fontSize="sm">{item.label}</Text>
                              </Flex>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </SelectRoot>
                    </Flex>
                    <Button
                      onClick={() =>
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
                    >
                      {tCommon("add")}
                    </Button>
                  </Flex>
                </>
              )}
            </Stack>
          </Card.Body>
        </Card.Root>

        {/* Nationalities Section */}
        <Card.Root>
          <Card.Body>
            <Stack gap={4}>
              <GroupToggle
                label={t("nationalities")}
                collapsed={!sectionsOpen.nationalities}
                onToggle={() =>
                  setSectionsOpen((prev) => ({
                    ...prev,
                    nationalities: !prev.nationalities,
                  }))
                }
                color="fg.default"
                size="lg"
                buttonProps={{ px: 0, py: 0 }}
              />
              {sectionsOpen.nationalities && (
                <>
                  <Text color="fg.muted" fontSize="sm">
                    {t("nationalitiesHelp")}
                  </Text>
                  <Stack gap={2}>
                    {nationalities.map((nat) => {
                      const selectedColor =
                        nationalityColorDrafts[nat.id] ||
                        resolvePalette(nat.name, nat.color);

                      return (
                        <Flex key={nat.id} align="center" gap={2} wrap="nowrap">
                          <Input
                            value={nationalityDrafts[nat.id] || ""}
                            onChange={(e) =>
                              setNationalityDrafts((prev) => ({
                                ...prev,
                                [nat.id]: e.target.value,
                              }))
                            }
                            size="sm"
                            flex="1"
                            minW="0"
                          />
                          <Flex align="center" gap={2}>
                            <SelectRoot
                              collection={colorCollection}
                              value={[selectedColor]}
                              onValueChange={(details) =>
                                setNationalityColorDrafts((prev) => ({
                                  ...prev,
                                  [nat.id]: details.value[0] as ColorPalette,
                                }))
                              }
                              width="140px"
                            >
                              <SelectTrigger>
                                <ColorSelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {colorCollection.items.map((item) => (
                                  <SelectItem key={item.value} item={item}>
                                    <Flex align="center" gap={2}>
                                      <Box
                                        boxSize="12px"
                                        borderRadius="full"
                                        bg={`${item.value}.solid`}
                                      />
                                      <Text fontSize="sm">{item.label}</Text>
                                    </Flex>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </SelectRoot>
                          </Flex>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateEntity(
                                "nationalities",
                                nat.id,
                                nationalityDrafts[nat.id] || "",
                                selectedColor,
                                setNationalities,
                                setNationalityDrafts,
                                setNationalityColorDrafts
                              )
                            }
                          >
                            {tCommon("save")}
                          </Button>
                          <Tooltip.Root
                            disabled={(nat._count?.authors || 0) === 0}
                          >
                            <Tooltip.Trigger asChild>
                              <Box as="span" display="inline-block">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  colorPalette="red"
                                  disabled={(nat._count?.authors || 0) > 0}
                                  onClick={() =>
                                    deleteEntity(
                                      "nationalities",
                                      nat.id,
                                      setNationalities,
                                      setNationalityDrafts
                                    )
                                  }
                                >
                                  {tCommon("delete")}
                                </Button>
                              </Box>
                            </Tooltip.Trigger>
                            <Tooltip.Positioner>
                              <Tooltip.Content>
                                <Tooltip.Arrow>
                                  <Tooltip.ArrowTip />
                                </Tooltip.Arrow>
                                {t("deleteBlocked")}
                              </Tooltip.Content>
                            </Tooltip.Positioner>
                          </Tooltip.Root>
                        </Flex>
                      );
                    })}
                  </Stack>
                  <Flex gap={2} wrap="nowrap" align="center">
                    <Input
                      placeholder={t("addNationality")}
                      value={newNationality}
                      onChange={(e) => setNewNationality(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addEntity(
                            "nationalities",
                            newNationality,
                            newNationalityColor,
                            setNationalities,
                            setNewNationality,
                            { authors: 0 },
                            setNewNationalityColor
                          );
                        }
                      }}
                      size="sm"
                      flex="1"
                      minW="0"
                    />
                    <Flex align="center" gap={2}>
                      <SelectRoot
                        collection={colorCollection}
                        value={[newNationalityColor]}
                        onValueChange={(details) =>
                          setNewNationalityColor(
                            details.value[0] as ColorPalette
                          )
                        }
                        width="140px"
                      >
                        <SelectTrigger>
                          <ColorSelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colorCollection.items.map((item) => (
                            <SelectItem key={item.value} item={item}>
                              <Flex align="center" gap={2}>
                                <Box
                                  boxSize="12px"
                                  borderRadius="full"
                                  bg={`${item.value}.solid`}
                                />
                                <Text fontSize="sm">{item.label}</Text>
                              </Flex>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </SelectRoot>
                    </Flex>
                    <Button
                      onClick={() =>
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
                    >
                      {tCommon("add")}
                    </Button>
                  </Flex>
                </>
              )}
            </Stack>
          </Card.Body>
        </Card.Root>
      </Stack>
    </Container>
  );
}
