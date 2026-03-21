"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWeddingAccess } from "@/lib/auth-helpers";
import {
  sectionCreateSchema,
  songCreateSchema,
  songUpdateSchema,
} from "@/lib/validators/playlist";

export async function getPlaylist(weddingId: string) {
  await requireWeddingAccess(weddingId);

  const sections = await prisma.playlistSection.findMany({
    where: { weddingId },
    include: {
      songs: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return sections;
}

export async function createSection(weddingId: string, formData: FormData) {
  await requireWeddingAccess(weddingId);

  const raw = {
    name: formData.get("name") as string,
    sortOrder: 0,
  };

  const parsed = sectionCreateSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  // Set sortOrder to the end
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
  const section = await prisma.playlistSection.findUniqueOrThrow({
    where: { id: sectionId },
  });

  await requireWeddingAccess(section.weddingId);

  const name = formData.get("name") as string;

  if (!name || name.trim() === "") {
    return {
      success: false as const,
      errors: { name: ["セクション名を入力してください"] },
    };
  }

  await prisma.playlistSection.update({
    where: { id: sectionId },
    data: { name },
  });

  revalidatePath(`/weddings/${section.weddingId}/playlist`);
  return { success: true as const };
}

export async function deleteSection(sectionId: string) {
  const section = await prisma.playlistSection.findUniqueOrThrow({
    where: { id: sectionId },
  });

  await requireWeddingAccess(section.weddingId);

  await prisma.playlistSection.delete({
    where: { id: sectionId },
  });

  revalidatePath(`/weddings/${section.weddingId}/playlist`);
  return { success: true as const };
}

export async function createSong(sectionId: string, formData: FormData) {
  const section = await prisma.playlistSection.findUniqueOrThrow({
    where: { id: sectionId },
  });

  await requireWeddingAccess(section.weddingId);

  const durationRaw = formData.get("durationSec") as string;
  let durationSec: number | undefined;
  if (durationRaw) {
    // Support mm:ss format
    if (durationRaw.includes(":")) {
      const [min, sec] = durationRaw.split(":").map(Number);
      durationSec = min * 60 + (sec || 0);
    } else {
      durationSec = Number(durationRaw);
    }
  }

  const raw = {
    title: formData.get("title") as string,
    artist: formData.get("artist") as string,
    durationSec,
    note: (formData.get("note") as string) || undefined,
    sortOrder: 0,
  };

  const parsed = songCreateSchema.safeParse(raw);

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
  const song = await prisma.song.findUniqueOrThrow({
    where: { id: songId },
    include: { section: true },
  });

  await requireWeddingAccess(song.section.weddingId);

  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      raw[key] = value === "" ? undefined : value;
    }
  }

  // Handle duration format
  if (raw.durationSec && typeof raw.durationSec === "string") {
    if (raw.durationSec.includes(":")) {
      const [min, sec] = (raw.durationSec as string).split(":").map(Number);
      raw.durationSec = min * 60 + (sec || 0);
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

  if (data.note === "") data.note = null;

  await prisma.song.update({
    where: { id: songId },
    data,
  });

  revalidatePath(`/weddings/${song.section.weddingId}/playlist`);
  return { success: true as const };
}

export async function deleteSong(songId: string) {
  const song = await prisma.song.findUniqueOrThrow({
    where: { id: songId },
    include: { section: true },
  });

  await requireWeddingAccess(song.section.weddingId);

  await prisma.song.delete({
    where: { id: songId },
  });

  revalidatePath(`/weddings/${song.section.weddingId}/playlist`);
  return { success: true as const };
}

export async function createDefaultSections(weddingId: string) {
  await requireWeddingAccess(weddingId);

  const defaultSections = [
    { name: "入場", sortOrder: 0 },
    { name: "乾杯", sortOrder: 1 },
    { name: "ケーキ入刀", sortOrder: 2 },
    { name: "お色直し入場", sortOrder: 3 },
    { name: "お色直し退場", sortOrder: 4 },
    { name: "テーブルラウンド", sortOrder: 5 },
    { name: "両親への手紙", sortOrder: 6 },
    { name: "退場", sortOrder: 7 },
    { name: "お見送り", sortOrder: 8 },
    { name: "歓談BGM", sortOrder: 9 },
  ];

  await prisma.playlistSection.createMany({
    data: defaultSections.map((section) => ({
      ...section,
      weddingId,
    })),
  });

  revalidatePath(`/weddings/${weddingId}/playlist`);
  return { success: true as const };
}
