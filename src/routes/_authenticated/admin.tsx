import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStaff } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "All patients | JARME" },
      { name: "description", content: "Office view of every completed nursing visit note, searchable by patient name." },
      { property: "og:title", content: "All patients | JARME" },
      { property: "og:description", content: "Search completed nursing visit notes by patient name." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { data: staff, isLoading: staffLoading } = useStaff();
  const [search, setSearch] = useState("");

  const { data: notes, isLoading } = useQuery({
    queryKey: ["all-notes", search],
    enabled: Boolean(staff?.isAdmin),
    queryFn: async () => {
      let query = supabase
        .from("visit_notes")
        .select("id, patient_name, visit_date, status, updated_at")
        .order("visit_date", { ascending: false })
        .limit(200);
      const term = search.trim();
      if (term) query = query.ilike("patient_name", `%${term}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  if (staffLoading) return <p className="text-muted-foreground">Loading…</p>;

  if (!staff?.isAdmin) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center">
        <h1 className="font-serif text-2xl text-foreground">Office access only</h1>
        <p className="mt-2 text-muted-foreground">
          Ask an administrator to give your account office access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">All patients</h1>
        <p className="mt-1 text-muted-foreground">Search every visit note by patient name.</p>
      </div>

      <Input
        placeholder="Search patient name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        maxLength={100}
      />

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !notes?.length ? (
        <p className="text-muted-foreground">No visit notes match that name.</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                to="/notes/$noteId"
                params={{ noteId: note.id }}
                className="flex flex-wrap items-center gap-3 px-4 py-4 transition-colors hover:bg-secondary"
              >
                <span className="font-medium text-foreground">
                  {note.patient_name || "Untitled patient"}
                </span>
                <span className="text-sm text-muted-foreground">{note.visit_date ?? "No date"}</span>
                <Badge
                  variant={note.status === "completed" ? "default" : "secondary"}
                  className="ml-auto"
                >
                  {note.status === "completed" ? "Completed" : "Draft"}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
