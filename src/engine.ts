import { Chess, type Square } from 'chess.js';
import { lessons, type Lesson } from './lessons';

export type Result = { id: string; assisted: boolean; attempts: number };
export type State = {
  scene: number; cursor: number; fen: string; hint: number;
  attempts: number; assisted: boolean; counterexample: boolean;
  targets: string[]; results: Result[]; message: string;
};
export const titles = ['Entdecken', 'Ziele erkennen', 'Selbst ziehen', 'Neu anwenden', 'Geschafft'];
export function lessonFor(scene: number): Lesson { return lessons[scene >= 3 ? 1 : 0]; }
export function moveUci(game: Chess, uci: string) {
  return game.move({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square,
    ...(uci.length > 4 ? { promotion: uci[4] } : {}) });
}
export function position(scene: number, cursor: number) {
  const lesson = lessonFor(scene);
  const game = new Chess(lesson.fen);
  const count = scene === 1 ? 1 : scene === 4 ? 3 : cursor;
  for (let i = 0; i < count; i++) moveUci(game, lesson.line[i]);
  return game.fen();
}
export function start(scene = 0, results: Result[] = []): State {
  return { scene, cursor: 0, fen: position(scene, 0), hint: 0, attempts: 0,
    assisted: false, counterexample: false, targets: [], results,
    message: scene === 0 ? 'Beobachte: Ein Springer greift zwei Ziele an.' :
      scene === 1 ? 'Tippe die beiden Figuren an, die der Springer angreift.' :
      scene === 4 ? 'Du hast das Motiv in zwei Stellungen ausprobiert.' :
      'Greife König und Dame mit einem Springerzug gleichzeitig an.' };
}
export function complete(s: State) {
  return s.scene === 4 || (s.scene === 1 ? s.targets.length === 2 : s.cursor === 3 && !s.counterexample);
}
function record(s: State): Result[] {
  if (s.scene !== 2 && s.scene !== 3) return s.results;
  const id = lessonFor(s.scene).id;
  return [...s.results.filter(r => r.id !== id), { id, assisted: s.assisted, attempts: s.attempts }];
}
export function next(s: State): State {
  return complete(s) && s.scene < 4 ? start(s.scene + 1, record(s)) : s;
}
export function reveal(s: State): State {
  if (s.scene < 2 || s.scene > 3 || complete(s) || s.counterexample) return s;
  return { ...s, hint: Math.min(5, s.hint + 1), assisted: true,
    message: 'Du darfst Hilfe nutzen. Dein nächster Versuch bleibt wichtig.' };
}
export function step(s: State, demonstrate = false): State {
  if (s.counterexample || s.cursor >= 3 || s.scene === 1 || s.scene === 4) return s;
  if (s.scene !== 0 && s.cursor !== 1 && !demonstrate) return s;
  const game = new Chess(s.fen);
  moveUci(game, lessonFor(s.scene).line[s.cursor]);
  const cursor = s.cursor + 1;
  return { ...s, fen: game.fen(), cursor,
    assisted: s.assisted || (demonstrate && s.scene !== 0),
    message: cursor === 1 ? 'Schach! Der König muss sich retten. Auch die Dame ist angegriffen.' :
      cursor === 2 ? 'Der König ist ausgewichen. Jetzt kannst du die Dame schlagen.' :
      'Die Dame ist gewonnen. Das ist die Wirkung der Gabel.' };
}
export function chooseTarget(s: State, square: string): State {
  if (s.scene !== 1) return s;
  if (!lessonFor(1).targets.includes(square))
    return { ...s, message: 'Suche eine gegnerische Figur auf einem Sprungfeld des Springers.' };
  const targets = s.targets.includes(square) ? s.targets.filter(t => t !== square) : [...s.targets, square];
  return { ...s, targets, message: targets.length === 2 ?
    'Genau: König und Dame sind gleichzeitig angegriffen.' : 'Ein Ziel gefunden. Suche das zweite.' };
}
export function attempt(s: State, from: string, to: string): State {
  if (s.scene < 2 || s.scene > 3 || complete(s) || s.counterexample || s.cursor === 1) return s;
  const game = new Chess(s.fen);
  const uci = from + to;
  try { moveUci(game, uci); } catch {
    return { ...s, message: 'Dieser Zug ist nicht erlaubt. Wähle eines der markierten Zielfelder.' };
  }
  const lesson = lessonFor(s.scene);
  if (uci === lesson.line[s.cursor]) {
    const cursor = s.cursor + 1;
    return { ...s, fen: game.fen(), cursor,
      message: cursor === 1 ? 'Schach und Angriff auf die Dame. Zeige jetzt die Antwort von Schwarz.' :
        'Du hast die Dame gewonnen. Die Gabel hat funktioniert.' };
  }
  if (s.cursor === 0 && uci === lesson.counterexample[0]) {
    moveUci(game, lesson.counterexample[1]);
    return { ...s, fen: game.fen(), counterexample: true, attempts: s.attempts + 1,
      message: 'Die Dame kann deinen Springer schlagen. Schau dir die Folge an und nimm den Versuch zurück.' };
  }
  return { ...s, attempts: s.attempts + 1,
    message: 'Der Zug ist legal. Für diese Aufgabe suchen wir die Gabel auf König und Dame. Dein Versuch wurde zurückgenommen.' };
}
export function undo(s: State): State {
  if (s.scene < 2 || s.scene > 3) return s;
  const cursor = s.counterexample ? 0 : s.cursor === 2 ? 0 : Math.max(0, s.cursor - 1);
  return { ...s, cursor, fen: position(s.scene, cursor), counterexample: false,
    message: 'Zurückgenommen. Du kannst einen anderen Zug ausprobieren.' };
}
export const storageKey = 'schachlabor.gabel.v1';
export function save(s: State): string {
  return JSON.stringify({ scene: s.scene, cursor: s.counterexample ? 0 : s.cursor,
    hint: s.hint, assisted: s.assisted, attempts: s.attempts, results: s.results });
}
export function restore(raw: string): State {
  const p = JSON.parse(raw);
  const integer = (x: unknown, max: number) => Number.isInteger(x) && Number(x) >= 0 && Number(x) <= max;
  if (!p || !integer(p.scene, 4) || !integer(p.cursor, 3) || !integer(p.hint, 5) ||
      !integer(p.attempts, 100000) || typeof p.assisted !== 'boolean' || !Array.isArray(p.results) || p.results.length > 2)
    throw new Error('Ungültiger Fortschritt');
  const results: Result[] = p.results.map((r: Result) => {
    if (!r || !lessons.some(l => l.id === r.id) || typeof r.assisted !== 'boolean' || !integer(r.attempts, 100000))
      throw new Error('Ungültiges Ergebnis');
    return { id: r.id, assisted: r.assisted, attempts: r.attempts };
  });
  const s = start(p.scene, results);
  const cursor = p.scene === 1 || p.scene === 4 ? 0 : p.cursor;
  return { ...s, cursor, fen: position(p.scene, cursor), hint: p.hint,
    assisted: p.assisted || p.hint > 0, attempts: p.attempts,
    message: 'Deine Lernrunde wurde wieder geöffnet. Du kannst weiterarbeiten.' };
}
