"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWeddingAccess } from "@/lib/auth-helpers";
import { guestCreateSchema, guestUpdateSchema } from "@/lib/validators/guest";
import type { Prisma } from "@prisma/client";

export type GuestFilters = {
  side?: "bride" | "groom";
  attendanceStatus?: "pending" | "attending" | "declined";
  search?: string;
};

export async function getGuests(weddingId: string, filters?: GuestFilters) {
  await requireWeddingAccess(weddingId);

  const where: Prisma.GuestWhereInput = { weddingId };

  if (filters?.side) {
    where.side = filters.side;
  }

  if (filters?.attendanceStatus) {
    where.attendanceStatus = filters.attendanceStatus;
  }

  if (filters?.search) {
    const search = filters.search;
    where.OR = [
      { familyName: { contains: search } },
      { givenName: { contains: search } },
      { familyNameKana: { contains: search } },
      { givenNameKana: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const guests = await prisma.guest.findMany({
    where,
    orderBy: [
      { side: "asc" },
      { familyNameKana: "asc" },
      { givenNameKana: "asc" },
    ],
  });

  return guests;
}

export async function createGuest(weddingId: string, formData: FormData) {
  await requireWeddingAccess(weddingId);

  const raw = {
    familyName: formData.get("familyName") as string,
    givenName: formData.get("givenName") as string,
    familyNameKana: (formData.get("familyNameKana") as string) || undefined,
    givenNameKana: (formData.get("givenNameKana") as string) || undefined,
    relationship: formData.get("relationship") as string,
    side: formData.get("side") as string,
    attendanceStatus:
      (formData.get("attendanceStatus") as string) || "pending",
    postalCode: (formData.get("postalCode") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    dietaryRestrictions:
      (formData.get("dietaryRestrictions") as string) || undefined,
    allergies: (formData.get("allergies") as string) || undefined,
    note: (formData.get("note") as string) || undefined,
    plusOne: formData.get("plusOne") === "on",
    isChild: formData.get("isChild") === "on",
  };

  const parsed = guestCreateSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.guest.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      weddingId,
    },
  });

  revalidatePath(`/weddings/${weddingId}/guests`);

  return { success: true as const };
}

export async function updateGuest(guestId: string, formData: FormData) {
  const guest = await prisma.guest.findUniqueOrThrow({
    where: { id: guestId },
  });

  await requireWeddingAccess(guest.weddingId);

  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      raw[key] = value === "" ? undefined : value;
    }
  }
  raw.plusOne = formData.get("plusOne") === "on";
  raw.isChild = formData.get("isChild") === "on";

  const parsed = guestUpdateSchema.safeParse(raw);

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

  // Normalize empty email to null
  if (data.email === "") {
    data.email = null;
  }

  await prisma.guest.update({
    where: { id: guestId },
    data,
  });

  revalidatePath(`/weddings/${guest.weddingId}/guests`);

  return { success: true as const };
}

export async function deleteGuest(guestId: string) {
  const guest = await prisma.guest.findUniqueOrThrow({
    where: { id: guestId },
  });

  await requireWeddingAccess(guest.weddingId);

  await prisma.guest.delete({
    where: { id: guestId },
  });

  revalidatePath(`/weddings/${guest.weddingId}/guests`);

  return { success: true as const };
}

export async function updateAttendanceStatus(
  guestId: string,
  status: "pending" | "attending" | "declined"
) {
  const guest = await prisma.guest.findUniqueOrThrow({
    where: { id: guestId },
  });

  await requireWeddingAccess(guest.weddingId);

  await prisma.guest.update({
    where: { id: guestId },
    data: { attendanceStatus: status },
  });

  revalidatePath(`/weddings/${guest.weddingId}/guests`);

  return { success: true as const };
}
