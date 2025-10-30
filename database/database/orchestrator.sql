-- database/orchestrator.sql
create table if not exists tickets (
  id serial primary key,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id serial primary key,
  trace_id uuid not null,
  ticket_id int references tickets(id) on delete set null,
  event text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id serial primary key,
  ticket_id int references tickets(id) on delete set null,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  trace_id uuid,
  actor text default 'system',
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id serial primary key,
  ticket_id int references tickets(id) on delete cascade,
  kind text not null,
  status text not null default 'new',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists agent_log (
  id serial primary key,
  ticket_id int references tickets(id) on delete cascade,
  agent text not null default 'unknown',
  input jsonb not null,
  output jsonb not null,
  trace_id uuid,
  created_at timestamptz not null default now()
);
