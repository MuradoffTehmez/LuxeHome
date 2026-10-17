import { env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { LEAD_ACTIVITY_TYPES } from "@/lib/constants";

const notices = vi.hoisted(() => ({ unanswered: vi.fn() }));
vi.mock("@/lib/accounts/account-notices", () => ({ noticeUnansweredLead: notices.unanswered }));

import {
  DEFAULT_LEAD_ALERT_CONFIG,
  leadAlertConfigOf,
  leadAlertSteps,
  validateLeadAlertConfig,
} from "@/lib/accounts/lead-alerts";
import { processUnansweredLeads } from "@/lib/accounts/lead-jobs";

/** Cavabsız müraciət pillələri (#224, PRD 8.5): saf qaydalar və real D1-də cron işi. */
const DB = (env as unknown as { DB: D1Database }).DB;
const now = new Date();
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();
const none = { reminder: null, alert: null, reassign: null };

describe("pillə qaydaları", () => {
  it("müddətlər həddə və artan sırada olmalıdır; pozulmuş bazadakı dəyər defolta düşür", () => {
    expect(validateLeadAlertConfig({ reminder: 30, alert: 120, reassign: 1440 })).toEqual({ ok: true, config: DEFAULT_LEAD_ALERT_CONFIG });
    expect(validateLeadAlertConfig({ reminder: 2, alert: 120, reassign: 1440 })).toEqual({ ok: false, error: "range" });
    expect(validateLeadAlertConfig({ reminder: "abc", alert: 120, reassign: 1440 })).toEqual({ ok: false, error: "range" });
    expect(validateLeadAlertConfig({ reminder: 60, alert: 60, reassign: 1440 })).toEqual({ ok: false, error: "order" });
    expect(leadAlertConfigOf({ leadReminderMinutes: 500, leadAlertMinutes: 120, leadReassignMinutes: 1440 })).toEqual(DEFAULT_LEAD_ALERT_CONFIG);
  });

  it("çatmış pillələrdən yalnız sonuncusu göndərilir; çoxdan keçmiş pillə bildirişsiz bağlanır", () => {
    const created = new Date(now.getTime() - 40 * 60_000);
    expect(leadAlertSteps(created, now, DEFAULT_LEAD_ALERT_CONFIG, none)).toEqual([{ step: "reminder", state: "due" }]);
    expect(leadAlertSteps(created, now, DEFAULT_LEAD_ALERT_CONFIG, { ...none, reminder: now })).toEqual([]);
    const late = new Date(now.getTime() - 150 * 60_000);
    expect(leadAlertSteps(late, now, DEFAULT_LEAD_ALERT_CONFIG, none)).toEqual([
      { step: "reminder", state: "expired" },
      { step: "alert", state: "due" },
    ]);
    const old = new Date(now.getTime() - 3 * 86_400_000);
    expect(leadAlertSteps(old, now, DEFAULT_LEAD_ALERT_CONFIG, none).map((item) => item.state)).toEqual(["expired", "expired", "expired"]);
  });
});

describe("cron işi", () => {
  const lead = DB.prepare(
    `INSERT INTO "Lead" ("id", "name", "phone", "message", "source", "status", "stage", "handlerId", "agencyId", "respondedAt", "createdAt", "updatedAt")
     VALUES (?, ?, '+994501234567', 'Salam', 'PROPERTY', 'NEW', ?, ?, 'la-agency', ?, ?, CURRENT_TIMESTAMP)`,
  );

  beforeAll(async () => {
    const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
    const employee = DB.prepare('INSERT INTO "AgencyEmployee" ("id", "agencyId", "userId", "role", "status", "approvedAt") VALUES (?, ?, ?, ?, \'APPROVED\', CURRENT_TIMESTAMP)');
    await DB.batch([
      user.bind("la-owner", "Sahib", "la-owner@example.test", "disabled", "EDITOR", "AGENCY"),
      user.bind("la-agent", "Agent", "la-agent@example.test", "disabled", "EDITOR", "AGENT"),
      user.bind("la-manager", "Menecer", "la-manager@example.test", "disabled", "EDITOR", "AGENT"),
      DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
        .bind("la-agency", "la-owner", "Alfa", "la-alfa"),
      employee.bind("la-e1", "la-agency", "la-agent", "AGENT"),
      employee.bind("la-e2", "la-agency", "la-manager", "MANAGER"),
      lead.bind("la-agent-40", "Aysel", "ASSIGNED", "la-agent", null, ago(40)),
      lead.bind("la-owner-40", "Murad", "NEW", "la-owner", null, ago(40)),
      lead.bind("la-fresh", "Təzə", "ASSIGNED", "la-agent", null, ago(3)),
      lead.bind("la-answered", "Cavablı", "CONTACTED", "la-agent", ago(30), ago(40)),
      lead.bind("la-closed", "Bağlı", "REJECTED", "la-agent", null, ago(40)),
    ]);
  });

  beforeEach(() => notices.unanswered.mockReset());

  it("bildiriş yazılmasa marker geri qaytarılır", async () => {
    notices.unanswered.mockResolvedValue(false);
    await expect(processUnansweredLeads(now)).resolves.toEqual({ reminder: 0, alert: 0, reassign: 0 });
    const rows = await DB.prepare(`SELECT "reminderSentAt" FROM "Lead" WHERE "id" LIKE 'la-%' AND "reminderSentAt" IS NOT NULL`).all();
    expect(rows.results).toHaveLength(0);
  });

  it("defolt 30 dəqiqədə məsula bir dəfə xatırlatma gedir; cavablı, bağlı və təzə müraciətə yox", async () => {
    notices.unanswered.mockResolvedValue(true);
    await expect(processUnansweredLeads(now)).resolves.toEqual({ reminder: 2, alert: 0, reassign: 0 });
    expect(notices.unanswered.mock.calls.map(([input]) => [input.step, input.leadId, input.userId]).sort()).toEqual([
      ["reminder", "la-agent-40", "la-agent"],
      ["reminder", "la-owner-40", "la-owner"],
    ]);
    await expect(processUnansweredLeads(now)).resolves.toEqual({ reminder: 0, alert: 0, reassign: 0 });
    const activity = await DB.prepare('SELECT "type" FROM "LeadActivity" WHERE "leadId" = ?').bind("la-agent-40").first<{ type: string }>();
    expect(activity?.type).toBe(LEAD_ACTIVITY_TYPES.REMINDER);
  });

  it("agentliyin öz müddəti ilə menecerə bildiriş: sahib + LEADS_MANAGE menecer, məsulun özündən başqa", async () => {
    await DB.prepare('UPDATE "Agency" SET "leadReminderMinutes" = 10, "leadAlertMinutes" = 35, "leadReassignMinutes" = 60 WHERE "id" = ?').bind("la-agency").run();
    notices.unanswered.mockResolvedValue(true);
    await expect(processUnansweredLeads(now)).resolves.toEqual({ reminder: 0, alert: 2, reassign: 0 });
    expect(notices.unanswered.mock.calls.map(([input]) => [input.step, input.leadId, input.userId]).sort()).toEqual([
      ["alert", "la-agent-40", "la-manager"],
      ["alert", "la-agent-40", "la-owner"],
      // Sahibin özündəki müraciət yalnız menecerə bildirilir.
      ["alert", "la-owner-40", "la-manager"],
    ]);
  });

  it("gecikmiş müraciətdə yalnız təkrar təyinat təklifi gedir, çoxdan keçmiş müraciət səssiz bağlanır", async () => {
    await DB.batch([
      lead.bind("la-late", "Gecikən", "ASSIGNED", "la-agent", null, ago(70)),
      lead.bind("la-old", "Köhnə", "ASSIGNED", "la-agent", null, ago(60 * 30)),
    ]);
    notices.unanswered.mockResolvedValue(true);
    await expect(processUnansweredLeads(now)).resolves.toEqual({ reminder: 0, alert: 0, reassign: 1 });
    expect(new Set(notices.unanswered.mock.calls.map(([input]) => `${input.step}:${input.leadId}`))).toEqual(new Set(["reassign:la-late"]));
    const old = await DB.prepare('SELECT "reminderSentAt", "escalatedAt", "reassignSuggestedAt" FROM "Lead" WHERE "id" = ?')
      .bind("la-old").first<Record<string, string | null>>();
    expect(Object.values(old ?? {}).every(Boolean)).toBe(true);
    const late = await DB.prepare('SELECT "reminderSentAt", "escalatedAt", "reassignSuggestedAt" FROM "Lead" WHERE "id" = ?')
      .bind("la-late").first<Record<string, string | null>>();
    expect(Object.values(late ?? {}).every(Boolean)).toBe(true);
  });
});
