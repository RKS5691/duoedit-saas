-- ============================================================
-- DuoEdit SaaS — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ────────────────────────────────────────────────
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text unique not null,
  full_name   text,
  avatar_url  text,
  role        text default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── SUBSCRIPTIONS ────────────────────────────────────────────
create table public.subscriptions (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  plan            text default 'starter' check (plan in ('starter', 'pro', 'studio')),
  status          text default 'active' check (status in ('active', 'cancelled', 'paused', 'trialing', 'expired')),
  gateway         text check (gateway in ('razorpay', 'stripe', 'free')),
  payment_id      text,
  stripe_sub_id   text unique,
  stripe_cust_id  text,
  razorpay_sub_id text,
  amount          integer default 0,
  currency        text default 'INR',
  started_at      timestamptz default now(),
  renews_at       timestamptz,
  cancelled_at    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── TRANSACTIONS ─────────────────────────────────────────────
create table public.transactions (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  subscription_id uuid references public.subscriptions(id),
  gateway         text not null check (gateway in ('razorpay', 'stripe')),
  gateway_txn_id  text unique not null,
  amount          integer not null,
  currency        text default 'INR',
  status          text default 'pending' check (status in ('pending', 'success', 'failed', 'refunded')),
  plan            text,
  metadata        jsonb default '{}',
  created_at      timestamptz default now()
);

-- ── PROJECTS ─────────────────────────────────────────────────
create table public.projects (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  title       text not null default 'Untitled Project',
  description text,
  status      text default 'draft' check (status in ('draft', 'processing', 'exported', 'failed')),
  file_path   text,
  output_path text,
  file_size   bigint default 0,
  duration    float default 0,
  thumbnail   text,
  metadata    jsonb default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── EXPORTS ──────────────────────────────────────────────────
create table public.exports (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  quality    text default '1080p' check (quality in ('720p','1080p','4k','8k')),
  status     text default 'queued' check (status in ('queued','processing','done','failed')),
  output_url text,
  file_size  bigint,
  created_at timestamptz default now()
);

-- ── PLAN LIMITS VIEW ──────────────────────────────────────────
create or replace view public.user_usage as
select
  p.id as user_id,
  p.email,
  coalesce(s.plan, 'starter') as plan,
  coalesce(s.status, 'active') as sub_status,
  count(distinct proj.id) as total_projects,
  count(distinct e.id) filter (
    where e.created_at > date_trunc('month', now())
  ) as exports_this_month,
  coalesce(sum(proj.file_size), 0) as storage_used_bytes,
  case coalesce(s.plan, 'starter')
    when 'starter' then 5
    when 'pro'     then 99999
    when 'studio'  then 99999
    else 5
  end as export_limit,
  case coalesce(s.plan, 'starter')
    when 'starter' then 524288000    -- 500 MB
    when 'pro'     then 53687091200  -- 50 GB
    when 'studio'  then 536870912000 -- 500 GB
    else 524288000
  end as storage_limit_bytes
from public.profiles p
left join public.subscriptions s
  on s.user_id = p.id and s.status = 'active'
left join public.projects proj on proj.user_id = p.id
left join public.exports e on e.user_id = p.id
group by p.id, p.email, s.plan, s.status;

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.subscriptions enable row level security;
alter table public.transactions  enable row level security;
alter table public.projects      enable row level security;
alter table public.exports       enable row level security;

-- Profiles: users see/edit own only
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Admin sees all profiles
create policy "profiles_admin_all" on public.profiles for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Subscriptions: own only
create policy "subs_select_own" on public.subscriptions for select using (auth.uid() = user_id);
create policy "subs_admin_all"  on public.subscriptions for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Transactions: own only
create policy "txn_select_own" on public.transactions for select using (auth.uid() = user_id);
create policy "txn_admin_all"  on public.transactions for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Projects: own only
create policy "proj_select_own" on public.projects for select using (auth.uid() = user_id);
create policy "proj_all_own"    on public.projects for all    using (auth.uid() = user_id);

-- Exports: own only
create policy "exp_select_own" on public.exports for select using (auth.uid() = user_id);
create policy "exp_all_own"    on public.exports for all    using (auth.uid() = user_id);

-- ── INDEXES ───────────────────────────────────────────────────
create index idx_subs_user_id    on public.subscriptions(user_id);
create index idx_subs_status     on public.subscriptions(status);
create index idx_txn_user_id     on public.transactions(user_id);
create index idx_projects_user   on public.projects(user_id);
create index idx_exports_user    on public.exports(user_id);
create index idx_exports_project on public.exports(project_id);
