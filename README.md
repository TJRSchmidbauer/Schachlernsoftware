# Schachlernsoftware – Schachlabor

Erster visueller Lernprototyp für Schule und AG, noch keine fertige Plattform.

## Funktionen
- Deutsche Oberfläche und eigene SVG-Figuren.
- Entdecken → Ziele erkennen → selbst ziehen → neue Stellung → Auswertung.
- Fünf Hilfestufen, Rücknahme, schrittweises Vormachen.
- Zwei Gabel-Stellungen und je eine kuratierte Fehlzugfolge.
- Klick, Touch und Tastatur; Fortschritt nur im lokalen Browser.
- Getrennte Ergebnisse mit/ohne Lösungshilfe; keine Rangliste und kein Zeitdruck.

## Start (Node.js 22)
```sh
npm install
npm run test
npm run typecheck
npm run dev
```
http://127.0.0.1:3000 öffnen. Installation erzeugt eine Lockdatei, die nach erfolgreicher Prüfung separat aufgenommen werden soll. Installation, Tests, Typecheck und Build wurden in der Erstellungsumgebung nicht ausgeführt.

## Docker
```sh
docker compose up --build -d
```
http://127.0.0.1:3080 öffnen. Build führt Tests, Typecheck und statischen Export aus. Laufzeit: statische Dateien, kein Next.js-Server. Port absichtlich nur lokal; auf einem entfernten Server SSH-Tunnel nutzen. Traefik-Freigabe ist nicht eingerichtet.

## Sicherheitsstatus: nur Prototyp
Stand 10.10.2026 kündigt Next.js für den 14.10.2026 ein Sicherheitsupdate wegen zwei Critical- und einer High-Schwachstelle in upstream-Abhängigkeiten an. Vor öffentlicher Bereitstellung Advisory, Betroffenheit, gepatchte Versionen und Abhängigkeiten erneut prüfen: https://nextjs.org/blog

## Grenzen und Daten
Kein Login, Backend, Dashboard oder KI-Trainer. Zwei Stellungen belegen keine dauerhafte Beherrschung. Lokaler Fortschritt ist veränderbar. Geteilte Geräte: Lernrunde zurücksetzen. Keine personenbezogenen Daten eingeben. Kein Lernfortschritt wird an einen Server gesendet; Webserver können Zugriffe protokollieren. Roadmap: `docs/ROADMAP.md`.

## Architektur und Lizenz
`src/lessons.ts`: Inhalte; `src/engine.ts`: Zustandslogik; `src/Board.tsx`: Brett; `src/Laboratory.tsx`: Oberfläche; `src/engine.test.ts`: Tests.
Eigene Grafiken und Inhalte, noch keine Projektlizenz gewählt. Abhängigkeiten behalten ihre eigenen Lizenzen. Keine Chessground-Dateien oder Lichess-Aufgaben enthalten.
