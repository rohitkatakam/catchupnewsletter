create table users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text,
  created_at  timestamptz default now()
);

create table groups (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  owner_id      uuid references users(id),
  send_day      int not null,
  deadline_day  int not null,
  send_hour     int not null,
  timezone      text not null,
  char_limit    int default 500,
  created_at    timestamptz default now()
);

create table group_invites (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references groups(id),
  code        text unique not null,
  created_by  uuid references users(id),
  created_at  timestamptz default now()
);

create table group_members (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid references groups(id),
  user_id         uuid references users(id),
  joined_at       timestamptz default now(),
  is_confirmed    boolean default false,
  is_active       boolean default true,
  confirm_token   text unique,
  confirm_sent_at timestamptz
);

create table prompts (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references groups(id),
  content     text not null,
  category    text,
  week_of     date not null,
  created_at  timestamptz default now()
);

create table responses (
  id            uuid primary key default gen_random_uuid(),
  prompt_id     uuid references prompts(id),
  user_id       uuid references users(id),
  content       text not null,
  submitted_at  timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (prompt_id, user_id)
);

create table response_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id),
  prompt_id   uuid references prompts(id),
  token       text unique not null,
  expires_at  timestamptz not null,
  used_at     timestamptz
);

create table newsletters (
  id          uuid primary key default gen_random_uuid(),
  prompt_id   uuid references prompts(id),
  content     text not null,
  sent_at     timestamptz default now()
);
