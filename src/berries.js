// Berry -> total grow time in minutes (planting to fully ripe).
//
// Source: https://pokemmo.shoutwiki.com/wiki/Berry (fetched and transcribed
// programmatically). Double-check against the live wiki page before trusting
// this for anything important — it was scraped via an AI summarizer, so
// transcription errors are possible even though the source itself is solid.
export const BERRIES = {
  Cheri: { growMinutes: 16 * 60 },
  Chesto: { growMinutes: 16 * 60 },
  Pecha: { growMinutes: 16 * 60 },
  Rawst: { growMinutes: 16 * 60 },
  Aspear: { growMinutes: 16 * 60 },
  Leppa: { growMinutes: 20 * 60 },
  Oran: { growMinutes: 16 * 60 },
  Persim: { growMinutes: 16 * 60 },
  Lum: { growMinutes: 44 * 60 },
  Sitrus: { growMinutes: 44 * 60 },
  Figy: { growMinutes: 20 * 60 },
  Wiki: { growMinutes: 20 * 60 },
  Mago: { growMinutes: 20 * 60 },
  Aguav: { growMinutes: 20 * 60 },
  Iapapa: { growMinutes: 20 * 60 },
  Razz: { growMinutes: 16 * 60 },
  Bluk: { growMinutes: 16 * 60 },
  Nanab: { growMinutes: 16 * 60 },
  Wepear: { growMinutes: 16 * 60 },
  Pinap: { growMinutes: 16 * 60 },
  Pomeg: { growMinutes: 44 * 60 },
  Kelpsy: { growMinutes: 44 * 60 },
  Qualot: { growMinutes: 44 * 60 },
  Hondew: { growMinutes: 44 * 60 },
  Grepa: { growMinutes: 44 * 60 },
  Tamato: { growMinutes: 44 * 60 },
  Cornn: { growMinutes: 20 * 60 },
  Magost: { growMinutes: 20 * 60 },
  Rabuta: { growMinutes: 20 * 60 },
  Nomel: { growMinutes: 20 * 60 },
  Spelon: { growMinutes: 42 * 60 },
  Pamtre: { growMinutes: 42 * 60 },
  Watmel: { growMinutes: 42 * 60 },
  Durin: { growMinutes: 42 * 60 },
  Belue: { growMinutes: 42 * 60 },
  Occa: { growMinutes: 42 * 60 },
  Passho: { growMinutes: 42 * 60 },
  Wacan: { growMinutes: 42 * 60 },
  Rindo: { growMinutes: 42 * 60 },
  Yache: { growMinutes: 42 * 60 },
  Chople: { growMinutes: 42 * 60 },
  Kebia: { growMinutes: 42 * 60 },
  Shuca: { growMinutes: 42 * 60 },
  Coba: { growMinutes: 42 * 60 },
  Payapa: { growMinutes: 42 * 60 },
  Tanga: { growMinutes: 42 * 60 },
  Charti: { growMinutes: 42 * 60 },
  Kasib: { growMinutes: 42 * 60 },
  Haban: { growMinutes: 42 * 60 },
  Colbur: { growMinutes: 42 * 60 },
  Babiri: { growMinutes: 42 * 60 },
  Chilan: { growMinutes: 42 * 60 },
  Liechi: { growMinutes: 67 * 60 },
  Ganlon: { growMinutes: 67 * 60 },
  Salac: { growMinutes: 67 * 60 },
  Petaya: { growMinutes: 67 * 60 },
  Apicot: { growMinutes: 67 * 60 },
  Lansat: { growMinutes: 67 * 60 },
  Starf: { growMinutes: 67 * 60 },
  Enigma: { growMinutes: 42 * 60 },
  Micle: { growMinutes: 44 * 60 },
  Custap: { growMinutes: 44 * 60 },
  Jaboca: { growMinutes: 44 * 60 },
  Rowap: { growMinutes: 44 * 60 },
};

// Confirmed on the wiki: every berry wilts (and is lost) 8 hours after it
// finishes growing if it isn't harvested.
export const WILT_HOURS = 8;

// Watering data confirmed from github.com/PokeMMO-Tools/pokemmo-data
// (community-maintained, values dumped from the game client's memory):
// - every berry needs its first watering 3 hours after planting
// - after that, watering repeats every 2h (fast-growing tiers) or 3h
//   (slow-growing tiers) until the berry finishes growing
// - watering does NOT speed up growth; it only keeps the plant alive/healthy
export const FIRST_WATER_HOURS = 3;

export function waterIntervalHoursFor(growMinutes) {
  return growMinutes / 60 <= 20 ? 2 : 3;
}

export function berryNames() {
  return Object.keys(BERRIES);
}
