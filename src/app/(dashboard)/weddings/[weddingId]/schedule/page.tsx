import { requireWeddingAccess } from "@/lib/auth-helpers";
import { getMilestones, createDefaultMilestones } from "@/actions/milestone-actions";
import { prisma } from "@/lib/db";
import { MilestoneList } from "@/components/schedule/milestone-list";
import { ScheduleHeader } from "./schedule-header";

interface SchedulePageProps {
  params: { weddingId: string };
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  const { weddingId } = params;
  await requireWeddingAccess(weddingId);

  const milestones = await getMilestones(weddingId);

  const wedding = await prisma.wedding.findUniqueOrThrow({
    where: { id: weddingId },
    select: { id: true, weddingDate: true },
  });

  const totalMilestones = milestones.length;
  const completedCount = milestones.filter((m) => m.status === "done").length;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const overdueCount = milestones.filter(
    (m) => m.status !== "done" && new Date(m.dueDate) < now
  ).length;

  return (
    <div className="space-y-6">
      <ScheduleHeader
        weddingId={weddingId}
        weddingDate={wedding.weddingDate.toISOString()}
        totalMilestones={totalMilestones}
        completedCount={completedCount}
        overdueCount={overdueCount}
        hasMilestones={totalMilestones > 0}
      />

      <MilestoneList milestones={milestones} weddingId={weddingId} />
    </div>
  );
}
