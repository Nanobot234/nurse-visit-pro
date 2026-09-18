import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | JARME Nursing Visit Notes" },
      {
        name: "description",
        content: "Nurses and office staff sign in with an email address or a mobile number.",
      },
      { property: "og:title", content: "Sign in | JARME Nursing Visit Notes" },
      {
        property: "og:description",
        content: "Sign in to complete or review nursing visit notes.",
      },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  fullName: z.string().trim().max(100).optional(),
});

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Use the full number with country code, e.g. +15551234567");

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          JARME Home &amp; Healthcare Services
        </p>
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Sign in</CardTitle>
            <CardDescription>Use your work email or your mobile number.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
              </TabsList>
              <TabsContent value="email" className="pt-6">
                <EmailForm />
              </TabsContent>
              <TabsContent value="phone" className="pt-6">
                <PhoneForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function EmailForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse({ email, password, fullName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the details you entered");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: parsed.data.fullName ?? "" },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign you in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "signup" && (
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Gladys Aideyan"
            maxLength={100}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </Button>
      <button
        type="button"
        className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
      >
        {mode === "signup" ? "I already have an account" : "Create a new staff account"}
      </button>
    </form>
  );
}

function PhoneForm() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the number");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: parsed.data });
      if (error) throw error;
      setSent(true);
      toast.success("We texted you a code.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the code");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: code.trim(),
        type: "sms",
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That code did not work");
    } finally {
      setBusy(false);
    }
  };

  if (!sent) {
    return (
      <form onSubmit={sendCode} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Mobile number</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+15551234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Sending…" : "Text me a code"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">6-digit code</Label>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Checking…" : "Sign in"}
      </Button>
      <button
        type="button"
        className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
        onClick={() => setSent(false)}
      >
        Use a different number
      </button>
    </form>
  );
}
