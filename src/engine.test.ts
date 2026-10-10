import { describe, expect, it } from 'vitest';
import { Chess, type Square } from 'chess.js';
import { lessons } from './lessons';
import { attempt, chooseTarget, complete, moveUci, next, restore, reveal, save, start, step, undo } from './engine';

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
});
