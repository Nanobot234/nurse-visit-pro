CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  patient_id_number text,
  date_of_birth date,
  phone text,
  address text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read patients" ON public.patients
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins create patients" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update patients" ON public.patients
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete patients" ON public.patients
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX patients_name_idx ON public.patients (lower(full_name));

CREATE TABLE public.progress_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  contact_type text NOT NULL DEFAULT 'other',
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress_notes TO authenticated;
GRANT ALL ON public.progress_notes TO service_role;

ALTER TABLE public.progress_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read progress notes" ON public.progress_notes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff create own progress notes" ON public.progress_notes
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Author or admin update progress notes" ON public.progress_notes
  FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Author or admin delete progress notes" ON public.progress_notes
  FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_progress_notes_updated_at BEFORE UPDATE ON public.progress_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX progress_notes_patient_idx ON public.progress_notes (patient_id, occurred_at DESC);

ALTER TABLE public.visit_notes ADD COLUMN patient_ref uuid REFERENCES public.patients(id) ON DELETE SET NULL;
CREATE INDEX visit_notes_patient_ref_idx ON public.visit_notes (patient_ref);