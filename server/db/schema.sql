-- MAVIE · Supabase schema
--
-- Paste this into the Supabase SQL editor and run it once.
-- MAVIE works without this (in-memory store); adding SUPABASE_URL and
-- SUPABASE_SERVICE_KEY to server/.env switches persistence on automatically.

create table if not exists profiles (
  id                text primary key,
  name              text,
  style_dna         text[]  default '{}',
  preferred_colors  text[]  default '{}',
  avoided_colors    text[]  default '{}',
  comfort_priority  real    default 0.5,
  budget_range      int[]   default '{50,300}',
  beauty            jsonb,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table if not exists closet_items (
  id          text primary key,
  user_id     text not null references profiles(id) on delete cascade,
  name        text,
  category    text not null,
  color       text,
  colors      text[] default '{}',
  hex         text,
  style_tags  text[] default '{}',
  image_url   text,
  created_at  timestamptz default now()
);

create table if not exists looks (
  id           text primary key,
  user_id      text references profiles(id) on delete cascade,
  name         text,
  archetype    text,
  items        jsonb not null,
  makeup       jsonb,
  total        numeric,
  scores       jsonb,
  explanation  text,
  created_at   timestamptz default now()
);

create table if not exists saved_looks (
  user_id   text not null references profiles(id) on delete cascade,
  look_id   text not null references looks(id) on delete cascade,
  saved_at  timestamptz default now(),
  primary key (user_id, look_id)
);

create table if not exists decisions (
  id              text primary key,
  user_id         text references profiles(id) on delete cascade,
  items           text[] default '{}',
  verdict         text,
  buy_confidence  int,
  regret_risk     text,
  created_at      timestamptz default now()
);

create table if not exists feedback (
  id             bigserial primary key,
  user_id        text references profiles(id) on delete cascade,
  decision_id    text,
  look_id        text,
  feedback_type  text not null,
  style_tags     text[] default '{}',
  created_at     timestamptz default now()
);

create index if not exists closet_items_user_idx on closet_items(user_id);
create index if not exists saved_looks_user_idx  on saved_looks(user_id);
create index if not exists decisions_user_idx    on decisions(user_id);

-- Row Level Security.
-- MAVIE's server uses the SERVICE key, which bypasses RLS. These policies
-- matter the moment a browser client talks to Supabase directly, so they are
-- enabled up front rather than retrofitted.
alter table profiles     enable row level security;
alter table closet_items enable row level security;
alter table looks        enable row level security;
alter table saved_looks  enable row level security;
alter table decisions    enable row level security;
alter table feedback     enable row level security;
