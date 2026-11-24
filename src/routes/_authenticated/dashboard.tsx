import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStaff } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My visit notes | JARME" },
      { name: "description", content: "Draft and completed nursing visit notes for this nurse." },
      { property: "og:title", content: "My visit notes | JARME" },
      { property: "og:description", content: "Start a new visit note or finish a draft." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: staff, isLoading: staffLoading } = useStaff();
  if (staffLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (staff?.isAdmin) return <RecentVisits />;
  return <NurseDashboard />;
}

const contactLabels: Record<string, string> = {
  phone_call: "Phone call",
  family_call: "Call from family",
  visit: "Visit",
  message: "Message / email",
  other: "Other",
};

function LatestProgressNotes() {
  const { data, isLoading } = useQuery({
    queryKey: ["progress-notes", "latest"],
    queryFn: async () => {
      const { data: notes, error } = await supabase
        .from("progress_notes")
        .select("id, patient_id, author_id, occurred_at, contact_type, body")
        .order("occurred_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      const pIds = [...new Set(notes.map((n) => n.patient_id))];
      const aIds = [...new Set(notes.map((n) => n.author_id))];
      const [{ data: people }, { data: authors }] = await Promise.all([
        pIds.length ? supabase.from("patients").select("id, full_name").in("id", pIds) : Promise.resolve({ data: [] }),
        aIds.length ? supabase.from("profiles").select("id, full_name, email").in("id", aIds) : Promise.resolve({ data: [] }),
      ]);
      const pn = new Map((people ?? []).map((p) => [p.id, p.full_name]));
      const an = new Map((authors ?? []).map((a) => [a.id, a.full_name || a.email || "Staff"]));
      return notes.map((n) => ({ ...n, person: pn.get(n.patient_id) ?? "Unknown", author: an.get(n.author_id) ?? "Staff" }));
    },
  });

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-serif text-2xl text-foreground">Latest progress notes</h2>
        <Link to="/progress" className="text-base font-medium text-primary hover:underline">See all</Link>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !data?.length ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="font-serif text-lg text-foreground">No progress notes yet</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((n) => (
            <li key={n.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{n.person}</span>
                <Badge variant="secondary">{contactLabels[n.contact_type] ?? "Other"}</Badge>
                <span className="text-sm text-muted-foreground">{new Date(n.occurred_at).toLocaleString()}</span>
                <span className="ml-auto text-sm text-muted-foreground">by {n.author}</span>
              </div>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-foreground">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentVisits() {
  const { data, isLoading } = useQuery({
    queryKey: ["recent-visits"],
    queryFn: async () => {
      const { data: notes, error } = await supabase
        .from("visit_notes")
        .select("id, patient_name, visit_date, nurse_id, updated_at")
        .eq("status", "completed")
        .order("updated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      const ids = [...new Set(notes.map((n) => n.nurse_id))];
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", ids)
        : { data: [] };
      const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name || p.email || "Nurse"]));
      return notes.map((n) => ({ ...n, nurse: names.get(n.nurse_id) ?? "Nurse" }));
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Recent visits</h1>
        <p className="mt-1 text-muted-foreground">The latest visit notes and progress notes.</p>
      </div>
      <LatestProgressNotes />
      <h2 className="font-serif text-2xl text-foreground">Latest nursing visit notes</h2>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !data?.length ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="font-serif text-lg text-foreground">No completed visits yet</p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {data.map((n) => (
            <li key={n.id}>
              <Link
                to="/notes/$noteId"
                params={{ noteId: n.id }}
                className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary"
              >
                <span className="font-medium text-foreground">{n.patient_name || "Untitled patient"}</span>
                <span className="text-sm text-muted-foreground">{n.visit_date ?? "No date"}</span>
                <span className="ml-auto text-sm text-muted-foreground">by {n.nurse}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NurseDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ["my-notes"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("visit_notes")
        .select("id, patient_name, visit_date, status, updated_at")
        .eq("nurse_id", auth.user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createNote = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("visit_notes")
        .insert({
          nurse_id: auth.user!.id,
          visit_date: new Date().toISOString().slice(0, 10),
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-notes"] });
      navigate({ to: "/notes/$noteId", params: { noteId: data.id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not start the note"),
  });

  type NoteRow = NonNullable<typeof notes>[number];

  const groups = (() => {
    const map = new Map<string, NoteRow[]>();
    for (const note of notes ?? []) {
      const name = note.patient_name?.trim() || "Untitled patient";
      const list = map.get(name) ?? [];
      list.push(note);
      map.set(name, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  })();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground">My visit notes</h1>
          <p className="mt-1 text-muted-foreground">
            Grouped by patient. You can reopen and edit a completed note any time.
          </p>
        </div>
        <Button onClick={() => createNote.mutate()} disabled={createNote.isPending}>
          {createNote.isPending ? "Starting…" : "New visit note"}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !notes?.length ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="font-serif text-lg text-foreground">No visit notes yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start one when you arrive at the patient's home.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([name, patientNotes]) => (
            <section key={name} className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/60 px-4 py-3">
                <h2 className="font-serif text-lg text-foreground">{name}</h2>
                <span className="text-xs text-muted-foreground">
                  {patientNotes.length} {patientNotes.length === 1 ? "visit" : "visits"}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {patientNotes.map((note) => (
                  <li key={note.id}>
                    <Link
                      to="/notes/$noteId"
                      params={{ noteId: note.id }}
                      className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary"
                    >
                      <span className="text-sm text-foreground">{note.visit_date ?? "No date"}</span>
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
