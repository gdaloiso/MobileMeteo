// Fase lunare calcolata sul telefono, senza servizi esterni.
// Riferimento: luna nuova del 6 gennaio 2000 alle 18:14 UTC. L'errore è di poche ore,
// più che sufficiente per mostrare fase e percentuale.

const SYNODIC_DAYS = 29.530588853;
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const DAY_MS = 24 * 60 * 60 * 1000;

const PHASES = [
  { name: "Luna nuova", icon: "🌑" },
  { name: "Falce crescente", icon: "🌒" },
  { name: "Primo quarto", icon: "🌓" },
  { name: "Gibbosa crescente", icon: "🌔" },
  { name: "Luna piena", icon: "🌕" },
  { name: "Gibbosa calante", icon: "🌖" },
  { name: "Ultimo quarto", icon: "🌗" },
  { name: "Falce calante", icon: "🌘" },
];

export type MoonInfo = {
  name: string;
  icon: string;
  /** Percentuale di disco illuminato, 0-100. */
  illumination: number;
  /** Data della prossima luna piena. */
  nextFull: Date;
};

// Posizione nel ciclo: 0 = luna nuova, 0.5 = luna piena, vicino a 1 = di nuovo nuova.
const cycle = (ms: number) => {
  const p = ((ms - REF_NEW_MOON) / DAY_MS / SYNODIC_DAYS) % 1;
  return p < 0 ? p + 1 : p;
};

export function moonInfo(at: Date): MoonInfo {
  const p = cycle(at.getTime());
  const phase = PHASES[Math.round(p * 8) % 8];
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * p)) / 2) * 100);
  const daysToFull = (((0.5 - p) % 1) + 1) % 1 * SYNODIC_DAYS;
  return { ...phase, illumination, nextFull: new Date(at.getTime() + daysToFull * DAY_MS) };
}

// "9 h 12 min"
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 60000));
  return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, "0")} min`;
}
