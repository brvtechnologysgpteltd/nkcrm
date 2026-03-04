"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vchLoginID, setVchLoginID] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!vchLoginID.trim() || !password) {
      setErrorMessage("Please enter your login ID and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/authUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vchLoginID: vchLoginID.trim(), password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const serverMessage =
          payload?.message || payload?.error || "Login failed.";
        setErrorMessage(serverMessage);
        return;
      }

      const nextPath = searchParams.get("next");
      router.push(nextPath || "/dashboard");
    } catch (error) {
      console.error("Login request failed:", error);
      setErrorMessage("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] px-4 pb-4 pt-6 shadow-xl">
      <CardHeader className="gap-2 px-6 pb-2">
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription className="text-black/60">
          Use your salon admin credentials to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2 text-sm">
            <Label htmlFor="login-id">Login ID</Label>
            <Input
              id="login-id"
              placeholder="your login ID"
              type="text"
              autoComplete="username"
              value={vchLoginID}
              onChange={(event) => setVchLoginID(event.target.value)}
              className="rounded-xl border-[var(--color-line)] bg-transparent px-4 py-3 focus-visible:ring-[var(--color-gold)]"
            />
          </div>
          <div className="grid gap-2 text-sm">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-xl border-[var(--color-line)] bg-transparent px-4 py-3 focus-visible:ring-[var(--color-gold)]"
            />
          </div>
          {errorMessage ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}
          <Button
            className="rounded-xl bg-[var(--color-night)] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[var(--color-night)]"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
