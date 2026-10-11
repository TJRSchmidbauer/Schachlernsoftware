import { describe, expect, it } from 'vitest';
import { cleanLabel, decodeExport, encodeExport, maxLabel } from './exchange';

const data = {
  label: 'Füchsin-7',
  results: [{ id: 'gabel-entdecken-v1', assisted: false, attempts: 2 }],
  history: [{ id: 'gabel-entdecken-v1', day: '2026-10-12', assisted: false }],
};

describe('Export-Code für Lehrkräfte', () => {
  it('überträgt Kürzel mit Umlauten, Ergebnisse und Verlauf verlustfrei', () => {
    const decoded = decodeExport(encodeExport(data, '2026-10-13'));
    expect(decoded).toEqual({ ...data, day: '2026-10-13' });
  });
  it('enthält nur Lerndaten und kein Gerät, keine Uhrzeit, keine Fenstergröße', () => {
    const code = encodeExport(data, '2026-10-13');
    const payload = JSON.parse(atob(code.slice(4)));
    expect(Object.keys(payload).sort()).toEqual(['day', 'history', 'kind', 'label', 'results', 'version']);
  });
  it('bereinigt und kürzt das Kürzel', () => {
    expect(cleanLabel('  Max\u0000\n  ')).toBe('Max');
    expect(cleanLabel('x'.repeat(100))).toHaveLength(maxLabel);
  });
  it('fällt bei leerem Kürzel auf einen Platzhalter zurück', () => {
    expect(decodeExport(encodeExport({ ...data, label: '   ' })).label).toBe('ohne Kürzel');
  });
  it('lehnt fremde, beschädigte und manipulierte Codes mit verständlicher Meldung ab', () => {
    const good = encodeExport(data);
    expect(() => decodeExport('hallo')).toThrow('kein Schachlabor-Code');
    expect(() => decodeExport(good.slice(0, 20))).toThrow('beschädigt');
    expect(() => decodeExport('SL1.' + btoa('{"kind":"x"}'))).toThrow('unbekannte');
    const bad = (patch: object) => 'SL1.' + btoa(JSON.stringify({ ...JSON.parse(atob(good.slice(4))), ...patch }));
    expect(() => decodeExport(bad({ day: '2026-02-30' }))).toThrow('unbekannte');
    expect(() => decodeExport(bad({ history: [{ id: 'erfunden', day: '2026-10-12', assisted: false }] }))).toThrow('ungültige');
    expect(() => decodeExport(bad({ results: 'x' }))).toThrow('ungültige');
  });
});
