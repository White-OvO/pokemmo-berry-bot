# PokeMMO Berry Bot

A Discord bot that tracks berry plots you plant in PokeMMO and pings you in
the channel when they're ripe — plus periodic watering check-in nudges and a
wilt-deadline warning. It never touches the PokeMMO client itself (no memory
reading, no packet sniffing), so there's no PokeMMO ToS concern here — this
is just a bot in your own Discord server.

## What it does

Two ways to plant, same result either way:

- **`!plant`** (plain text, no slash) — type it alone and pick from a dropdown
  (grow-time group → specific berry), or type `!plant <berry name>` directly
  (e.g. `!plant Oran`) to skip the menu.
- **`/berry plant <type>`** — slash command with autocomplete.

Either one replies with: *"A timer has been added for your **{berry}** berry
for {amount of time}."*

Other commands:
- `/berry list` — a table of your tracked plots: how many of your
  `MAX_ACTIVE_PLOTS` slots are used, which berries remain, and each one's
  status (growing / needs water / ripe / wilting soon).
- `/berry remove <id>` — stop tracking a plot
- `/berry types` — list every known berry and its total grow time

Once you plant, the bot will:
1. Ping you with a **💧 "I watered it" button** when watering is due. Nothing
   advances until you click it — clicking is what starts the timer for the
   *next* watering (or confirms you're covered until it ripens, if that was
   the last one needed). If you ignore it, it re-pings every 2 hours rather
   than going silent or assuming anything happened.
2. Ping you the moment it's ripe.
3. Warn you ~2 hours before the confirmed 8-hour wilt deadline.
4. Tell you if it's likely wilted and stop tracking it.

### A note on accuracy

Grow times (per berry) come from
[pokemmo.shoutwiki.com/wiki/Berry](https://pokemmo.shoutwiki.com/wiki/Berry),
scraped and transcribed programmatically — spot-check `src/berries.js`
against the live wiki table before relying on it, in case anything got
mis-transcribed. The 8-hour wilt window is confirmed from that same source.

**Watering timing** comes from
[github.com/PokeMMO-Tools/pokemmo-data](https://github.com/PokeMMO-Tools/pokemmo-data)
(`data/items-berry.json`), a community-maintained dataset pulled from the
game client's memory — the most reliable source found for this:
- First watering is needed **3 hours** after planting, for every berry.
- After that, watering repeats every **2 hours** (fast-growing 16h/20h-tier
  berries) or **3 hours** (slower 42h/44h/67h-tier berries) — see
  `waterIntervalHoursFor()` in `src/berries.js`.
- Watering does **not** speed up growth — it only keeps the plant healthy;
  ripening time is fixed from the moment you plant.
- The dataset also has a `reduce_time` field (2h for every berry) whose exact
  meaning wasn't confirmed anywhere (likely a yield-penalty grace period
  before something worse happens) — not implemented here since the mechanic
  isn't verified. If you find out what it does, `src/scheduler.js` is where
  it'd plug in.

**The 8-plot limit** in `/berry list` (`MAX_ACTIVE_PLOTS` in `src/config.js`)
is **not** a confirmed PokeMMO rule — research only turned up the total
number of physical plot tiles in the world (~156 in Unova), not a per-player
cap. It's just a self-imposed limit so the tracker/table stays manageable;
change or remove it in `src/config.js` freely.

## Setup

### 1. Create the Discord application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application**, name it, create it.
3. Go to **Bot** in the sidebar → **Reset Token** → copy it. This is your `DISCORD_TOKEN`.
4. Under **Privileged Gateway Intents**, enable **Message Content Intent** —
   this is required for the `!plant` text command to be able to read what
   you typed. (Not needed if you only ever plan to use `/berry plant`.)
5. Go to **OAuth2 → General** and copy the **Application ID** — this is your `CLIENT_ID`.

### 2. Invite it to your server

Go to **OAuth2 → URL Generator**:
- Scopes: `bot`, `applications.commands`
- Bot permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`

Open the generated URL and add the bot to your server.

### 3. Configure and run

```bash
cp .env.example .env
# edit .env: fill in DISCORD_TOKEN and CLIENT_ID
# (optional) fill in GUILD_ID with your server's ID for instant command updates while testing

npm install
npm run deploy-commands   # registers /berry with Discord
npm start                 # starts the bot
```

To get your server's ID for `GUILD_ID`: enable Developer Mode in Discord
(User Settings → Advanced), then right-click your server icon → Copy Server ID.

## Hosting it long-term

The bot just needs to stay running as a Node process (`npm start`) with your
`.env` present. A few reasonable free/cheap options:

- **A machine you already leave on** (a home server, a Raspberry Pi, an old
  laptop) — run it with `npm start` inside a `screen`/`tmux` session, or set
  it up as a `systemd` service so it restarts on reboot/crash.
- **Railway / Render / Fly.io** — all have small free or very cheap tiers
  well-suited to a lightweight bot like this. Exact free-tier limits change
  fairly often, so check current pricing before committing, but any of them
  can run this bot as a "worker" process (no need for a web server or public
  port — the bot only makes outbound connections to Discord).

Whichever you pick, just copy the whole project folder over, run
`npm install`, put your real `.env` there (don't commit it — it's already in
`.gitignore`), and run `npm start`.

## Project structure

```
src/
  index.js            # bot entry point, wires up commands + scheduler
  deploy-commands.js  # one-off script to register /berry with Discord
  berries.js          # berry data: grow time + watering interval (edit to fix/add berries)
  config.js           # MAX_ACTIVE_PLOTS (self-imposed, not a confirmed game rule)
  storage.js          # simple JSON-file storage for tracked plots
  scheduler.js        # background loop: watering reminders, ripe/wilt alerts
  format.js           # shared duration/timestamp formatting helpers
  plant.js            # shared "plant a berry" logic (used by both !plant and /berry plant)
  prefix.js           # the !plant text command + its dropdown menus
  buttons.js          # the "💧 I watered it" button handler
  commands/berry.js   # the /berry slash command and its subcommands
data/
  plots.json          # created automatically, holds tracked plots (gitignored)
```
