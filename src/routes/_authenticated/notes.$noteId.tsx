import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { visitNoteSections, supervisionItems, allFields } from "@/lib/visit-note-schema";
import { NoteFieldInput } from "@/components/NoteField";
import { SignaturePad, SignatureImage } from "@/components/SignaturePad";
import { useStaff } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notes/$noteId")({
  head: () => ({
    meta: [
      { title: "Visit note | JARME" },
      { name: "description", content: "Complete and sign a home care nursing visit note." },
      { property: "og:title", content: "Visit note | JARME" },
      { property: "og:description", content: "Complete and sign a home care nursing visit note." },
    ],
  }),
  component: NotePage,
});

type Answers = Record<string, string>;
type Supervision = Record<string, { answer: string; comment: string }>;

function NotePage() {
  const { noteId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: staff } = useStaff();

  const { data: note, isLoading } = useQuery({
    queryKey: ["note", noteId],
    queryFn: async () => {
      const { data, error } = await supabase.from("visit_notes").select("*").eq("id", noteId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [aidePresent, setAidePresent] = useState(false);
  const [aideName, setAideName] = useState("");
  const [supervision, setSupervision] = useState<Supervision>({});
  const [nurseSig, setNurseSig] = useState<string | null>(null);
  const [aideSig, setAideSig] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [missingKeys, setMissingKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!note || ready) return;
    const data = (note.data ?? {}) as { answers?: Answers; supervision?: Supervision };
    setPatientName(note.patient_name ?? "");
    setPatientId(note.patient_id_number ?? "");
    setVisitDate(note.visit_date ?? "");
    setAnswers(data.answers ?? {});
    setSupervision(data.supervision ?? {});
    setAidePresent(note.aide_present ?? false);
    setAideName(note.aide_name ?? "");
    setNurseSig(note.nurse_signature);
    setAideSig(note.aide_signature);
    setReady(true);
  }, [note, ready]);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!note) return <p className="text-muted-foreground">This visit note could not be found.</p>;

  const completed = note.status === "completed";
  const isOwner = staff?.profile?.id === note.nurse_id;
  const readOnly = completed || !isOwner;

  const clearMissing = (key: string) =>
    setMissingKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

  const setAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    clearMissing(key);
  };

  const setSupervisionValue = (key: string, patch: Partial<{ answer: string; comment: string }>) =>
    setSupervision((prev) => ({
      ...prev,
      [key]: { answer: "", comment: "", ...prev[key], ...patch },
    }));

  const save = async (status: "draft" | "completed") => {
    if (status === "completed") {
      if (!patientName.trim()) {
        toast.error("Enter the patient's name before completing.");
        return;
      }
      if (!visitDate) {
        toast.error("Enter the visit date before completing.");
        return;
      }
      const failed = new Set<string>();
      if (!patientName.trim()) failed.add("patientName");
      if (!visitDate) failed.add("visitDate");
      for (const f of allFields) {
        if (f.required && !(answers[f.key] ?? "").trim()) failed.add(f.key);
      }
      if (failed.size > 0) {
        setMissingKeys(failed);
        const labels: string[] = [];
        if (failed.has("patientName")) labels.push("patient's name");
        if (failed.has("visitDate")) labels.push("visit date");
        labels.push(...allFields.filter((f) => failed.has(f.key)).map((f) => f.label));
        toast.error(`Please fill in before completing: ${labels.join(", ")}`);
        return;
      }
      setMissingKeys(new Set());
      if (!nurseSig) {
        toast.error("The nurse's signature is required.");
        return;
      }
      if (aidePresent && !aideSig) {
        toast.error("The aide still needs to sign.");
        return;
      }
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("visit_notes")
        .update({
          patient_name: patientName.trim(),
          patient_id_number: patientId.trim() || null,
          visit_date: visitDate || null,
          data: { answers, supervision },
          aide_present: aidePresent,
          aide_name: aideName.trim() || null,
          nurse_signature: nurseSig,
          nurse_signed_at: nurseSig ? (note.nurse_signed_at ?? now) : null,
          aide_signature: aideSig,
          aide_signed_at: aideSig ? (note.aide_signed_at ?? now) : null,
          status,
        })
        .eq("id", noteId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      queryClient.invalidateQueries({ queryKey: ["my-notes"] });
      if (status === "completed") {
        toast.success("Visit note completed and filed.");
        navigate({ to: "/dashboard" });
      } else {
        toast.success("Draft saved.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10 pb-24">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl text-foreground">Nursing visit note</h1>
          <Badge variant={completed ? "default" : "secondary"}>{completed ? "Completed" : "Draft"}</Badge>
        </div>
        <p className="text-muted-foreground">JARME Home &amp; Healthcare Services, Inc.</p>
      </header>

      <Section title="Patient">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Patient's name"
            required
            readOnly={readOnly}
            value={patientName}
            error={missingKeys.has("patientName") ? "This field is required" : undefined}
          >
            <Input
              value={patientName}
              maxLength={120}
              onChange={(e) => {
                setPatientName(e.target.value);
                clearMissing("patientName");
              }}
            />
          </Field>
          <Field label="ID #" readOnly={readOnly} value={patientId}>
            <Input value={patientId} maxLength={60} onChange={(e) => setPatientId(e.target.value)} />
          </Field>
          <Field
            label="Visit date"
            required
            readOnly={readOnly}
            value={visitDate}
            error={missingKeys.has("visitDate") ? "This field is required" : undefined}
          >
            <Input
              type="date"
              value={visitDate}
              onChange={(e) => {
                setVisitDate(e.target.value);
                clearMissing("visitDate");
              }}
            />
          </Field>
        </div>
      </Section>

      {visitNoteSections.map((section) => (
        <Section key={section.id} title={section.title} description={section.description}>
          <div
            className={cn(
              "grid gap-4",
              section.columns === 1 && "grid-cols-1",
              (section.columns ?? 2) === 2 && "sm:grid-cols-2",
              section.columns === 3 && "sm:grid-cols-3",
            )}
          >
            {section.fields.map((field) => (
              <NoteFieldInput
                key={field.key}
                field={field}
                value={answers[field.key] ?? ""}
                onChange={(v) => setAnswer(field.key, v)}
                readOnly={readOnly}
                error={missingKeys.has(field.key) ? "This field is required" : undefined}
              />
            ))}
          </div>
        </Section>
      ))}

      <Section title="HHA / PCA supervision">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Aide present</Label>
            {readOnly ? (
              <p className="text-foreground">{aidePresent ? "Yes" : "No"}</p>
            ) : (
              <div className="flex gap-2">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setAidePresent(v)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      aidePresent === v
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary",
                    )}
                  >
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Aide name</Label>
            {readOnly ? (
              <p className="text-foreground">{aideName || "—"}</p>
            ) : (
              <Input value={aideName} maxLength={120} onChange={(e) => setAideName(e.target.value)} />
            )}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          {supervisionItems.map((item, i) => {
            const row = supervision[item.key] ?? { answer: "", comment: "" };
            return (
              <div
                key={item.key}
                className={cn(
                  "grid gap-3 p-3 sm:grid-cols-[1fr_auto_14rem] sm:items-center",
                  i > 0 && "border-t border-border",
                )}
              >
                <span className="text-sm text-foreground">{item.label}</span>
                {readOnly ? (
                  <span className="text-sm text-muted-foreground">{row.answer || "—"}</span>
                ) : (
                  <div className="flex gap-2">
                    {["Yes", "No"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSupervisionValue(item.key, { answer: row.answer === opt ? "" : opt })}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          row.answer === opt
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary",
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {readOnly ? (
                  <span className="text-sm text-muted-foreground">{row.comment || ""}</span>
                ) : (
                  <Input
                    placeholder="Comments"
                    value={row.comment}
                    maxLength={300}
                    onChange={(e) => setSupervisionValue(item.key, { comment: e.target.value })}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Signatures" description="Both signatures are made on this device before you leave.">
        <div className="grid gap-6 sm:grid-cols-2">
          {readOnly ? (
            <SignatureImage src={nurseSig} label="Nurse / supervisor signature" />
          ) : (
            <SignaturePad label="Nurse / supervisor signature" value={nurseSig} onChange={setNurseSig} />
          )}
          {readOnly ? (
            <SignatureImage src={aideSig} label="Aide signature" />
          ) : (
            <SignaturePad label="Aide signature" value={aideSig} onChange={setAideSig} />
          )}
        </div>
      </Section>

      {!readOnly && (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-end gap-3 px-4 py-3">
            <Button variant="outline" onClick={() => save("draft")} disabled={saving}>
              Save draft
            </Button>
            <Button onClick={() => save("completed")} disabled={saving}>
              {saving ? "Saving…" : "Complete note"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="font-serif text-xl text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  readOnly,
  children,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {readOnly ? <p className="text-foreground">{value || "—"}</p> : children}
    </div>
  );
}
