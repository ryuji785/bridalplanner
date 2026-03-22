import { requireWeddingAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { SeatingPrintActions } from "@/components/seating/seating-print-actions";

type PageProps = {
  params: { weddingId: string };
};

async function getSeatingPrintData(weddingId: string) {
  const [wedding, tables, unassignedGuests] = await Promise.all([
    prisma.wedding.findUniqueOrThrow({
      where: { id: weddingId },
      select: {
        title: true,
        weddingDate: true,
        venue: true,
      },
    }),
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
      select: {
        id: true,
        familyName: true,
        givenName: true,
        side: true,
        relationship: true,
      },
    }),
  ]);

  return { wedding, tables, unassignedGuests };
}

type SeatingTableWithAssignments = Awaited<
  ReturnType<typeof getSeatingPrintData>
>["tables"][number];

function getTableSize(shape: string) {
  return shape === "round"
    ? { width: 180, height: 180 }
    : { width: 220, height: 130 };
}

function getCanvasBounds(tables: SeatingTableWithAssignments[]) {
  if (tables.length === 0) {
    return { width: 960, height: 640, offsetX: 0, offsetY: 0 };
  }

  const padding = 60;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const table of tables) {
    const size = getTableSize(table.shape);
    minX = Math.min(minX, table.posX);
    minY = Math.min(minY, table.posY);
    maxX = Math.max(maxX, table.posX + size.width);
    maxY = Math.max(maxY, table.posY + size.height);
  }

  return {
    width: Math.max(960, maxX - minX + padding * 2),
    height: Math.max(640, maxY - minY + padding * 2),
    offsetX: padding - minX,
    offsetY: padding - minY,
  };
}

function getSeatPosition(index: number, total: number, shape: string) {
  if (shape === "round") {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radius = 72;
    return {
      left: `${50 + Math.cos(angle) * radius}%`,
      top: `${50 + Math.sin(angle) * radius}%`,
    };
  }

  const longSide = Math.ceil(total / 2);
  if (index < longSide) {
    const spacing = 100 / (longSide + 1);
    return {
      left: `${spacing * (index + 1)}%`,
      top: "-18px",
    };
  }

  const bottomCount = total - longSide;
  const spacing = 100 / (bottomCount + 1);
  return {
    left: `${spacing * (index - longSide + 1)}%`,
    top: "calc(100% + 18px)",
  };
}

function StaticTable({
  table,
  offsetX,
  offsetY,
}: {
  table: SeatingTableWithAssignments;
  offsetX: number;
  offsetY: number;
}) {
  const size = getTableSize(table.shape);
  const seats = Array.from({ length: table.capacity }, (_, index) => index);

  const getAssignment = (seatIndex: number) =>
    table.seatAssignments.find((assignment) => assignment.seatIndex === seatIndex);

  return (
    <div
      className="absolute"
      style={{
        left: table.posX + offsetX,
        top: table.posY + offsetY,
        width: size.width,
        height: size.height,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          margin: table.shape === "round" ? "-32px" : "-30px -12px",
        }}
      >
        {seats.map((seatIndex) => {
          const assignment = getAssignment(seatIndex);
          const position = getSeatPosition(seatIndex, table.capacity, table.shape);

          return (
            <div
              key={seatIndex}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: position.left, top: position.top }}
            >
              {assignment ? (
                <div
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                    assignment.guest.side === "bride"
                      ? "border-pink-300 bg-pink-50 text-pink-800"
                      : "border-blue-300 bg-blue-50 text-blue-800"
                  }`}
                >
                  {assignment.guest.familyName} {assignment.guest.givenName}
                </div>
              ) : (
                <div className="h-7 w-7 rounded-full border border-dashed border-slate-300 bg-white/70" />
              )}
            </div>
          );
        })}
      </div>

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center border-2 border-slate-300 bg-white shadow-sm ${
          table.shape === "round" ? "rounded-full" : "rounded-lg"
        }`}
      >
        <div className="text-sm font-semibold text-slate-800">{table.name}</div>
        <div className="mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
          {table.seatAssignments.length}/{table.capacity}
        </div>
      </div>
    </div>
  );
}

export default async function SeatingPrintPage({ params }: PageProps) {
  await requireWeddingAccess(params.weddingId);

  const { wedding, tables, unassignedGuests } = await getSeatingPrintData(
    params.weddingId
  );
  const bounds = getCanvasBounds(tables);

  return (
    <div className="mx-auto max-w-7xl space-y-8 bg-white px-6 py-8 text-slate-900 print:max-w-none print:px-0">
      <div className="flex flex-col gap-4 border-b pb-6 print:border-slate-300">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
              Seating Chart
            </p>
            <h1 className="mt-2 text-3xl font-bold">{wedding.title}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {formatDate(wedding.weddingDate)}
              {wedding.venue ? ` / ${wedding.venue}` : ""}
            </p>
          </div>
          <SeatingPrintActions weddingId={params.weddingId} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 print:text-xs">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
          新郎側
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-pink-400" />
          新婦側
        </span>
        <span>テーブル {tables.length} 卓</span>
        <span>未配置 {unassignedGuests.length} 名</span>
      </div>

      {tables.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-slate-500">
          印刷できるテーブル配置はまだ登録されていません。
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-slate-50 p-4 print:overflow-visible print:border-none print:bg-white print:p-0">
          <div
            className="relative mx-auto rounded-2xl border border-slate-200 bg-white"
            style={{ width: bounds.width, height: bounds.height }}
          >
            {tables.map((table) => (
              <StaticTable
                key={table.id}
                table={table}
                offsetX={bounds.offsetX}
                offsetY={bounds.offsetY}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">未配置ゲスト</h2>
        {unassignedGuests.length === 0 ? (
          <p className="text-sm text-slate-500">未配置のゲストはいません。</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unassignedGuests.map((guest) => (
              <span
                key={guest.id}
                className={`rounded-full border px-3 py-1 text-sm ${
                  guest.side === "bride"
                    ? "border-pink-300 bg-pink-50 text-pink-800"
                    : "border-blue-300 bg-blue-50 text-blue-800"
                }`}
              >
                {guest.familyName} {guest.givenName}
                <span className="ml-2 text-xs opacity-80">{guest.relationship}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
