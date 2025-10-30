create table if not exists public.tasks (
  id         serial primary key,
  ticket_id  int not null references public.tickets(id) on delete cascade,
  kind       text not null,
  status     text not null default 'new',
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);
