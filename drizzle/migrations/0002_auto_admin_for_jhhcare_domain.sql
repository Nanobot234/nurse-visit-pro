create or replace function public.grant_admin_for_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(split_part(new.email, '@', 2)) = 'jhhcare.com' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict do nothing;
  end if;
  return new;
end;
$$;