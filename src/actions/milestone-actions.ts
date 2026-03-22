"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWeddingAccess } from "@/lib/auth-helpers";
import { isMissingRecordError } from "@/lib/action-errors";
import {
  milestoneSchema,
  updateMilestoneSchema,
  taskSchema,
} from "@/lib/validators/milestone";

export async function getMilestones(weddingId: string) {
  await requireWeddingAccess(weddingId);

  return prisma.milestone.findMany({
    where: { weddingId },
    include: { tasks: true },
    orderBy: { dueDate: "asc" },
  });
}

export async function createMilestone(weddingId: string, data: unknown) {
  await requireWeddingAccess(weddingId);

  const parsed = milestoneSchema.parse(data);

  const milestone = await prisma.milestone.create({
    data: {
      title: parsed.title,
      description: parsed.description,
      dueDate: new Date(parsed.dueDate),
      status: parsed.status,
      category: parsed.category,
      sortOrder: parsed.sortOrder,
      weddingId,
    },
  });

  revalidatePath(`/weddings/${weddingId}/schedule`);
  return milestone;
}

export async function updateMilestone(milestoneId: string, data: unknown) {
  const parsed = updateMilestoneSchema.parse(data);

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
  });

  if (!milestone) {
    return null;
  }

  await requireWeddingAccess(milestone.weddingId);

  const updateData: Record<string, unknown> = {};
  if (parsed.title !== undefined) updateData.title = parsed.title;
  if (parsed.description !== undefined) updateData.description = parsed.description;
  if (parsed.dueDate !== undefined) updateData.dueDate = new Date(parsed.dueDate);
  if (parsed.status !== undefined) updateData.status = parsed.status;
  if (parsed.category !== undefined) updateData.category = parsed.category;
  if (parsed.sortOrder !== undefined) updateData.sortOrder = parsed.sortOrder;

  let updated = null;

  try {
    updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData,
    });
  } catch (error) {
    if (!isMissingRecordError(error)) {
      throw error;
    }
  }

  revalidatePath(`/weddings/${milestone.weddingId}/schedule`);
  return updated;
}

export async function deleteMilestone(milestoneId: string) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
  });

  if (!milestone) {
    return;
  }

  await requireWeddingAccess(milestone.weddingId);

  try {
    await prisma.milestone.delete({
      where: { id: milestoneId },
    });
  } catch (error) {
    if (!isMissingRecordError(error)) {
      throw error;
    }
  }

  revalidatePath(`/weddings/${milestone.weddingId}/schedule`);
}

export async function createTask(milestoneId: string, data: unknown) {
  const parsed = taskSchema.parse(data);

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
  });

  if (!milestone) {
    return null;
  }

  await requireWeddingAccess(milestone.weddingId);

  const task = await prisma.task.create({
    data: {
      title: parsed.title,
      assignee: parsed.assignee,
      note: parsed.note,
      milestoneId,
    },
  });

  revalidatePath(`/weddings/${milestone.weddingId}/schedule`);
  return task;
}

export async function toggleTask(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { milestone: true },
  });

  if (!task) {
    return null;
  }

  await requireWeddingAccess(task.milestone.weddingId);

  let updated = null;

  try {
    updated = await prisma.task.update({
      where: { id: taskId },
      data: { done: !task.done },
    });
  } catch (error) {
    if (!isMissingRecordError(error)) {
      throw error;
    }
  }

  revalidatePath(`/weddings/${task.milestone.weddingId}/schedule`);
  return updated;
}

export async function deleteTask(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { milestone: true },
  });

  if (!task) {
    return;
  }

  await requireWeddingAccess(task.milestone.weddingId);

  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
  } catch (error) {
    if (!isMissingRecordError(error)) {
      throw error;
    }
  }

  revalidatePath(`/weddings/${task.milestone.weddingId}/schedule`);
}

