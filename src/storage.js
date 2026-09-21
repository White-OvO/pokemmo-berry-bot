import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const DATA_FILE = join(DATA_DIR, "plots.json");

function load() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DATA_FILE)) return { plots: [] };
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { plots: [] };
  }
}

function save(db) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// A "plot" is one planted berry being tracked:
// { id, userId, guildId, channelId, berry, plantedAt, readyAt,
//   nextWaterDeadline, awaitingWater, lastNagAt,
//   notifiedReady, notifiedWiltWarning, notifiedWilted }
export function addPlot({
  userId,
  guildId,
  channelId,
  berry,
  plantedAt,
  readyAt,
  nextWaterDeadline,
}) {
  const db = load();
  const plot = {
    id: randomUUID().slice(0, 8),
    userId,
    guildId,
    channelId,
    berry,
    plantedAt,
    readyAt,
    nextWaterDeadline,
    awaitingWater: false,
    lastNagAt: plantedAt,
    notifiedReady: false,
    notifiedWiltWarning: false,
    notifiedWilted: false,
  };
  db.plots.push(plot);
  save(db);
  return plot;
}

export function listPlotsForUser(userId, guildId) {
  const db = load();
  return db.plots.filter((p) => p.userId === userId && p.guildId === guildId);
}

export function getPlotById(id) {
  return load().plots.find((p) => p.id === id) ?? null;
}

export function removePlot(id, userId) {
  const db = load();
  const before = db.plots.length;
  db.plots = db.plots.filter((p) => !(p.id === id && p.userId === userId));
  save(db);
  return db.plots.length < before;
}

export function allPlots() {
  return load().plots;
}

export function updatePlot(id, changes) {
  const db = load();
  const plot = db.plots.find((p) => p.id === id);
  if (plot) Object.assign(plot, changes);
  save(db);
  return plot;
}

// Plots that were already flagged as wilted are dropped after this long so
// the JSON file doesn't grow forever.
export function pruneStale(maxAgeMs) {
  const db = load();
  const now = Date.now();
  db.plots = db.plots.filter(
    (p) => !p.notifiedWilted || now - p.readyAt < maxAgeMs
  );
  save(db);
}
