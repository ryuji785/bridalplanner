"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GuestFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    updateParams("search", search);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form onSubmit={handleSearchSubmit} className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="名前で検索..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
      </form>

      <Select
        defaultValue={searchParams.get("side") ?? "all"}
        onValueChange={(value) => updateParams("side", value)}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="全て" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全て</SelectItem>
          <SelectItem value="bride">新婦側</SelectItem>
          <SelectItem value="groom">新郎側</SelectItem>
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("status") ?? "all"}
        onValueChange={(value) => updateParams("status", value)}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="全て" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全て</SelectItem>
          <SelectItem value="attending">出席</SelectItem>
          <SelectItem value="declined">欠席</SelectItem>
          <SelectItem value="pending">未確認</SelectItem>
        </SelectContent>
      </Select>

      {(searchParams.get("side") ||
        searchParams.get("status") ||
        searchParams.get("search")) ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("");
            startTransition(() => {
              router.replace(pathname);
            });
          }}
          disabled={isPending}
        >
          クリア
        </Button>
      ) : null}
    </div>
  );
}
