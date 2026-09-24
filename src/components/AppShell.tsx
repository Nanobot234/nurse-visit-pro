import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfileAndRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return null;
      return fetchProfileAndRole(data.user);
    },
  });
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: staff } = useStaff();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/dashboard" className="font-serif text-lg text-foreground">
            JARME Visit Notes
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/dashboard"
              className="text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {staff?.isAdmin ? "Recent visits" : "My notes"}
            </Link>
            <Link
              to="/progress"
              className="text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              Progress notes
            </Link>
            {staff?.isAdmin && (
              <>
                <Link
                  to="/patients"
                  className="text-muted-foreground hover:text-foreground"
                  activeProps={{ className: "text-foreground font-medium" }}
                >
                  Patients
                </Link>
                <Link
                  to="/admin"
                  className="text-muted-foreground hover:text-foreground"
                  activeProps={{ className: "text-foreground font-medium" }}
                >
                  All notes
                </Link>
              </>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {staff?.displayName}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
