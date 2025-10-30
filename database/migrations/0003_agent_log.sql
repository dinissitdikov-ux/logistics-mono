create table if not exists public.agent_log (
  id          serial primary key,
  ticket_id   int not null references public.tickets(id) on delete cascade,
  trace_id    uuid not null,
  agent       text not null default 'unknown',
  input       jsonb not null default '{}',
  output      jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
