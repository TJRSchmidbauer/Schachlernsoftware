export type Texts = {
  /** Meldung nach dem 1., 2. und 3. gezeigten Zug. */
  watch: readonly [string, string, string];
  watchStart: string;
  identifyStart: string;
  identifyUnaided: string;
  identifyMiss: string;
  identifyPartial: string;
  identifyDone: string;
  goal: string;
  legalOther: string;
  afterFirst: string;
  afterWin: string;
  counterPending: string;
  counterDone: string;
  heading: string;
  identifyHeading: string;
  /** Hilfestufen 1 bis 5. */
  hints: readonly [string, string, string, string, string];
};

export type Lesson = {
  id: string;
  path: string;
  fen: string;
  /** Eigener Zug, Antwort des Gegners, Gewinnzug. */
  line: readonly [string, string, string];
  attacker: string;
  landing: string;
  targets: readonly [string, string];
  /** Verlockender, aber schlechter Zug und die Antwort darauf. */
  counterexample: readonly [string, string];
  texts: Texts;
};

const commonHints = {
  four: 'Der durchgezogene Pfeil zeigt den gesuchten Zug.',
  five: 'Du kannst dir die Züge einzeln vormachen lassen.',
};

export const lessons: readonly Lesson[] = [
  {
    id: 'gabel-entdecken-v1', path: 'gabel',
    fen: '1k1q4/8/8/4N3/8/8/8/6K1 w - - 0 1',
    line: ['e5c6', 'b8a8', 'c6d8'],
    attacker: 'e5', landing: 'c6', targets: ['b8', 'd8'],
    counterexample: ['e5d7', 'd8d7'],
    texts: gabelTexts(),
  },
  {
    id: 'gabel-transfer-v1', path: 'gabel',
    fen: '8/1k1q4/8/8/4N3/8/8/6K1 w - - 0 1',
    line: ['e4c5', 'b7a8', 'c5d7'],
    attacker: 'e4', landing: 'c5', targets: ['b7', 'd7'],
    counterexample: ['e4d6', 'd7d6'],
    texts: gabelTexts(),
  },
  {
    id: 'fesselung-entdecken-v1', path: 'fesselung',
    fen: '4k3/p4ppp/2n5/8/8/8/4BPPP/3R2K1 w - - 0 1',
    line: ['e2b5', 'a7a6', 'b5c6'],
    attacker: 'e2', landing: 'b5', targets: ['c6', 'e8'],
    counterexample: ['d1d8', 'e8d8'],
    texts: fesselungTexts(),
  },
  {
    id: 'fesselung-transfer-v1', path: 'fesselung',
    fen: '3k4/ppp4p/5n2/8/8/8/PPPB4/1K2R3 w - - 0 1',
    line: ['d2g5', 'h7h6', 'g5f6'],
    attacker: 'd2', landing: 'g5', targets: ['f6', 'd8'],
    counterexample: ['e1e8', 'd8e8'],
    texts: fesselungTexts(),
  },
];

function gabelTexts(): Texts {
  return {
    watch: ['Schach! Der König muss sich retten. Auch die Dame ist angegriffen.',
      'Der König ist ausgewichen. Jetzt kannst du die Dame schlagen.',
      'Die Dame ist gewonnen. Das ist die Wirkung der Gabel.'],
    watchStart: 'Beobachte: Ein Springer greift zwei Ziele an.',
    identifyStart: 'Tippe die beiden Figuren an, die der Springer angreift.',
    identifyUnaided: 'Diesmal ohne Pfeile: Tippe die beiden Figuren an, die der Springer angreift.',
    identifyMiss: 'Suche eine gegnerische Figur auf einem Sprungfeld des Springers.',
    identifyPartial: 'Ein Ziel gefunden. Suche das zweite.',
    identifyDone: 'Genau: König und Dame sind gleichzeitig angegriffen.',
    goal: 'Greife König und Dame mit einem Springerzug gleichzeitig an.',
    legalOther: 'Der Zug ist legal. Für diese Aufgabe suchen wir die Gabel auf König und Dame. Dein Versuch wurde zurückgenommen.',
    afterFirst: 'Schach und Angriff auf die Dame. Zeige jetzt die Antwort von Schwarz.',
    afterWin: 'Du hast die Dame gewonnen. Die Gabel hat funktioniert.',
    counterPending: 'Dein Springer steht jetzt dort. Schwarz antwortet gleich …',
    counterDone: 'Die Dame kann deinen Springer schlagen. Schau dir die Folge an und nimm den Versuch zurück.',
    heading: 'Die Springergabel',
    identifyHeading: 'Wen greift der Springer an?',
    hints: ['Suche einen Zug, der König und Dame gleichzeitig angreift.', 'Die beiden Ziele sind eingerahmt.',
      'Der Springer ist die passende Figur.', commonHints.four, commonHints.five],
  };
}

