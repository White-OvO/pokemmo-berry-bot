import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { BERRIES } from "./berries.js";
import { formatDuration } from "./format.js";
import { plantBerry, resolveBerryName } from "./plant.js";

const PREFIX = "!plant";

// Discord select menus cap out at 25 options, and there are ~64 berries, so
// planting via dropdown is a two-step picker: first grow-time tier, then the
// specific berry within it. (Every tier below has under 25 berries in it.)
function tiersFromBerries() {
  const tiers = new Map(); // growMinutes -> [berryName, ...]
  for (const [name, { growMinutes }] of Object.entries(BERRIES)) {
    if (!tiers.has(growMinutes)) tiers.set(growMinutes, []);
    tiers.get(growMinutes).push(name);
  }
  return [...tiers.entries()].sort((a, b) => a[0] - b[0]);
}

function buildTierSelectRow() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("berry-tier-select")
    .setPlaceholder("Pick a grow-time group first…")
    .addOptions(
      tiersFromBerries().map(([growMinutes, names]) => ({
        label: `${formatDuration(growMinutes * 60 * 1000)} berries`,
        description: `${names.length} berries, e.g. ${names.slice(0, 3).join(", ")}`,
        value: String(growMinutes),
      }))
    );
  return new ActionRowBuilder().addComponents(menu);
}

function buildBerrySelectRow(growMinutes) {
  const names = tiersFromBerries().find(([g]) => g === growMinutes)?.[1] ?? [];
  const menu = new StringSelectMenuBuilder()
    .setCustomId("berry-name-select")
    .setPlaceholder("Now pick the berry…")
    .addOptions(names.map((name) => ({ label: name, value: name })));
  return new ActionRowBuilder().addComponents(menu);
}

// Handles plain text messages (not slash commands). Wire this into
// Events.MessageCreate in index.js.
export async function handlePrefixMessage(message) {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith(PREFIX)) return;

  const arg = message.content.slice(PREFIX.length).trim();

  if (!arg) {
    await message.reply({
      content:
        "Which berry did you plant? Pick a grow-time group below, or just type " +
        "`!plant <berry name>` (e.g. `!plant Oran`).",
      components: [buildTierSelectRow()],
    });
    return;
  }

  const berryName = resolveBerryName(arg);
  if (!berryName) {
    await message.reply(
      `I don't know a berry called **${arg}**. Try \`!plant\` with no name to pick from a menu, ` +
        "or use `/berry types` to see the full list."
    );
    return;
  }

  // plantBerry() returns { ok: false, message } on failure (e.g. plot limit
  // reached) or { ok: true, plot, message } on success — either way `message`
  // is the right thing to show, so no branching needed here.
  const { message: confirmation } = plantBerry({
    userId: message.author.id,
    guildId: message.guildId,
    channelId: message.channelId,
    berryName,
  });

  await message.reply(confirmation);
}

// Handles the two dropdown steps above. Wire this into
// Events.InteractionCreate in index.js (for isStringSelectMenu() interactions).
export async function handleSelectMenu(interaction) {
  if (interaction.customId === "berry-tier-select") {
    const growMinutes = Number(interaction.values[0]);
    await interaction.update({
      content: "Now pick the specific berry:",
      components: [buildBerrySelectRow(growMinutes)],
    });
    return;
  }

  if (interaction.customId === "berry-name-select") {
    const berryName = interaction.values[0];
    const { message } = plantBerry({
      userId: interaction.user.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      berryName,
    });

    await interaction.update({ content: message, components: [] });
  }
}
