export function formatDuration(ms) {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatWhen(timestampMs) {
  const seconds = Math.round(timestampMs / 1000);
  return `<t:${seconds}:R>`; // Discord relative timestamp, e.g. "in 3 hours"
}
