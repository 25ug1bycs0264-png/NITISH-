const { promisify } = require("node:util");
const { randomBytes, randomUUID, scrypt: scryptCallback, timingSafeEqual } = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const express = require("express");

const scrypt = promisify(scryptCallback);
const categories = ["Workshop", "Seminar", "Cultural", "Sports", "Conference"];
const roles = ["admin", "organizer", "participant"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sessionLifetime = 7 * 24 * 60 * 60 * 1000;

function futureDate(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function sampleEvents() {
  const samples = [
    ["Designing for Everyone", "A practical, hands-on introduction to accessibility, inclusive design, and building digital experiences that work for all.", "Workshop", "Innovation Lab · Block C", 14, 9, "09:30", 80, "Maya Chen", "indigo"],
    ["Ideas into Impact", "Hear fresh perspectives from researchers and founders turning bold, early-stage ideas into things that matter.", "Seminar", "Main Auditorium", 20, 15, "14:00", 240, "Jordan Ellis", "blue"],
    ["A Night in Bloom", "An evening of live music, local artists, thoughtful conversation, and a celebration of the creative community.", "Cultural", "The Courtyard", 27, 22, "18:30", 180, "Amara Okafor", "rose"],
    ["Campus Cup: Spring Edition", "Bring your team for an afternoon of friendly competition, good energy, and a campus-wide celebration of sport.", "Sports", "University Sports Ground", 34, 29, "10:00", 320, "Ravi Kumar", "green"],
    ["The Future of Work", "An open conversation with practitioners about meaningful careers, human-centered technology, and what's next.", "Conference", "North Hall", 41, 36, "09:00", 400, "Priya Sharma", "amber"],
    ["Build Something Weekend", "Two days to follow a question, find collaborators, and make something useful. Curiosity required; experience optional.", "Workshop", "Digital Studio · Block A", 49, 44, "08:30", 120, "Alex Morgan", "violet"],
  ];

  return samples.map(([title, description, category, venue, eventDay, deadlineDay, time, capacity, organizerName, color]) => ({
    id: randomUUID(),
    title,
    description,
    category,
    venue,
    date: futureDate(eventDay),
    deadline: futureDate(deadlineDay),
    time,
    capacity,
    organizerId: null,
    organizerName,
    status: "published",
    color,
    createdAt: new Date().toISOString(),
  }));
}

function publicUser(user) {
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
}

function publicRegistration(registration, user, event, attendance) {
  return {
    ...registration,
    participant: user ? { id: user.id, name: user.name, email: user.email } : null,
    event: event ? { id: event.id, title: event.title, date: event.date, time: event.time, venue: event.venue } : null,
    attendance: attendance?.status ?? null,
  };
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validateEvent(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return "Provide event details.";
  if (typeof input.title !== "string" || input.title.trim().length < 3 || input.title.trim().length > 120) return "Event names must be between 3 and 120 characters.";
  if (typeof input.description !== "string" || input.description.trim().length < 10 || input.description.trim().length > 5000) return "Descriptions must be between 10 and 5,000 characters.";
  if (!categories.includes(input.category)) return `Choose a category: ${categories.join(", ")}.`;
  if (typeof input.venue !== "string" || input.venue.trim().length < 2 || input.venue.trim().length > 200) return "Venue must be between 2 and 200 characters.";
  if (!validDate(input.date) || !validDate(input.deadline) || input.deadline > input.date) return "Choose valid event and registration deadline dates. The deadline must be on or before the event date.";
  if (typeof input.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) return "Choose a valid event start time.";
  if (!Number.isSafeInteger(input.capacity) || input.capacity < 1 || input.capacity > 100000) return "Capacity must be a whole number between 1 and 100,000.";
  return null;
}

function makeError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function createEventRouter(options = {}) {
  const router = express.Router();
  const dataFile = options.dataFile || process.env.EVENTS_DB_PATH || path.join(__dirname, "..", "data", "events.json");
  const allowedOrigins = options.allowedOrigins || (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000")
    .split(",").map((origin) => origin.trim()).filter(Boolean);
  const sessions = new Map();
  const attempts = new Map();
  let statePromise;
  let mutationQueue = Promise.resolve();

  async function loadState() {
    if (!statePromise) {
      statePromise = (async () => {
        await fs.mkdir(path.dirname(dataFile), { recursive: true });
        try {
          const parsed = JSON.parse(await fs.readFile(dataFile, "utf8"));
          if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.events) ||
              !Array.isArray(parsed.registrations) || !Array.isArray(parsed.attendance)) {
            throw new Error("The event database has an invalid structure.");
          }
          return parsed;
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
          const initial = { users: [], events: sampleEvents(), registrations: [], attendance: [] };
          await saveState(initial);
          return initial;
        }
      })();
    }
    return statePromise;
  }

  async function saveState(state) {
    const temporaryFile = `${dataFile}.${randomUUID()}.tmp`;
    await fs.writeFile(temporaryFile, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
    await fs.rename(temporaryFile, dataFile);
  }

  function mutate(operation) {
    const pending = mutationQueue.then(async () => {
      const state = await loadState();
      const result = await operation(state);
      await saveState(state);
      return result;
    });
    mutationQueue = pending.catch(() => {});
    return pending;
  }

  function getSession(req) {
    const token = req.cookies?.event_session;
    if (typeof token !== "string" || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
    const session = sessions.get(token);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
      sessions.delete(token);
      return null;
    }
    return session;
  }

  async function currentUser(req) {
    const session = getSession(req);
    if (!session) return null;
    const state = await loadState();
    return state.users.find((user) => user.id === session.userId) || null;
  }

  function requireUser(req, res, next) {
    currentUser(req).then((user) => {
      if (!user) return res.status(401).json({ error: "Sign in to continue." });
      req.user = user;
      return next();
    }).catch(next);
  }

  function requireRole(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) return res.status(403).json({ error: "You do not have permission to do that." });
      return next();
    };
  }

  function setSession(res, user) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = Date.now() + sessionLifetime;
    sessions.set(token, { userId: user.id, expiresAt });
    res.cookie("event_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: sessionLifetime,
    });
  }

  function checkRateLimit(req, key, maximum) {
    const now = Date.now();
    const identity = `${key}:${req.ip || "unknown"}`;
    const record = attempts.get(identity);
    if (!record || record.resetAt <= now) {
      attempts.set(identity, { count: 1, resetAt: now + 15 * 60 * 1000 });
      return true;
    }
    if (record.count >= maximum) return false;
    record.count += 1;
    return true;
  }

  function checkOrigin(req, res, next) {
    const origin = req.get("origin");
    if (origin && !allowedOrigins.includes(origin)) return res.status(403).json({ error: "This origin is not allowed to make changes." });
    res.set("Cache-Control", "no-store");
    return next();
  }

  function enrichEvent(state, event, user) {
    const registrations = state.registrations.filter((registration) => registration.eventId === event.id && registration.status === "registered");
    const ownRegistration = user
      ? registrations.find((registration) => registration.userId === user.id)
      : null;
    return {
      ...event,
      organizerName: state.users.find((candidate) => candidate.id === event.organizerId)?.name || event.organizerName,
      registrationCount: registrations.length,
      remainingSpots: Math.max(0, event.capacity - registrations.length),
      registration: ownRegistration ? {
        id: ownRegistration.id,
        registrationId: ownRegistration.registrationId,
        registeredAt: ownRegistration.registeredAt,
      } : null,
    };
  }

  router.use(checkOrigin);

  router.post("/auth/register", async (req, res) => {
    if (!checkRateLimit(req, "register", 10)) return res.status(429).json({ error: "Too many account attempts. Try again in 15 minutes." });
    const { name, email, password } = req.body || {};
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) return res.status(400).json({ error: "Name must be between 2 and 80 characters." });
    if (typeof email !== "string" || !emailPattern.test(email.trim()) || email.length > 254) return res.status(400).json({ error: "Enter a valid email address." });
    if (typeof password !== "string" || password.length < 10 || password.length > 128) return res.status(400).json({ error: "Use a password between 10 and 128 characters." });

    const user = await mutate(async (state) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (state.users.some((candidate) => candidate.email === normalizedEmail)) throw makeError(409, "An account with that email already exists.");
      const firstAccount = state.users.length === 0;
      const salt = randomBytes(16);
      const passwordHash = await scrypt(password, salt, 64);
      const created = {
        id: randomUUID(),
        name: name.trim(),
        email: normalizedEmail,
        passwordSalt: salt.toString("hex"),
        passwordHash: Buffer.from(passwordHash).toString("hex"),
        role: firstAccount ? "admin" : "participant",
        createdAt: new Date().toISOString(),
      };
      state.users.push(created);
      return created;
    });
    setSession(res, user);
    return res.status(201).json({ user: publicUser(user), message: user.role === "admin" ? "Your account is the first administrator account." : "Your account is ready." });
  });

  router.post("/auth/login", async (req, res) => {
    if (!checkRateLimit(req, "login", 10)) return res.status(429).json({ error: "Too many sign-in attempts. Try again in 15 minutes." });
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string" || password.length > 128) return res.status(400).json({ error: "Enter your email and password." });
    const state = await loadState();
    const user = state.users.find((candidate) => candidate.email === email.trim().toLowerCase());
    const salt = user ? Buffer.from(user.passwordSalt, "hex") : Buffer.from("event-registration-login");
    const storedHash = user ? Buffer.from(user.passwordHash, "hex") : Buffer.alloc(64);
    const suppliedHash = Buffer.from(await scrypt(password, salt, 64));
    if (!user || storedHash.length !== suppliedHash.length || !timingSafeEqual(storedHash, suppliedHash)) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    setSession(res, user);
    return res.json({ user: publicUser(user) });
  });

  router.post("/auth/logout", (req, res) => {
    const token = req.cookies?.event_session;
    if (token) sessions.delete(token);
    res.clearCookie("event_session", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
    return res.json({ message: "You are signed out." });
  });

  router.get("/auth/me", async (req, res) => {
    return res.json({ user: publicUser(await currentUser(req)) });
  });

  router.get("/events", async (req, res) => {
    const state = await loadState();
    const user = await currentUser(req);
    const events = state.events.filter((event) => {
      if (event.status === "published") return true;
      return user?.role === "admin" || (user?.role === "organizer" && event.organizerId === user.id);
    }).filter((event) => user?.role !== "organizer" || event.organizerId === user.id || event.status === "published")
      .sort((left, right) => left.date.localeCompare(right.date));
    return res.json({ events: events.map((event) => enrichEvent(state, event, user)) });
  });

  router.get("/dashboard", requireUser, async (req, res) => {
    const state = await loadState();
    const visibleEvents = state.events.filter((event) => req.user.role === "admin" ||
      (req.user.role === "organizer" && event.organizerId === req.user.id));
    const registrations = req.user.role === "participant"
      ? state.registrations.filter((registration) => registration.userId === req.user.id)
      : state.registrations.filter((registration) => visibleEvents.some((event) => event.id === registration.eventId));
    const activeRegistrations = registrations.filter((registration) => registration.status === "registered");
    const upcomingEvents = visibleEvents.filter((event) => event.date >= futureDate(0) && event.status === "published");
    const upcomingRegistrations = activeRegistrations.filter((registration) =>
      state.events.some((event) => event.id === registration.eventId && event.date >= futureDate(0) && event.status === "published"));
    return res.json({
      stats: {
        events: req.user.role === "participant"
          ? registrations.length
          : visibleEvents.filter((event) => event.status === "published").length,
        registrations: activeRegistrations.length,
        upcoming: req.user.role === "participant"
          ? upcomingRegistrations.length
          : upcomingEvents.length,
      },
      events: visibleEvents.map((event) => enrichEvent(state, event, req.user)),
      registrations: registrations.map((registration) => publicRegistration(
        registration,
        state.users.find((user) => user.id === registration.userId),
        state.events.find((event) => event.id === registration.eventId),
        state.attendance.find((record) => record.registrationId === registration.id),
      )).sort((left, right) => right.registeredAt.localeCompare(left.registeredAt)),
    });
  });

  router.get("/admin/users", requireUser, requireRole("admin"), async (_req, res) => {
    const state = await loadState();
    return res.json({ users: state.users.map(publicUser).sort((left, right) => left.name.localeCompare(right.name)) });
  });

  router.patch("/admin/users/:id/role", requireUser, requireRole("admin"), async (req, res) => {
    const { role } = req.body || {};
    if (!roles.includes(role)) return res.status(400).json({ error: "Choose an admin, organizer, or participant role." });
    const user = await mutate((state) => {
      const target = state.users.find((candidate) => candidate.id === req.params.id);
      if (!target) throw makeError(404, "User not found.");
      if (target.id === req.user.id && role !== "admin") throw makeError(400, "You cannot remove your own administrator access.");
      target.role = role;
      return publicUser(target);
    });
    return res.json({ user });
  });

  router.post("/events", requireUser, requireRole("admin", "organizer"), async (req, res) => {
    const problem = validateEvent(req.body);
    if (problem) return res.status(400).json({ error: problem });
    const event = await mutate((state) => {
      const created = {
        id: randomUUID(),
        title: req.body.title.trim(),
        description: req.body.description.trim(),
        category: req.body.category,
        venue: req.body.venue.trim(),
        date: req.body.date,
        deadline: req.body.deadline,
        time: req.body.time,
        capacity: req.body.capacity,
        organizerId: req.user.role === "admin" ? (req.body.organizerId || req.user.id) : req.user.id,
        organizerName: req.user.name,
        status: "published",
        color: req.body.color || "indigo",
        createdAt: new Date().toISOString(),
      };
      if (created.organizerId !== req.user.id && !state.users.some((user) => user.id === created.organizerId && user.role === "organizer")) {
        throw makeError(400, "Choose an existing organizer.");
      }
      created.organizerName = state.users.find((user) => user.id === created.organizerId)?.name || req.user.name;
      state.events.push(created);
      return created;
    });
    return res.status(201).json({ event });
  });

  router.patch("/events/:id", requireUser, requireRole("admin", "organizer"), async (req, res) => {
    const problem = validateEvent(req.body);
    if (problem) return res.status(400).json({ error: problem });
    const event = await mutate((state) => {
      const target = state.events.find((candidate) => candidate.id === req.params.id);
      if (!target) throw makeError(404, "Event not found.");
      if (req.user.role !== "admin" && target.organizerId !== req.user.id) throw makeError(403, "You can only update events you organize.");
      const currentRegistrations = state.registrations.filter((registration) => registration.eventId === target.id && registration.status === "registered").length;
      if (req.body.capacity < currentRegistrations) throw makeError(400, `Capacity cannot be lower than the ${currentRegistrations} active registrations.`);
      let nextOrganizer;
      if (req.user.role === "admin" && req.body.organizerId && req.body.organizerId !== target.organizerId) {
        nextOrganizer = state.users.find((user) => user.id === req.body.organizerId && user.role === "organizer");
        if (!nextOrganizer) throw makeError(400, "Choose an existing organizer.");
      }
      for (const field of ["title", "description", "category", "venue", "date", "deadline", "time", "capacity"]) {
        target[field] = field === "title" || field === "description" || field === "venue" ? req.body[field].trim() : req.body[field];
      }
      if (nextOrganizer) {
        target.organizerId = nextOrganizer.id;
        target.organizerName = nextOrganizer.name;
      }
      return target;
    });
    return res.json({ event });
  });

  router.delete("/events/:id", requireUser, requireRole("admin", "organizer"), async (req, res) => {
    const event = await mutate((state) => {
      const target = state.events.find((candidate) => candidate.id === req.params.id);
      if (!target) throw makeError(404, "Event not found.");
      if (req.user.role !== "admin" && target.organizerId !== req.user.id) throw makeError(403, "You can only cancel events you organize.");
      target.status = "cancelled";
      for (const registration of state.registrations) {
        if (registration.eventId === target.id && registration.status === "registered") registration.status = "cancelled";
      }
      return target;
    });
    return res.json({ event, message: "Event cancelled. Its registration and attendance history has been retained." });
  });

  router.post("/events/:id/register", requireUser, requireRole("participant"), async (req, res) => {
    const result = await mutate((state) => {
      const event = state.events.find((candidate) => candidate.id === req.params.id);
      if (!event || event.status !== "published") throw makeError(404, "This event is no longer available.");
      const today = futureDate(0);
      if (event.date < today || event.deadline < today) throw makeError(400, "Registration for this event has closed.");
      const duplicate = state.registrations.find((registration) => registration.eventId === event.id && registration.userId === req.user.id && registration.status === "registered");
      if (duplicate) throw makeError(409, "You are already registered for this event.");
      const activeCount = state.registrations.filter((registration) => registration.eventId === event.id && registration.status === "registered").length;
      if (activeCount >= event.capacity) throw makeError(409, "This event has reached capacity.");
      let registrationId;
      do {
        registrationId = `EVT-${randomBytes(5).toString("hex").toUpperCase()}`;
      } while (state.registrations.some((existing) => existing.registrationId === registrationId));
      const registration = {
        id: randomUUID(),
        registrationId,
        userId: req.user.id,
        eventId: event.id,
        registeredAt: new Date().toISOString(),
        status: "registered",
      };
      state.registrations.push(registration);
      return registration;
    });
    return res.status(201).json({ registration: result, message: "You are registered. Your confirmation ID is ready." });
  });

  router.post("/registrations/:id/cancel", requireUser, async (req, res) => {
    const registration = await mutate((state) => {
      const target = state.registrations.find((candidate) => candidate.id === req.params.id);
      if (!target) throw makeError(404, "Registration not found.");
      const event = state.events.find((candidate) => candidate.id === target.eventId);
      const permitted = req.user.role === "admin" || (req.user.role === "organizer" && event?.organizerId === req.user.id);
      if (target.userId !== req.user.id && !permitted) throw makeError(403, "You can only cancel your own registration.");
      if (target.status !== "registered") throw makeError(409, "This registration has already been cancelled.");
      if (event?.date < futureDate(0)) throw makeError(400, "Registrations cannot be cancelled after an event has started.");
      target.status = "cancelled";
      return target;
    });
    return res.json({ registration, message: "Your registration has been cancelled." });
  });

  router.get("/events/:id/registrations", requireUser, requireRole("admin", "organizer"), async (req, res) => {
    const state = await loadState();
    const event = state.events.find((candidate) => candidate.id === req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (req.user.role !== "admin" && event.organizerId !== req.user.id) return res.status(403).json({ error: "You can only view registrations for your own events." });
    const registrations = state.registrations.filter((registration) => registration.eventId === event.id)
      .map((registration) => publicRegistration(
        registration,
        state.users.find((user) => user.id === registration.userId),
        event,
        state.attendance.find((record) => record.registrationId === registration.id),
      ));
    return res.json({ event, registrations });
  });

  router.patch("/registrations/:id/attendance", requireUser, requireRole("admin", "organizer"), async (req, res) => {
    if (!["present", "absent"].includes(req.body?.status)) return res.status(400).json({ error: "Attendance must be marked present or absent." });
    const attendance = await mutate((state) => {
      const registration = state.registrations.find((candidate) => candidate.id === req.params.id);
      if (!registration) throw makeError(404, "Registration not found.");
      const event = state.events.find((candidate) => candidate.id === registration.eventId);
      if (req.user.role !== "admin" && event?.organizerId !== req.user.id) throw makeError(403, "You can only record attendance for your own events.");
      if (registration.status !== "registered") throw makeError(400, "Cancelled registrations cannot be marked present or absent.");
      let record = state.attendance.find((candidate) => candidate.registrationId === registration.id);
      if (!record) {
        record = { id: randomUUID(), registrationId: registration.id };
        state.attendance.push(record);
      }
      record.status = req.body.status;
      record.markedBy = req.user.id;
      record.updatedAt = new Date().toISOString();
      return record;
    });
    return res.json({ attendance });
  });

  router.use((error, _req, res, _next) => {
    if (res.headersSent) return;
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error("Event management request failed.", error);
    return res.status(500).json({ error: "The event service could not process this request." });
  });

  return router;
}

module.exports = { createEventRouter };
