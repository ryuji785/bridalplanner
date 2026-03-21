import { requireWeddingAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { getTimelineEntries } from "@/actions/timeline-actions";
import { TimelinePrintActions } from "@/components/day-of/timeline-print-actions";

type PageProps = {
  params: { weddingId: string };
};

const categoryLabels: Record<string, string> = {
  preparation: "準備",
  ceremony: "挙式",
  reception: "披露宴",
};

export default async function DayOfPrintPage({ params }: PageProps) {
  await requireWeddingAccess(params.weddingId);

  const [wedding, entries] = await Promise.all([
    prisma.wedding.findUniqueOrThrow({
      where: { id: params.weddingId },
      select: {
        title: true,
        weddingDate: true,
        venue: true,
      },
    }),
    getTimelineEntries(params.weddingId),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 bg-white px-6 py-8 text-slate-900 print:max-w-none print:px-0">
      <div className="flex flex-col gap-4 border-b pb-6 print:border-slate-300">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
              Day Of Timeline
            </p>
            <h1 className="mt-2 text-3xl font-bold">{wedding.title}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {formatDate(wedding.weddingDate)}
              {wedding.venue ? ` / ${wedding.venue}` : ""}
            </p>
          </div>
          <TimelinePrintActions weddingId={params.weddingId} />
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-slate-500">
          印刷できるタイムラインはまだ登録されていません。
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="grid gap-3 rounded-xl border border-slate-200 p-4 print:break-inside-avoid"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="min-w-[76px] text-lg font-semibold tracking-tight">
                    {entry.startTime}
                    {entry.endTime ? (
                      <span className="ml-1 text-sm font-normal text-slate-500">
                        - {entry.endTime}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{entry.title}</h2>
                    {entry.description ? (
                      <p className="mt-1 text-sm text-slate-600">
                        {entry.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {entry.category ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      {categoryLabels[entry.category] ?? entry.category}
                    </span>
                  ) : null}
                  {entry.location ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      {entry.location}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
