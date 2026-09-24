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
        .select(
          "id, nurse_id, patient_name, patient_id_number, visit_date, status, updated_at, aide_name"
        )
        .order("visit_date", { ascending: false })
        .limit(200);
      const term = search.trim();
      if (term) query = query.ilike("patient_name", `%${term}%`);
      const { data, error } = await query;
      if (error) throw error;
      const rows = data as {
        id: string;
        nurse_id: string;
        patient_name: string;
        patient_id_number: string | null;
        visit_date: string | null;
        status: string;
        updated_at: string;
        aide_name: string | null;
      }[];

      const nurseIds = [...new Set(rows.map((r) => r.nurse_id))];
      const namesById = new Map<string, string>();
      if (nurseIds.length) {
        const { data: nurses, error: nurseError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", nurseIds);
        if (nurseError) throw nurseError;
        for (const n of (nurses ?? []) as { id: string; full_name: string }[]) {
          namesById.set(n.id, n.full_name);
        }
      }
      return rows.map((r) => ({ ...r, nurseName: namesById.get(r.nurse_id) ?? "" }));
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
                {note.patient_id_number && (
                  <span className="text-sm text-muted-foreground">ID: {note.patient_id_number}</span>
                )}
                {note.nurseName && (
                  <span className="text-sm text-muted-foreground">Nurse: {note.nurseName}</span>
                )}
                {note.aide_name && (
                  <span className="text-sm text-muted-foreground">Aide: {note.aide_name}</span>
                )}
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
