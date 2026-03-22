"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWeddingAccess } from "@/lib/auth-helpers";
import { isMissingRecordError } from "@/lib/action-errors";
import {
  sectionCreateSchema,
  songCreateSchema,
  songUpdateSchema,
} from "@/lib/validators/playlist";

export async function getPlaylist(weddingId: string) {
  await requireWeddingAccess(weddingId);

  return prisma.playlistSection.findMany({
    where: { weddingId },
    include: {
      songs: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createSection(weddingId: string, formData: FormData) {
  await requireWeddingAccess(weddingId);

  const parsed = sectionCreateSchema.safeParse({
    name: formData.get("name") as string,
    sortOrder: 0,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const maxSort = await prisma.playlistSection.aggregate({
    where: { weddingId },
    _max: { sortOrder: true },
  });

  await prisma.playlistSection.create({
    data: {
      name: parsed.data.name,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      weddingId,
    },
  });

  revalidatePath(`/weddings/${weddingId}/playlist`);
  return { success: true as const };
}

export async function updateSection(sectionId: string, formData: FormData) {
  const section = await prisma.playlistSection.findUnique({
    where: { id: sectionId },
  });

  if (!section) {
    return {
      success: false as const,
      errors: { name: ["セクションが見つかりません。"] },
    };
  }

  await requireWeddingAccess(section.weddingId);

  const name = (formData.get("name") as string)?.trim();
  if (!name) {
    return {
      success: false as const,
      errors: { name: ["セクション名を入力してください"] },
    };
  }

  try {
    await prisma.playlistSection.update({
      where: { id: sectionId },
      data: { name },
    });
  } catch (error) {
    if (isMissingRecordError(error)) {
      return {
        success: false as const,
        errors: { name: ["セクションが見つかりません。"] },
      };
    }

    throw error;
  }

  revalidatePath(`/weddings/${section.weddingId}/playlist`);
  return { success: true as const };
}

export async function deleteSection(sectionId: string) {
  const section = await prisma.playlistSection.findUnique({
    where: { id: sectionId },
  });

  if (!section) {
    return { success: true as const };
  }

  await requireWeddingAccess(section.weddingId);

  try {
    await prisma.playlistSection.delete({
      where: { id: sectionId },
    });
  } catch (error) {
    if (!isMissingRecordError(error)) {
      throw error;
    }
  }

  revalidatePath(`/weddings/${section.weddingId}/playlist`);
  return { success: true as const };
}

export async function createSong(sectionId: string, formData: FormData) {
  const section = await prisma.playlistSection.findUnique({
    where: { id: sectionId },
  });

  if (!section) {
    return {
      success: false as const,
      errors: { title: ["セクションが見つかりません。"] },
    };
  }

  await requireWeddingAccess(section.weddingId);

  const durationRaw = (formData.get("durationSec") as string) || "";
  let durationSec: number | undefined;

  if (durationRaw) {
    if (durationRaw.includes(":")) {
      const [minutes, seconds] = durationRaw.split(":").map(Number);
      durationSec = minutes * 60 + (seconds || 0);
    } else {
      durationSec = Number(durationRaw);
    }
  }

  const parsed = songCreateSchema.safeParse({
    title: formData.get("title") as string,
    artist: formData.get("artist") as string,
    durationSec,
    note: (formData.get("note") as string) || undefined,
    sortOrder: 0,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const maxSort = await prisma.song.aggregate({
    where: { sectionId },
    _max: { sortOrder: true },
  });

  await prisma.song.create({
    data: {
      title: parsed.data.title,
      artist: parsed.data.artist,
      durationSec: parsed.data.durationSec ?? null,
      note: parsed.data.note || null,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      sectionId,
    },
  });

  revalidatePath(`/weddings/${section.weddingId}/playlist`);
  return { success: true as const };
}

export async function updateSong(songId: string, formData: FormData) {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: { section: true },
  });

  if (!song) {
    return {
      success: false as const,
      errors: { title: ["楽曲が見つかりません。"] },
    };
  }

  await requireWeddingAccess(song.section.weddingId);

  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      raw[key] = value === "" ? undefined : value;
    }
  }

  if (raw.durationSec && typeof raw.durationSec === "string") {
    if (raw.durationSec.includes(":")) {
      const [minutes, seconds] = raw.durationSec.split(":").map(Number);
      raw.durationSec = minutes * 60 + (seconds || 0);
    } else {
      raw.durationSec = Number(raw.durationSec);
    }
  }

  const parsed = songUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      data[key] = value;
    }
  }

  if (data.note === "") {
    data.note = null;
  }

  try {
    await prisma.song.update({
      where: { id: songId },
      data,
    });
  } catch (error) {
    if (isMissingRecordError(error)) {
      return {
        success: false as const,
        errors: { title: ["楽曲が見つかりません。"] },
      };
    }

    throw error;
  }

  revalidatePath(`/weddings/${song.section.weddingId}/playlist`);
  return { success: true as const };
}

export async function deleteSong(songId: string) {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: { section: true },
  });

  if (!song) {
    return { success: true as const };
  }

  await requireWeddingAccess(song.section.weddingId);

  try {
    await prisma.song.delete({
      where: { id: songId },
    });
  } catch (error) {
    if (!isMissingRecordError(error)) {
      throw error;
    }
  }

  revalidatePath(`/weddings/${song.section.weddingId}/playlist`);
  return { success: true as const };
}

export async function createDefaultSections(weddingId: string) {
  await requireWeddingAccess(weddingId);

  const defaultSections = [
    { name: "入場", sortOrder: 0 },
    { name: "乾杯", sortOrder: 1 },
    { name: "ケーキ入刀", sortOrder: 2 },
    { name: "お色直し中座", sortOrder: 3 },
    { name: "お色直し再入場", sortOrder: 4 },
    { name: "テーブルラウンド", sortOrder: 5 },
    { name: "両親への手紙", sortOrder: 6 },
    { name: "送賓", sortOrder: 7 },
    { name: "お開き", sortOrder: 8 },
    { name: "歓談BGM", sortOrder: 9 },
  ];

  const maxSort = await prisma.playlistSection.aggregate({
    where: { weddingId },
    _max: { sortOrder: true },
  });
  const baseSortOrder = (maxSort._max.sortOrder ?? -1) + 1;

  await prisma.playlistSection.createMany({
    data: defaultSections.map((section, index) => ({
      name: section.name,
      sortOrder: baseSortOrder + index,
      weddingId,
    })),
  });

  revalidatePath(`/weddings/${weddingId}/playlist`);
  return { success: true as const };
}
