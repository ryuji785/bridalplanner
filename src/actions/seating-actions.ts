"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWeddingAccess } from "@/lib/auth-helpers";

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

  // Position new tables in a grid pattern
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
  const table = await prisma.seatingTable.findUniqueOrThrow({
    where: { id: tableId },
  });

  await requireWeddingAccess(table.weddingId);

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.shape !== undefined) updateData.shape = data.shape;
  if (data.capacity !== undefined) updateData.capacity = data.capacity;
  if (data.posX !== undefined) updateData.posX = data.posX;
  if (data.posY !== undefined) updateData.posY = data.posY;

  await prisma.seatingTable.update({
    where: { id: tableId },
    data: updateData,
  });

  revalidatePath(`/weddings/${table.weddingId}/seating`);
  return { success: true as const };
}

export async function deleteTable(tableId: string) {
  const table = await prisma.seatingTable.findUniqueOrThrow({
    where: { id: tableId },
  });

  await requireWeddingAccess(table.weddingId);

  await prisma.seatingTable.delete({
    where: { id: tableId },
  });

  revalidatePath(`/weddings/${table.weddingId}/seating`);
  return { success: true as const };
}

export async function updateTablePosition(
  tableId: string,
  posX: number,
  posY: number
) {
  const table = await prisma.seatingTable.findUniqueOrThrow({
    where: { id: tableId },
  });

  await requireWeddingAccess(table.weddingId);

  await prisma.seatingTable.update({
    where: { id: tableId },
    data: { posX, posY },
  });

  revalidatePath(`/weddings/${table.weddingId}/seating`);
  return { success: true as const };
}

export async function assignGuestToSeat(
  guestId: string,
  tableId: string,
  seatIndex: number
) {
  const table = await prisma.seatingTable.findUniqueOrThrow({
    where: { id: tableId },
  });

  await requireWeddingAccess(table.weddingId);

  // Remove existing assignment if any
  await prisma.seatAssignment.deleteMany({
    where: { guestId },
  });

  await prisma.seatAssignment.create({
    data: {
      guestId,
      tableId,
      seatIndex,
    },
  });

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

  // Group guests by side and relationship
  const grouped: Record<string, typeof unassignedGuests> = {};
  for (const guest of unassignedGuests) {
    const key = `${guest.side}_${guest.relationship}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(guest);
  }

  // Build available seats per table
  const tableSeats = tables.map((t) => {
    const occupied = new Set(t.seatAssignments.map((sa) => sa.seatIndex));
    const available: number[] = [];
    for (let i = 0; i < t.capacity; i++) {
      if (!occupied.has(i)) available.push(i);
    }
    return { tableId: t.id, available };
  });

  const assignments: { guestId: string; tableId: string; seatIndex: number }[] = [];
  let tableIdx = 0;

  // Assign groups to tables, trying to keep groups together
  for (const guests of Object.values(grouped)) {
    for (const guest of guests) {
      // Find next table with available seats
      let attempts = 0;
      while (
        attempts < tableSeats.length &&
        tableSeats[tableIdx].available.length === 0
      ) {
        tableIdx = (tableIdx + 1) % tableSeats.length;
        attempts++;
      }

      if (attempts >= tableSeats.length) break; // No more seats

      const seat = tableSeats[tableIdx];
      const seatIndex = seat.available.shift()!;
      assignments.push({
        guestId: guest.id,
        tableId: seat.tableId,
        seatIndex,
      });

      // Move to next table when current is full
      if (seat.available.length === 0) {
        tableIdx = (tableIdx + 1) % tableSeats.length;
      }
    }
    // After each group, advance to next table if possible
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
      tableId: { in: tableIds.map((t) => t.id) },
    },
  });

  revalidatePath(`/weddings/${weddingId}/seating`);
  return { success: true as const };
}
