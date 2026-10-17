import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { AGENCY_EMPLOYEE_STATUSES, AGENCY_TASK_STATUSES, AGENCY_TASK_TYPES, LOCATION_KINDS, PROPERTY_STATUSES } from "@/lib/constants";
import { getAgencyAccess } from "@/lib/accounts/agency-access";
import {
  countOverdueAgencyTasks,
  createAgencyTask,
  getTaskFormOptions,
  isTaskOverdue,
  listAgencyTasks,
  parseTaskDueDate,
  updateAgencyTaskStatus,
} from "@/lib/accounts/agency-tasks";
import { prisma } from "@/lib/prisma";

/** Agentlik daxili tapşırıqları (#220, PRD 7.3) real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;
const now = new Date("2026-10-17T08:00:00.000Z");
const base = { description: null, propertyId: null, leadId: null, dueDate: null, now };

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const employee = DB.prepare(
    `INSERT INTO "AgencyEmployee" ("id", "agencyId", "userId", "role", "status", "source", "invitedAt", "approvedAt", "suspendedAt")
     VALUES (?, ?, ?, ?, ?, 'INVITE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`,
  );
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("task-type", "Mənzil", "menzil", "task-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("task-city", "Bakı", "baki", "task-baki", LOCATION_KINDS.CITY),
    user.bind("task-owner", "Sahib", "task-owner@example.test", "disabled", "EDITOR", "AGENCY"),
    user.bind("task-manager", "Menecer", "task-manager@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("task-agent", "Agent", "task-agent@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("task-suspended", "Dayandırılmış", "task-suspended@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("task-other-owner", "Başqa", "task-other@example.test", "disabled", "EDITOR", "AGENCY"),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').bind("task-agency", "task-owner", "Alfa", "task-alfa"),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').bind("task-agency-2", "task-other-owner", "Beta", "task-beta"),
    employee.bind("task-e1", "task-agency", "task-manager", "MANAGER", AGENCY_EMPLOYEE_STATUSES.APPROVED, null),
    employee.bind("task-e2", "task-agency", "task-agent", "AGENT", AGENCY_EMPLOYEE_STATUSES.APPROVED, null),
    employee.bind("task-e3", "task-agency", "task-suspended", "AGENT", AGENCY_EMPLOYEE_STATUSES.APPROVED, now.toISOString()),
    DB.prepare(
      `INSERT INTO "Lead" ("id", "name", "phone", "message", "source", "status", "handlerId", "agencyId", "createdAt", "updatedAt")
       VALUES (?, ?, '+994501112233', 'Salam', 'AGENCY', 'NEW', ?, 'task-agency', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    ).bind("task-l-manager", "Menecerin müştərisi", "task-manager"),
    DB.prepare(
      `INSERT INTO "Lead" ("id", "name", "phone", "message", "source", "status", "handlerId", "agencyId", "createdAt", "updatedAt")
       VALUES (?, ?, '+994501112233', 'Salam', 'AGENCY', 'NEW', ?, 'task-agency', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    ).bind("task-l-agent", "Agentin müştərisi", "task-agent"),
    DB.prepare(
      `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId", "authorId", "agencyId", "createdAt", "updatedAt")
       VALUES (?, ?, ?, 'Təsvir', 'x', 'SALE', ?, 1000, 'task-type', 'task-city', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    ).bind("task-p-foreign", "Başqa agentliyin elanı", "task-p-foreign", PROPERTY_STATUSES.PUBLISHED, "task-other-owner", "task-agency-2"),
  ]);
});

const access = (id: string, accountType = "AGENT") => getAgencyAccess({ id, accountType });

describe("tapşırıq yaratmaq", () => {
  it("son tarix bu gündən əvvəl olmur, gün sonu Bakı vaxtıdır", () => {
    expect(parseTaskDueDate("2026-10-16", now)).toBeUndefined();
    expect(parseTaskDueDate("2026-10-17", now)?.toISOString()).toBe("2026-10-17T19:59:59.000Z");
    expect(parseTaskDueDate("17.10.2026", now)).toBeUndefined();
    expect(parseTaskDueDate("2026-02-30", new Date("2026-01-01T00:00:00.000Z"))).toBeUndefined();
    expect(parseTaskDueDate(null, now)).toBeNull();
  });

  it("idarəçi istənilən aktiv üzvə, agent yalnız özünə; kənar elan və dayandırılmış icraçı qəbul olunmur", async () => {
    const manager = await access("task-manager");
    const agent = await access("task-agent");
    await expect(createAgencyTask({ ...base, access: manager, actorId: "task-manager", title: "Şəkilləri yenilə", type: AGENCY_TASK_TYPES.PHOTO_UPDATE, assigneeId: "task-agent", dueDate: "2026-10-18" }))
      .resolves.toMatchObject({ result: "created", assigneeId: "task-agent" });
    await expect(createAgencyTask({ ...base, access: agent, actorId: "task-agent", title: "Başqasına", type: AGENCY_TASK_TYPES.GENERAL, assigneeId: "task-manager" }))
      .resolves.toEqual({ result: "invalidAssignee" });
    await expect(createAgencyTask({ ...base, access: agent, actorId: "task-agent", title: "Özümə xatırlatma", type: AGENCY_TASK_TYPES.CLIENT_CONTACT, assigneeId: null }))
      .resolves.toMatchObject({ result: "created", assigneeId: "task-agent" });
    await expect(createAgencyTask({ ...base, access: manager, actorId: "task-manager", title: "Dayandırılmışa", type: AGENCY_TASK_TYPES.GENERAL, assigneeId: "task-suspended" }))
      .resolves.toEqual({ result: "invalidAssignee" });
    await expect(createAgencyTask({ ...base, access: manager, actorId: "task-manager", title: "Kənar elan", type: AGENCY_TASK_TYPES.LISTING_CHECK, assigneeId: null, propertyId: "task-p-foreign" }))
      .resolves.toEqual({ result: "invalidProperty" });
    await expect(createAgencyTask({ ...base, access: manager, actorId: "task-manager", title: "x", type: AGENCY_TASK_TYPES.GENERAL, assigneeId: null }))
      .resolves.toEqual({ result: "invalidTitle" });
    await expect(createAgencyTask({ ...base, access: await access("task-suspended"), actorId: "task-suspended", title: "Mən", type: AGENCY_TASK_TYPES.GENERAL, assigneeId: null }))
      .resolves.toEqual({ result: "forbidden" });
  });
});

describe("görünüş və statuslar", () => {
  it("idarəçi hamısını, agent yalnız özününkünü görür; icraçı tamamlayır, ləğvi yalnız idarəçi/yaradan edir", async () => {
    const manager = (await access("task-manager"))!;
    const agent = (await access("task-agent"))!;
    const owner = (await access("task-owner", "AGENCY"))!;
    expect(await listAgencyTasks({ access: manager, userId: "task-manager", view: "open" })).toHaveLength(2);
    expect(await listAgencyTasks({ access: owner, userId: "task-owner", view: "open", assigneeId: "task-agent" })).toHaveLength(2);
    const agentTasks = await listAgencyTasks({ access: agent, userId: "task-agent", view: "open" });
    expect(agentTasks.map((task) => task.title).sort()).toEqual(["Özümə xatırlatma", "Şəkilləri yenilə"]);
    expect(agentTasks.find((task) => task.title === "Şəkilləri yenilə")).toMatchObject({ assigneeName: "Agent", creatorName: "Menecer" });

    const photo = agentTasks.find((task) => task.title === "Şəkilləri yenilə")!;
    await expect(updateAgencyTaskStatus({ access: agent, actorId: "task-agent", taskId: photo.id, status: AGENCY_TASK_STATUSES.CANCELLED })).resolves.toEqual({ result: "forbidden" });
    await expect(updateAgencyTaskStatus({ access: agent, actorId: "task-agent", taskId: photo.id, status: AGENCY_TASK_STATUSES.DONE, now }))
      .resolves.toMatchObject({ result: "updated", task: { from: AGENCY_TASK_STATUSES.NEW, createdById: "task-manager" } });
    await expect(prisma.agencyTask.findUniqueOrThrow({ where: { id: photo.id } })).resolves.toMatchObject({ status: AGENCY_TASK_STATUSES.DONE, completedAt: now });
    expect(await listAgencyTasks({ access: agent, userId: "task-agent", view: "done" })).toHaveLength(1);

    const other = (await access("task-other-owner", "AGENCY"))!;
    await expect(updateAgencyTaskStatus({ access: other, actorId: "task-other-owner", taskId: photo.id, status: AGENCY_TASK_STATUSES.NEW })).resolves.toEqual({ result: "notFound" });
    await expect(updateAgencyTaskStatus({ access: manager, actorId: "task-manager", taskId: photo.id, status: AGENCY_TASK_STATUSES.CANCELLED })).resolves.toMatchObject({ result: "updated" });
  });

  it("gecikmə yalnız açıq tapşırıqda sayılır", async () => {
    const later = new Date("2026-10-20T08:00:00.000Z");
    const manager = (await access("task-manager"))!;
    await createAgencyTask({ ...base, access: manager, actorId: "task-manager", title: "Müraciətə cavab ver", type: AGENCY_TASK_TYPES.LEAD_RESPONSE, assigneeId: "task-agent", dueDate: "2026-10-18" });
    await expect(countOverdueAgencyTasks("task-agency", later)).resolves.toBe(1);
    expect(isTaskOverdue({ status: AGENCY_TASK_STATUSES.DONE, dueAt: now }, later)).toBe(false);
    expect(isTaskOverdue({ status: AGENCY_TASK_STATUSES.ON_HOLD, dueAt: now }, later)).toBe(true);
  });
});

describe("müraciət bağlantısı", () => {
  it("agent yalnız öz müraciətini görür və bağlayır, idarəçi agentliyin hamısını", async () => {
    const agent = (await access("task-agent"))!;
    const manager = (await access("task-manager"))!;
    expect((await getTaskFormOptions(agent, "task-agent")).leads.map((lead) => lead.value)).toEqual(["task-l-agent"]);
    expect((await getTaskFormOptions(manager, "task-manager")).leads.map((lead) => lead.value).sort()).toEqual(["task-l-agent", "task-l-manager"]);
    await expect(createAgencyTask({ ...base, access: agent, actorId: "task-agent", title: "Başqasının müştərisi", type: AGENCY_TASK_TYPES.LEAD_RESPONSE, assigneeId: null, leadId: "task-l-manager" }))
      .resolves.toEqual({ result: "invalidLead" });
    await expect(createAgencyTask({ ...base, access: agent, actorId: "task-agent", title: "Öz müştərim", type: AGENCY_TASK_TYPES.LEAD_RESPONSE, assigneeId: null, leadId: "task-l-agent" }))
      .resolves.toMatchObject({ result: "created" });
  });
});