function fesselungTexts(): Texts {
  return {
    watch: ['Der Läufer fesselt den Springer: Zöge er weg, stünde der König im Schach.',
      'Schwarz kann den Springer nicht ziehen und nicht mehr retten.',
      'Der gefesselte Springer ist gewonnen. Das ist die Wirkung der Fesselung.'],
    watchStart: 'Beobachte: Ein Läufer richtet sich auf eine Figur, hinter der der König steht.',
    identifyStart: 'Tippe die gefesselte Figur und den König dahinter an.',
    identifyUnaided: 'Diesmal ohne Pfeile: Tippe die gefesselte Figur und den König dahinter an.',
    identifyMiss: 'Suche die Figur auf der Linie des Läufers und den König dahinter.',
    identifyPartial: 'Eine Figur gefunden. Suche die zweite auf derselben Linie.',
    identifyDone: 'Genau: Der Springer darf nicht ziehen, weil dahinter der König steht.',
    goal: 'Fessle den schwarzen Springer an seinen König.',
    legalOther: 'Der Zug ist legal. Für diese Aufgabe suchen wir die Fesselung des Springers. Dein Versuch wurde zurückgenommen.',
    afterFirst: 'Der Springer ist gefesselt. Zeige jetzt die Antwort von Schwarz.',
    afterWin: 'Du hast den gefesselten Springer gewonnen. Die Fesselung hat funktioniert.',
    counterPending: 'Dein Turm steht jetzt dort. Schwarz antwortet gleich …',
    counterDone: 'Der König schlägt den Turm. Ein Schach ist nicht automatisch ein guter Zug. Nimm den Versuch zurück.',
    heading: 'Die Fesselung',
    identifyHeading: 'Was ist gefesselt?',
    hints: ['Suche einen Zug, nach dem eine Figur nicht mehr ziehen darf, weil dahinter der König steht.',
      'Die gefesselte Figur und der König sind eingerahmt.', 'Der Läufer ist die passende Figur.',
      commonHints.four, commonHints.five],
  };
}

export type SceneKind = 'watch' | 'identify' | 'solve' | 'summary';
/** `aided: false` blendet bei Erkennungsaufgaben die Angriffspfeile aus. */
export type Scene = { kind: SceneKind; title: string; lesson: string; path: string; aided?: boolean };

export type Path = { id: string; title: string; eyebrow: string; headline: string; lead: string };
export const paths: readonly Path[] = [
  { id: 'gabel', title: 'Doppelangriff', eyebrow: 'Lernpfad 01 · Doppelangriff', headline: 'Ein Zug. Zwei Ziele.',
    lead: 'Entdecke die Gabel. Probiere aus. Hilfe ist jederzeit erlaubt.' },
  { id: 'fesselung', title: 'Fesselung', eyebrow: 'Lernpfad 02 · Fesselung', headline: 'Nicht ziehen dürfen.',
    lead: 'Entdecke die Fesselung. Probiere aus. Hilfe ist jederzeit erlaubt.' },
];

const pathScenes = (path: string, first: string, transfer: string): Scene[] => [
  { kind: 'watch', title: 'Entdecken', lesson: first, path },
  { kind: 'identify', title: 'Ziele erkennen', lesson: first, path },
  { kind: 'solve', title: 'Selbst ziehen', lesson: first, path },
  { kind: 'identify', title: 'Selbst erkennen', lesson: transfer, path, aided: false },
  { kind: 'solve', title: 'Neu anwenden', lesson: transfer, path },
  { kind: 'summary', title: 'Geschafft', lesson: transfer, path },
];

/** Ablauf der Lernrunde: neue Szenen, Lektionen oder Motive werden hier ergänzt, nicht in der Engine. */
export const scenes: readonly Scene[] = [
  ...pathScenes('gabel', 'gabel-entdecken-v1', 'gabel-transfer-v1'),
  ...pathScenes('fesselung', 'fesselung-entdecken-v1', 'fesselung-transfer-v1'),
];
