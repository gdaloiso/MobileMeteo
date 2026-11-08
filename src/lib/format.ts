export const round = (n: number) => Math.round(n);

export const hh = (d: Date, hour12 = false) =>
  d.toLocaleTimeString(hour12 ? "en-US" : "it-IT", { hour: hour12 ? "numeric" : "2-digit", minute: "2-digit", hour12 });

export const weekday = (d: Date, i: number) =>
  i === 0 ? "Oggi" : d.toLocaleDateString("it-IT", { weekday: "long" }).replace(/^./, (c) => c.toUpperCase());
