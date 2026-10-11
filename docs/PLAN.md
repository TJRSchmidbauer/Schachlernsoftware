# Programmierplan Schachlabor (Stand 11.10.2026)

Dieser Plan ersetzt die grobe Roadmap nicht, sondern macht sie umsetzbar: Arbeitspakete (AP) mit Ergebnis, Abnahmekriterium und **Entscheidungsfreiheit** – was ich selbstständig entscheide (🟢), was ich vorschlage und du bestätigst (🟡) und was ausdrücklich bei dir liegt (🔴).

## Ausgangslage (verifiziert am 11.10.2026)
- `npm install` scheitert mit npm 10.9 an einem Peer-Dependency-Fehler (`edgesOut`, ausgelöst durch optionale vitest-Peers). Lösung: `.npmrc` mit `legacy-peer-deps=true`.
- Mit dieser Einstellung: 13/13 Tests grün, `tsc --noEmit` sauber, statischer Build erfolgreich, `npm audit --omit=dev`: 0 Schwachstellen.
- `package-lock.json` liegt nun vor; Dockerfile nutzt `npm ci`.
- Codebasis: ~360 Zeilen, eine Lektion (Gabel), zwei Stellungen, Szenenautomat in `src/engine.ts`.

## Entscheidungsrahmen
| Stufe | Bedeutung |
|---|---|
| 🟢 Ich entscheide | Technische Details, Benennungen, Teststruktur, Refactorings innerhalb der Architektur |
| 🟡 Vorschlag, Veto möglich | Ich setze die Empfehlung um, sofern du nicht widersprichst; Alternativen stehen dabei |
| 🔴 Deine Entscheidung | Lizenz, Datenschutz/Hosting, öffentliche Freigabe, schachdidaktische Leitlinien, Budget |

---

## Phase A – Fundament festigen (0.2a, ca. 1–2 Tage)
**Status 11.10.2026:** A1 ✅ (CI grün auf main) · A3 ✅ (`scenes` in `lessons.ts`, Engine ohne Magic Numbers) · A4 ✅ (Speicherformat mit `version`, alte Daten ohne Version werden weiter gelesen, unbekannte Versionen abgelehnt; 17 Tests) · A2 ⏳ (Next.js 16.4.0 ist noch `latest`, Update erst ab 14.10. erwartet).

**AP A1 – Toolchain & CI grün** *(erledigt bis auf CI-Lauf)*: Lockdatei, `.npmrc`, Dockerfile mit `npm ci`. Abnahme: GitHub-Action „Quality checks“ grün.
- 🟢 Ob `legacy-peer-deps` später durch ein Vitest-Update überflüssig wird.

**AP A2 – Next.js-Security-Update 14.10.2026**: Advisory lesen, Betroffenheit (statischer Export, kein Server!) bewerten, patchen, Tests/Build wiederholen.
- 🟢 Patch-Version einspielen. 🔴 Freigabe „öffentlich“ erst danach.

**AP A3 – Engine entflechten**: `engine.ts` nutzt Szenen-Nummern (`scene >= 3`, `scene === 1`). Vorbereitung auf mehrere Lektionen: Szenen als Datenstruktur (`{kind: 'watch'|'identify'|'solve'|'transfer'|'summary', lessonId}`) statt Magic Numbers.
- 🟡 Empfehlung: Schritte pro Lektion deklarativ in `lessons.ts`. Alternative: kleine State-Machine-Bibliothek (nicht empfohlen, Overkill).
- Abnahme: alle bestehenden Tests unverändert grün + neue Tests für beliebige Szenenfolgen.

**AP A4 – Persistenz robuster**: Storage-Schema mit Version (`v1` → Migration), Schutz vor manipulierten Daten (ist teils vorhanden), Test für Storage-Ausfall.
- 🟢 komplett.

## Phase B – Browser-Qualität (0.2b, ca. 2–3 Tage)
**Status 11.10.2026:** B1 ✅ (Playwright: Desktop + Pixel 7 Touch; Lernrunde, Hilfe, Rücknahme, Reload, Zurücksetzen, gesperrter/kaputter Speicher, Tastatur; CI-Schritt) · B2 🟡 (axe WCAG A/AA ohne Befunde in zwei Szenen; manuelle Prüfung mit Screenreader und Schulgeräten offen) · B3 ✅ (neue Szene „Selbst erkennen“ ohne Pfeile vor der Transferaufgabe; Speicherformat v2 mit Migration von v1) · B4 ✅ (Antwort von Schwarz erscheint nach 1,4 s, Rücknahme bricht ab).

**AP B1 – E2E-Tests (Playwright, Chromium vorinstalliert)**: Klick, Touch-Emulation, Tastatur, Reload, Hilfestufen 1–5, Rücknahme, localStorage gesperrt.
- 🟢 Testfälle. 🟡 Playwright als devDependency (Empfehlung) statt Vitest-Browser-Mode.
**AP B2 – Barrierefreiheit**: Kontraste (WCAG AA), Fokusreihenfolge, `aria-live` für Meldungen, Brett per Tastatur, Screenreader-Beschreibung der Stellung; axe-core im E2E.
- 🟢 Umsetzung. 🔴 Anspruch: „AA geprüft“ nach außen nur nach manueller Prüfung.
**AP B3 – Wahrnehmung ohne Pfeile**: Aufgabe „Ziele erkennen“ zusätzlich ohne Angriffspfeile (Roadmap-Punkt). Neues Szenenmuster `identify-unaided`.
- 🟡 Reihenfolge: erst mit Pfeilen, dann ohne (Empfehlung); alternativ umgekehrt als Diagnose.
**AP B4 – Fehlzug als Animation**: Gegenzug zeitlich versetzt (respektiert `prefers-reduced-motion`).
- 🟢.

