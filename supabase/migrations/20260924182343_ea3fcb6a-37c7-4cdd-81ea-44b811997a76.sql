-- Progress notes are an office/admin feature only.
DROP POLICY IF EXISTS "Staff read progress notes" ON public.progress_notes;
DROP POLICY IF EXISTS "Staff create own progress notes" ON public.progress_notes;
DROP POLICY IF EXISTS "Author or admin update progress notes" ON public.progress_notes;
DROP POLICY IF EXISTS "Staff delete progress notes" ON public.progress_notes;

CREATE POLICY "Admins read progress notes"
  ON public.progress_notes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins create progress notes"
  ON public.progress_notes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update progress notes"
  ON public.progress_notes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete progress notes"
  ON public.progress_notes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Keep the API grants in place (row rules above decide who sees what).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress_notes TO authenticated;
GRANT ALL ON public.progress_notes TO service_role;