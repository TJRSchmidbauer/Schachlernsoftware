import { Chess, type Square } from 'chess.js';
import { lessons, scenes, type Lesson, type SceneKind } from './lessons';

export type Result = { id: string; assisted: boolean; attempts: number };
export type State = {
  scene: number; cursor: number; fen: string; hint: number;
  attempts: number; assisted: boolean; counterexample: boolean;
  targets: string[]; results: Result[]; message: string;
};
export const titles = scenes.map(s => s.title);
export const lastScene = scenes.length - 1;
export function kindOf(scene: number): SceneKind { return scenes[scene].kind; }
export function isSolve(scene: number) { return kindOf(scene) === 'solve'; }
export function lessonFor(scene: number): Lesson { return lessons.find(l => l.id === scenes[scene].lesson)!; }
export function moveUci(game: Chess, uci: string) {
  return game.move({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square,
    ...(uci.length > 4 ? { promotion: uci[4] } : {}) });
}
export function position(scene: number, cursor: number) {
  const lesson = lessonFor(scene);
  const game = new Chess(lesson.fen);
  const kind = kindOf(scene);
  const count = kind === 'identify' ? 1 : kind === 'summary' ? 3 : cursor;
  for (let i = 0; i < count; i++) moveUci(game, lesson.line[i]);
  return game.fen();
}
export function start(scene = 0, results: Result[] = []): State {
  return { scene, cursor: 0, fen: position(scene, 0), hint: 0, attempts: 0,
    assisted: false, counterexample: false, targets: [], results,
    message: kindOf(scene) === 'watch' ? 'Beobachte: Ein Springer greift zwei Ziele an.' :
      kindOf(scene) === 'identify' ? 'Tippe die beiden Figuren an, die der Springer angreift.' :
      kindOf(scene) === 'summary' ? 'Du hast das Motiv in zwei Stellungen ausprobiert.' :
      'Greife König und Dame mit einem Springerzug gleichzeitig an.' };
}
export function complete(s: State) {
  return kindOf(s.scene) === 'summary' || (kindOf(s.scene) === 'identify' ? s.targets.length === 2 : s.cursor === 3 && !s.counterexample);
}
function record(s: State): Result[] {
  if (!isSolve(s.scene)) return s.results;
  const id = lessonFor(s.scene).id;
  return [...s.results.filter(r => r.id !== id), { id, assisted: s.assisted, attempts: s.attempts }];
}
export function next(s: State): State {
  return complete(s) && s.scene < lastScene ? start(s.scene + 1, record(s)) : s;
}
export function reveal(s: State): State {
  if (!isSolve(s.scene) || complete(s) || s.counterexample) return s;
  return { ...s, hint: Math.min(5, s.hint + 1), assisted: true,
    message: 'Du darfst Hilfe nutzen. Dein nächster Versuch bleibt wichtig.' };
}
export function step(s: State, demonstrate = false): State {
  if (s.counterexample || s.cursor >= 3 || kindOf(s.scene) === 'identify' || kindOf(s.scene) === 'summary') return s;
  if (kindOf(s.scene) !== 'watch' && s.cursor !== 1 && !demonstrate) return s;
  const game = new Chess(s.fen);
  moveUci(game, lessonFor(s.scene).line[s.cursor]);
  const cursor = s.cursor + 1;
  return { ...s, fen: game.fen(), cursor,
    assisted: s.assisted || (demonstrate && kindOf(s.scene) !== 'watch'),
    message: cursor === 1 ? 'Schach! Der König muss sich retten. Auch die Dame ist angegriffen.' :
      cursor === 2 ? 'Der König ist ausgewichen. Jetzt kannst du die Dame schlagen.' :
      'Die Dame ist gewonnen. Das ist die Wirkung der Gabel.' };
}
export function chooseTarget(s: State, square: string): State {
  if (kindOf(s.scene) !== 'identify') return s;
  if (!lessonFor(s.scene).targets.includes(square))
    return { ...s, message: 'Suche eine gegnerische Figur auf einem Sprungfeld des Springers.' };
  const targets = s.targets.includes(square) ? s.targets.filter(t => t !== square) : [...s.targets, square];
  return { ...s, targets, message: targets.length === 2 ?
    'Genau: König und Dame sind gleichzeitig angegriffen.' : 'Ein Ziel gefunden. Suche das zweite.' };
}
export function attempt(s: State, from: string, to: string): State {
  if (!isSolve(s.scene) || complete(s) || s.counterexample || s.cursor === 1) return s;
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
  if (!isSolve(s.scene)) return s;
  const cursor = s.counterexample ? 0 : s.cursor === 2 ? 0 : Math.max(0, s.cursor - 1);
  return { ...s, cursor, fen: position(s.scene, cursor), counterexample: false,
    message: 'Zurückgenommen. Du kannst einen anderen Zug ausprobieren.' };
}
export const storageKey = 'schachlabor.gabel.v1';
export const storageVersion = 1;
export function save(s: State): string {
  return JSON.stringify({ version: storageVersion, scene: s.scene, cursor: s.counterexample ? 0 : s.cursor,
    hint: s.hint, assisted: s.assisted, attempts: s.attempts, results: s.results });
}
export function restore(raw: string): State {
  const p = JSON.parse(raw);
  const integer = (x: unknown, max: number) => Number.isInteger(x) && Number(x) >= 0 && Number(x) <= max;
  if (!p || (p.version !== undefined && p.version !== storageVersion) || !integer(p.scene, lastScene) || !integer(p.cursor, 3) || !integer(p.hint, 5) ||
      !integer(p.attempts, 100000) || typeof p.assisted !== 'boolean' || !Array.isArray(p.results) || p.results.length > lessons.length)
    throw new Error('Ungültiger Fortschritt');
  const results: Result[] = p.results.map((r: Result) => {
    if (!r || !lessons.some(l => l.id === r.id) || typeof r.assisted !== 'boolean' || !integer(r.attempts, 100000))
      throw new Error('Ungültiges Ergebnis');
    return { id: r.id, assisted: r.assisted, attempts: r.attempts };
  });
  const s = start(p.scene, results);
  const kind = kindOf(p.scene);
  const cursor = kind === 'identify' || kind === 'summary' ? 0 : p.cursor;
  return { ...s, cursor, fen: position(p.scene, cursor), hint: p.hint,
    assisted: p.assisted || p.hint > 0, attempts: p.attempts,
    message: 'Deine Lernrunde wurde wieder geöffnet. Du kannst weiterarbeiten.' };
}
