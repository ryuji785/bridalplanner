"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWeddingAccess } from "@/lib/auth-helpers";
import { isMissingRecordError } from "@/lib/action-errors";

export async function getSeatingData(weddingId: string) {
  await requireWeddingAccess(weddingId);

  const [tables, unassignedGuests] = await Promise.all([
    prisma.seatingTable.findMany({
      where: { weddingId },
      include: {
        seatAssignments: {
          include: {
            guest: {
              select: {
                id: true,
                familyName: true,
                givenName: true,
                side: true,
                relationship: true,
              },
            },
          },
          orderBy: { seatIndex: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.guest.findMany({
      where: {
        weddingId,
        attendanceStatus: "attending",
        seatAssignment: null,
      },
      orderBy: [
        { side: "asc" },
        { relationship: "asc" },
        { familyName: "asc" },
        { givenName: "asc" },
      ],
    }),
  ]);

  return { tables, unassignedGuests };
}

export type SeatingData = Awaited<ReturnType<typeof getSeatingData>>;
export type SeatingTable = SeatingData["tables"][number];
export type SeatAssignment = SeatingTable["seatAssignments"][number];

export async function createTable(
  weddingId: string,
  data: { name: string; shape: string; capacity: number }
) {
  await requireWeddingAccess(weddingId);

  const maxOrder = await prisma.seatingTable.aggregate({
    where: { weddingId },
    _max: { sortOrder: true },
  });

  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  const tableCount = await prisma.seatingTable.count({ where: { weddingId } });
  const col = tableCount % 3;
  const row = Math.floor(tableCount / 3);
  const posX = 100 + col * 250;
  const posY = 100 + row * 250;

  const table = await prisma.seatingTable.create({
    data: {
      name: data.name,
      shape: data.shape,
      capacity: data.capacity,
      posX,
      posY,
      sortOrder,
      weddingId,
    },
  });

  revalidatePath(`/weddings/${weddingId}/seating`);
  return { success: true as const, table };
}

export async function updateTable(
  tableId: string,
  data: { name?: string; shape?: string; capacity?: number; posX?: number; posY?: number }
) {
  const table = await prisma.seatingTable.findUnique({
    where: { id: tableId },
    include: {
      seatAssignments: {
        select: { seatIndex: true },
      },
    },
  });

  if (!table) {
    return {
      success: false as const,
      error: "テーブルが見つかりません。",
    };
  }

  await requireWeddingAccess(table.weddingId);

  if (data.capacity !== undefined) {
    const minimumCapacity = Math.max(
      2,
      ...table.seatAssignments.map((assignment) => assignment.seatIndex + 1)
    );

    if (data.capacity < minimumCapacity) {
      return {
        success: false as const,
        error: `収容人数は ${minimumCapacity} 名以上にしてください。`,
      };
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.shape !== undefined) updateData.shape = data.shape;
  if (data.capacity !== undefined) updateData.capacity = data.capacity;
  if (data.posX !== undefined) updateData.posX = data.posX;
  if (data.posY !== undefined) updateData.posY = data.posY;

  try {
    await prisma.seatingTable.update({
      where: { id: tableId },
      data: updateData,
    });
  } catch (error) {
    if (isMissingRecordError(error)) {
      return {
        success: false as const,
        error: "テーブルが見つかりません。",
      };
    }

    throw error;
  }

  revalidatePath(`/weddings/${table.weddingId}/seating`);
  return { success: true as const };
}

export async function deleteTable(tableId: string) {
  const table = await prisma.seatingTable.findUnique({
    where: { id: tableId },
  });

  if (!table) {
    return { success: true as const };
  }

  await requireWeddingAccess(table.weddingId);

  try {
    await prisma.seatingTable.delete({
      where: { id: tableId },
    });
  } catch (error) {
    if (!isMissingRecordError(error)) {
      throw error;
    }
  }

  revalidatePath(`/weddings/${table.weddingId}/seating`);
  return { success: true as const };
}

export async function updateTablePosition(
  tableId: string,
  posX: number,
  posY: number
) {
  const table = await prisma.seatingTable.findUnique({
    where: { id: tableId },
  });

  if (!table) {
    return { success: true as const };
  }

  await requireWeddingAccess(table.weddingId);

  try {
    await prisma.seatingTable.update({
      where: { id: tableId },
      data: { posX, posY },
    });
  } catch (error) {
    if (!isMissingRecordError(error)) {
      throw error;
    }
  }

  revalidatePath(`/weddings/${table.weddingId}/seating`);
  return { success: true as const };
}

export async function assignGuestToSeat(
  guestId: string,
  tableId: string,
  seatIndex: number
) {
  const table = await prisma.seatingTable.findUnique({
    where: { id: tableId },
  });

  if (!table) {
    return {
      success: false as const,
      error: "テーブルが見つかりません。",
    };
  }

  await requireWeddingAccess(table.weddingId);

  if (seatIndex < 0 || seatIndex >= table.capacity) {
    return {
      success: false as const,
      error: "存在しない席が指定されました。",
    };
  }

  const occupiedSeat = await prisma.seatAssignment.findFirst({
    where: {
      tableId,
      seatIndex,
    },
    select: { id: true },
  });

  if (occupiedSeat) {
    return {
      success: false as const,
      error: "その席はすでに使用されています。",
    };
  }

  await prisma.seatAssignment.deleteMany({
    where: { guestId },
  });

  try {
    await prisma.seatAssignment.create({
      data: {
        guestId,
        tableId,
        seatIndex,
      },
    });
  } catch (error) {
    if (isMissingRecordError(error)) {
      return {
        success: false as const,
        error: "テーブルが見つかりません。",
      };
    }

    throw error;
  }

  revalidatePath(`/weddings/${table.weddingId}/seating`);
  return { success: true as const };
}

export async function removeGuestFromSeat(guestId: string) {
  const assignment = await prisma.seatAssignment.findUnique({
    where: { guestId },
    include: { table: true },
  });

  if (!assignment) {
    return { success: true as const };
  }

  await requireWeddingAccess(assignment.table.weddingId);

  await prisma.seatAssignment.delete({
    where: { guestId },
  });

  revalidatePath(`/weddings/${assignment.table.weddingId}/seating`);
  return { success: true as const };
}

export async function autoAssignGuests(weddingId: string) {
  await requireWeddingAccess(weddingId);

  const [tables, unassignedGuests] = await Promise.all([
    prisma.seatingTable.findMany({
      where: { weddingId },
      include: {
        seatAssignments: true,
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.guest.findMany({
      where: {
        weddingId,
        attendanceStatus: "attending",
        seatAssignment: null,
      },
      orderBy: [
        { side: "asc" },
        { relationship: "asc" },
        { familyName: "asc" },
      ],
    }),
  ]);

  if (tables.length === 0 || unassignedGuests.length === 0) {
    return { success: true as const, assigned: 0 };
  }

  const grouped: Record<string, typeof unassignedGuests> = {};
  for (const guest of unassignedGuests) {
    const key = `${guest.side}_${guest.relationship}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(guest);
  }

  const tableSeats = tables.map((table) => {
    const occupied = new Set(table.seatAssignments.map((assignment) => assignment.seatIndex));
    const available: number[] = [];
    for (let index = 0; index < table.capacity; index += 1) {
      if (!occupied.has(index)) available.push(index);
    }
    return { tableId: table.id, available };
  });

  const assignments: { guestId: string; tableId: string; seatIndex: number }[] = [];
  let tableIdx = 0;

  for (const guests of Object.values(grouped)) {
    for (const guest of guests) {
      let attempts = 0;
      while (
        attempts < tableSeats.length &&
        tableSeats[tableIdx].available.length === 0
      ) {
        tableIdx = (tableIdx + 1) % tableSeats.length;
        attempts += 1;
      }

      if (attempts >= tableSeats.length) break;

      const seat = tableSeats[tableIdx];
      const seatIndex = seat.available.shift()!;
      assignments.push({
        guestId: guest.id,
        tableId: seat.tableId,
        seatIndex,
      });

      if (seat.available.length === 0) {
        tableIdx = (tableIdx + 1) % tableSeats.length;
      }
    }

    if (tableSeats[tableIdx].available.length === 0 || assignments.length > 0) {
      const nextIdx = (tableIdx + 1) % tableSeats.length;
      if (tableSeats[nextIdx].available.length > 0) {
        tableIdx = nextIdx;
      }
    }
  }

  if (assignments.length > 0) {
    await prisma.seatAssignment.createMany({
      data: assignments,
    });
  }

  revalidatePath(`/weddings/${weddingId}/seating`);
  return { success: true as const, assigned: assignments.length };
}

export async function clearAllAssignments(weddingId: string) {
  await requireWeddingAccess(weddingId);

  const tableIds = await prisma.seatingTable.findMany({
    where: { weddingId },
    select: { id: true },
  });

  await prisma.seatAssignment.deleteMany({
    where: {
      tableId: { in: tableIds.map((table) => table.id) },
    },
  });

  revalidatePath(`/weddings/${weddingId}/seating`);
  return { success: true as const };
}
