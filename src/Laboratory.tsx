'use client';
import { useEffect, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { lessons, scenes } from './lessons';
const lessonById = (id: string) => lessons.find(l => l.id === id)!;
import Board, { type Arrow } from './Board';
import { attempt, chooseTarget, playReply, complete, isSolve, kindOf, lessonFor, next, restore, nextPath, hasNextPath, pathOf, reveal, save, sceneIndexes, start, step, storageKey, undo } from './engine';

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
  useEffect(() => {
    if (!state.pending) return;
    const timer = setTimeout(() => setState(s => playReply(s)), 1400);
    return () => clearTimeout(timer);
  }, [state.pending]);
  const game = new Chess(state.fen);
  const lesson = lessonFor(state.scene);
  const interactive = ready && isSolve(state.scene) && state.cursor !== 1 && !complete(state) && !state.counterexample;
  const legal = selected && interactive ? game.moves({ square: selected as Square, verbose: true }).map(m => m.to) : [];
  const arrows: Arrow[] = [];
  if ((kindOf(state.scene) === 'watch' && state.cursor === 1) || (kindOf(state.scene) === 'identify' && scenes[state.scene].aided !== false) || (state.cursor === 1 && !state.counterexample))
    for (const to of lesson.targets) arrows.push({ from: lesson.landing, to, kind: 'attack' });
  if (state.hint >= 4 && state.cursor !== 1 && state.cursor < 3 && !state.counterexample) {
    const uci = lesson.line[state.cursor]; arrows.push({ from: uci.slice(0, 2), to: uci.slice(2, 4), kind: 'move' });
  }
  const marks = [...state.targets];
  if (state.hint >= 2 && state.cursor === 0 && !state.counterexample) marks.push(...lesson.targets);
  if (state.hint >= 3 && state.cursor === 0 && !state.counterexample) marks.push(lesson.attacker);
  function squareClick(square: string) {
    if (!ready) return;
    if (kindOf(state.scene) === 'identify') { setState(s => chooseTarget(s, square)); return; }
    if (!interactive) return;
    const piece = game.get(square as Square);
    if (piece?.color === 'w') { setSelected(square === selected ? null : square); return; }
    if (selected) { setState(s => attempt(s, selected, square)); setSelected(null); }
  }
  const hints = ['', ...lesson.texts.hints];
  const path = pathOf(state.scene);
  const stepIndexes = sceneIndexes(state.scene);
  return <main>
    <header className="top"><a href="/" className="brand">Schachlabor<span>Lernen durch Züge</span></a><span className="badge">Prototyp · ohne Konto</span></header>
    <section className="intro"><p className="eyebrow">{path.eyebrow}</p><h1>{path.headline}</h1><p>{path.lead}</p></section>
    <ol className="steps" aria-label="Lektionsfortschritt">{stepIndexes.map((index, n) => <li key={index} className={index === state.scene ? 'current' : index < state.scene ? 'past' : ''} aria-current={index === state.scene ? 'step' : undefined}><span>{n + 1}</span>{scenes[index].title}</li>)}</ol>
    <section className="workspace" aria-label="Interaktive Lektion">
      <div className="board-area"><Board fen={state.fen} selected={selected} marks={marks} legal={legal} arrows={arrows} onSquare={squareClick} /><p className="legend">Figur antippen → Zielfeld antippen · Pfeiltasten und Enter funktionieren ebenfalls.</p></div>
      <aside className="panel"><p className="eyebrow">{scenes[state.scene].title}</p><h2>{kindOf(state.scene) === 'summary' ? 'Motiv entdeckt' : kindOf(state.scene) === 'identify' ? lesson.texts.identifyHeading : lesson.texts.heading}</h2>
        <p className="feedback" role="status" aria-live="polite">{state.message}</p>
        {kindOf(state.scene) === 'watch' && !complete(state) && <button className="primary" disabled={!ready} onClick={() => setState(s => step(s))}>Nächsten Zug zeigen</button>}
        {state.cursor === 1 && isSolve(state.scene) && !state.counterexample && <button className="primary" onClick={() => setState(s => step(s))}>Antwort von Schwarz zeigen</button>}
        {isSolve(state.scene) && !complete(state) && <div className="tools">
          <button disabled={state.counterexample || state.hint === 5} onClick={() => { setSelected(null); setState(s => reveal(s)); }}>Hilfe {state.hint}/5</button>
          <button onClick={() => { setSelected(null); setState(s => undo(s)); }}>Zurücknehmen</button>
        </div>}
        {state.hint > 0 && !complete(state) && <div className="hint"><p>{hints[state.hint]}</p>
          {state.hint === 5 && !state.counterexample && state.cursor !== 1 && <button onClick={() => { setSelected(null); setState(s => step(s, true)); }}>Diesen Zug vormachen</button>}
        </div>}
        {state.attempts >= 2 && state.hint === 0 && !complete(state) && <p className="gentle">Du kannst dir einen Hinweis holen. Hilfe ist kein Fehler.</p>}
        {complete(state) && kindOf(state.scene) !== 'summary' && <button className="primary" disabled={!ready} onClick={() => { setSelected(null); setState(s => next(s)); }}>Weiter</button>}
        {kindOf(state.scene) === 'summary' && <><ul className="results">{state.results.filter(r => lessonById(r.id).path === path.id).map(r => <li key={r.id}>{r.id.includes('transfer') ? 'Neue Stellung' : 'Erste Stellung'}<span>{r.assisted ? 'Mit Unterstützung gelöst' : 'Ohne Lösungshilfe gelöst'}</span></li>)}</ul><p>Das ist ein erster Schritt, noch kein Nachweis dauerhafter Beherrschung.</p>{hasNextPath(state.scene) && <button className="primary" disabled={!ready} onClick={() => { setSelected(null); setState(s => nextPath(s)); }}>Nächstes Motiv</button>}</>}
        <details><summary>Was bedeutet die Markierung?</summary><p>Gestrichelte rote Pfeile zeigen Angriffe. Durchgezogene blaue Pfeile zeigen einen Zug. Rahmen kennzeichnen wichtige Figuren. Punkte zeigen erlaubte Zielfelder einer ausgewählten Figur.</p></details>
      </aside>
    </section>
    <footer><p>Fortschritt wird nur in diesem Browser gespeichert. Keine Übertragung an einen Schüler-Server.</p>{storageNotice && <p role="status">{storageNotice}</p>}<button onClick={() => { if (window.confirm('Diese Lernrunde und ihren lokalen Fortschritt zurücksetzen?')) { setSelected(null); setState(start()); } }}>Lernrunde zurücksetzen</button></footer>
  </main>;
}
