-- APTI AI Resume Builder — profiles (entitlements) + storage bucket
-- Adds the Subscription-module touch-point (SRS §2.3) as a real table so
-- the API can resolve a student's plan server-side (apps/api/src/auth/
-- supabase-auth.guard.ts) instead of trusting a client-supplied `plan`
-- query/body param, which would otherwise let anyone grant themselves Pro.

-- ─────────────────────────────────────────────────────────────────────────
-- profiles — one row per auth user, source of truth for plan/entitlements
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  plan        text not null check (plan in ('free', 'pro')) default 'free',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table profiles enable row level security;

-- Students can read their own plan (surfaced in the UI), but cannot write
-- it themselves — upgrading plan is a Subscription-module/billing concern
-- and should only ever be written by the service-role key (e.g. a
-- webhook from your payment provider) or an admin tool.
create policy "profiles_owner_read" on profiles
  for select using (auth.uid() = id);

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a Free-plan profile row the moment someone signs up, so the
-- API's plan lookup never has to special-case a missing row.
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, plan) values (new.id, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill: give every existing auth user a profile row so nobody is
-- stuck without one if this migration runs after users already exist.
insert into public.profiles (id, plan)
select id, 'free' from auth.users
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────
-- Storage bucket for generated PDFs (RB-EXP-01, NF-SEC-03)
-- Private bucket — the API only ever hands out short-lived signed URLs
-- (see apps/api/src/pdf/pdf.service.ts), so no public read policy is added.
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('resume-exports', 'resume-exports', false)
on conflict (id) do nothing;
