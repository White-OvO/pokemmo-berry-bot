import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { allPlots, updatePlot, pruneStale } from "./storage.js";
import { WILT_HOURS } from "./berries.js";
import { waterButtonCustomId } from "./buttons.js";

const CHECK_INTERVAL_MS = 30 * 1000; // how often the bot checks plots
const HOUR = 60 * 60 * 1000;

// If a watering reminder is ignored, re-ping at this cadence rather than
// spamming every 30s or going silent forever.
const NAG_INTERVAL_MS = 2 * HOUR;

// Confirmed: every berry wilts 8 hours after finishing growth if not
// harvested. Warn a bit before that deadline so there's time to act.
const WILT_WARNING_LEAD_MS = 2 * HOUR;
const WILT_MS = WILT_HOURS * HOUR;
const PRUNE_AFTER_MS = 3 * 24 * 60 * 60 * 1000; // stop tracking 3 days after wilting

function waterButtonRow(plotId) {
  const button = new ButtonBuilder()
    .setCustomId(waterButtonCustomId(plotId))
    .setLabel("💧 I watered it")
    .setStyle(ButtonStyle.Success);
  return new ActionRowBuilder().addComponents(button);
}

async function send(client, channelId, payload) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel?.isTextBased()) {
      return await channel.send(typeof payload === "string" ? { content: payload } : payload);
    }
  } catch (err) {
    console.error(`Failed to send message to channel ${channelId}:`, err.message);
  }
  return null;
}

export function startScheduler(client) {
  setInterval(async () => {
    const now = Date.now();

    for (const plot of allPlots()) {
      const mention = `<@${plot.userId}>`;

      if (!plot.notifiedReady) {
        // Berry finished growing before it needed watering again (or right on time).
        if (now >= plot.readyAt) {
          await send(
            client,
            plot.channelId,
            `🍓 ${mention} your **${plot.berry}** berry is ripe and ready to harvest! (plot \`${plot.id}\`) ` +
              `You have about ${WILT_HOURS} hours before it wilts.`
          );
          updatePlot(plot.id, { notifiedReady: true, awaitingWater: false });
          continue;
        }

        // Watering is due. Send the button once, then re-nag periodically
        // until they click it (or it becomes ripe / gets removed).
        if (now >= plot.nextWaterDeadline) {
          const isFirstPing = !plot.awaitingWater;
          if (isFirstPing || now - plot.lastNagAt >= NAG_INTERVAL_MS) {
            await send(client, plot.channelId, {
              content:
                `💧 ${mention} your **${plot.berry}** berry (plot \`${plot.id}\`) needs watering. ` +
                `Click the button once you've watered it in-game.`,
              components: [waterButtonRow(plot.id)],
            });
            updatePlot(plot.id, { awaitingWater: true, lastNagAt: now });
          }
        }
        continue;
      }

      // Already ripe: wilt-warning / wilted lifecycle.
      if (!plot.notifiedWiltWarning && now >= plot.readyAt + WILT_MS - WILT_WARNING_LEAD_MS) {
        await send(
          client,
          plot.channelId,
          `⚠️ ${mention} your **${plot.berry}** berry (plot \`${plot.id}\`) will wilt soon — go harvest it!`
        );
        updatePlot(plot.id, { notifiedWiltWarning: true });
        continue;
      }

      if (!plot.notifiedWilted && now >= plot.readyAt + WILT_MS) {
        await send(
          client,
          plot.channelId,
          `🥀 ${mention} your **${plot.berry}** berry (plot \`${plot.id}\`) has likely wilted. Removing it from tracking.`
        );
        updatePlot(plot.id, { notifiedWilted: true });
      }
    }

    pruneStale(PRUNE_AFTER_MS);
  }, CHECK_INTERVAL_MS);
}
