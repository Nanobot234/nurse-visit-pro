import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { DEFAULT_PHONE_PREFIX, normalizePhoneNumber, phoneAuthOptions } from "@/lib/phone-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or sign up | JARME Nursing Visit Notes" },
      {
        name: "description",
        content: "Nurses and office staff sign in or create an account with an email address or a mobile number.",
      },
      { property: "og:title", content: "Sign in or sign up | JARME Nursing Visit Notes" },
      {
        property: "og:description",
        content: "Sign in or create an account to complete or review nursing visit notes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  fullName: z.string().trim().max(100).optional(),
});

const signUpNameSchema = z.string().trim().min(1, "Enter your full name").max(100);

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
            <CardTitle className="font-serif text-2xl">Sign in or create an account</CardTitle>
            <CardDescription>
              Sign in with your work email or mobile number, or create a new staff account.
            </CardDescription>
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
        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="underline">Terms &amp; Conditions</Link> and{" "}
          <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}

function EmailForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [forgot, setForgot] = useState(false);
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
    if (mode === "signup" && !signUpNameSchema.safeParse(fullName).success) {
      toast.error("Enter your full name");
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

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().email("Enter a valid email address").safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("If that email has an account, we sent a reset link. Check your inbox.");
      setForgot(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the reset email");
    } finally {
      setBusy(false);
    }
  };

  if (forgot) {
    return (
      <form onSubmit={sendReset} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter the email on your account and we will send you a link to set a new password.
        </p>
        <div className="space-y-2">
          <Label htmlFor="resetEmail">Email</Label>
          <Input
            id="resetEmail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </Button>
        <button
          type="button"
          className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setForgot(false)}
        >
          Back to sign in
        </button>
      </form>
    );
  }

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
            required
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
      {mode === "signin" && (
        <button
          type="button"
          className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setForgot(true)}
        >
          Forgot password?
        </button>
      )}
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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [phone, setPhone] = useState(DEFAULT_PHONE_PREFIX);
  const [sentPhone, setSentPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [consented, setConsented] = useState(false);
  const [busy, setBusy] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consented) {
      toast.error("Please check the consent box before we can text you a code");
      return;
    }
    const parsed = phoneSchema.safeParse(normalizePhoneNumber(phone));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the number");
      return;
    }
    if (mode === "signup" && !signUpNameSchema.safeParse(fullName).success) {
      toast.error("Enter your full name");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: parsed.data,
        options: phoneAuthOptions(mode, fullName),
      });
      if (error) throw error;
      setSentPhone(parsed.data);
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
        phone: sentPhone,
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
        <Tabs value={mode} onValueChange={(value) => setMode(value === "signup" ? "signup" : "signin")}>
          <TabsList className="grid h-auto w-full grid-cols-2">
            <TabsTrigger value="signin" className="min-h-12 whitespace-normal text-base">Sign in</TabsTrigger>
            <TabsTrigger value="signup" className="min-h-12 whitespace-normal text-base">Create account</TabsTrigger>
          </TabsList>
        </Tabs>
        <h2 className="font-serif text-xl">{mode === "signup" ? "Create a phone account" : "Sign in by phone"}</h2>
        {mode === "signup" && (
        <div className="space-y-2">
          <Label htmlFor="phoneFullName">Full name</Label>
          <Input
            id="phoneFullName"
            autoComplete="name"
            placeholder="Gladys Aideyan"
            maxLength={100}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="phone">Mobile number</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <label
          htmlFor="smsConsent"
          className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-3"
        >
          <Checkbox
            id="smsConsent"
            checked={consented}
            onCheckedChange={(checked) => setConsented(checked === true)}
            className="mt-0.5"
          />
          <span className="text-base leading-relaxed text-muted-foreground">
            By checking this box and entering my phone number, I agree to receive one-time
            authentication codes by SMS from JARME Home & Healthcare Services. Message
            frequency varies per login. Msg & data rates may apply. Reply STOP to cancel,
            HELP for help. See our{" "}
            <Link to="/terms" className="underline">Terms & Conditions</Link> and{" "}
            <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </span>
        </label>
        <Button type="submit" className="w-full" disabled={busy || !consented}>
          {busy ? "Sending…" : mode === "signup" ? "Text me a signup code" : "Text me a sign-in code"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <p className="text-base text-muted-foreground">Code sent to {sentPhone}</p>
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
        {busy ? "Checking…" : mode === "signup" ? "Verify code & create account" : "Verify code & sign in"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full text-base"
        onClick={() => { setSent(false); setCode(""); }}
      >
        Use a different number
      </Button>
    </form>
  );
}
