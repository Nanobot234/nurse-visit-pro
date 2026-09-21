import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePatients, type PatientRow } from "@/lib/patients";
import { useStaff } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/patients")({
  head: () => ({
    meta: [
      { title: "Patients | JARME" },
      { name: "description", content: "Office list of patients that nurses can select on visit notes and progress notes." },
      { property: "og:title", content: "Patients | JARME" },
      { property: "og:description", content: "Add and manage the patient list for the agency." },
    ],
  }),
  component: PatientsPage,
});

const emptyForm = {
  full_name: "",
  patient_id_number: "",
  date_of_birth: "",
  phone: "",
  address: "",
};

function PatientsPage() {
  const { data: staff, isLoading: staffLoading } = useStaff();
  const { data: patients, isLoading } = usePatients();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["patients"] });

  const savePatient = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: form.full_name.trim(),
        patient_id_number: form.patient_id_number.trim() || null,
        date_of_birth: form.date_of_birth || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      };
      if (!payload.full_name) throw new Error("Please enter the patient's name.");
      if (editingId) {
        const { error } = await supabase.from("patients").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data: auth } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("patients")
          .insert({ ...payload, created_by: auth.user?.id ?? null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success(editingId ? "Patient updated." : "Patient added.");
      setForm({ ...emptyForm });
      setEditingId(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save the patient"),
  });

  const toggleActive = useMutation({
    mutationFn: async (patient: PatientRow) => {
      const { error } = await supabase
        .from("patients")
        .update({ active: !patient.active })
        .eq("id", patient.id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update the patient"),
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

  const term = search.trim().toLowerCase();
  const visible = (patients ?? []).filter((p) =>
    term ? p.full_name.toLowerCase().includes(term) : true,
  );

  const startEdit = (patient: PatientRow) => {
    setEditingId(patient.id);
    setForm({
      full_name: patient.full_name,
      patient_id_number: patient.patient_id_number ?? "",
      date_of_birth: patient.date_of_birth ?? "",
      phone: patient.phone ?? "",
      address: patient.address ?? "",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Patients</h1>
        <p className="mt-1 text-muted-foreground">
          Patients added here can be picked from a list on visit notes and progress notes.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-serif text-xl text-foreground">
          {editingId ? "Edit patient" : "Add a patient"}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>
              Patient's name<span className="text-destructive"> *</span>
            </Label>
            <Input
              value={form.full_name}
              maxLength={120}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>ID #</Label>
            <Input
              value={form.patient_id_number}
              maxLength={60}
              onChange={(e) => setForm((f) => ({ ...f, patient_id_number: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Date of birth</Label>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              maxLength={40}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Address</Label>
            <Input
              value={form.address}
              maxLength={200}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          {editingId && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm({ ...emptyForm });
              }}
            >
              Cancel
            </Button>
          )}
          <Button onClick={() => savePatient.mutate()} disabled={savePatient.isPending}>
            {savePatient.isPending ? "Saving…" : editingId ? "Save changes" : "Add patient"}
          </Button>
        </div>
      </section>

      <div className="space-y-4">
        <Input
          placeholder="Search patients…"
          value={search}
          maxLength={100}
          onChange={(e) => setSearch(e.target.value)}
        />
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !visible.length ? (
          <p className="text-muted-foreground">No patients yet.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {visible.map((patient) => (
              <li key={patient.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{patient.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[patient.patient_id_number && `ID ${patient.patient_id_number}`, patient.phone]
                      .filter(Boolean)
                      .join(" · ") || "No extra details"}
                  </p>
                </div>
                {!patient.active && <Badge variant="secondary">Inactive</Badge>}
                <div className="ml-auto flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(patient)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive.mutate(patient)}
                    disabled={toggleActive.isPending}
                  >
                    {patient.active ? "Make inactive" : "Make active"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
