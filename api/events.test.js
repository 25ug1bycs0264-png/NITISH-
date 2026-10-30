const assert = require("node:assert/strict");
const { once } = require("node:events");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const express = require("express");
const { after, before, test } = require("node:test");
const { createEventRouter } = require("./events");

const origin = "http://localhost:5173";
let server;
let dataDirectory;
let baseUrl;

async function call(route, { method = "GET", cookie, body, originHeader = origin } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (originHeader) headers.Origin = originHeader;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  return { response, result, cookie: response.headers.get("set-cookie")?.split(";")[0] };
}

before(async () => {
  dataDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "eventflow-test-"));
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.cookies = Object.fromEntries((req.headers.cookie || "").split(";")
      .map((item) => item.trim().split("="))
      .filter(([name, value]) => name && value !== undefined));
    next();
  });
  app.use("/api/events", createEventRouter({ dataFile: path.join(dataDirectory, "events.json"), allowedOrigins: [origin] }));
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}/api/events`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (dataDirectory) await fs.rm(dataDirectory, { recursive: true, force: true });
});

test("authentication, authorization, registration capacity, cancellation, and attendance work end to end", async () => {
  const administrator = await call("/auth/register", {
    method: "POST",
    body: { name: "First Admin", email: "ADMIN@example.test", password: "a-secure-test-password" },
  });
  assert.equal(administrator.response.status, 201);
  assert.equal(administrator.result.user.role, "admin");
  assert.equal("passwordHash" in administrator.result.user, false);

  const participant = await call("/auth/register", {
    method: "POST",
    body: { name: "Taylor Guest", email: "taylor@example.test", password: "another-secure-password" },
  });
  assert.equal(participant.response.status, 201);
  assert.equal(participant.result.user.role, "participant");
  assert.ok(participant.cookie);

  const anonymousDashboard = await call("/dashboard");
  assert.equal(anonymousDashboard.response.status, 401);

  const forbiddenEvent = await call("/events", {
    method: "POST",
    cookie: participant.cookie,
    body: {},
  });
  assert.equal(forbiddenEvent.response.status, 403);

  const promotion = await call(`/admin/users/${participant.result.user.id}/role`, {
    method: "PATCH",
    cookie: administrator.cookie,
    body: { role: "organizer" },
  });
  assert.equal(promotion.response.status, 200);

  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 30);
  const eventDate = date.toISOString().slice(0, 10);
  date.setUTCDate(date.getUTCDate() - 3);
  const deadline = date.toISOString().slice(0, 10);
  const event = await call("/events", {
    method: "POST",
    cookie: participant.cookie,
    body: {
      title: "Community Design Day",
      description: "A welcoming workshop with enough room for every curious participant.",
      category: "Workshop",
      venue: "Community Hall",
      date: eventDate,
      deadline,
      time: "10:30",
      capacity: 1,
    },
  });
  assert.equal(event.response.status, 201);

  const selfDemotion = await call(`/admin/users/${administrator.result.user.id}/role`, {
    method: "PATCH",
    cookie: administrator.cookie,
    body: { role: "participant" },
  });
  assert.equal(selfDemotion.response.status, 400);

  const firstParticipant = await call("/auth/register", {
    method: "POST",
    body: { name: "Casey Guest", email: "casey@example.test", password: "a-different-secure-password" },
  });
  assert.equal(firstParticipant.result.user.role, "participant");
  const registration = await call(`/events/${event.result.event.id}/register`, {
    method: "POST",
    cookie: firstParticipant.cookie,
  });
  assert.equal(registration.response.status, 201);
  assert.match(registration.result.registration.registrationId, /^EVT-[A-F0-9]{10}$/);

  const duplicate = await call(`/events/${event.result.event.id}/register`, {
    method: "POST",
    cookie: firstParticipant.cookie,
  });
  assert.equal(duplicate.response.status, 409);

  const secondParticipant = await call("/auth/register", {
    method: "POST",
    body: { name: "Morgan Guest", email: "morgan@example.test", password: "one-more-secure-password" },
  });
  const fullEvent = await call(`/events/${event.result.event.id}/register`, {
    method: "POST",
    cookie: secondParticipant.cookie,
  });
  assert.equal(fullEvent.response.status, 409);

  const attendance = await call(`/registrations/${registration.result.registration.id}/attendance`, {
    method: "PATCH",
    cookie: participant.cookie,
    body: { status: "present" },
  });
  assert.equal(attendance.response.status, 200);
  assert.equal(attendance.result.attendance.status, "present");

  const roster = await call(`/events/${event.result.event.id}/registrations`, { cookie: participant.cookie });
  assert.equal(roster.response.status, 200);
  assert.equal(roster.result.registrations[0].attendance, "present");
  assert.equal(roster.result.registrations[0].participant.email, "casey@example.test");

  const cancelled = await call(`/registrations/${registration.result.registration.id}/cancel`, {
    method: "POST",
    cookie: firstParticipant.cookie,
  });
  assert.equal(cancelled.response.status, 200);
  const simultaneousRegistrations = await Promise.all([
    call(`/events/${event.result.event.id}/register`, { method: "POST", cookie: firstParticipant.cookie }),
    call(`/events/${event.result.event.id}/register`, { method: "POST", cookie: secondParticipant.cookie }),
  ]);
  assert.deepEqual(simultaneousRegistrations.map(({ response }) => response.status).sort(), [201, 409]);
  const finalRoster = await call(`/events/${event.result.event.id}/registrations`, { cookie: participant.cookie });
  assert.equal(finalRoster.result.registrations.filter((item) => item.status === "registered").length, 1);
});

test("the API rejects disallowed browser origins and invalid event data", async () => {
  const disallowed = await call("/auth/register", {
    method: "POST",
    originHeader: "https://untrusted.example",
    body: { name: "A person", email: "new@example.test", password: "a-secure-test-password" },
  });
  assert.equal(disallowed.response.status, 403);

  const admin = await call("/auth/login", {
    method: "POST",
    body: { email: "admin@example.test", password: "a-secure-test-password" },
  });
  assert.equal(admin.response.status, 200);
  const invalid = await call("/events", {
    method: "POST",
    cookie: admin.cookie,
    body: { title: "x", description: "", category: "Unknown", venue: "", date: "2026-02-31", deadline: "2026-02-31", time: "29:99", capacity: -1 },
  });
  assert.equal(invalid.response.status, 400);
});
