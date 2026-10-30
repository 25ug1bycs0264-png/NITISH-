const fs = require("node:fs");
const cors = require("cors");
const express = require("express");
const path = require("node:path");

try {
  const envFile = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(["'])([\s\S]*)\1$/, "$2");
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const analyzeHandler = require("./api/analyze");
const { createEventRouter } = require("./api/events");

const app = express();
const configuredOrigins = process.env.ALLOWED_ORIGINS;
const allowedOrigins = (configuredOrigins || "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
}));
app.use(express.json({ limit: "60kb", type: "application/json" }));
app.use((req, _res, next) => {
  req.cookies = Object.fromEntries((req.headers.cookie || "").split(";")
    .map((cookie) => cookie.trim().split("="))
    .filter(([name, value]) => name && value !== undefined)
    .map(([name, ...value]) => [name, value.join("=")]));
  next();
});
app.use("/api/events", createEventRouter({ allowedOrigins }));
app.all("/api/analyze", (req, res, next) => {
  Promise.resolve(analyzeHandler(req, res)).catch(next);
});
app.use(express.static(path.join(__dirname, "dist")));
app.use((req, res, next) => {
  if (req.method === "GET" && req.accepts("html") && !req.path.startsWith("/api/")) {
    return res.sendFile(path.join(__dirname, "dist", "index.html"), (error) => {
      if (error && !res.headersSent) next(error);
    });
  }
  return next();
});
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("Express API request failed.", error);
  if (error.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body is too large." });
  }
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "The request body contains invalid JSON." });
  }
  return res.status(500).json({ error: "The API could not process this request." });
});

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
app.listen(port, host, () => {
  console.log(`Event registration server listening on port ${port}.`);
});
