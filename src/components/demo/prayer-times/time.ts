import verified from "@/content/verified.json";

export function minutenImOrt(zeitpunkt: Date, zone: string, bezugstag: string) {
  const teile = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(zeitpunkt)
      .map((t) => [t.type, t.value]),
  );
  const tag = `${teile.year}-${teile.month}-${teile.day}`;
  const minuten = Number(teile.hour) * 60 + Number(teile.minute);
  const tagesversatz = Math.round(
    (Date.parse(`${tag}T00:00:00Z`) - Date.parse(`${bezugstag}T00:00:00Z`)) /
      86_400_000,
  );
  return minuten + tagesversatz * 1440;
}

export const uhrzeit = (m: number | null, fehlt: string) => {
  if (m === null) return fehlt;
  const tage = Math.floor(m / 1440);
  const rest = ((m % 1440) + 1440) % 1440;
  const zeit = `${String(Math.floor(rest / 60)).padStart(2, "0")}:${String(rest % 60).padStart(2, "0")}`;
  if (tage === 0) return zeit;
  return `${zeit} ${tage > 0 ? "+" : "−"}${Math.abs(tage)}`;
};

export function spanne(m: number) {
  const h = Math.floor(m / 60);
  return h ? `${h} h ${m % 60} min` : `${m} min`;
}

export const BAUZEIT = new Date(`${verified.date}T12:00:00Z`);

export function tagDesJahresImOrt(zone: string, jetzt = new Date()) {
  const heute = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(jetzt);
  const jahr = Number(heute.slice(0, 4));
  return Math.round(
    (Date.parse(`${heute}T00:00:00Z`) - Date.UTC(jahr, 0, 1)) / 86_400_000,
  );
}
