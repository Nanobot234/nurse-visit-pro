import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { visitNoteSections, supervisionItems } from "./visit-note-schema";

const idInput = (d: unknown) => z.object({ id: z.string().uuid() }).parse(d);

/** Builds the PDF for a completed visit note and files it in the patient's SharePoint folder. */
export const fileVisitNoteToSharePoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idInput)
  .handler(async ({ data, context }) => {
    const { NotePdf, uploadToPatientFolder } = await import("./sharepoint.server");
    const { data: note, error } = await context.supabase
      .from("visit_notes").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!note) throw new Error("Visit note not found.");
    const { data: nurse } = await context.supabase
      .from("profiles").select("full_name").eq("id", note.nurse_id).maybeSingle();

    const body = (note.data ?? {}) as {
      answers?: Record<string, string>;
      supervision?: Record<string, { answer: string; comment: string }>;
    };
    const answers = body.answers ?? {};
    const sup = body.supervision ?? {};

    const pdf = await NotePdf.create("Nursing Visit Note");
    pdf.heading("Patient");
    pdf.row("Patient's name", note.patient_name);
    pdf.row("ID #", note.patient_id_number ?? "");
    pdf.row("Visit date", note.visit_date ?? "");
    pdf.row("Nurse", nurse?.full_name ?? "");
    for (const section of visitNoteSections) {
      pdf.heading(section.title);
      for (const f of section.fields) pdf.row(f.label, answers[f.key] ?? "");
    }
    pdf.heading("HHA / PCA supervision");
    pdf.row("Aide present", note.aide_present ? "Yes" : "No");
    pdf.row("Aide name", note.aide_name ?? "");
    for (const item of supervisionItems) {
      const r = sup[item.key];
      pdf.row(item.label, [r?.answer, r?.comment].filter(Boolean).join(" - "));
    }
    pdf.heading("Signatures");
    await pdf.signature("Nurse / supervisor signature", note.nurse_signature, note.nurse_signed_at);
    await pdf.signature("Aide signature", note.aide_signature, note.aide_signed_at);

    const date = note.visit_date ?? new Date().toISOString().slice(0, 10);
    const url = await uploadToPatientFolder({
      patientName: note.patient_name,
      subfolder: "Nursing Visit Notes",
      year: date.slice(0, 4),
      fileBase: `Nursing Visit Note - ${date.slice(0, 7)}`,
      pdf: await pdf.save(),
    });
    return { url };
  });

const contactLabels: Record<string, string> = {
  phone_call: "Phone call",
  family_call: "Call from family",
  visit: "Visit",
  message: "Message / email",
  other: "Other",
};

/** Builds the PDF for a progress note and files it under the patient's "Patient Notes" folder. */
export const fileProgressNoteToSharePoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idInput)
  .handler(async ({ data, context }) => {
    const { NotePdf, uploadToPatientFolder } = await import("./sharepoint.server");
    const { data: note, error } = await context.supabase
      .from("progress_notes").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!note) throw new Error("Progress note not found.");
    const [{ data: patient }, { data: author }] = await Promise.all([
      context.supabase.from("patients").select("full_name, patient_id_number").eq("id", note.patient_id).maybeSingle(),
      context.supabase.from("profiles").select("full_name").eq("id", note.author_id).maybeSingle(),
    ]);
    if (!patient) throw new Error("Patient not found.");

    const when = new Date(note.occurred_at);
    const pdf = await NotePdf.create("Patient Progress Note");
    pdf.heading("Details");
    pdf.row("Patient's name", patient.full_name);
    pdf.row("ID #", patient.patient_id_number ?? "");
    pdf.row("Date / time", when.toLocaleString("en-US", { timeZone: "America/New_York" }));
    pdf.row("Type of contact", contactLabels[note.contact_type] ?? "Other");
    pdf.row("Written by", author?.full_name ?? "");
    pdf.heading("Note");
    pdf.paragraph(note.body);

    const ny = when.toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD
    const url = await uploadToPatientFolder({
      patientName: patient.full_name,
      subfolder: "Patient Notes",
      year: ny.slice(0, 4),
      fileBase: `Patient Note - ${ny.slice(0, 7)}`,
      pdf: await pdf.save(),
    });
    return { url };
  });
