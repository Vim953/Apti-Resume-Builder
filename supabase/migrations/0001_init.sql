-- APTI AI Resume Builder — initial schema
-- Matches SRS §4 Data Requirements. Postgres/Supabase.

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────
-- templates
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists templates (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  plan_min    text not null check (plan_min in ('free', 'pro')) default 'free',
  config      jsonb not null default '{}'::jsonb, -- layout, fonts, accent colors
  ats_safe    boolean not null default true,       -- single-column, standard headings (RB-TPL-02)
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- resumes
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists resumes (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null default 'Untitled Resume',
  template_id  uuid references templates(id),
  target_role  text,
  ats_score    int check (ats_score between 0 and 100),
  is_default   boolean not null default false,
  watermarked  boolean not null default true, -- Free plan default (RB-EXP-02)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_resumes_user on resumes(user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- resume_sections
-- type: personal | education | skills | projects | certs | experience | custom
-- content stores flexible per-section JSON — includes include/exclude flags
-- and student overrides for data referenced from Projects/Certifications
-- modules (source-of-truth stays in those modules, per SRS §4 note).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists resume_sections (
  id          uuid primary key default uuid_generate_v4(),
  resume_id   uuid not null references resumes(id) on delete cascade,
  type        text not null check (type in
              ('personal','education','skills','projects','certs','experience','custom')),
  "order"     int not null default 0,
  visible     boolean not null default true,
  content     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_sections_resume on resume_sections(resume_id);

-- ─────────────────────────────────────────────────────────────────────────
-- resume_ai_events — audit trail of every AI action (RB-AI-04 accept/reject)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists resume_ai_events (
  id          uuid primary key default uuid_generate_v4(),
  resume_id   uuid not null references resumes(id) on delete cascade,
  action      text not null check (action in ('improve','tip','summary','desc')),
  input       text,
  output      text,
  accepted    boolean,               -- null until student responds to the diff
  tokens      int,
  cost_usd    numeric(10,6),
  created_at  timestamptz not null default now()
);

create index if not exists idx_ai_events_resume on resume_ai_events(resume_id);

-- ─────────────────────────────────────────────────────────────────────────
-- ats_scores — one row per computed score (history), latest mirrored onto
-- resumes.ats_score for fast reads
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists ats_scores (
  id          uuid primary key default uuid_generate_v4(),
  resume_id   uuid not null references resumes(id) on delete cascade,
  total       int not null check (total between 0 and 100),
  components  jsonb not null, -- {keyword_coverage: {score,weight,detail}, ...}
  target_jd   text,           -- nullable; set when RB-ATS-04 JD-match mode used
  computed_at timestamptz not null default now()
);

create index if not exists idx_ats_scores_resume on ats_scores(resume_id);

-- ─────────────────────────────────────────────────────────────────────────
-- ai_credits — per-student metering (RB-ENT-03)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists ai_credits (
  user_id     uuid not null references auth.users(id) on delete cascade,
  plan        text not null check (plan in ('free','pro')) default 'free',
  period      text not null, -- e.g. '2026-07'
  used        int not null default 0,
  "limit"     int not null default 20,
  primary key (user_id, period)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security — a student only sees their own resumes/events/scores
-- ─────────────────────────────────────────────────────────────────────────
alter table resumes enable row level security;
alter table resume_sections enable row level security;
alter table resume_ai_events enable row level security;
alter table ats_scores enable row level security;
alter table ai_credits enable row level security;
alter table templates enable row level security;

create policy "resumes_owner_all" on resumes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sections_owner_all" on resume_sections
  for all using (
    exists (select 1 from resumes r where r.id = resume_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from resumes r where r.id = resume_id and r.user_id = auth.uid())
  );

create policy "ai_events_owner_all" on resume_ai_events
  for all using (
    exists (select 1 from resumes r where r.id = resume_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from resumes r where r.id = resume_id and r.user_id = auth.uid())
  );

create policy "ats_scores_owner_all" on ats_scores
  for all using (
    exists (select 1 from resumes r where r.id = resume_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from resumes r where r.id = resume_id and r.user_id = auth.uid())
  );

create policy "ai_credits_owner_all" on ai_credits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- templates are readable by everyone (catalog); writes are admin-only via
-- service role key from the NestJS admin endpoints, so no public write policy.
create policy "templates_read_all" on templates
  for select using (true);

-- ─────────────────────────────────────────────────────────────────────────
-- updated_at triggers
-- ─────────────────────────────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_resumes_updated_at before update on resumes
  for each row execute function set_updated_at();

create trigger trg_sections_updated_at before update on resume_sections
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- seed: one ATS-safe Free template (RB-TPL-01)
-- ─────────────────────────────────────────────────────────────────────────
insert into templates (name, plan_min, ats_safe, config)
values (
  'Classic ATS',
  'free',
  true,
  '{"columns":1,"font":"Plus Jakarta Sans","accent":"#5B4FE8","headingStyle":"uppercase-underline"}'::jsonb
)
on conflict do nothing;

insert into templates (name, plan_min, ats_safe, config)
values
  ('Modern Indigo', 'pro', true, '{"columns":1,"font":"Plus Jakarta Sans","accent":"#5B4FE8","headingStyle":"pill"}'::jsonb),
  ('Minimal Violet', 'pro', true, '{"columns":1,"font":"Plus Jakarta Sans","accent":"#7C3AED","headingStyle":"line"}'::jsonb)
on conflict do nothing;
