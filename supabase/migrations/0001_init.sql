-- rate my setup: schema, access rules and storage.
-- All writes go through the app's API routes (service role), which check wallet sign-in,
-- token holding and rate limits. The browser can only read public data.

create table public.config (
  id int primary key default 1 check (id = 1),
  current_round int not null default 1,
  pool_sol numeric not null default 0 check (pool_sol >= 0),
  ends_at timestamptz,
  split int[] not null default '{50,30,20}',
  min_ratings int not null default 5 check (min_ratings >= 0),
  mint text not null default ''
);
insert into public.config default values;

create table public.setups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users on delete cascade,
  wallet text not null unique,
  title text not null check (char_length(title) between 1 and 60),
  handle text not null default '' check (char_length(handle) <= 30),
  cpu text not null default '' check (char_length(cpu) <= 60),
  gpu text not null default '' check (char_length(gpu) <= 60),
  monitor text not null default '' check (char_length(monitor) <= 80),
  peripherals text not null default '' check (char_length(peripherals) <= 100),
  tags text[] not null default '{}',
  image_path text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ratings (
  round int not null,
  setup_id uuid not null references public.setups on delete cascade,
  rater_id uuid not null references auth.users on delete cascade,
  rater_wallet text not null,
  score int not null check (score between 1 and 10),
  created_at timestamptz not null default now(),
  primary key (round, setup_id, rater_id)
);
create index ratings_rater_recent on public.ratings (rater_id, created_at desc);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  round int not null,
  place int not null check (place >= 1),
  setup_id uuid references public.setups on delete set null,
  title text not null,
  wallet text not null,
  amount_sol numeric not null check (amount_sol >= 0),
  tx text not null unique,
  paid_at timestamptz not null default now(),
  unique (round, place)
);

alter table public.config enable row level security;
alter table public.setups enable row level security;
alter table public.ratings enable row level security;
alter table public.payouts enable row level security;

create policy "anyone can read config" on public.config for select using (true);
create policy "anyone can read visible setups" on public.setups for select using (not hidden);
create policy "anyone can read payouts" on public.payouts for select using (true);
-- ratings has no policies: individual votes are never readable from the browser.

-- Current-round leaderboard. Weighted so one 10 can't beat many 9s: (6*3 + sum) / (3 + n).
create view public.standings as
select
  s.id, s.title, s.handle, s.wallet, s.cpu, s.gpu, s.monitor, s.peripherals, s.tags, s.image_path, s.created_at,
  count(r.score)::int as n,
  coalesce(avg(r.score), 0)::float8 as avg,
  ((18 + coalesce(sum(r.score), 0))::float8 / (3 + count(r.score)))::float8 as ranked
from public.setups s
cross join public.config c
left join public.ratings r on r.setup_id = s.id and r.round = c.current_round
where not s.hidden
group by s.id;

grant select on public.standings to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('setup-images', 'setup-images', true, 4194304, array['image/jpeg', 'image/png', 'image/webp']);
