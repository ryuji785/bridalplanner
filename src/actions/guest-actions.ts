"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWeddingAccess } from "@/lib/auth-helpers";
import { isMissingRecordError } from "@/lib/action-errors";
import { guestCreateSchema, guestUpdateSchema } from "@/lib/validators/guest";
import { parseGuestCsv } from "@/lib/guest-csv";
import type { Prisma } from "@prisma/client";

export type GuestFilters = {
  side?: "bride" | "groom";
  attendanceStatus?: "pending" | "attending" | "declined";
  search?: string;
};

export type GuestCsvImportResult =
  | { success: true; created: number; updated: number; total: number }
  | { success: false; errors: string[]; total: number };

function revalidateGuestPaths(weddingId: string) {
  revalidatePath(`/weddings/${weddingId}/guests`);
  revalidatePath(`/weddings/${weddingId}/seating`);
  revalidatePath(`/weddings/${weddingId}/gifts`);
}

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

  return prisma.guest.findMany({
    where,
    orderBy: [
      { side: "asc" },
      { familyNameKana: "asc" },
      { givenNameKana: "asc" },
      { familyName: "asc" },
      { givenName: "asc" },
    ],
  });
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

  revalidateGuestPaths(weddingId);

  return { success: true as const };
}

export async function updateGuest(guestId: string, formData: FormData) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
  });

  if (!guest) {
    return {
      success: false as const,
      error: "ゲストが見つかりません。",
    };
  }

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

  if (data.email === "") {
    data.email = null;
  }

  try {
    await prisma.guest.update({
      where: { id: guestId },
      data,
    });
  } catch (error) {
    if (isMissingRecordError(error)) {
      return {
        success: false as const,
        error: "ゲストが見つかりません。",
      };
    }

    throw error;
  }

  revalidateGuestPaths(guest.weddingId);

  return { success: true as const };
}

export async function deleteGuest(guestId: string) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
  });

  if (!guest) {
    return { success: true as const };
  }

  await requireWeddingAccess(guest.weddingId);

  try {
    await prisma.guest.delete({
      where: { id: guestId },
    });
  } catch (error) {
    if (!isMissingRecordError(error)) {
      throw error;
    }
  }

  revalidateGuestPaths(guest.weddingId);

  return { success: true as const };
}

export async function updateAttendanceStatus(
  guestId: string,
  status: "pending" | "attending" | "declined"
) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
  });

  if (!guest) {
    return {
      success: false as const,
      error: "ゲストが見つかりません。",
    };
  }

  await requireWeddingAccess(guest.weddingId);

  try {
    await prisma.guest.update({
      where: { id: guestId },
      data: { attendanceStatus: status },
    });
  } catch (error) {
    if (isMissingRecordError(error)) {
      return {
        success: false as const,
        error: "ゲストが見つかりません。",
      };
    }

    throw error;
  }

  revalidateGuestPaths(guest.weddingId);

  return { success: true as const };
}

export async function importGuestsFromCsv(
  weddingId: string,
  csvText: string
): Promise<GuestCsvImportResult> {
  await requireWeddingAccess(weddingId);

  const parsed = parseGuestCsv(csvText);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.errors,
      total: 0,
    };
  }

  const existingGuests = await prisma.guest.findMany({
    where: { weddingId },
    select: { id: true },
  });
  const existingIds = new Set(existingGuests.map((guest) => guest.id));

  const missingIdErrors = parsed.rows
    .filter((row) => row.id && !existingIds.has(row.id))
    .map((row) => `${row.rowNumber}行目: 指定された id のゲストはこの結婚式に存在しません。`);

  if (missingIdErrors.length > 0) {
    return {
      success: false,
      errors: missingIdErrors,
      total: parsed.rows.length,
    };
  }

  let created = 0;
  let updated = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of parsed.rows) {
      if (row.id) {
        await tx.guest.update({
          where: { id: row.id },
          data: row.data,
        });
        updated += 1;
      } else {
        await tx.guest.create({
          data: {
            ...row.data,
            weddingId,
          },
        });
        created += 1;
      }
    }
  });

  revalidateGuestPaths(weddingId);

  return {
    success: true,
    created,
    updated,
    total: parsed.rows.length,
  };
}
