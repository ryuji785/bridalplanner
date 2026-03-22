import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatGuestCsv } from "@/lib/guest-csv";

type RouteContext = {
  params: { weddingId: string };
};

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const membership = await prisma.weddingMember.findUnique({
    where: {
      userId_weddingId: {
        userId: session.user.id,
        weddingId: params.weddingId,
      },
    },
  });

  if (!membership) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const guests = await prisma.guest.findMany({
    where: { weddingId: params.weddingId },
    orderBy: [
      { side: "asc" },
      { familyNameKana: "asc" },
      { givenNameKana: "asc" },
      { familyName: "asc" },
      { givenName: "asc" },
    ],
    select: {
      id: true,
      familyName: true,
      givenName: true,
      familyNameKana: true,
      givenNameKana: true,
      relationship: true,
      side: true,
      attendanceStatus: true,
      postalCode: true,
      address: true,
      email: true,
      phone: true,
      dietaryRestrictions: true,
      allergies: true,
      note: true,
      plusOne: true,
      isChild: true,
    },
  });

  const csv = formatGuestCsv(guests);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="guest-list.csv"',
      "Cache-Control": "no-store",
    },
  });
}
