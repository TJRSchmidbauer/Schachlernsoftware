'use client';
import { useEffect, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import Board, { type Arrow } from './Board';
import { attempt, chooseTarget, complete, lessonFor, next, restore, reveal, save, start, step, storageKey, titles, undo } from './engine';

export default function Laboratory() {
  const [state, setState] = useState(() => start());
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [storageNotice, setStorageNotice] = useState('');
  useEffect(() => {
    try { const raw = localStorage.getItem(storageKey); if (raw) setState(restore(raw)); }
    catch { setStorageNotice('Gespeicherter Fortschritt ist nicht verfügbar. Du kannst trotzdem lernen.'); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(storageKey, save(state)); }
    catch { setStorageNotice('Dein Browser erlaubt keine Speicherung. Diese Runde bleibt nur bis zum Schließen erhalten.'); }
  }, [state, ready]);
  const game = new Chess(state.fen);
  const lesson = lessonFor(state.scene);
  const interactive = ready && (state.scene === 2 || state.scene === 3) && state.cursor !== 1 && !complete(state) && !state.counterexample;
  const legal = selected && interactive ? game.moves({ square: selected as Square, verbose: true }).map(m => m.to) : [];
  const arrows: Arrow[] = [];
  if ((state.scene === 0 && state.cursor === 1) || state.scene === 1 || (state.cursor === 1 && !state.counterexample))
    for (const to of lesson.targets) arrows.push({ from: lesson.landing, to, kind: 'attack' });
  if (state.hint >= 4 && state.cursor !== 1 && state.cursor < 3 && !state.counterexample) {
    const uci = lesson.line[state.cursor]; arrows.push({ from: uci.slice(0, 2), to: uci.slice(2, 4), kind: 'move' });
  }
  const marks = [...state.targets];
  if (state.hint >= 2 && state.cursor === 0 && !state.counterexample) marks.push(...lesson.targets);
  if (state.hint >= 3 && state.cursor === 0 && !state.counterexample) marks.push(lesson.attacker);
  function squareClick(square: string) {
    if (!ready) return;
    if (state.scene === 1) { setState(s => chooseTarget(s, square)); return; }
    if (!interactive) return;
    const piece = game.get(square as Square);
    if (piece?.color === 'w') { setSelected(square === selected ? null : square); return; }
    if (selected) { setState(s => attempt(s, selected, square)); setSelected(null); }
  }
  const hints = ['', 'Suche einen Zug, der König und Dame gleichzeitig angreift.', 'Die beiden Ziele sind eingerahmt.',
    'Der Springer ist die passende Figur.', 'Der durchgezogene Pfeil zeigt den gesuchten Zug.', 'Du kannst dir die Züge einzeln vormachen lassen.'];
  return <main>
    <header className="top"><a href="/" className="brand">Schachlabor<span>Lernen durch Züge</span></a><span className="badge">Prototyp · ohne Konto</span></header>
    <section className="intro"><p className="eyebrow">Lernpfad 01 · Doppelangriff</p><h1>Ein Zug. Zwei Ziele.</h1><p>Entdecke die Gabel. Probiere aus. Hilfe ist jederzeit erlaubt.</p></section>
    <ol className="steps" aria-label="Lektionsfortschritt">{titles.map((title, i) => <li key={title} className={i === state.scene ? 'current' : i < state.scene ? 'past' : ''} aria-current={i === state.scene ? 'step' : undefined}><span>{i + 1}</span>{title}</li>)}</ol>
    <section className="workspace" aria-label="Interaktive Lektion">
      <div className="board-area"><Board fen={state.fen} selected={selected} marks={marks} legal={legal} arrows={arrows} onSquare={squareClick} /><p className="legend">Figur antippen → Zielfeld antippen · Pfeiltasten und Enter funktionieren ebenfalls.</p></div>
      <aside className="panel"><p className="eyebrow">{titles[state.scene]}</p><h2>{state.scene === 4 ? 'Motiv entdeckt' : state.scene === 1 ? 'Wen greift der Springer an?' : 'Die Springergabel'}</h2>
        <p className="feedback" role="status" aria-live="polite">{state.message}</p>
        {state.scene === 0 && !complete(state) && <button className="primary" disabled={!ready} onClick={() => setState(s => step(s))}>Nächsten Zug zeigen</button>}
        {state.cursor === 1 && state.scene >= 2 && state.scene <= 3 && !state.counterexample && <button className="primary" onClick={() => setState(s => step(s))}>Antwort von Schwarz zeigen</button>}
        {(state.scene === 2 || state.scene === 3) && !complete(state) && <div className="tools">
          <button disabled={state.counterexample || state.hint === 5} onClick={() => { setSelected(null); setState(s => reveal(s)); }}>Hilfe {state.hint}/5</button>
          <button onClick={() => { setSelected(null); setState(s => undo(s)); }}>Zurücknehmen</button>
        </div>}
        {state.hint > 0 && !complete(state) && <div className="hint"><p>{hints[state.hint]}</p>
          {state.hint === 5 && !state.counterexample && state.cursor !== 1 && <button onClick={() => { setSelected(null); setState(s => step(s, true)); }}>Diesen Zug vormachen</button>}
        </div>}
        {state.attempts >= 2 && state.hint === 0 && !complete(state) && <p className="gentle">Du kannst dir einen Hinweis holen. Hilfe ist kein Fehler.</p>}
        {complete(state) && state.scene < 4 && <button className="primary" disabled={!ready} onClick={() => { setSelected(null); setState(s => next(s)); }}>Weiter</button>}
        {state.scene === 4 && <><ul className="results">{state.results.map(r => <li key={r.id}>{r.id.includes('transfer') ? 'Neue Stellung' : 'Erste Stellung'}<span>{r.assisted ? 'Mit Unterstützung gelöst' : 'Ohne Lösungshilfe gelöst'}</span></li>)}</ul><p>Das ist ein erster Schritt, noch kein Nachweis dauerhafter Beherrschung. Weitere Motive folgen.</p></>}
        <details><summary>Was bedeutet die Markierung?</summary><p>Gestrichelte rote Pfeile zeigen Angriffe. Durchgezogene blaue Pfeile zeigen einen Zug. Rahmen kennzeichnen wichtige Figuren. Punkte zeigen erlaubte Zielfelder einer ausgewählten Figur.</p></details>
      </aside>
    </section>
    <footer><p>Fortschritt wird nur in diesem Browser gespeichert. Keine Übertragung an einen Schüler-Server.</p>{storageNotice && <p role="status">{storageNotice}</p>}<button onClick={() => { if (window.confirm('Diese Lernrunde und ihren lokalen Fortschritt zurücksetzen?')) { setSelected(null); setState(start()); } }}>Lernrunde zurücksetzen</button></footer>
  </main>;
}
