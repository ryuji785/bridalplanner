import { Suspense } from "react";
import { requireWeddingAccess } from "@/lib/auth-helpers";
import { getGuests } from "@/actions/guest-actions";
import { GuestStats } from "@/components/guests/guest-stats";
import { GuestFilters } from "@/components/guests/guest-filters";
import { GuestTable } from "@/components/guests/guest-table";
import { GuestPageHeader } from "./guest-page-header";

type PageProps = {
  params: { weddingId: string };
  searchParams: {
    side?: string;
    status?: string;
    search?: string;
  };
};

export default async function GuestsPage({ params, searchParams }: PageProps) {
  await requireWeddingAccess(params.weddingId);

  const side =
    searchParams.side === "bride" || searchParams.side === "groom"
      ? (searchParams.side as "bride" | "groom")
      : undefined;
  const attendanceStatus =
    searchParams.status === "pending" ||
    searchParams.status === "attending" ||
    searchParams.status === "declined"
      ? (searchParams.status as "pending" | "attending" | "declined")
      : undefined;
  const search = searchParams.search || undefined;

  const guests = await getGuests(params.weddingId, { side, attendanceStatus, search });

  // For stats, fetch all guests (unfiltered) to show accurate totals
  const allGuests = await getGuests(params.weddingId);

  return (
    <div className="space-y-6">
      <GuestPageHeader weddingId={params.weddingId} />

      <GuestStats guests={allGuests} />

      <Suspense fallback={null}>
        <GuestFilters />
      </Suspense>

      <GuestTable guests={guests} weddingId={params.weddingId} />
    </div>
  );
}
