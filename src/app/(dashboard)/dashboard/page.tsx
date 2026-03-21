import Link from "next/link";
import { Plus, CalendarDays, MapPin } from "lucide-react";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatDate, daysUntil } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
  planning: "準備中",
  confirmed: "確定",
  completed: "完了",
};

const statusVariants: Record<string, "default" | "secondary" | "outline"> = {
  planning: "secondary",
  confirmed: "default",
  completed: "outline",
};

export default async function DashboardPage() {
  const user = await requireAuth();

  const memberships = await prisma.weddingMember.findMany({
    where: { userId: user.id },
    include: {
      wedding: {
        include: {
          _count: {
            select: {
              guests: true,
            },
          },
        },
      },
    },
    orderBy: { wedding: { weddingDate: "asc" } },
  });

  const weddings = memberships.map((m) => ({
    ...m.wedding,
    role: m.role,
    guestCount: m.wedding._count.guests,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-muted-foreground">
            担当する結婚式の一覧
          </p>
        </div>
        <Button asChild>
          <Link href="/weddings/new">
            <Plus className="mr-2 h-4 w-4" />
            新規結婚式を作成
          </Link>
        </Button>
      </div>

      {weddings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">
              まだ結婚式がありません
            </h2>
            <p className="mb-6 max-w-sm text-muted-foreground">
              新しい結婚式を作成して、プランニングを始めましょう。
            </p>
            <Button asChild>
              <Link href="/weddings/new">
                <Plus className="mr-2 h-4 w-4" />
                新規結婚式を作成
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weddings.map((wedding) => {
            const days = daysUntil(wedding.weddingDate);
            return (
              <Link key={wedding.id} href={`/weddings/${wedding.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        {wedding.title}
                      </CardTitle>
                      <Badge
                        variant={
                          statusVariants[wedding.status] ?? "secondary"
                        }
                      >
                        {statusLabels[wedding.status] ?? wedding.status}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(wedding.weddingDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {wedding.venue && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {wedding.venue}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-muted-foreground">
                        ゲスト: {wedding.guestCount}名
                      </span>
                      {days > 0 ? (
                        <span className="font-medium text-primary">
                          あと{days}日
                        </span>
                      ) : days === 0 ? (
                        <span className="font-medium text-primary">
                          本日
                        </span>
                      ) : (
                        <span className="text-muted-foreground">終了</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
