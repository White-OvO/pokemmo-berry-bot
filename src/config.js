// Research didn't turn up a confirmed per-player concurrent-plot limit in
// PokeMMO itself (there are ~156 physical plot tiles across Unova's farming
// spots, but that's a shared world limit, not a per-account rule). This is a
// self-imposed soft cap so the bot's tracking (and the /berry list table)
// stays manageable — change it freely, it's not modeling a real game rule.
export const MAX_ACTIVE_PLOTS = 8;
