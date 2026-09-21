import "dotenv/config";
import { REST, Routes } from "discord.js";
import { data as berryCommand } from "./commands/berry.js";

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_TOKEN or CLIENT_ID in .env — see .env.example.");
  process.exit(1);
}

const commands = [berryCommand.toJSON()];
const rest = new REST().setToken(DISCORD_TOKEN);

try {
  if (GUILD_ID) {
    // Guild-scoped: updates instantly, good for development.
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`Registered ${commands.length} command(s) to guild ${GUILD_ID}.`);
  } else {
    // Global: can take up to an hour to propagate.
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`Registered ${commands.length} command(s) globally.`);
  }
} catch (err) {
  console.error("Failed to register commands:", err);
  process.exit(1);
}