## Phase C – Inhalt wächst (0.3a, ca. 1–2 Wochen)
**Status 11.10.2026:** C1 ✅ (Lektion enthält alle Texte; Motive als `paths`/`scenes` in `lessons.ts`; Inhaltsprüfung für jede Lektion: legale Züge, Zielfiguren, Fehlzug kostet Material, Durchspielen über die Engine) · C2 🟡 (Fesselung mit 2 Stellungen: Läufer fesselt Springer an König; Test prüft, dass Weiß auf **jede** legale Antwort von Schwarz mindestens einen Springer gewinnt. 🔴 Schachdidaktische Prüfung offen: zweite Stellung ist bisher eine Spiegelung der ersten und sollte durch eine strukturell andere ersetzt werden, z. B. Turmfesselung auf einer Linie.) · C3, C4 offen.

**AP C1 – Allgemeines Lektionsformat**: `Lesson` → Typ mit Motiv, Stellungen, kuratierten Fehlzügen, Hilfetexten; JSON-Validierung per Test (jede Linie legal, Ziele korrekt, Gegenbeispiel wirklich schlecht → mit chess.js geprüft).
- 🟢 Format. 
**AP C2 – Weitere Motive**: Reihenfolge-Vorschlag 🟡: Fesselung → Spieß → Abzug → Mattmuster in 1 → Grundlinienmatt. Je Motiv 4–6 Stellungen (Entdecken, Erkennen, Lösen, 2× Transfer, Gegenbeispiel).
- 🔴 Schachdidaktische Prüfung der Inhalte (du oder Trainer:in) vor Pilot; ich liefere Entwürfe und automatische Korrektheitstests.
**AP C3 – Lernpfad & Wiederholung**: einfache Regel statt KI: Motiv gilt als „gefestigt“, wenn zwei Transferaufgaben ohne Hilfe an unterschiedlichen Tagen gelöst wurden; Wiederholungsintervalle (1/3/7 Tage) lokal gespeichert.
- 🟡 Schwellen sind Vorschläge; 🔴 Aussage „Beherrschung“ nur als „bisher ohne Hilfe gelöst“ formulieren.
**AP C4 – Lehrkraft-Export ohne Backend**: Fortschritt als Textcode/Datei exportieren, Lehrkraft importiert mehrere in eine Übersichtsseite (rein clientseitig).
- 🟡 Zwischenlösung vor echter Plattform; vermeidet Datenschutzaufwand.

## Phase D – Pilot (0.2c, parallel zu C)
- 🔴 Hosting-Entscheidung (Traefik-Freigabe, Domain), Impressum/Datenschutzhinweis.
- 🔴 Pilot mit 5–8 Lernenden: Beobachtungsbogen (ich erstelle Vorlage in `docs/PILOT.md`), Fragen: Verstehen sie die Hilfestufen? Transfer ohne Pfeile?
- 🟢 Auswertung in Verbesserungs-Backlog.

## Phase E – Plattform (0.3b, erst nach Pilot)
Zufällige Schülercodes statt Namen, Lehrkraftkonten, SQLite + Backup/Löschung, Dashboard mit getrennten Erfolgsarten (mit/ohne Hilfe), Rate-Limits, Inhaltsversionen.
- 🔴 Grundsatzentscheidung: **Statisch bleiben (Variante C4 ausbauen)** oder **Backend (Next-Server/Fastify + SQLite)**. Empfehlung: erst Backend, wenn Pilot echten Bedarf an Lehrkraft-Dashboard zeigt.
- 🔴 Datenschutz (Schulträger, DSGVO, Auftragsverarbeitung).

## Phase F – Ausbau (0.4)
Lichess-CC0-Importer (Puzzle-DB, mit erstem Gegnerzug), Stockfish nur offline in der Inhaltsprüfung, Inhaltseditor, kein Live-KI-Coach.
- 🔴 Lizenz des Projekts (MIT/AGPL/CC-BY-SA für Inhalte) vor dem ersten externen Beitrag.

---

## Empfohlene nächste Schritte (Reihenfolge)
1. Dieses Paket mergen, CI-Lauf prüfen (A1).
2. A2 nach Veröffentlichung des Next.js-Updates (14.10.).
3. A3 + A4, dann B1/B2.
4. Parallel: du entscheidest 🔴 **Lizenz**, **Hosting**, **erstes Zusatzmotiv**.

## Offene Fragen an dich
1. Zielgruppe/Alter der Lernenden (steuert Sprache und Aufgabenumfang)?
2. Welches zweite Motiv zuerst – Fesselung (Empfehlung) oder Matt in 1?
3. Soll es dauerhaft ohne Server laufen (statisch) oder ist ein Lehrkraft-Dashboard fix geplant?
4. Wer prüft die Inhalte schachlich?
