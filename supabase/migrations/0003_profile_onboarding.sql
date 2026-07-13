-- Profile/onboarding fields used to pre-fill new resumes.

alter table profiles add column if not exists email text;
alter table profiles add column if not exists full_name text;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists location text;
alter table profiles add column if not exists github text;
alter table profiles add column if not exists linkedin text;
alter table profiles add column if not exists portfolio text;
alter table profiles add column if not exists target_role text;
alter table profiles add column if not exists education jsonb not null default '[]'::jsonb;
alter table profiles add column if not exists skills jsonb not null default '[]'::jsonb;

create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (
    id,
    plan,
    email,
    full_name,
    phone,
    location,
    github,
    linkedin,
    portfolio,
    target_role,
    education,
    skills
  )
  values (
    new.id,
    'free',
    new.email,
    new.raw_user_meta_data->>'fullName',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'location',
    new.raw_user_meta_data->>'github',
    new.raw_user_meta_data->>'linkedin',
    new.raw_user_meta_data->>'portfolio',
    new.raw_user_meta_data->>'targetRole',
    coalesce(new.raw_user_meta_data->'education', '[]'::jsonb),
    coalesce(new.raw_user_meta_data->'skills', '[]'::jsonb)
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, profiles.email),
    full_name = coalesce(excluded.full_name, profiles.full_name),
    phone = coalesce(excluded.phone, profiles.phone),
    location = coalesce(excluded.location, profiles.location),
    github = coalesce(excluded.github, profiles.github),
    linkedin = coalesce(excluded.linkedin, profiles.linkedin),
    portfolio = coalesce(excluded.portfolio, profiles.portfolio),
    target_role = coalesce(excluded.target_role, profiles.target_role),
    education = case when excluded.education = '[]'::jsonb then profiles.education else excluded.education end,
    skills = case when excluded.skills = '[]'::jsonb then profiles.skills else excluded.skills end;
  return new;
end;
$$ language plpgsql security definer;

insert into public.profiles (id, plan, email, full_name, phone, location, github, linkedin, portfolio, target_role, education, skills)
select
  id,
  'free',
  email,
  raw_user_meta_data->>'fullName',
  raw_user_meta_data->>'phone',
  raw_user_meta_data->>'location',
  raw_user_meta_data->>'github',
  raw_user_meta_data->>'linkedin',
  raw_user_meta_data->>'portfolio',
  raw_user_meta_data->>'targetRole',
  coalesce(raw_user_meta_data->'education', '[]'::jsonb),
  coalesce(raw_user_meta_data->'skills', '[]'::jsonb)
from auth.users
on conflict (id) do update set
  email = coalesce(excluded.email, profiles.email),
  full_name = coalesce(excluded.full_name, profiles.full_name),
  phone = coalesce(excluded.phone, profiles.phone),
  location = coalesce(excluded.location, profiles.location),
  github = coalesce(excluded.github, profiles.github),
  linkedin = coalesce(excluded.linkedin, profiles.linkedin),
  portfolio = coalesce(excluded.portfolio, profiles.portfolio),
  target_role = coalesce(excluded.target_role, profiles.target_role),
  education = case when excluded.education = '[]'::jsonb then profiles.education else excluded.education end,
  skills = case when excluded.skills = '[]'::jsonb then profiles.skills else excluded.skills end;
