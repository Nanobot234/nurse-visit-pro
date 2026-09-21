import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePatients } from "@/lib/patients";
import { useStaff } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress notes | JARME" },
      { name: "description", content: "Quick timestamped progress notes about a patient: phone calls, family contact and follow-ups." },
      { property: "og:title", content: "Progress notes | JARME" },
      { property: "og:description", content: "Jot down a quick note about a patient and see the full history." },
    ],
  }),
  component: ProgressNotesPage,
});

const contactTypes = [
  { value: "phone_call", label: "Phone call" },
  { value: "family_call", label: "Call from family" },
  { value: "visit", label: "Visit" },
  { value: "message", label: "Message / email" },
  { value: "other", label: "Other" },
];

const contactLabel = (value: string) =>
  contactTypes.find((t) => t.value === value)?.label ?? "Other";

function ProgressNotesPage() {
  const queryClient = useQueryClient();
  const { data: staff } = useStaff();
  const { data: patients, isLoading: patientsLoading } = usePatients();

  const [patientId, setPatientId] = useState("");
  const [contactType, setContactType] = useState("phone_call");
  const [body, setBody] = useState("");
  const [filterPatient, setFilterPatient] = useState("all");

  const { data: notes, isLoading } = useQuery({
    queryKey: ["progress-notes", filterPatient],
    queryFn: async () => {
      let query = supabase
        .from("progress_notes")
        .select("id, patient_id, author_id, occurred_at, contact_type, body")
        .order("occurred_at", { ascending: false })
        .limit(300);
      if (filterPatient !== "all") query = query.eq("patient_id", filterPatient);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error("Please choose a patient.");
      if (!body.trim()) throw new Error("Please write the note.");
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("progress_notes").insert({
        patient_id: patientId,
        author_id: auth.user!.id,
        contact_type: contactType,
        body: body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress-notes"] });
      setBody("");
      toast.success("Progress note saved.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save the note"),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("progress_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["progress-notes"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete the note"),
  });

  const patientName = (id: string) =>
    patients?.find((p) => p.id === id)?.full_name ?? "Unknown patient";

  const noPatients = !patientsLoading && !(patients ?? []).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Progress notes</h1>
        <p className="mt-1 text-muted-foreground">
          Quick notes about a patient — phone calls, family contact and follow-ups.
        </p>
      </div>

      {noPatients ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="font-serif text-lg text-foreground">No patients yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The office needs to add patients before progress notes can be written.
          </p>
        </div>
      ) : (
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-serif text-xl text-foreground">New note</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {(patients ?? [])
                    .filter((p) => p.active)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type of contact</Label>
              <Select value={contactType} onValueChange={setContactType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contactTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Note</Label>
              <Textarea
                rows={4}
                maxLength={4000}
                value={body}
                placeholder="What happened, who you spoke with, and any follow-up needed."
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button onClick={() => addNote.mutate()} disabled={addNote.isPending}>
              {addNote.isPending ? "Saving…" : "Save note"}
            </Button>
          </div>
        </section>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-xl text-foreground">History</h2>
          <div className="ml-auto w-full sm:w-64">
            <Select value={filterPatient} onValueChange={setFilterPatient}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All patients</SelectItem>
                {(patients ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !notes?.length ? (
          <p className="text-muted-foreground">No progress notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => {
              const mine = note.author_id === staff?.profile?.id;
              return (
                <li key={note.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{patientName(note.patient_id)}</span>
                    <Badge variant="secondary">{contactLabel(note.contact_type)}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.occurred_at).toLocaleString()}
                    </span>
                    {mine && <span className="text-xs text-muted-foreground">· by you</span>}
                    {(mine || staff?.isAdmin) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={() => deleteNote.mutate(note.id)}
                        disabled={deleteNote.isPending}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{note.body}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
