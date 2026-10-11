export type Lesson = {
  id: string;
  fen: string;
  line: readonly [string, string, string];
  attacker: string;
  landing: string;
  targets: readonly [string, string];
  counterexample: readonly [string, string];
};

export const lessons: readonly Lesson[] = [
  {
    id: 'gabel-entdecken-v1',
    fen: '1k1q4/8/8/4N3/8/8/8/6K1 w - - 0 1',
    line: ['e5c6', 'b8a8', 'c6d8'],
    attacker: 'e5', landing: 'c6', targets: ['b8', 'd8'],
    counterexample: ['e5d7', 'd8d7'],
  },
  {
    id: 'gabel-transfer-v1',
    fen: '8/1k1q4/8/8/4N3/8/8/6K1 w - - 0 1',
    line: ['e4c5', 'b7a8', 'c5d7'],
    attacker: 'e4', landing: 'c5', targets: ['b7', 'd7'],
    counterexample: ['e4d6', 'd7d6'],
  },
];

export type SceneKind = 'watch' | 'identify' | 'solve' | 'summary';
/** `aided: false` blendet bei Erkennungsaufgaben die Angriffspfeile aus. */
export type Scene = { kind: SceneKind; title: string; lesson: string; aided?: boolean };

/** Ablauf der Lernrunde: neue Szenen oder Lektionen werden hier ergänzt, nicht in der Engine. */
export const scenes: readonly Scene[] = [
  { kind: 'watch', title: 'Entdecken', lesson: 'gabel-entdecken-v1' },
  { kind: 'identify', title: 'Ziele erkennen', lesson: 'gabel-entdecken-v1' },
  { kind: 'solve', title: 'Selbst ziehen', lesson: 'gabel-entdecken-v1' },
  { kind: 'identify', title: 'Selbst erkennen', lesson: 'gabel-transfer-v1', aided: false },
  { kind: 'solve', title: 'Neu anwenden', lesson: 'gabel-transfer-v1' },
  { kind: 'summary', title: 'Geschafft', lesson: 'gabel-transfer-v1' },
];
