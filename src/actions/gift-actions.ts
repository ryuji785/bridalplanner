"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWeddingAccess } from "@/lib/auth-helpers";
import { isMissingRecordError } from "@/lib/action-errors";
import {
  giftCreateSchema,
  giftUpdateSchema,
  giftGroupCreateSchema,
  giftGroupUpdateSchema,
  giftAssignmentSchema,
} from "@/lib/validators/gift";

function revalidateGiftPath(weddingId: string) {
  revalidatePath(`/weddings/${weddingId}/gifts`);
}

export async function getGifts(weddingId: string) {
  await requireWeddingAccess(weddingId);

  return prisma.gift.findMany({
    where: { weddingId },
    include: {
      assignments: {
        include: {
          guest: true,
          group: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createGift(weddingId: string, formData: FormData) {
  await requireWeddingAccess(weddingId);

  const raw = {
    name: formData.get("name") as string,
    category: (formData.get("category") as string) || undefined,
    unitPrice: Number(formData.get("unitPrice")),
    supplier: (formData.get("supplier") as string) || undefined,
    note: (formData.get("note") as string) || undefined,
  };

  const parsed = giftCreateSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.gift.create({
    data: {
      name: parsed.data.name,
      category: parsed.data.category || null,
      unitPrice: parsed.data.unitPrice,
      supplier: parsed.data.supplier || null,
      note: parsed.data.note || null,
      weddingId,
    },
  });

  revalidateGiftPath(weddingId);
  return { success: true as const };
}

export async function updateGift(giftId: string, formData: FormData) {
  const gift = await prisma.gift.findUnique({
    where: { id: giftId },
  });

  if (!gift) {
    return {
      success: false as const,
      error: "ギフトが見つかりません。",
    };
  }

  await requireWeddingAccess(gift.weddingId);

  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      raw[key] = value === "" ? undefined : value;
    }
  }

  if (raw.unitPrice !== undefined) {
    raw.unitPrice = Number(raw.unitPrice);
  }

  const parsed = giftUpdateSchema.safeParse(raw);

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

  try {
    await prisma.gift.update({
      where: { id: giftId },
      data: {
        ...data,
        category: data.category ?? null,
        supplier: data.supplier ?? null,
        note: data.note ?? null,
      },
    });
  } catch (error) {
    if (isMissingRecordError(error)) {
      return {
        success: false as const,
        error: "ギフトが見つかりません。",
      };
    }

    throw error;
  }

  revalidateGiftPath(gift.weddingId);
  return { success: true as const };
}

export async function deleteGift(giftId: string) {
  const gift = await prisma.gift.findUnique({
    where: { id: giftId },
  });

  if (!gift) {
    return { success: true as const };
  }

  await requireWeddingAccess(gift.weddingId);

  try {
    await prisma.gift.delete({
      where: { id: giftId },
    });
  } catch (error) {
    if (!isMissingRecordError(error)) {
      throw error;
    }
  }

  revalidateGiftPath(gift.weddingId);
  return { success: true as const };
}

export async function getGiftGroups(weddingId: string) {
  await requireWeddingAccess(weddingId);

  return prisma.giftGroup.findMany({
    where: { weddingId },
    include: {
      assignments: {
        include: {
          gift: true,
          guest: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createGiftGroup(weddingId: string, formData: FormData) {
  await requireWeddingAccess(weddingId);

  const parsed = giftGroupCreateSchema.safeParse({
    name: formData.get("name") as string,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.giftGroup.create({
    data: {
      name: parsed.data.name,
      weddingId,
    },
  });

  revalidateGiftPath(weddingId);
  return { success: true as const };
}

export async function updateGiftGroup(groupId: string, formData: FormData) {
  const group = await prisma.giftGroup.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    return {
      success: false as const,
      errors: { name: ["グループが見つかりません。"] },
    };
  }

  await requireWeddingAccess(group.weddingId);

  const parsed = giftGroupUpdateSchema.safeParse({
    name: formData.get("name") as string,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.giftGroup.update({
      where: { id: groupId },
      data: {
        name: parsed.data.name,
      },
    });
  } catch (error) {
    if (isMissingRecordError(error)) {
      return {
        success: false as const,
        errors: { name: ["グループが見つかりません。"] },
      };
    }

    throw error;
  }

  revalidateGiftPath(group.weddingId);
  return { success: true as const };
}

export async function deleteGiftGroup(groupId: string) {
  const group = await prisma.giftGroup.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    return { success: true as const };
  }

  await requireWeddingAccess(group.weddingId);

  await prisma.giftAssignment.deleteMany({
    where: { groupId },
  });

  try {
    await prisma.giftGroup.delete({
      where: { id: groupId },
    });
  } catch (error) {
    if (!isMissingRecordError(error)) {
      throw error;
    }
  }

  revalidateGiftPath(group.weddingId);
  return { success: true as const };
}

export async function assignGiftToGuest(
  giftId: string,
  guestId: string,
  quantity: number = 1
) {
  const gift = await prisma.gift.findUnique({
    where: { id: giftId },
  });

  if (!gift) {
    return {
      success: false as const,
      errors: { giftId: ["ギフトが見つかりません。"] },
    };
  }

  await requireWeddingAccess(gift.weddingId);

  const guest = await prisma.guest.findFirst({
    where: { id: guestId, weddingId: gift.weddingId },
    select: { id: true },
  });

  if (!guest) {
    return {
      success: false as const,
      errors: { guestId: ["割り当て先のゲストを選択してください"] },
    };
  }

  const parsed = giftAssignmentSchema.safeParse({ giftId, guestId, quantity });

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const existingAssignment = await prisma.giftAssignment.findFirst({
    where: {
      giftId,
      guestId,
      groupId: null,
    },
  });

  if (existingAssignment) {
    await prisma.giftAssignment.update({
      where: { id: existingAssignment.id },
      data: {
        quantity: existingAssignment.quantity + quantity,
      },
    });
  } else {
    await prisma.giftAssignment.create({
      data: {
        giftId,
        guestId,
        quantity,
      },
    });
  }

  revalidateGiftPath(gift.weddingId);
  return { success: true as const };
}

export async function assignGiftToGroup(
  giftId: string,
  groupId: string,
  quantity: number = 1
) {
  const gift = await prisma.gift.findUnique({
    where: { id: giftId },
  });

  if (!gift) {
    return {
      success: false as const,
      errors: { giftId: ["ギフトが見つかりません。"] },
    };
  }

  await requireWeddingAccess(gift.weddingId);

  const group = await prisma.giftGroup.findFirst({
    where: { id: groupId, weddingId: gift.weddingId },
    select: { id: true },
  });

  if (!group) {
    return {
      success: false as const,
      errors: { groupId: ["割り当て先のグループを選択してください"] },
    };
  }

  const parsed = giftAssignmentSchema.safeParse({ giftId, groupId, quantity });

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const existingAssignment = await prisma.giftAssignment.findFirst({
    where: {
      giftId,
      groupId,
      guestId: null,
    },
  });

  if (existingAssignment) {
    await prisma.giftAssignment.update({
      where: { id: existingAssignment.id },
      data: {
        quantity: existingAssignment.quantity + quantity,
      },
    });
  } else {
    await prisma.giftAssignment.create({
      data: {
        giftId,
        groupId,
        quantity,
      },
    });
  }

  revalidateGiftPath(gift.weddingId);
  return { success: true as const };
}

export async function removeGiftAssignment(assignmentId: string) {
  const assignment = await prisma.giftAssignment.findUnique({
    where: { id: assignmentId },
    include: { gift: true },
  });

  if (!assignment) {
    return { success: true as const };
  }

  await requireWeddingAccess(assignment.gift.weddingId);

  try {
    await prisma.giftAssignment.delete({
      where: { id: assignmentId },
    });
  } catch (error) {
    if (!isMissingRecordError(error)) {
      throw error;
    }
  }

  revalidateGiftPath(assignment.gift.weddingId);
  return { success: true as const };
}

export async function getGiftBudgetSummary(weddingId: string) {
  await requireWeddingAccess(weddingId);

  const gifts = await prisma.gift.findMany({
    where: { weddingId },
    include: {
      assignments: true,
    },
  });

  const totalItems = gifts.length;
  let totalCost = 0;
  let totalAssignments = 0;
  const assignedTargets = new Set<string>();

  const categoryBreakdown: Record<string, { count: number; totalCost: number }> = {
    main: { count: 0, totalCost: 0 },
    sweets: { count: 0, totalCost: 0 },
    petite: { count: 0, totalCost: 0 },
  };

  for (const gift of gifts) {
    const assignmentQuantity = gift.assignments.reduce(
      (sum, assignment) => sum + assignment.quantity,
      0
    );

    totalCost += gift.unitPrice * assignmentQuantity;
    totalAssignments += assignmentQuantity;

    gift.assignments.forEach((assignment) => {
      if (assignment.guestId) assignedTargets.add(`guest:${assignment.guestId}`);
      if (assignment.groupId) assignedTargets.add(`group:${assignment.groupId}`);
    });

    if (gift.category && categoryBreakdown[gift.category]) {
      categoryBreakdown[gift.category].count += assignmentQuantity;
      categoryBreakdown[gift.category].totalCost +=
        gift.unitPrice * assignmentQuantity;
    }
  }

  const assignedTargetCount = assignedTargets.size;
  const averagePerTarget =
    assignedTargetCount > 0 ? Math.round(totalCost / assignedTargetCount) : 0;

  return {
    totalItems,
    totalCost,
    averagePerTarget,
    totalAssignments,
    assignedTargetCount,
    categoryBreakdown,
  };
}
