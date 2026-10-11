import { validateHistory, validateResults, type Result } from './engine';
import { isDay, localDay, type Solve } from './progress';

const prefix = 'SL1.';
export const maxLabel = 24;

export type Export = { label: string; day: string; results: Result[]; history: Solve[] };

function toBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = ''; for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
function fromBase64(code: string) {
  const binary = atob(code);
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
}

/** Das Kürzel darf kein Klarname sein; Steuerzeichen werden entfernt und die Länge begrenzt. */
export function cleanLabel(label: string) {
  return label.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLabel);
}

/** Erzeugt einen Text-Code, den Lernende an die Lehrkraft geben. Der Code ist nicht fälschungssicher. */
export function encodeExport(data: { label: string; results: Result[]; history: Solve[] }, day = localDay()): string {
  const payload = { kind: 'schachlabor-export', version: 1, label: cleanLabel(data.label), day,
    results: data.results, history: data.history };
  return prefix + toBase64(JSON.stringify(payload));
}

export function decodeExport(code: string): Export {
  const text = code.trim();
  if (!text.startsWith(prefix)) throw new Error('Das ist kein Schachlabor-Code.');
  let p: any;
  try { p = JSON.parse(fromBase64(text.slice(prefix.length))); }
  catch { throw new Error('Der Code ist beschädigt oder unvollständig.'); }
  if (!p || p.kind !== 'schachlabor-export' || p.version !== 1 || typeof p.label !== 'string' || !isDay(p.day))
    throw new Error('Der Code hat ein unbekanntes Format.');
  try {
    return { label: cleanLabel(p.label) || 'ohne Kürzel', day: p.day,
      results: validateResults(p.results), history: validateHistory(p.history) };
  } catch { throw new Error('Der Code enthält ungültige Lernstände.'); }
}
