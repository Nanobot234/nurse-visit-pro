import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface StaffProfile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export async function fetchProfileAndRole(user: User) {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone, email").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");
  return {
    profile: (profile ?? null) as StaffProfile | null,
    isAdmin,
    displayName: profile?.full_name || user.email || user.phone || "Staff member",
  };
}

export async function signOutEverywhere() {
  await supabase.auth.signOut();
}
