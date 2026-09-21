import "dotenv/config";
import { Client, GatewayIntentBits, Events } from "discord.js";
import * as berryCommand from "./commands/berry.js";
import { startScheduler } from "./scheduler.js";
import { handlePrefixMessage, handleSelectMenu } from "./prefix.js";
import { handleWaterButton } from "./buttons.js";

const { DISCORD_TOKEN } = process.env;

if (!DISCORD_TOKEN) {
  console.error("Missing DISCORD_TOKEN in .env — see .env.example.");
  process.exit(1);
}

const commands = new Map([[berryCommand.data.name, berryCommand]]);

const client = new Client({
  // GuildMessages + MessageContent are needed to read "!plant ..." text
  // commands. MessageContent is a privileged intent — enable it for this bot
  // under Developer Portal -> your app -> Bot -> Privileged Gateway Intents.
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  startScheduler(c);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction);
      return;
    }

    if (interaction.isButton()) {
      await handleWaterButton(interaction);
      return;
    }

    const command = commands.get(interaction.commandName);
    if (!command) return;

    if (interaction.isAutocomplete()) {
      if (command.autocomplete) await command.autocomplete(interaction);
      return;
    }

    if (interaction.isChatInputCommand()) {
      await command.execute(interaction);
    }
  } catch (err) {
    console.error("Error handling interaction:", err);
    const payload = { content: "Something went wrong.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

client.on(Events.MessageCreate, (message) => {
  handlePrefixMessage(message).catch((err) =>
    console.error("Error handling !plant message:", err)
  );
});

client.login(DISCORD_TOKEN);
