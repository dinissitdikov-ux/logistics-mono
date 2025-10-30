create table if not exists public.audit_log (
id serial primary key,
ticket_id int references public.tickets(id) on delete set null,
action text not null,
meta jsonb not null default '{}',
actor text not null default 'system',
ts timestamptz not null default now()
);