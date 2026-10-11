import { describe, expect, it } from 'vitest';
import { Chess, type Square } from 'chess.js';
import { lessons, scenes } from './lessons';
import { attempt, chooseTarget, complete, lastScene, moveUci, next, restore, reveal, save, start, step, undo } from './engine';

describe('Geprüfte Gabel-Lektionen', () => {
  for (const lesson of lessons) {
    it(`${lesson.id}: Schach, legale Antwort und Damengewinn`, () => {
      const g = new Chess(lesson.fen);
      moveUci(g, lesson.line[0]);
      expect(g.isCheck()).toBe(true);
      expect(g.isAttacked(lesson.targets[1] as Square, 'w')).toBe(true);
      moveUci(g, lesson.line[1]);
      expect(g.isCheck()).toBe(false);
      expect(moveUci(g, lesson.line[2]).captured).toBe('q');
    });
    it(`${lesson.id}: vorgeprüfte Fehlzugfolge`, () => {
      const g = new Chess(lesson.fen);
      moveUci(g, lesson.counterexample[0]);
      expect(moveUci(g, lesson.counterexample[1]).captured).toBe('n');
    });
  }
  it('verlangt beide Ziele', () => {
    let s = start(1);
    s = chooseTarget(s, 'b8');
    expect(complete(s)).toBe(false);
    s = chooseTarget(s, 'd8');
    expect(complete(s)).toBe(true);
    expect(next(s).scene).toBe(2);
  });
  it('weist illegale Züge ohne Stellungsveränderung zurück', () => {
    const s = start(2);
    expect(attempt(s, 'e5', 'e6').fen).toBe(s.fen);
    expect(attempt(s, 'e5', 'e6').cursor).toBe(0);
  });
  it('speichert Hilfe getrennt von selbstständigem Lösen', () => {
    let s = reveal(start(2));
    s = attempt(s, 'e5', 'c6'); s = step(s); s = attempt(s, 'c6', 'd8');
    expect(next(s).results[0].assisted).toBe(true);
  });
  it('zeichnet selbstständigen Transfer auf', () => {
    let s = start(3);
    s = attempt(s, 'e4', 'c5'); s = step(s); s = attempt(s, 'c5', 'd7');
    expect(next(s).results[0].assisted).toBe(false);
  });
  it('lässt Demo-Fortschritt nicht als selbstständigen Erfolg zählen', () => {
    let s = start(2);
    s = step(s, true); s = step(s, true); s = step(s, true);
    expect(next(s).results[0].assisted).toBe(true);
  });
  it('nimmt eine Fehlzugfolge vollständig zurück', () => {
    const s = attempt(start(2), 'e5', 'd7');
    expect(s.counterexample).toBe(true);
    expect(undo(s).fen).toBe(start(2).fen);
    expect(undo(s).attempts).toBe(1);
  });
  it('nimmt den eigenen Zug samt Antwort zurück', () => {
    const s = step(attempt(start(2), 'e5', 'c6'));
    expect(undo(s).cursor).toBe(0);
  });
  it('restauriert nur rekonstruierte, legale Stellungen', () => {
    const s = step(attempt(reveal(start(2)), 'e5', 'c6'));
    expect(restore(save(s)).fen).toBe(s.fen);
    expect(restore(save(s)).assisted).toBe(true);
    expect(() => restore('{"scene":99}')).toThrow();
  });
  it('überspringt unvollständige Szenen nicht', () => {
    expect(next(start(2)).scene).toBe(2);
  });
  it('verweist jede Szene auf eine vorhandene Lektion und endet mit der Zusammenfassung', () => {
    for (const sc of scenes) expect(lessons.some(l => l.id === sc.lesson)).toBe(true);
    expect(scenes[lastScene].kind).toBe('summary');
    expect(scenes.filter(sc => sc.kind === 'summary')).toHaveLength(1);
  });
  it('führt jede Szene in Folge ohne Abbruch aus', () => {
    let s = start();
    for (let i = 0; i < lastScene; i++) {
      const { kind } = scenes[s.scene];
      if (kind === 'watch') { s = step(s); s = step(s); s = step(s); }
      else if (kind === 'identify') { for (const t of lessons.find(l => l.id === scenes[s.scene].lesson)!.targets) s = chooseTarget(s, t); }
      else { s = step(s, true); s = step(s, true); s = step(s, true); }
      s = next(s);
      expect(s.scene).toBe(i + 1);
    }
    expect(s.results).toHaveLength(2);
  });
  it('speichert mit Version und liest alte Daten ohne Version weiter', () => {
    const s = start(2);
    const raw = save(s);
    expect(JSON.parse(raw).version).toBe(1);
    const legacy = JSON.parse(raw); delete legacy.version;
    expect(restore(JSON.stringify(legacy)).scene).toBe(2);
  });
  it('lehnt unbekannte Versionen und manipulierte Daten ab', () => {
    const good = JSON.parse(save(start(2)));
    expect(() => restore(JSON.stringify({ ...good, version: 2 }))).toThrow();
    expect(() => restore(JSON.stringify({ ...good, scene: lastScene + 1 }))).toThrow();
    expect(() => restore(JSON.stringify({ ...good, hint: 6 }))).toThrow();
    expect(() => restore(JSON.stringify({ ...good, results: [{ id: 'x', assisted: true, attempts: 1 }] }))).toThrow();
    expect(() => restore('kein json')).toThrow();
    expect(() => restore('null')).toThrow();
  });
});