export async function createDefaultMilestones(
  weddingId: string,
  weddingDate: Date | string
) {
  await requireWeddingAccess(weddingId);

  const date = typeof weddingDate === "string" ? new Date(weddingDate) : weddingDate;

  function monthsBefore(months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() - months);
    return d;
  }

  function weeksBefore(weeks: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() - weeks * 7);
    return d;
  }

  const template = [
    {
      title: "会場見学・決定",
      description: "式場の見学と最終決定",
      dueDate: monthsBefore(6),
      category: "会場",
      sortOrder: 1,
      tasks: [
        { title: "候補会場のリストアップ", assignee: "couple" },
        { title: "ブライダルフェア参加", assignee: "couple" },
        { title: "見積もり比較", assignee: "planner" },
        { title: "会場契約手続き", assignee: "planner" },
      ],
    },
    {
      title: "招待客リスト作成",
      description: "ゲストリストの作成と人数確定",
      dueDate: monthsBefore(6),
      category: "招待状",
      sortOrder: 2,
      tasks: [
        { title: "新郎側ゲストリスト作成", assignee: "couple" },
        { title: "新婦側ゲストリスト作成", assignee: "couple" },
        { title: "人数調整・最終確認", assignee: "planner" },
      ],
    },
    {
      title: "衣装選び",
      description: "ウェディングドレス・タキシードの試着と決定",
      dueDate: monthsBefore(4),
      category: "衣装",
      sortOrder: 3,
      tasks: [
        { title: "ドレスショップ予約", assignee: "planner" },
        { title: "ウェディングドレス試着", assignee: "couple" },
        { title: "カラードレス試着", assignee: "couple" },
        { title: "タキシード試着", assignee: "couple" },
        { title: "小物（ティアラ・ベール等）選定", assignee: "couple" },
      ],
    },
    {
      title: "前撮り準備",
      description: "前撮り撮影の手配と実施",
      dueDate: monthsBefore(4),
      category: "写真",
      sortOrder: 4,
      tasks: [
        { title: "フォトグラファー手配", assignee: "planner" },
        { title: "ロケーション決定", assignee: "couple" },
        { title: "前撮り撮影実施", assignee: "couple" },
      ],
    },
    {
      title: "招待状準備・発送",
      description: "招待状のデザイン作成と発送",
      dueDate: monthsBefore(3),
      category: "招待状",
      sortOrder: 5,
      tasks: [
        { title: "招待状デザイン決定", assignee: "couple" },
        { title: "宛名リスト最終確認", assignee: "planner" },
        { title: "印刷手配", assignee: "planner" },
        { title: "招待状発送", assignee: "planner" },
      ],
    },
    {
      title: "ブーケ・装花決定",
      description: "会場装花とブーケのデザイン決定",
      dueDate: monthsBefore(3),
      category: "装花",
      sortOrder: 6,
      tasks: [
        { title: "フローリストとの打ち合わせ", assignee: "planner" },
        { title: "ブーケデザイン決定", assignee: "couple" },
        { title: "会場装花イメージ決定", assignee: "couple" },
        { title: "装花見積もり確認", assignee: "planner" },
      ],
    },
    {
      title: "料理・ドリンク決定",
      description: "披露宴の料理コースとドリンクプラン決定",
      dueDate: monthsBefore(2),
      category: "料理",
      sortOrder: 7,
      tasks: [
        { title: "料理試食会参加", assignee: "couple" },
        { title: "コース内容決定", assignee: "couple" },
        { title: "ドリンクプラン決定", assignee: "couple" },
        { title: "アレルギー対応確認", assignee: "planner" },
      ],
    },
    {
      title: "引き出物選定",
      description: "引き出物・引き菓子の選定",
      dueDate: monthsBefore(2),
      category: "引き出物",
      sortOrder: 8,
      tasks: [
        { title: "引き出物カタログ確認", assignee: "couple" },
        { title: "引き菓子選定", assignee: "couple" },
        { title: "贈り分けリスト作成", assignee: "planner" },
      ],
    },
    {
      title: "席次表作成",
      description: "披露宴の席次表作成",
      dueDate: monthsBefore(2),
      category: "その他",
      sortOrder: 9,
      tasks: [
        { title: "テーブルレイアウト決定", assignee: "planner" },
        { title: "席次案作成", assignee: "couple" },
        { title: "席次表デザイン決定", assignee: "couple" },
      ],
    },
    {
      title: "最終打ち合わせ",
      description: "会場との最終打ち合わせ",
      dueDate: monthsBefore(1),
      category: "会場",
      sortOrder: 10,
      tasks: [
        { title: "会場との最終確認", assignee: "planner" },
        { title: "司会者との打ち合わせ", assignee: "planner" },
        { title: "ヘアメイクリハーサル", assignee: "couple" },
      ],
    },
    {
      title: "進行表確認",
      description: "当日の進行スケジュール確認",
      dueDate: monthsBefore(1),
      category: "その他",
      sortOrder: 11,
      tasks: [
        { title: "進行表ドラフト作成", assignee: "planner" },
        { title: "演出内容最終確認", assignee: "couple" },
        { title: "スピーチ・余興依頼確認", assignee: "couple" },
      ],
    },
    {
      title: "BGM決定",
      description: "各シーンのBGM選曲",
      dueDate: monthsBefore(1),
      category: "音楽",
      sortOrder: 12,
      tasks: [
        { title: "入場曲決定", assignee: "couple" },
        { title: "ケーキ入刀・乾杯曲決定", assignee: "couple" },
        { title: "歓談中BGM決定", assignee: "couple" },
        { title: "退場曲決定", assignee: "couple" },
        { title: "音源手配", assignee: "planner" },
      ],
    },
    {
      title: "席次表最終確認",
      description: "席次表の最終チェックと印刷",
      dueDate: weeksBefore(2),
      category: "その他",
      sortOrder: 13,
      tasks: [
        { title: "出欠最終確認", assignee: "planner" },
        { title: "席次表最終校正", assignee: "couple" },
        { title: "席次表印刷手配", assignee: "planner" },
      ],
    },
    {
      title: "引き出物発注",
      description: "引き出物の最終発注",
      dueDate: weeksBefore(2),
      category: "引き出物",
      sortOrder: 14,
      tasks: [
        { title: "個数最終確認", assignee: "planner" },
        { title: "発注手続き", assignee: "planner" },
        { title: "納品日確認", assignee: "planner" },
      ],
    },
    {
      title: "最終確認",
      description: "結婚式前の最終チェック",
      dueDate: weeksBefore(1),
      category: "その他",
      sortOrder: 15,
      tasks: [
        { title: "持ち物リスト確認", assignee: "couple" },
        { title: "お車代・お心付け準備", assignee: "couple" },
        { title: "各業者への最終連絡", assignee: "planner" },
      ],
    },
    {
      title: "当日スケジュール確認",
      description: "挙式・披露宴当日の流れ最終確認",
      dueDate: weeksBefore(1),
      category: "会場",
      sortOrder: 16,
      tasks: [
        { title: "タイムスケジュール最終確認", assignee: "planner" },
        { title: "緊急連絡先リスト作成", assignee: "planner" },
        { title: "当日の動き最終リハーサル", assignee: "couple" },
      ],
    },
  ];

  for (const item of template) {
    await prisma.milestone.create({
      data: {
        title: item.title,
        description: item.description,
        dueDate: item.dueDate,
        category: item.category,
        sortOrder: item.sortOrder,
        weddingId,
        tasks: {
          create: item.tasks.map((t) => ({
            title: t.title,
            assignee: t.assignee,
          })),
        },
      },
    });
  }

  revalidatePath(`/weddings/${weddingId}/schedule`);
}
