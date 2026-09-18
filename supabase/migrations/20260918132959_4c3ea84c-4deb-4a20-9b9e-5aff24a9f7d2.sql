CREATE TYPE public.app_role AS ENUM ('admin', 'nurse');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE TABLE public.visit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL DEFAULT '',
  patient_id_number TEXT,
  visit_date DATE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  aide_present BOOLEAN NOT NULL DEFAULT false,
  aide_name TEXT,
  nurse_signature TEXT,
  nurse_signed_at TIMESTAMPTZ,
  aide_signature TEXT,
  aide_signed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX visit_notes_patient_name_idx ON public.visit_notes (lower(patient_name));
CREATE INDEX visit_notes_nurse_idx ON public.visit_notes (nurse_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visit_notes TO authenticated;
GRANT ALL ON public.visit_notes TO service_role;
ALTER TABLE public.visit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own profile readable" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Own roles readable" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Notes readable by owner or admin" ON public.visit_notes FOR SELECT TO authenticated
  USING (nurse_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Nurses create own notes" ON public.visit_notes FOR INSERT TO authenticated
  WITH CHECK (nurse_id = auth.uid());
CREATE POLICY "Nurses edit own drafts" ON public.visit_notes FOR UPDATE TO authenticated
  USING (nurse_id = auth.uid() AND status = 'draft')
  WITH CHECK (nurse_id = auth.uid());
CREATE POLICY "Nurses delete own drafts" ON public.visit_notes FOR DELETE TO authenticated
  USING (nurse_id = auth.uid() AND status = 'draft');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER visit_notes_updated_at BEFORE UPDATE ON public.visit_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.phone,
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'nurse')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();