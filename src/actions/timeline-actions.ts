"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWeddingAccess } from "@/lib/auth-helpers";
import {
  timelineEntryCreateSchema,
  timelineEntryUpdateSchema,
} from "@/lib/validators/timeline";

const DEFAULT_TIMELINE_ENTRIES = [
  { startTime: "10:00", title: "新郎新婦お支度・準備", category: "preparation" },
  { startTime: "11:00", title: "ヘアメイク・最終確認", category: "preparation" },
  { startTime: "12:00", title: "親族紹介", category: "preparation" },
  { startTime: "12:30", title: "挙式リハーサル", category: "ceremony" },
  { startTime: "13:00", title: "挙式（チャペル）", category: "ceremony" },
  { startTime: "13:30", title: "フラワーシャワー・集合写真", category: "ceremony" },
  { startTime: "14:00", title: "披露宴 開場", category: "reception" },
  { startTime: "14:10", title: "新郎新婦入場", category: "reception" },
  { startTime: "14:20", title: "ウェルカムスピーチ", category: "reception" },
  { startTime: "14:30", title: "乾杯", category: "reception" },
  { startTime: "14:40", title: "お色直し中座", category: "reception" },
  { startTime: "15:10", title: "お色直し再入場", category: "reception" },
  { startTime: "15:30", title: "ケーキ入刀", category: "reception" },
  { startTime: "15:45", title: "テーブルラウンド", category: "reception" },
  { startTime: "16:15", title: "両親への手紙", category: "reception" },
  { startTime: "16:30", title: "花束贈呈", category: "reception" },
  { startTime: "16:40", title: "謝辞", category: "reception" },
  { startTime: "16:50", title: "新郎新婦退場", category: "reception" },
  { startTime: "17:00", title: "お見送り", category: "reception" },
] as const;

function revalidateTimelinePaths(weddingId: string) {
  revalidatePath(`/weddings/${weddingId}/day-of`);
  revalidatePath(`/weddings/${weddingId}/day-of/print`);
}

export async function getTimelineEntries(weddingId: string) {
  await requireWeddingAccess(weddingId);

  return prisma.dayTimelineEntry.findMany({
    where: { weddingId },
    orderBy: [{ startTime: "asc" }, { sortOrder: "asc" }],
  });
}

export async function createTimelineEntry(
  weddingId: string,
  formData: FormData
) {
  await requireWeddingAccess(weddingId);

  const maxOrder = await prisma.dayTimelineEntry.aggregate({
    where: { weddingId },
    _max: { sortOrder: true },
  });

  const raw = {
    startTime: formData.get("startTime") as string,
    endTime: (formData.get("endTime") as string) || undefined,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    location: (formData.get("location") as string) || undefined,
    category: (formData.get("category") as string) || undefined,
    sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
  };

  const parsed = timelineEntryCreateSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.dayTimelineEntry.create({
    data: {
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime || null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      location: parsed.data.location || null,
      category: parsed.data.category || null,
      sortOrder: parsed.data.sortOrder,
      weddingId,
    },
  });

  revalidateTimelinePaths(weddingId);
  return { success: true as const };
}

export async function updateTimelineEntry(
  entryId: string,
  formData: FormData
) {
  const entry = await prisma.dayTimelineEntry.findUniqueOrThrow({
    where: { id: entryId },
  });

  await requireWeddingAccess(entry.weddingId);

  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      raw[key] = value === "" ? undefined : value;
    }
  }

  const parsed = timelineEntryUpdateSchema.safeParse(raw);

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

  await prisma.dayTimelineEntry.update({
    where: { id: entryId },
    data: {
      ...data,
      endTime: data.endTime ?? null,
      description: data.description ?? null,
      location: data.location ?? null,
      category: data.category ?? null,
    },
  });

  revalidateTimelinePaths(entry.weddingId);
  return { success: true as const };
}

export async function deleteTimelineEntry(entryId: string) {
  const entry = await prisma.dayTimelineEntry.findUniqueOrThrow({
    where: { id: entryId },
  });

  await requireWeddingAccess(entry.weddingId);

  await prisma.dayTimelineEntry.delete({
    where: { id: entryId },
  });

  revalidateTimelinePaths(entry.weddingId);
  return { success: true as const };
}

export async function createDefaultTimeline(weddingId: string) {
  await requireWeddingAccess(weddingId);

  const maxOrder = await prisma.dayTimelineEntry.aggregate({
    where: { weddingId },
    _max: { sortOrder: true },
  });
  const baseSortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  await prisma.dayTimelineEntry.createMany({
    data: DEFAULT_TIMELINE_ENTRIES.map((entry, index) => ({
      ...entry,
      weddingId,
      sortOrder: baseSortOrder + index,
    })),
  });

  revalidateTimelinePaths(weddingId);
  return { success: true as const };
}
