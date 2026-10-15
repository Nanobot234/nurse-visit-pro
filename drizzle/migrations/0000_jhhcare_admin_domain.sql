create or replace function public.enforce_admin_domain()
returns trigger language plpgsql security definer set search_path = public as $$
declare _email text; _confirmed timestamptz;
begin
  if new.role = 'admin' then
    select email, email_confirmed_at into _email, _confirmed from auth.users where id = new.user_id;
    if _email is null or _confirmed is null or lower(split_part(_email,'@',2)) <> 'jhhcare.com' then
      raise exception 'Only verified @jhhcare.com accounts can be admins';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists enforce_admin_domain on public.user_roles;
create trigger enforce_admin_domain before insert or update on public.user_roles
for each row execute function public.enforce_admin_domain();

create or replace function public.grant_role_for_verified_domain()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and lower(split_part(new.email,'@',2)) = 'jhhcare.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end; $$;

drop trigger if exists on_auth_user_created_grant_admin on auth.users;
create trigger on_auth_user_created_grant_admin after insert on auth.users
for each row execute function public.grant_role_for_verified_domain();

drop trigger if exists on_auth_user_confirmed_grant_admin on auth.users;
create trigger on_auth_user_confirmed_grant_admin after update of email_confirmed_at on auth.users
for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function public.grant_role_for_verified_domain();

insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users
where email_confirmed_at is not null and lower(split_part(email,'@',2)) = 'jhhcare.com'
on conflict (user_id, role) do nothing;