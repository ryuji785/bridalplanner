import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireWeddingAccess(weddingId: string) {
  const user = await requireAuth();

  const membership = await prisma.weddingMember.findUnique({
    where: {
      userId_weddingId: {
        userId: user.id,
        weddingId,
      },
    },
    include: {
      wedding: true,
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  return membership;
}

export async function requirePlannerRole(weddingId: string) {
  const membership = await requireWeddingAccess(weddingId);

  if (membership.role !== "planner") {
    redirect("/dashboard");
  }

  return membership;
}
