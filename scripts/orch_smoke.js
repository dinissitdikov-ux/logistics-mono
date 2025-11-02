// scripts/orch_smoke.js
/* Kommentarer: norsk */
// Laster .env
require("dotenv").config();
const fetch = require("node-fetch");

const base = `http://127.0.0.1:${process.env.PORT || 5000}`;

/* Hjelpefunksjoner */
async function login() {
  // Innlogging for å få JWT
  const r = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "Admin1234" }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`login_failed: ${JSON.stringify(j)}`);
  return j.token;
}

async function emit(token, body) {
  // Sender hendelse til orkestratoren
  const r = await fetch(`${base}/api/orch/emit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`emit_failed: ${JSON.stringify(j)}`);
  return j;
}

async function debug(ticketId, token) {
  // Henter full historikk for en billett
  const r = await fetch(`${base}/api/orch/debug?ticket_id=${ticketId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`debug_failed: ${JSON.stringify(j)}`);
  return j;
}

/* Røyk-testsekvens (FSM) */
(async () => {
  const token = await login();

  // 1) Opprett ny billett via første hendelse
  const first = await emit(token, {
    event: "user_provided",
    payload: { source: "smoke" },
  });
  let ticketId = first.ticket_id;
  console.log("[new]", { ticket_id: ticketId, status: first.status });

  // 2) Korrekt kjede av overganger
  const steps = [
    { event: "file_uploaded", payload: { files: ["invoice.pdf"] } }, // collecting → waiting_docs
    { event: "agent_result", payload: { ok: true } }, // waiting_docs → compliance
    {
      event: "agent_result", // compliance → cost_ready
      payload: {
        ok: true,
        diff: { validated: true },
        confidence: 0.95,
        required_fields: [],
      },
    },
    { event: "operator_action", payload: { action: "confirm" } }, // cost_ready → confirmed
    { event: "operator_action", payload: { action: "dispatch" } }, // confirmed → ready_to_dispatch
    { event: "operator_action", payload: { action: "archive" } }, // ready_to_dispatch → archived
  ];

  for (const s of steps) {
    const r = await emit(token, { ticket_id: ticketId, ...s });
    console.log(`[emit] ${s.event} ->`, {
      status: r.status,
      accepted_event: r.accepted_event,
    });
  }

  // 3) Final verifikasjon
  const dbg = await debug(ticketId, token);
  console.log("[final-status]", dbg.ticket.status);
  console.log(
    JSON.stringify(
      {
        ticket: dbg.ticket,
        count: {
          messages: dbg.history.messages.length,
          audits: dbg.history.audit_log.length,
          agent_log: dbg.history.agent_log.length,
          tasks: dbg.history.tasks.length,
        },
      },
      null,
      2,
    ),
  );
})().catch((e) => {
  console.error("[smoke_error]", e.message);
  process.exit(1);
});
