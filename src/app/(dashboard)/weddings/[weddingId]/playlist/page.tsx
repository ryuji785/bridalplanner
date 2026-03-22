import { requireWeddingAccess } from "@/lib/auth-helpers";
import { getPlaylist } from "@/actions/playlist-actions";
import { PlaylistPageHeader } from "@/components/playlist/playlist-page-header";
import { SectionList } from "@/components/playlist/section-list";

type Props = {
  params: { weddingId: string };
};

function formatTotalDuration(seconds: number) {
  if (seconds <= 0) return "";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}時間 ${minutes}分`;
  }

  return `${minutes}分`;
}

export default async function PlaylistPage({ params }: Props) {
  await requireWeddingAccess(params.weddingId);

  const sections = await getPlaylist(params.weddingId);
  const songCount = sections.reduce(
    (sum, section) => sum + section.songs.length,
    0
  );
  const totalDurationSec = sections.reduce(
    (sum, section) =>
      sum + section.songs.reduce((inner, song) => inner + (song.durationSec ?? 0), 0),
    0
  );

  return (
    <div className="space-y-6">
      <PlaylistPageHeader
        weddingId={params.weddingId}
        sectionCount={sections.length}
        songCount={songCount}
        totalDuration={formatTotalDuration(totalDurationSec)}
      />

      <SectionList sections={sections} />
    </div>
  );
}
