-- Norsk: Initielt skjema for logistikk-MVP (PostgreSQL 16)
-- Norsk: Enheter: cm/kg; avrunding 1 cm og 0.1 kg

BEGIN;

-- Norsk: Enum-typer
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'direction_t') THEN
        CREATE TYPE direction_t AS ENUM ('LYR_TO_TOS','TOS_TO_LYR');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_type_t') THEN
        CREATE TYPE request_type_t AS ENUM ('pricing','order');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status_t') THEN
        CREATE TYPE ticket_status_t AS ENUM ('new','collecting','waiting_docs','compliance','cost_ready','confirmed','ready_to_dispatch','archived','blocked');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transport_t') THEN
        CREATE TYPE transport_t AS ENUM ('air','sea','auto','undecided');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payer_t') THEN
        CREATE TYPE payer_t AS ENUM ('sender','receiver','third_party');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'party_role_t') THEN
        CREATE TYPE party_role_t AS ENUM ('sender','receiver','payer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_kind_t') THEN
        CREATE TYPE doc_kind_t AS ENUM ('invoice','packing_list','permit','msds','other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_validation_t') THEN
        CREATE TYPE doc_validation_t AS ENUM ('ok','needs_translation','rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'msg_role_t') THEN
        CREATE TYPE msg_role_t AS ENUM ('user','assistant','operator','system');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_kind_t') THEN
        CREATE TYPE task_kind_t AS ENUM ('calc_air','clarify','ops','compliance_check','translate_doc');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_t') THEN
        CREATE TYPE task_status_t AS ENUM ('new','in_progress','done','failed');
    END IF;
END $$;

-- Norsk: Klienter
CREATE TABLE IF NOT EXISTS clients (
    id              BIGSERIAL PRIMARY KEY,
    external_id     TEXT UNIQUE,
    name            TEXT NOT NULL,
    phone_e164      TEXT,
    email           TEXT,
    preferred_locale TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Norsk: Билеты/заявки
CREATE TABLE IF NOT EXISTS tickets (
    id              BIGSERIAL PRIMARY KEY,
    client_id       BIGINT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    direction       direction_t NOT NULL,
    request_type    request_type_t NOT NULL,
    status          ticket_status_t NOT NULL DEFAULT 'new',
    transport       transport_t NOT NULL DEFAULT 'undecided',
    is_special      BOOLEAN NOT NULL DEFAULT FALSE,
    payer           payer_t,
    display_locale  TEXT,
    legal_hold      BOOLEAN NOT NULL DEFAULT FALSE,
    legal_hold_reason TEXT,
    legal_hold_by   TEXT,
    legal_hold_at   TIMESTAMPTZ,
    trace_id        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tickets_client ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- Norsk: Позиции отправления
CREATE TABLE IF NOT EXISTS shipment_items (
    id              BIGSERIAL PRIMARY KEY,
    ticket_id       BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    piece_no        INTEGER NOT NULL,
    qty             INTEGER NOT NULL CHECK (qty > 0),
    weight_kg       NUMERIC(8,1) NOT NULL CHECK (weight_kg > 0),
    length_cm       INTEGER CHECK (length_cm >= 0),
    width_cm        INTEGER CHECK (width_cm >= 0),
    height_cm       INTEGER CHECK (height_cm >= 0),
    is_dg           BOOLEAN NOT NULL DEFAULT FALSE,
    un_number       TEXT,
    notes           TEXT
);
CREATE INDEX IF NOT EXISTS idx_items_ticket ON shipment_items(ticket_id);

-- Norsk: Стороны
CREATE TABLE IF NOT EXISTS parties (
    id              BIGSERIAL PRIMARY KEY,
    ticket_id       BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    role            party_role_t NOT NULL,
    contact_name    TEXT,
    phone_e164      TEXT,
    email           TEXT
);

-- Norsk: Адреса
CREATE TABLE IF NOT EXISTS addresses (
    id          BIGSERIAL PRIMARY KEY,
    party_id    BIGINT NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    street      TEXT,
    city        TEXT,
    postal      TEXT,
    country     TEXT,
    notes       TEXT
);

-- Norsk: Документы
CREATE TABLE IF NOT EXISTS documents (
    id              BIGSERIAL PRIMARY KEY,
    ticket_id       BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    kind            doc_kind_t NOT NULL,
    lang            TEXT,
    validation_status doc_validation_t,
    file_uri        TEXT NOT NULL,
    sha256          TEXT UNIQUE,
    parsed_json     JSONB,
    issues          JSONB,
    uploaded_by     msg_role_t,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_ticket ON documents(ticket_id);

-- Norsk: Сообщения
CREATE TABLE IF NOT EXISTS messages (
    id              BIGSERIAL PRIMARY KEY,
    ticket_id       BIGINT REFERENCES tickets(id) ON DELETE CASCADE,
    role            msg_role_t NOT NULL,
    detected_lang   TEXT,
    text            TEXT,
    attachments     JSONB,
    extracted_fields JSONB,
    ts              TIMESTAMPTZ NOT NULL DEFAULT now(),
    trace_id        TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_ticket ON messages(ticket_id);

-- Norsk: Задачи
CREATE TABLE IF NOT EXISTS tasks (
    id              BIGSERIAL PRIMARY KEY,
    ticket_id       BIGINT REFERENCES tickets(id) ON DELETE CASCADE,
    kind            task_kind_t NOT NULL,
    status          task_status_t NOT NULL DEFAULT 'new',
    assignee        TEXT,
    due_at          TIMESTAMPTZ,
    payload         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_ticket ON tasks(ticket_id);

-- Norsk: Аудит
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    actor       TEXT,
    action      TEXT,
    entity      TEXT,
    entity_id   TEXT,
    before      JSONB,
    after       JSONB,
    ts          TIMESTAMPTZ NOT NULL DEFAULT now(),
    trace_id    TEXT
);

-- Norsk: Уведомления
CREATE TABLE IF NOT EXISTS notifications (
    id          BIGSERIAL PRIMARY KEY,
    ticket_id   BIGINT REFERENCES tickets(id) ON DELETE CASCADE,
    channel     TEXT NOT NULL DEFAULT 'email',
    recipient   TEXT,
    subject     TEXT,
    body        TEXT,
    status      TEXT,
    error       TEXT,
    ts          TIMESTAMPTZ NOT NULL DEFAULT now(),
    trace_id    TEXT
);

-- Norsk: Логи агентов (partisjonering kan legges senere)
CREATE TABLE IF NOT EXISTS agent_log (
    id          BIGSERIAL PRIMARY KEY,
    agent_name  TEXT,
    input       TEXT,
    output      TEXT,
    confidence  NUMERIC(3,2),
    status      TEXT,
    ts          TIMESTAMPTZ NOT NULL DEFAULT now(),
    trace_id    TEXT,
    ticket_id   BIGINT
);

-- Norsk: Доступы
CREATE TABLE IF NOT EXISTS access_log (
    id          BIGSERIAL PRIMARY KEY,
    user_id     TEXT,
    action      TEXT,
    ip_masked   TEXT,
    user_agent  TEXT,
    ts          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Norsk: Настройки (JSONB)
CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL
);

-- Norsk: KB-dokumenter (kan utvides i v1.1)
CREATE TABLE IF NOT EXISTS kb_docs (
    id          BIGSERIAL PRIMARY KEY,
    title       TEXT,
    locale      TEXT DEFAULT 'nb-NO',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS kb_files (
    id          BIGSERIAL PRIMARY KEY,
    doc_id      BIGINT REFERENCES kb_docs(id) ON DELETE CASCADE,
    file_uri    TEXT,
    sha256      TEXT UNIQUE
);
CREATE TABLE IF NOT EXISTS kb_chunks (
    id          BIGSERIAL PRIMARY KEY,
    doc_id      BIGINT REFERENCES kb_docs(id) ON DELETE CASCADE,
    chunk_no    INTEGER,
    text        TEXT
);

COMMIT;
