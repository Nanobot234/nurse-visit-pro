CREATE OR REPLACE FUNCTION public.enforce_admin_domain() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare _email text;
begin
  if new.role = 'admin' then
    select email into _email from auth.users where id = new.user_id;
    if _email is null or lower(split_part(_email,'@',2)) <> 'jhhcare.com' then
      raise exception 'Only @jhhcare.com accounts can be admins';
    end if;
  end if;
  return new;
end; $$;