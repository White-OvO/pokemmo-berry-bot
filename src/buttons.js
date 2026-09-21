import { BERRIES, waterIntervalHoursFor } from "./berries.js";
import { getPlotById, updatePlot } from "./storage.js";
import { formatWhen } from "./format.js";

const HOUR = 60 * 60 * 1000;

export function waterButtonCustomId(plotId) {
  return `water:${plotId}`;
}

// Handles the "💧 I watered it" button on a watering reminder. This is the
// click that "starts a new timer" — the next watering deadline is measured
// from the moment of the click, not from a fixed schedule, matching how
// PokeMMO's water meter actually works (it refills on watering and drains
// over the next 2-3h depending on the berry, per confirmed game data).
export async function handleWaterButton(interaction) {
  const plotId = interaction.customId.split(":")[1];
  const plot = getPlotById(plotId);

  if (!plot || plot.userId !== interaction.user.id) {
    await interaction.reply({
      content: "That's not one of your plots (or it's no longer tracked).",
      ephemeral: true,
    });
    return;
  }

  if (plot.notifiedReady) {
    await interaction.reply({
      content: `**${plot.berry}** (plot \`${plot.id}\`) is already ripe — no more watering needed, go harvest it!`,
      ephemeral: true,
    });
    return;
  }

  const now = Date.now();
  const intervalHours = waterIntervalHoursFor(BERRIES[plot.berry].growMinutes);
  // No point scheduling a watering deadline past the point it's already ripe.
  const nextWaterDeadline = Math.min(now + intervalHours * HOUR, plot.readyAt);

  updatePlot(plot.id, { awaitingWater: false, nextWaterDeadline, lastNagAt: now });

  await interaction.update({
    content:
      `💧 Watered **${plot.berry}** (plot \`${plot.id}\`)! ` +
      (nextWaterDeadline < plot.readyAt
        ? `Next watering needed ${formatWhen(nextWaterDeadline)}.`
        : `That should carry it through to ripening ${formatWhen(plot.readyAt)}.`),
    components: [],
  });
}
