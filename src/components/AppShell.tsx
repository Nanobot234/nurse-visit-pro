import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ClipboardList, FileText, KeyRound, LogOut, Menu, NotebookPen, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfileAndRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/jarme-logo.png.asset.json";

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

type NavItem = { to: "/dashboard" | "/progress" | "/patients" | "/admin"; label: string; icon: typeof FileText };

export function AppShell({ children }: { children: ReactNode }) {
  const { data: staff } = useStaff();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Accounts given a temporary password must pick a new one before using the app.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.["must_change_password"]) {
        navigate({ to: "/reset-password", replace: true });
      }
    });
  }, [navigate]);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const items: NavItem[] = [
    { to: "/dashboard", label: staff?.isAdmin ? "Recent visits" : "My notes", icon: FileText },
    ...(staff?.isAdmin
      ? ([
          { to: "/progress", label: "Progress notes", icon: NotebookPen },
          { to: "/patients", label: "Patients", icon: Users },
          { to: "/admin", label: "All notes", icon: ClipboardList },
        ] as NavItem[])
      : []),
  ];

  const tabClass =
    "flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
  const activeTab = { className: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/dashboard" className="flex min-w-0 shrink-0 items-center gap-2.5">
            <img src={logo.url} alt="JARME logo" className="h-10 w-auto shrink-0" />
            <span className="truncate font-serif text-lg leading-tight text-foreground">
              JARME <span className="hidden sm:inline">Visit Notes</span>
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {items.map((item) => (
              <Link key={item.to} to={item.to} className={tabClass} activeProps={activeTab}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <span className="max-w-[10rem] truncate text-sm text-muted-foreground">{staff?.displayName}</span>
            <Button asChild variant="ghost" size="sm">
              <Link to="/reset-password">
                <KeyRound className="h-4 w-4" />
                Password
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="ml-auto h-11 w-11 lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-80 flex-col">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-serif">
                  <img src={logo.url} alt="" className="h-9 w-auto" />
                  Menu
                </SheetTitle>
                {staff?.displayName && (
                  <p className="text-left text-sm text-muted-foreground">Signed in as {staff.displayName}</p>
                )}
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1.5">
                {items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                    activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
                <Button asChild variant="ghost" className="h-12 justify-start text-base" onClick={() => setOpen(false)}>
                  <Link to="/reset-password">
                    <KeyRound className="h-5 w-5" />
                    Change password
                  </Link>
                </Button>
                <Button variant="outline" className="h-12 justify-start text-base" onClick={signOut}>
                  <LogOut className="h-5 w-5" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
