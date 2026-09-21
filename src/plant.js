import { BERRIES, FIRST_WATER_HOURS } from "./berries.js";
import { addPlot, listPlotsForUser } from "./storage.js";
import { formatDuration, formatWhen } from "./format.js";
import { MAX_ACTIVE_PLOTS } from "./config.js";

const HOUR = 60 * 60 * 1000;

// Case-insensitive lookup so "!plant oran" and "!plant Oran" both work.
export function resolveBerryName(input) {
  const target = input.trim().toLowerCase();
  return Object.keys(BERRIES).find((name) => name.toLowerCase() === target) ?? null;
}

// Shared by the /berry plant slash command and the !plant prefix command,
// so both stay in sync with the same message wording and storage logic.
// Returns { ok: true, plot, message } or { ok: false, message }.
export function plantBerry({ userId, guildId, channelId, berryName }) {
  const existing = listPlotsForUser(userId, guildId).filter((p) => !p.notifiedWilted);
  if (existing.length >= MAX_ACTIVE_PLOTS) {
    return {
      ok: false,
      message:
        `You're already tracking ${existing.length}/${MAX_ACTIVE_PLOTS} plots ` +
        `(that's just this bot's own limit, not a confirmed in-game one — see \`/berry list\`). ` +
        `Remove one with \`/berry remove\` first, or raise \`MAX_ACTIVE_PLOTS\` in \`src/config.js\`.`,
    };
  }

  const berry = BERRIES[berryName];
  const plantedAt = Date.now();
  const readyAt = plantedAt + berry.growMinutes * 60 * 1000;
  const nextWaterDeadline = plantedAt + FIRST_WATER_HOURS * HOUR;

  const plot = addPlot({
    userId,
    guildId,
    channelId,
    berry: berryName,
    plantedAt,
    readyAt,
    nextWaterDeadline,
  });

  const message =
    `🌱 A timer has been added for your **${berryName}** berry for ` +
    `${formatDuration(berry.growMinutes * 60 * 1000)} (plot \`${plot.id}\`). ` +
    `Ready ${formatWhen(readyAt)}. First watering needed ${formatWhen(nextWaterDeadline)} — ` +
    `I'll ping you here with a button to confirm each time you water it, and again when it's ripe.`;

  return { ok: true, plot, message };
}
