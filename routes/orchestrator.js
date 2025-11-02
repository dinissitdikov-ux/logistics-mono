// routes/orchestrator.js
const express = require("express");
const { randomUUID } = require("crypto");
const db = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

/*
  ticket_status_t:
  new, collecting, waiting_docs, compliance, cost_ready,
  confirmed, ready_to_dispatch, archived, blocked
*/
const transitions = {
  new: { user_provided: () => "collecting" },
  collecting: { file_uploaded: () => "waiting_docs" },
  waiting_docs: { agent_result: () => "compliance" },
  compliance: {
    agent_result: (p) => (p?.ok === false ? "blocked" : "cost_ready"),
  },
  cost_ready: { operator_action: () => "confirmed" },
  confirmed: { operator_action: () => "ready_to_dispatch" },
  ready_to_dispatch: { operator_action: () => "archived" },
};

function nextStatus(current, event, payload) {
  const t = transitions[current] || {};
  const fn = t[event];
  if (typeof fn === "function") return fn(payload);
  if (typeof fn === "string") return fn;
  return null; // недопустимый переход
}

async function insertLog(table, data) {
  const keys = Object.keys(data);
  const vals = keys.map((_, i) => `$${i + 1}`).join(", ");
  const sql = `insert into ${table} (${keys.join(",")}) values (${vals}) returning *`;
  const res = await db.query(sql, Object.values(data));
  return res.rows[0];
}

// POST /api/orch/emit
router.post(
  "/emit",
  authenticateToken,
  authorizeRoles("admin", "service"),
  express.json(),
  async (req, res) => {
    const trace_id = req.body.trace_id || randomUUID();
    const { event, ticket_id, payload = {} } = req.body;
    const actor = req.user?.email || "system";

    if (!event)
      return res.status(400).json({ trace_id, error: "event_required" });

    try {
      // 1) ticket
      let ticket;
      if (!ticket_id) {
        const r = await db.query(
          "insert into tickets(status, created_at, updated_at) values('new', now(), now()) returning *",
        );
        ticket = r.rows[0];
      } else {
        const r = await db.query("select * from tickets where id=$1", [
          ticket_id,
        ]);
        ticket = r.rows[0];
        if (!ticket)
          return res.status(404).json({ trace_id, error: "ticket_not_found" });
      }

      // 2) messages
      await insertLog("messages", {
        ticket_id: ticket.id,
        role: "system",
        detected_lang: null,
        text: event,
        attachments: null,
        extracted_fields: payload,
        ts: new Date(),
        trace_id,
      });

      // 3) audit_log
      await insertLog("audit_log", {
        actor,
        action: `event:${event}`,
        entity: "ticket",
        entity_id: String(ticket.id),
        before: null,
        after: payload,
        ts: new Date(),
        trace_id,
      });

      // 4) FSM
      const current = ticket.status;
      const proposed = nextStatus(current, event, payload);
      if (proposed === null) {
        await insertLog("audit_log", {
          actor,
          action: "fsm_conflict",
          entity: "ticket",
          entity_id: String(ticket.id),
          before: { status: current },
          after: { status: current, event },
          ts: new Date(),
          trace_id,
        });
        logger.warn("orch.emit.fsm_conflict", {
          trace_id,
          ticket_id: ticket.id,
          current,
          event,
        });
        return res
          .status(409)
          .json({ trace_id, error: "invalid_transition", status: current });
      }

      let status = current;
      if (proposed !== current) {
        const r2 = await db.query(
          "update tickets set status=$1, updated_at=now() where id=$2 returning *",
          [proposed, ticket.id],
        );
        status = r2.rows[0].status;
      }

      // 5) agent_result — спецлогика
      if (event === "agent_result") {
        const {
          diff = {},
          confidence = null,
          required_fields = [],
        } = payload || {};

        await insertLog("agent_log", {
          agent_name: "orch",
          input: JSON.stringify({
            context: { ticket_id: ticket.id, status: current },
            trace_id,
            payload,
          }),
          output: JSON.stringify({ diff, confidence, required_fields }),
          confidence: confidence === null ? null : confidence,
          status: "ok",
          ts: new Date(),
          trace_id,
          ticket_id: ticket.id,
        });

        if (typeof confidence === "number" && confidence < 0.7) {
          await insertLog("tasks", {
            ticket_id: ticket.id,
            kind: "ops",
            status: "new",
            assignee: null,
            due_at: null,
            payload: { reason: "low_confidence", confidence, required_fields },
            created_at: new Date(),
            updated_at: new Date(),
          });

          await insertLog("audit_log", {
            actor: "system",
            action: "escalate",
            entity: "ticket",
            entity_id: String(ticket.id),
            before: null,
            after: { confidence },
            ts: new Date(),
            trace_id,
          });
        }
      }

      logger.info("orch.emit.ok", {
        trace_id,
        ticket_id: ticket.id,
        event,
        status,
      });

      return res.json({
        trace_id,
        ticket_id: ticket.id,
        status,
        accepted_event: event,
      });
    } catch (e) {
      await insertLog("audit_log", {
        actor: "system",
        action: "error",
        entity: "orch",
        entity_id: null,
        before: null,
        after: { error: e.message },
        ts: new Date(),
        trace_id,
      }).catch(() => {});
      logger.error("orch.emit.exception", {
        trace_id,
        error: e.message,
        stack: e.stack,
      });
      return res.status(500).json({ trace_id, error: e.message });
    }
  },
);

// GET /api/orch/debug?ticket_id=ID
router.get(
  "/debug",
  authenticateToken,
  authorizeRoles("admin", "service", "dispatcher"),
  async (req, res) => {
    const trace_id = randomUUID();
    const id = req.query.ticket_id;

    if (!id)
      return res.status(400).json({ trace_id, error: "ticket_id_required" });

    try {
      const t = await db.query("select * from tickets where id=$1", [id]);
      if (t.rows.length === 0)
        return res.status(404).json({ trace_id, error: "ticket_not_found" });

      const [msgs, audits, agents, tasks] = await Promise.all([
        db.query(
          "select role, detected_lang, text, extracted_fields, ts from messages where ticket_id=$1 order by ts asc limit 200",
          [id],
        ),
        db.query(
          "select actor, action, entity, entity_id, before, after, ts from audit_log where entity=$1 and entity_id=$2 order by ts asc limit 200",
          ["ticket", String(id)],
        ),
        db.query(
          "select agent_name, input, output, confidence, status, ts from agent_log where ticket_id=$1 order by ts asc limit 200",
          [id],
        ),
        db.query(
          "select kind, status, assignee, due_at, payload, created_at, updated_at from tasks where ticket_id=$1 order by created_at asc limit 200",
          [id],
        ),
      ]);

      logger.info("orch.debug.done", {
        trace_id,
        ticket_id: id,
        counts: {
          messages: msgs.rowCount,
          audits: audits.rowCount,
          agents: agents.rowCount,
          tasks: tasks.rowCount,
        },
      });

      return res.json({
        trace_id,
        ticket: t.rows[0],
        history: {
          messages: msgs.rows,
          audit_log: audits.rows,
          agent_log: agents.rows,
          tasks: tasks.rows,
        },
      });
    } catch (e) {
      logger.error("orch.debug.exception", {
        trace_id,
        error: e.message,
        stack: e.stack,
      });
      return res.status(500).json({ trace_id, error: e.message });
    }
  },
);

module.exports = router;
