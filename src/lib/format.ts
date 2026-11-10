export const round = (n: number) => Math.round(n);

export const hh = (d: Date, hour12 = false) =>
  d.toLocaleTimeString(hour12 ? "en-US" : "it-IT", { hour: hour12 ? "numeric" : "2-digit", minute: "2-digit", hour12 });

const POINTS = ["Nord", "Nord-Est", "Est", "Sud-Est", "Sud", "Sud-Ovest", "Ovest", "Nord-Ovest"];
const ARROWS = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];

const sector = (deg: number) => Math.round((((deg % 360) + 360) % 360) / 45) % 8;

// Vento da Nord-Est: la freccia indica dove va il vento (verso Sud-Ovest, ↙)
export const windFrom = (deg: number) => `${ARROWS[sector(deg + 180)]} ${POINTS[sector(deg)]}`;

export const weekday = (d: Date, i: number) =>
  i === 0 ? "Oggi" : d.toLocaleDateString("it-IT", { weekday: "long" }).replace(/^./, (c) => c.toUpperCase());
