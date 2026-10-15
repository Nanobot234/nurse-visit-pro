import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password | JARME Nursing Visit Notes" },
      {
        name: "description",
        content: "Choose a new password for your JARME Nursing Visit Notes account.",
      },
      { property: "og:title", content: "Set a new password | JARME Nursing Visit Notes" },
      {
        property: "og:description",
        content: "Choose a new password for your JARME Nursing Visit Notes account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72);

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [waited, setWaited] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The recovery link carries a token in the URL hash; the Supabase client
    // exchanges it automatically and fires a session change. Give it a moment.
    const timer = setTimeout(() => setWaited(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the password you entered");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data });
      if (error) throw error;
      toast.success("Password updated. You are signed in.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the password");
    } finally {
      setBusy(false);
    }
  };

  const stillChecking = loading || !waited;
  if (stillChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Checking your reset link…</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Link expired</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired. Request a new one from the
                sign-in page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/auth">Back to sign in</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          JARME Home & Healthcare Services
        </p>
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Set a new password</CardTitle>
            <CardDescription>
              Pick a new password for your account. You will stay signed in afterwards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Saving…" : "Save new password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
