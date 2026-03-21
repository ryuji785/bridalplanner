import Link from "next/link";
import {
  Calendar,
  Users,
  Grid3X3,
  Gift,
  Music,
  Clock,
  CheckCircle2,
  HelpCircle,
  XCircle,
} from "lucide-react";
import { requireWeddingAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatDate, formatYen, daysUntil } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

export default async function WeddingOverviewPage({
  params,
}: {
  params: { weddingId: string };
}) {
  const membership = await requireWeddingAccess(params.weddingId);
  const weddingId = params.weddingId;

  const wedding = await prisma.wedding.findUniqueOrThrow({
    where: { id: weddingId },
    include: {
      guests: {
        select: {
          attendanceStatus: true,
        },
      },
      tables: {
        select: { id: true },
      },
      milestones: {
        where: { status: { not: "done" } },
        orderBy: { dueDate: "asc" },
        take: 5,
        select: {
          id: true,
          title: true,
          dueDate: true,
          status: true,
        },
      },
    },
  });

  const days = daysUntil(wedding.weddingDate);

  const totalGuests = wedding.guests.length;
  const attending = wedding.guests.filter(
    (g) => g.attendanceStatus === "attending"
  ).length;
  const pending = wedding.guests.filter(
    (g) => g.attendanceStatus === "pending"
  ).length;
  const declined = wedding.guests.filter(
    (g) => g.attendanceStatus === "declined"
  ).length;
  const tableCount = wedding.tables.length;

  const quickLinks = [
    {
      label: "スケジュール",
      href: `/weddings/${weddingId}/schedule`,
      icon: Calendar,
      description: "マイルストーン・タスク管理",
    },
    {
      label: "ゲスト管理",
      href: `/weddings/${weddingId}/guests`,
      icon: Users,
      description: "ゲストの追加・出欠管理",
    },
    {
      label: "席次表",
      href: `/weddings/${weddingId}/seating`,
      icon: Grid3X3,
      description: "テーブル・座席配置",
    },
    {
      label: "引き出物",
      href: `/weddings/${weddingId}/gifts`,
      icon: Gift,
      description: "引き出物の管理",
    },
    {
      label: "音楽",
      href: `/weddings/${weddingId}/playlist`,
      icon: Music,
      description: "BGM・プレイリスト",
    },
    {
      label: "当日タイムライン",
      href: `/weddings/${weddingId}/day-of`,
      icon: Clock,
      description: "当日の進行表",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {wedding.title}
            </h1>
            <Badge variant={statusVariants[wedding.status] ?? "secondary"}>
              {statusLabels[wedding.status] ?? wedding.status}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            {formatDate(wedding.weddingDate)}
            {wedding.venue && ` / ${wedding.venue}`}
          </p>
        </div>
        <div className="text-right">
          {days > 0 ? (
            <div>
              <span className="text-3xl font-bold text-primary">{days}</span>
              <span className="ml-1 text-lg text-muted-foreground">
                日後
              </span>
            </div>
          ) : days === 0 ? (
            <span className="text-2xl font-bold text-primary">本日</span>
          ) : (
            <span className="text-lg text-muted-foreground">終了済み</span>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ゲスト数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGuests}名</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">出席予定</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attending}名</div>
            {totalGuests > 0 && (
              <p className="text-xs text-muted-foreground">
                全体の{Math.round((attending / totalGuests) * 100)}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">未回答</CardTitle>
            <HelpCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending}名</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">テーブル数</CardTitle>
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tableCount}卓</div>
          </CardContent>
        </Card>
      </div>

      {/* Budget and milestones row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Budget */}
        {wedding.budget && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">予算概要</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatYen(wedding.budget)}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                総予算
              </p>
            </CardContent>
          </Card>
        )}

        {/* Upcoming milestones */}
        <Card className={wedding.budget ? "" : "lg:col-span-2"}>
          <CardHeader>
            <CardTitle className="text-base">
              今後のマイルストーン
            </CardTitle>
            <CardDescription>期日が近い項目</CardDescription>
          </CardHeader>
          <CardContent>
            {wedding.milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                マイルストーンはまだありません。
              </p>
            ) : (
              <div className="space-y-3">
                {wedding.milestones.map((milestone) => {
                  const milestoneDays = daysUntil(milestone.dueDate);
                  return (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            milestone.status === "in_progress"
                              ? "bg-yellow-500"
                              : "bg-muted-foreground"
                          }`}
                        />
                        <span className="text-sm">{milestone.title}</span>
                      </div>
                      <span
                        className={`text-xs ${
                          milestoneDays < 0
                            ? "font-medium text-destructive"
                            : milestoneDays <= 7
                            ? "font-medium text-yellow-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatDate(milestone.dueDate)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Quick links */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">セクション</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{link.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
