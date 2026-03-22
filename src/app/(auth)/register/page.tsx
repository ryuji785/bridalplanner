"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("planner");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("パスワードが一致しません。");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "登録に失敗しました。");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("登録に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center text-2xl">新規登録</CardTitle>
        <CardDescription className="text-center">
          アカウントを作成して利用を開始します
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name">名前</Label>
            <Input
              id="name"
              type="text"
              placeholder="山田 太郎"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="mail@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              placeholder="8文字以上"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">パスワード確認</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>役割</Label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="planner"
                  checked={role === "planner"}
                  onChange={(event) => setRole(event.target.value)}
                  disabled={isLoading}
                  className="accent-primary"
                />
                <span className="text-sm">プランナー</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="couple"
                  checked={role === "couple"}
                  onChange={(event) => setRole(event.target.value)}
                  disabled={isLoading}
                  className="accent-primary"
                />
                <span className="text-sm">カップル</span>
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "登録中..." : "アカウントを作成"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            すでにアカウントをお持ちですか？{" "}
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              ログイン
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
