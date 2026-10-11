'use client';
import { useState } from 'react';
import { decodeExport, type Export } from './exchange';
import { describe, localDay, statusFor, type Status } from './progress';
import { lessons, paths } from './lessons';

type Row = { line: number; data?: Export; error?: string };
const cell = (data: Export, pathId: string, today: string): Status =>
  statusFor(data.history, lessons.filter(l => l.path === pathId).map(l => l.id), today);
const csvEscape = (value: string) => `"${value.replace(/"/g, '""').replace(/^[=+\-@]/, "'$&")}"`;

export default function Teacher() {
  const [text, setText] = useState('');
  const today = localDay();
  const rows: Row[] = text.split('\n').map((raw, i) => ({ raw, line: i + 1 })).filter(r => r.raw.trim()).map(({ raw, line }) => {
    try { return { line, data: decodeExport(raw) }; } catch (e) { return { line, error: (e as Error).message }; }
  });
  const valid = rows.filter(r => r.data);
  function download() {
    const header = ['Kürzel', 'Stand', ...paths.flatMap(p => [`${p.title}: Tage ohne Hilfe`, `${p.title}: Wiederholung`])];
    const lines = valid.map(r => [r.data!.label, r.data!.day, ...paths.flatMap(p => {
      const st = cell(r.data!, p.id, today);
      return [String(st.days), st.nextDue ?? ''];
    })].map(csvEscape).join(';'));
    const url = URL.createObjectURL(new Blob(['﻿' + [header.map(csvEscape).join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'schachlabor-uebersicht.csv'; a.click();
    URL.revokeObjectURL(url);
  }
  return <main>
    <header className="top"><a href="/" className="brand">Schachlabor<span>Übersicht für Lehrkräfte</span></a><span className="badge">Nur in diesem Browser</span></header>
    <section className="intro"><p className="eyebrow">Ohne Konto · ohne Server</p><h1>Lernstände sammeln</h1>
      <p>Lernende erzeugen unten auf der Lernseite einen Code mit einem Kürzel. Fügen Sie die Codes hier ein, einen pro Zeile. Es wird nichts hochgeladen.</p></section>
    <section className="panel">
      <label htmlFor="codes"><strong>Codes</strong></label>
      <textarea id="codes" rows={6} value={text} onChange={e => setText(e.target.value)} spellCheck={false}
        placeholder="SL1.…" className="codes" />
      <p className="gentle">Die Codes sind nicht fälschungssicher und zeigen nur, was in diesem Browser gespeichert war. Sie sind kein Leistungsnachweis. Bitte keine Klarnamen verwenden.</p>
      {rows.filter(r => r.error).map(r => <p key={r.line} role="alert" className="gentle">Zeile {r.line}: {r.error}</p>)}
      {valid.length > 0 && <>
        <div className="table-wrap"><table>
          <caption>Stand am {localDay()}</caption>
          <thead><tr><th scope="col">Kürzel</th>{paths.map(p => <th scope="col" key={p.id}>{p.title}</th>)}</tr></thead>
          <tbody>{valid.map(r => <tr key={r.line}><th scope="row">{r.data!.label}<span>Stand {r.data!.day}</span></th>
            {paths.map(p => <td key={p.id}>{describe(cell(r.data!, p.id, today))}</td>)}</tr>)}</tbody>
        </table></div>
        <button onClick={download}>Als CSV speichern</button>
      </>}
    </section>
    <footer><p>Die Auswertung geschieht ausschließlich im Browser. <a href="/">Zurück zum Schachlabor</a></p></footer>
  </main>;
}
