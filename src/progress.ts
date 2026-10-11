/** Eine abgeschlossene Lösung einer Lektion. Der Tag steht lokal als JJJJ-MM-TT. */
export type Solve = { id: string; day: string; assisted: boolean };

export const reviewIntervals = [1, 3, 7] as const;
/** Ab dieser Zahl verschiedener Tage mit selbstständiger Lösung gilt ein Motiv als gefestigt. */
export const consolidatedDays = 2;
export const maxHistory = 200;

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
export function isDay(x: unknown): x is string {
  if (typeof x !== 'string' || !dayPattern.test(x)) return false;
  const d = new Date(`${x}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === x;
}
export function localDay(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function germanDate(day: string) { const [y, m, d] = day.split('-'); return `${d}.${m}.${y}`; }

export type Status = {
  /** Verschiedene Tage, an denen eine Lektion des Motivs ohne Lösungshilfe gelöst wurde. */
  days: number;
  consolidated: boolean;
  lastDay: string | null;
  nextDue: string | null;
  due: boolean;
};

/**
 * Wertet den Verlauf eines Motivs aus. Mehrere Lösungen am selben Tag zählen nur einmal.
 * Wiederholungen: 1, 3, dann 7 Tage nach der letzten selbstständigen Lösung.
 */
export function statusFor(history: readonly Solve[], lessonIds: readonly string[], today: string): Status {
  const days = [...new Set(history.filter(h => !h.assisted && lessonIds.includes(h.id)).map(h => h.day))].sort();
  if (!days.length) return { days: 0, consolidated: false, lastDay: null, nextDue: null, due: false };
  const lastDay = days[days.length - 1];
  const nextDue = addDays(lastDay, reviewIntervals[Math.min(days.length, reviewIntervals.length) - 1]);
  return { days: days.length, consolidated: days.length >= consolidatedDays, lastDay, nextDue, due: today >= nextDue };
}

export function describe(status: Status): string {
  if (!status.days) return 'Noch nicht ohne Lösungshilfe gelöst.';
  const base = `An ${status.days} ${status.days === 1 ? 'Tag' : 'Tagen'} ohne Lösungshilfe gelöst${status.consolidated ? ' (gefestigt)' : ''}.`;
  return `${base} ${status.due ? 'Eine Wiederholung ist fällig.' : `Wiederholung ab ${germanDate(status.nextDue!)}.`}`;
}
