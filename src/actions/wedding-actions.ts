"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, requirePlannerRole } from "@/lib/auth-helpers";

const createWeddingSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  weddingDate: z.string().min(1, "日付を入力してください"),
  venue: z.string().optional(),
  budget: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .pipe(z.number().positive("予算は正の数を入力してください").optional()),
});

const updateWeddingSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").optional(),
  weddingDate: z.string().min(1, "日付を入力してください").optional(),
  venue: z.string().optional(),
  budget: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .pipe(z.number().positive("予算は正の数を入力してください").optional()),
  status: z.enum(["planning", "confirmed", "completed"]).optional(),
  notes: z.string().optional(),
});

export async function createWedding(formData: FormData) {
  const user = await requireAuth();

  const raw = {
    title: formData.get("title") as string,
    weddingDate: formData.get("weddingDate") as string,
    venue: (formData.get("venue") as string) || undefined,
    budget: (formData.get("budget") as string) || undefined,
  };

  const parsed = createWeddingSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const wedding = await prisma.wedding.create({
    data: {
      title: parsed.data.title,
      weddingDate: new Date(parsed.data.weddingDate),
      venue: parsed.data.venue || null,
      budget: parsed.data.budget ?? null,
      members: {
        create: {
          userId: user.id,
          role: "planner",
        },
      },
    },
  });

  revalidatePath("/dashboard");

  return { success: true as const, weddingId: wedding.id };
}

export async function updateWedding(weddingId: string, formData: FormData) {
  await requirePlannerRole(weddingId);

  const raw: Record<string, string | undefined> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && value !== "") {
      raw[key] = value;
    }
  }

  const parsed = updateWeddingSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.weddingDate !== undefined)
    data.weddingDate = new Date(parsed.data.weddingDate);
  if (parsed.data.venue !== undefined) data.venue = parsed.data.venue || null;
  if (parsed.data.budget !== undefined) data.budget = parsed.data.budget ?? null;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes || null;

  await prisma.wedding.update({
    where: { id: weddingId },
    data,
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/dashboard");

  return { success: true as const };
}

export async function deleteWedding(weddingId: string) {
  await requirePlannerRole(weddingId);

  await prisma.wedding.delete({
    where: { id: weddingId },
  });

  revalidatePath("/dashboard");

  return { success: true as const };
}
