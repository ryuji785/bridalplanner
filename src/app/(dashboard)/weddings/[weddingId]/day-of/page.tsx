import { requireWeddingAccess } from "@/lib/auth-helpers";
import { getTimelineEntries } from "@/actions/timeline-actions";
import { TimelineEditor } from "@/components/day-of/timeline-editor";
import { TimelinePageHeader } from "./timeline-page-header";

type PageProps = {
  params: { weddingId: string };
};

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatDuration(entries: Awaited<ReturnType<typeof getTimelineEntries>>) {
  if (entries.length === 0) return "";

  const first = entries[0];
  const last = entries[entries.length - 1];
  const diffMinutes = Math.max(
    0,
    toMinutes(last.endTime ?? last.startTime) - toMinutes(first.startTime)
  );

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours === 0) {
    return `${minutes}分`;
  }

  return `${hours}時間${minutes > 0 ? ` ${minutes}分` : ""}`;
}

export default async function DayOfPage({ params }: PageProps) {
  await requireWeddingAccess(params.weddingId);

  const entries = await getTimelineEntries(params.weddingId);

  return (
    <div className="space-y-6">
      <TimelinePageHeader
        weddingId={params.weddingId}
        entryCount={entries.length}
        totalDuration={formatDuration(entries)}
        hasEntries={entries.length > 0}
      />

      <TimelineEditor entries={entries} weddingId={params.weddingId} />
    </div>
  );
}
