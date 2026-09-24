DROP POLICY IF EXISTS "Author or admin delete progress notes" ON public.progress_notes;
CREATE POLICY "Staff delete progress notes" ON public.progress_notes FOR DELETE TO authenticated USING (true);