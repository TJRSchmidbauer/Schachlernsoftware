import { describe, expect, it } from 'vitest';
import { Chess, type Square } from 'chess.js';
import { lessons, paths, scenes } from './lessons';
import { attempt, chooseTarget, complete, lastScene, nextPath, playReply, moveUci, next, restore, reveal, save, start, step, undo } from './engine';

const value: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
/** Reiner Schlagtausch: bester Materialgewinn der Seite am Zug, wenn nur noch geschlagen wird. */
function exchange(g: Chess): number {
  let best = 0;
  for (const m of g.moves({ verbose: true })) {
    if (!m.captured) continue;
    g.move(m);
    best = Math.max(best, value[m.captured] - exchange(g));
    g.undo();
  }
  return best;
}
const play = (g: Chess, uci: string) => moveUci(g, uci);

describe('Inhaltsprüfung aller Lektionen', () => {
  it('hat eindeutige Kennungen und gültige Motive', () => {
    expect(new Set(lessons.map(l => l.id)).size).toBe(lessons.length);
    for (const l of lessons) expect(paths.some(p => p.id === l.path)).toBe(true);
    for (const p of paths) expect(lessons.filter(l => l.path === p.id)).toHaveLength(2);
  });
  for (const lesson of lessons) {
    describe(lesson.id, () => {
      it('besteht aus legalen Zügen, Weiß beginnt, Ziele sind Gegnerfiguren', () => {
        const g = new Chess(lesson.fen);
        expect(g.turn()).toBe('w');
        expect(g.get(lesson.attacker as Square)?.color).toBe('w');
        play(g, lesson.line[0]);
        expect(lesson.line[0].slice(0, 2)).toBe(lesson.attacker);
        expect(lesson.line[0].slice(2, 4)).toBe(lesson.landing);
        for (const t of lesson.targets) expect(g.get(t as Square)?.color).toBe('b');
        play(g, lesson.line[1]);
        expect(play(g, lesson.line[2]).captured).toBeDefined();
      });
      it('hat fünf Hilfetexte und eine Meldung je gezeigtem Zug', () => {
        expect(lesson.texts.hints).toHaveLength(5);
        expect(lesson.texts.watch).toHaveLength(3);
        for (const text of Object.values(lesson.texts).flat()) expect(String(text).length).toBeGreaterThan(10);
      });
      it('hat eine Fehlzugfolge, die Material kostet', () => {
        const g = new Chess(lesson.fen);
        play(g, lesson.counterexample[0]);
        const reply = play(g, lesson.counterexample[1]);
        expect(reply.captured).toBeDefined();
        expect(value[reply.captured!]).toBeGreaterThanOrEqual(3);
      });
      it('lässt sich als ganze Lektion über die Engine durchspielen', () => {
        const sceneIndex = scenes.findIndex(sc => sc.kind === 'solve' && sc.lesson === lesson.id);
        let s = start(sceneIndex);
        s = attempt(s, lesson.line[0].slice(0, 2), lesson.line[0].slice(2, 4));
        expect(s.cursor).toBe(1);
        s = step(s); s = attempt(s, lesson.line[2].slice(0, 2), lesson.line[2].slice(2, 4));
        expect(complete(s)).toBe(true);
        expect(next(s).results[0].assisted).toBe(false);
      });
    });
  }
  const forks = lessons.filter(l => l.path === 'gabel');
  const pins = lessons.filter(l => l.path === 'fesselung');
  for (const lesson of forks) {
    it(`${lesson.id}: Gabel mit Schach, Dame angegriffen, Damengewinn`, () => {
      const g = new Chess(lesson.fen);
      play(g, lesson.line[0]);
      expect(g.isCheck()).toBe(true);
      expect(g.isAttacked(lesson.targets[1] as Square, 'w')).toBe(true);
      play(g, lesson.line[1]);
      expect(g.isCheck()).toBe(false);
      expect(play(g, lesson.line[2]).captured).toBe('q');
    });
  }
  for (const lesson of pins) {
    it(`${lesson.id}: Fesselung – Figur kann nicht ziehen, kein Schach, Springer gewonnen`, () => {
      const g = new Chess(lesson.fen);
      play(g, lesson.line[0]);
      const [pinned, king] = lesson.targets;
      expect(g.get(king as Square)).toMatchObject({ type: 'k', color: 'b' });
      expect(g.isCheck()).toBe(false);
      expect(g.moves({ square: pinned as Square })).toHaveLength(0);
      expect(g.isAttacked(pinned as Square, 'w')).toBe(true);
      play(g, lesson.line[1]);
      expect(play(g, lesson.line[2]).captured).toBe('n');
    });
    it(`${lesson.id}: Weiß gewinnt auf jede legale Antwort von Schwarz mindestens einen Springer`, () => {
      const g = new Chess(lesson.fen);
      play(g, lesson.line[0]);
      for (const reply of g.moves({ verbose: true })) {
        g.move(reply);
        const gain = exchange(g) - (reply.captured ? value[reply.captured] : 0);
        g.undo();
        expect(gain, `${reply.san} nach ${lesson.line[0]}`).toBeGreaterThanOrEqual(3);
      }
    });
  }
});

