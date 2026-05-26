create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_app_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_settings_touch_updated_at on public.app_settings;

create trigger app_settings_touch_updated_at
before update on public.app_settings
for each row
execute function public.touch_app_settings_updated_at();

alter table public.app_settings enable row level security;

drop policy if exists "Allow app settings read" on public.app_settings;
drop policy if exists "Allow app settings insert" on public.app_settings;
drop policy if exists "Allow app settings update" on public.app_settings;

create policy "Allow app settings read"
on public.app_settings
for select
using (true);

create policy "Allow app settings insert"
on public.app_settings
for insert
with check (true);

create policy "Allow app settings update"
on public.app_settings
for update
using (true)
with check (true);
