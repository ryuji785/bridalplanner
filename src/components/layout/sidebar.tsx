"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  Calendar,
  Users,
  Grid3X3,
  Gift,
  Music,
  Clock,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  className?: string;
}

const mainNav = [
  {
    label: "ダッシュボード",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

function getWeddingNav(weddingId: string) {
  return [
    { label: "概要", href: `/weddings/${weddingId}`, icon: Home },
    {
      label: "スケジュール",
      href: `/weddings/${weddingId}/schedule`,
      icon: Calendar,
    },
    {
      label: "ゲスト管理",
      href: `/weddings/${weddingId}/guests`,
      icon: Users,
    },
    { label: "席次表", href: `/weddings/${weddingId}/seating`, icon: Grid3X3 },
    { label: "引き出物", href: `/weddings/${weddingId}/gifts`, icon: Gift },
    { label: "音楽", href: `/weddings/${weddingId}/playlist`, icon: Music },
    {
      label: "当日タイムライン",
      href: `/weddings/${weddingId}/day-of`,
      icon: Clock,
    },
  ];
}

function extractWeddingId(pathname: string): string | null {
  const match = pathname.match(/^\/weddings\/([^/]+)/);
  return match ? match[1] : null;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const weddingId = extractWeddingId(pathname);
  const weddingNav = weddingId ? getWeddingNav(weddingId) : [];

  return (
    <aside className={cn("flex h-full w-64 flex-col border-r bg-card", className)}>
      <div className="flex h-16 items-center gap-2 px-6">
        <Heart className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">
          ブライダルプランナー
        </span>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {mainNav.map((item) => {
          const isActive = pathname === "/" || pathname === "/dashboard";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {weddingId && (
          <>
            <Separator className="my-3" />
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              結婚式メニュー
            </p>
            {weddingNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
