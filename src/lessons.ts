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
