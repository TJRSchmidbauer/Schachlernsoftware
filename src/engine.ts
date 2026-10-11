import { Chess, type Square } from 'chess.js';
import { lessons, paths, scenes, type Lesson, type Path, type SceneKind } from './lessons';

export type Result = { id: string; assisted: boolean; attempts: number };
export type State = {
  scene: number; cursor: number; fen: string; hint: number;
  attempts: number; assisted: boolean; counterexample: boolean; pending: string | null;
  targets: string[]; results: Result[]; message: string;
};
export const lastScene = scenes.length - 1;
export function pathOf(scene: number): Path { return paths.find(p => p.id === scenes[scene].path)!; }
/** Szenennummern des aktuellen Motivs, für die Fortschrittsanzeige. */
export function sceneIndexes(scene: number): number[] {
  const id = scenes[scene].path;
  return scenes.flatMap((sc, i) => sc.path === id ? [i] : []);
}
export function hasNextPath(scene: number) { return scene < scenes.length - 1 && scenes[scene + 1].path !== scenes[scene].path; }
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
    assisted: false, counterexample: false, pending: null, targets: [], results,
    message: kindOf(scene) === 'watch' ? lessonFor(scene).texts.watchStart :
      kindOf(scene) === 'identify' ? (scenes[scene].aided === false ?
        lessonFor(scene).texts.identifyUnaided : lessonFor(scene).texts.identifyStart) :
      kindOf(scene) === 'summary' ? 'Du hast das Motiv in zwei Stellungen ausprobiert.' :
      lessonFor(scene).texts.goal };
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
  return complete(s) && kindOf(s.scene) !== 'summary' ? start(s.scene + 1, record(s)) : s;
}
/** Von der Zusammenfassung zum nächsten Motiv. */
export function nextPath(s: State): State {
  return kindOf(s.scene) === 'summary' && hasNextPath(s.scene) ? start(s.scene + 1, s.results) : s;
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
    message: lessonFor(s.scene).texts.watch[cursor - 1] };
}
export function chooseTarget(s: State, square: string): State {
  if (kindOf(s.scene) !== 'identify') return s;
  if (!lessonFor(s.scene).targets.includes(square))
    return { ...s, message: lessonFor(s.scene).texts.identifyMiss };
  const targets = s.targets.includes(square) ? s.targets.filter(t => t !== square) : [...s.targets, square];
  return { ...s, targets, message: targets.length === 2 ?
    lessonFor(s.scene).texts.identifyDone : lessonFor(s.scene).texts.identifyPartial };
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
      message: cursor === 1 ? lesson.texts.afterFirst : lesson.texts.afterWin };
  }
  if (s.cursor === 0 && uci === lesson.counterexample[0]) {
    return { ...s, fen: game.fen(), counterexample: true, pending: lesson.counterexample[1], attempts: s.attempts + 1,
      message: lesson.texts.counterPending };
  }
  return { ...s, attempts: s.attempts + 1,
    message: lesson.texts.legalOther };
}
/** Spielt die zeitlich versetzte Antwort der Fehlzugfolge. */
export function playReply(s: State): State {
  if (!s.pending) return s;
  const game = new Chess(s.fen);
  moveUci(game, s.pending);
  return { ...s, fen: game.fen(), pending: null,
    message: lessonFor(s.scene).texts.counterDone };
}
export function undo(s: State): State {
  if (!isSolve(s.scene)) return s;
  const cursor = s.counterexample ? 0 : s.cursor === 2 ? 0 : Math.max(0, s.cursor - 1);
  return { ...s, cursor, fen: position(s.scene, cursor), counterexample: false, pending: null,
    message: 'Zurückgenommen. Du kannst einen anderen Zug ausprobieren.' };
}
export const storageKey = 'schachlabor.gabel.v1';
export const storageVersion = 2;
/** Version 1 hatte vier statt fünf Szenen vor der Zusammenfassung: Szene 3+ rückt um eins weiter. */
const migrateScene = (scene: number, version: number) => version < 2 && scene >= 3 ? scene + 1 : scene;
export function save(s: State): string {
  return JSON.stringify({ version: storageVersion, scene: s.scene, cursor: s.counterexample ? 0 : s.cursor,
    hint: s.hint, assisted: s.assisted, attempts: s.attempts, results: s.results });
}
export function restore(raw: string): State {
  const p = JSON.parse(raw);
  const version = p && p.version === undefined ? 1 : p?.version;
  const integer = (x: unknown, max: number) => Number.isInteger(x) && Number(x) >= 0 && Number(x) <= max;
  if (!p || (version !== 1 && version !== storageVersion) || !integer(p.scene, version === 1 ? 4 : lastScene) || !integer(p.cursor, 3) || !integer(p.hint, 5) ||
      !integer(p.attempts, 100000) || typeof p.assisted !== 'boolean' || !Array.isArray(p.results) || p.results.length > lessons.length)
    throw new Error('Ungültiger Fortschritt');
  const results: Result[] = p.results.map((r: Result) => {
    if (!r || !lessons.some(l => l.id === r.id) || typeof r.assisted !== 'boolean' || !integer(r.attempts, 100000))
      throw new Error('Ungültiges Ergebnis');
    return { id: r.id, assisted: r.assisted, attempts: r.attempts };
  });
  const scene = migrateScene(p.scene, version);
  const s = start(scene, results);
  const kind = kindOf(scene);
  const cursor = kind === 'identify' || kind === 'summary' ? 0 : p.cursor;
  return { ...s, cursor, fen: position(scene, cursor), hint: p.hint,
    assisted: p.assisted || p.hint > 0, attempts: p.attempts,
    message: 'Deine Lernrunde wurde wieder geöffnet. Du kannst weiterarbeiten.' };
}
