import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { BERRIES, berryNames } from "../berries.js";
import { listPlotsForUser, removePlot } from "../storage.js";
import { formatDuration, formatWhen } from "../format.js";
import { plantBerry, resolveBerryName } from "../plant.js";
import { MAX_ACTIVE_PLOTS } from "../config.js";

function plotStatus(p, now) {
  if (p.notifiedWilted) return { label: "wilted", next: "—" };
  if (p.notifiedWiltWarning) return { label: "wilting soon!", next: "harvest now" };
  if (p.notifiedReady) return { label: "ripe", next: "harvest now" };
  if (p.awaitingWater || now >= p.nextWaterDeadline) return { label: "needs water!", next: "click the button" };
  return { label: "growing", next: `water ${formatWhen(p.nextWaterDeadline)}` };
}

export const data = new SlashCommandBuilder()
  .setName("berry")
  .setDescription("Track PokeMMO berry plots and get reminded when they're ready.")
  .addSubcommand((sub) =>
    sub
      .setName("plant")
      .setDescription("Start tracking a berry you just planted.")
      .addStringOption((opt) =>
        opt
          .setName("type")
          .setDescription("Which berry did you plant?")
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("Show your currently tracked berry plots.")
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove")
      .setDescription("Stop tracking a plot (e.g. you harvested early or it withered).")
      .addStringOption((opt) =>
        opt.setName("id").setDescription("Plot ID (from /berry list)").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("types").setDescription("List all known berries and their grow times.")
  );

export async function autocomplete(interaction) {
  const focused = interaction.options.getFocused().toLowerCase();
  const matches = berryNames()
    .filter((name) => name.toLowerCase().includes(focused))
    .slice(0, 25)
    .map((name) => ({ name, value: name }));
  await interaction.respond(matches);
}

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();

  if (sub === "plant") {
    const type = interaction.options.getString("type", true);
    const berryName = resolveBerryName(type);

    if (!berryName) {
      await interaction.reply({
        content: `I don't know a berry called **${type}**. Use \`/berry types\` to see the full list.`,
        ephemeral: true,
      });
      return;
    }

    const { ok, message } = plantBerry({
      userId: interaction.user.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      berryName,
    });

    await interaction.reply(ok ? message : { content: message, ephemeral: true });
    return;
  }

  if (sub === "list") {
    const plots = listPlotsForUser(interaction.user.id, interaction.guildId).filter(
      (p) => !p.notifiedWilted
    );

    if (plots.length === 0) {
      await interaction.reply({
        content: `You have no tracked berry plots. (0/${MAX_ACTIVE_PLOTS} used)`,
        ephemeral: true,
      });
      return;
    }

    const now = Date.now();
    const col = (s, w) => String(s).padEnd(w).slice(0, w);
    const header = `${col("ID", 10)} ${col("Berry", 10)} ${col("Status", 14)} Next`;
    const rows = plots.map((p) => {
      const { label, next } = plotStatus(p, now);
      return `${col(p.id, 10)} ${col(p.berry, 10)} ${col(label, 14)} ${next}`;
    });

    const table = "```\n" + [header, ...rows].join("\n") + "\n```";

    const embed = new EmbedBuilder()
      .setTitle(`Your berry plots — ${plots.length}/${MAX_ACTIVE_PLOTS} slots used`)
      .setColor(0x57f287)
      .setDescription(table)
      .setFooter({
        text: `${MAX_ACTIVE_PLOTS - plots.length} slot(s) remaining (bot-side limit, not a confirmed in-game cap).`,
      });

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (sub === "remove") {
    const id = interaction.options.getString("id", true);
    const removed = removePlot(id, interaction.user.id);
    await interaction.reply({
      content: removed
        ? `Stopped tracking plot \`${id}\`.`
        : `Couldn't find a plot \`${id}\` that belongs to you.`,
      ephemeral: true,
    });
    return;
  }

  if (sub === "types") {
    const lines = berryNames().map((name) => {
      const b = BERRIES[name];
      return `**${name}** — ${formatDuration(b.growMinutes * 60 * 1000)}`;
    });

    const embed = new EmbedBuilder()
      .setTitle("Known berries")
      .setColor(0xf1c40f)
      .setDescription(lines.join("\n"))
      .setFooter({ text: "Grow times are total time from planting to ripe." });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
