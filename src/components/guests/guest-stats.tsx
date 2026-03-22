import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Guest = {
  id: string;
  side: string;
  attendanceStatus: string;
};

type GuestStatsProps = {
  guests: Guest[];
};

export function GuestStats({ guests }: GuestStatsProps) {
  const total = guests.length;
  const attending = guests.filter(
    (guest) => guest.attendanceStatus === "attending"
  ).length;
  const declined = guests.filter(
    (guest) => guest.attendanceStatus === "declined"
  ).length;
  const pending = guests.filter(
    (guest) => guest.attendanceStatus === "pending"
  ).length;

  const brideSide = guests.filter((guest) => guest.side === "bride");
  const groomSide = guests.filter((guest) => guest.side === "groom");

  const brideAttending = brideSide.filter(
    (guest) => guest.attendanceStatus === "attending"
  ).length;
  const groomAttending = groomSide.filter(
    (guest) => guest.attendanceStatus === "attending"
  ).length;

  const stats = [
    {
      label: "総ゲスト数",
      value: total,
      sub: `新婦側 ${brideSide.length} / 新郎側 ${groomSide.length}`,
    },
    {
      label: "出席人数",
      value: attending,
      sub: `新婦側 ${brideAttending} / 新郎側 ${groomAttending}`,
      color: "text-green-600",
    },
    {
      label: "欠席",
      value: declined,
      color: "text-red-600",
    },
    {
      label: "未確認",
      value: pending,
      color: "text-gray-500",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stat.color ?? ""}`}>
              {stat.value}
            </div>
            {stat.sub ? (
              <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
