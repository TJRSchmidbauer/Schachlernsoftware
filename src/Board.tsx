'use client';
import { useId, useRef } from 'react';
import { Chess, type Square, type PieceSymbol } from 'chess.js';

const names: Record<PieceSymbol, string> = { k: 'König', q: 'Dame', r: 'Turm', b: 'Läufer', n: 'Springer', p: 'Bauer' };
function Piece({ type, white }: { type: PieceSymbol; white: boolean }) {
  const paths: Record<PieceSymbol, string> = {
    p: 'M18 38L20 32Q24 27 22 22A7 7 0 1 1 34 22Q32 27 36 32L38 38Z',
    r: 'M17 38L20 21H16V10H23V15H26V10H31V15H34V10H41V21H37L40 38Z',
    n: 'M16 38L19 29L29 21L21 22L15 18L22 9L30 6L31 11Q44 15 41 38ZM22 9L20 5L27 7',
    b: 'M18 38L22 28Q16 22 22 15L28 7L34 15Q40 22 34 28L38 38ZM28 12L24 21',
    q: 'M17 38L14 17L23 23L28 12L33 23L42 17L39 38Z',
    k: 'M19 38L21 28Q14 16 22 16Q26 16 28 21Q30 16 34 16Q42 16 35 28L37 38ZM28 5V15M23 10H33',
  };
  return <svg viewBox="0 0 56 48" className="piece" aria-hidden="true">
    <g fill={white ? '#fffaf0' : '#263745'} stroke={white ? '#263745' : '#fffaf0'} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d={paths[type]} />
      {type === 'n' && <circle cx="29" cy="15" r="1.3" fill="#263745" stroke="none" />}
      {type === 'q' && <><circle cx="14" cy="14" r="2" /><circle cx="28" cy="9" r="2" /><circle cx="42" cy="14" r="2" /></>}
      <path d="M15 39H41V43H15Z" />
    </g>
  </svg>;
}
const squares = Array.from({ length: 64 }, (_, i) => `${'abcdefgh'[i % 8]}${8 - Math.floor(i / 8)}` as Square);
function center(square: string) { return [square.charCodeAt(0) - 97 + .5, 8 - Number(square[1]) + .5]; }
export type Arrow = { from: string; to: string; kind: 'attack' | 'move' };
export default function Board({ fen, selected, marks, legal, arrows, onSquare }: {
  fen: string; selected: string | null; marks: string[]; legal: string[];
  arrows: Arrow[]; onSquare: (square: string) => void;
}) {
  const game = new Chess(fen);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId().replace(/:/g, '');
  return <div className="board" role="group" aria-label="Schachbrett, Weiß unten. Figur und danach Zielfeld wählen.">
    {squares.map((square, i) => {
      const piece = game.get(square);
      const marked = marks.includes(square);
      return <button key={square} ref={node => { refs.current[i] = node; }}
        className={`square ${(Math.floor(i / 8) + i % 8) % 2 ? 'dark' : 'light'} ${selected === square ? 'selected' : ''} ${marked ? 'marked' : ''}`}
        aria-label={`${square}: ${piece ? `${piece.color === 'w' ? 'weißer' : 'schwarzer'} ${names[piece.type]}` : 'leer'}${legal.includes(square) ? ', erlaubtes Zielfeld' : ''}`}
        aria-pressed={selected === square || marked} onClick={() => onSquare(square)}
        onKeyDown={event => {
          const delta: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 };
          if (event.key in delta) {
            event.preventDefault();
            refs.current[Math.max(0, Math.min(63, i + delta[event.key]))]?.focus();
          }
        }}>
        {piece && <Piece type={piece.type} white={piece.color === 'w'} />}
        {legal.includes(square) && <span className="dot" />}
        {marked && <span className="target-ring" />}
        <span className="coordinate">{square}</span>
      </button>;
    })}
    <svg className="arrows" viewBox="0 0 8 8" aria-hidden="true">
      <defs>{(['attack', 'move'] as const).map(kind => <marker key={kind} id={`${id}-${kind}`} markerWidth="3" markerHeight="3" refX="2" refY="1.5" orient="auto"><path d="M0 0L3 1.5L0 3Z" fill={kind === 'attack' ? '#b44838' : '#166a74'} /></marker>)}</defs>
      {arrows.map((arrow, i) => {
        const [x1, y1] = center(arrow.from); const [x2, y2] = center(arrow.to);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={arrow.kind === 'attack' ? '#b44838' : '#166a74'} strokeWidth=".075"
          strokeDasharray={arrow.kind === 'attack' ? '.12 .08' : undefined}
          markerEnd={`url(#${id}-${arrow.kind})`} />;
      })}
    </svg>
  </div>;
}