describe('Lernrunde', () => {
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
    let s = start(4);
    s = attempt(s, 'e4', 'c5'); s = step(s); s = attempt(s, 'c5', 'd7');
    expect(next(s).results[0].assisted).toBe(false);
  });
  it('lässt Demo-Fortschritt nicht als selbstständigen Erfolg zählen', () => {
    let s = start(2);
    s = step(s, true); s = step(s, true); s = step(s, true);
    expect(next(s).results[0].assisted).toBe(true);
  });
  it('nimmt eine Fehlzugfolge vollständig zurück', () => {
    const s = playReply(attempt(start(2), 'e5', 'd7'));
    expect(s.counterexample).toBe(true);
    expect(undo(s).fen).toBe(start(2).fen);
    expect(undo(s).attempts).toBe(1);
  });
  it('zeigt die Fehlzugantwort zeitlich versetzt und kann sie vorher abbrechen', () => {
    const first = attempt(start(2), 'e5', 'd7');
    expect(first.pending).toBe('d8d7');
    expect(new Chess(first.fen).get('d8' as Square)?.type).toBe('q');
    const full = playReply(first);
    expect(full.pending).toBeNull();
    expect(full.fen).not.toBe(first.fen);
    expect(playReply(full)).toBe(full);
    const undone = undo(first);
    expect(undone.pending).toBeNull();
    expect(undone.fen).toBe(start(2).fen);
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
  it('verweist jede Szene auf eine Lektion desselben Motivs und endet je Motiv mit der Zusammenfassung', () => {
    for (const sc of scenes) expect(lessons.find(l => l.id === sc.lesson)?.path).toBe(sc.path);
    expect(scenes[lastScene].kind).toBe('summary');
    for (const p of paths) {
      const own = scenes.filter(sc => sc.path === p.id);
      expect(own.filter(sc => sc.kind === 'summary')).toHaveLength(1);
      expect(own[own.length - 1].kind).toBe('summary');
    }
  });
  it('führt alle Motive in Folge ohne Abbruch aus', () => {
    let s = start();
    for (let i = 0; i < scenes.length - 1; i++) {
      const { kind, lesson: id } = scenes[s.scene];
      const lesson = lessons.find(l => l.id === id)!;
      if (kind === 'watch') { s = step(s); s = step(s); s = step(s); }
      else if (kind === 'identify') { for (const t of lesson.targets) s = chooseTarget(s, t); }
      else if (kind === 'solve') { s = step(s, true); s = step(s, true); s = step(s, true); }
      else s = nextPath(s);
      if (kind !== 'summary') s = next(s);
      expect(s.scene).toBe(i + 1);
    }
    expect(scenes[s.scene].kind).toBe('summary');
    expect(s.results).toHaveLength(lessons.length);
    expect(nextPath(s)).toBe(s);
  });
  it('speichert mit Version und liest alte Daten ohne Version weiter', () => {
    const s = start(2);
    const raw = save(s);
    expect(JSON.parse(raw).version).toBe(2);
    const legacy = JSON.parse(raw); delete legacy.version;
    expect(restore(JSON.stringify(legacy)).scene).toBe(2);
  });
  it('migriert Version-1-Fortschritt auf die neue Szenenfolge', () => {
    const v1 = (scene: number) => JSON.stringify({ version: 1, scene, cursor: 0, hint: 0, assisted: false, attempts: 0, results: [] });
    expect(restore(v1(2)).scene).toBe(2);
    expect(scenes[restore(v1(3)).scene].lesson).toBe('gabel-transfer-v1');
    expect(scenes[restore(v1(3)).scene].kind).toBe('solve');
    expect(restore(v1(4)).scene).toBe(5);
    expect(() => restore(v1(5))).toThrow();
  });
  it('lehnt unbekannte Versionen und manipulierte Daten ab', () => {
    const good = JSON.parse(save(start(2)));
    expect(() => restore(JSON.stringify({ ...good, version: 3 }))).toThrow();
    expect(() => restore(JSON.stringify({ ...good, scene: lastScene + 1 }))).toThrow();
    expect(() => restore(JSON.stringify({ ...good, hint: 6 }))).toThrow();
    expect(() => restore(JSON.stringify({ ...good, results: [{ id: 'x', assisted: true, attempts: 1 }] }))).toThrow();
    expect(() => restore('kein json')).toThrow();
    expect(() => restore('null')).toThrow();
  });
});
