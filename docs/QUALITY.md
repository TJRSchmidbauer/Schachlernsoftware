# Technischer Qualitätsmeilenstein

## Automatisierte Prüfung
Die Pipeline `.github/workflows/quality.yml` läuft bei Änderungen auf main, Pull Requests auf main und manuell über Actions. Sie installiert Node.js 22 und führt Installation, Vitest, TypeScript-Prüfung, statischen Produktionsbuild und npm-Sicherheitsprüfung aus. Alle verwendeten GitHub-Actions sind auf feste Commit-SHAs aufgelöst. Der Repository-Token hat nur Leserechte; Checkout speichert keine Git-Credentials.

Es erfolgen kein Deployment, kein Paket-Publishing, kein automatischer Code-Commit und keine Änderungen an deinem Server. Läufe benötigen GitHub-Actions-Kontingent; je nach Account, Budget und Nutzung können Kosten entstehen. Zeitlimit: 15 Minuten, Artefaktaufbewahrung: 7 Tage. Bei schnellen Folge-Commits wird der ältere Lauf abgebrochen.

## Lockdatei-Bootstrap
Fehlt `package-lock.json`, erzeugt der Runner einmal pro Lauf zunächst eine Lockdatei und installiert anschließend mit `npm ci`. Die Datei wird im Prüfartefakt bereitgestellt, nicht automatisch committed. Bis sie separat geprüft und aufgenommen ist, sind verschiedene Bootstrap-Läufe nicht vollständig reproduzierbar. Eine vorhandene Lockdatei wird bei der Installation nicht aktualisiert; Abweichungen zu package.json führen zum Fehler.

## Ergebnisse
Im GitHub-Reiter Actions den Lauf `Quality checks` öffnen. Dort erscheinen die Schritte und Artefakte:
- `quality-reports-<run-id>`: Installations-, Test-, TypeScript- und Buildlogs, JUnit-Ergebnis, npm-Audit und Lockdatei, soweit erzeugt.
- `prototype-static-build-<run-id>`: exportierte Webseite, nur bei erfolgreichem Build. Ein Buildartefakt kann auch bei fehlgeschlagenen Tests oder Sicherheitsprüfung vorhanden sein und ist keine Produktionsfreigabe.

Fehlgeschlagene Tests oder TypeScript-Prüfungen werden nicht verdeckt. Nachfolgende Prüfungen laufen unabhängig weiter, solange Installation erfolgreich und der Lauf nicht abgebrochen ist. Die Security-Prüfung bewertet den Produktions-Abhängigkeitsgraphen; High/Critical-Befunde oder Auditfehler lassen den Lauf scheitern. Bekannte Risiken werden nicht automatisch repariert. Ein erfolgreicher Audit beweist weder vollständige Sicherheit noch die Abwesenheit bisher unbekannter Schwachstellen.

## Noch offene Abnahme
- Ersten tatsächlichen Lauf auswerten; noch kein grüner Test-/Buildnachweis.
- Erzeugte Lockdatei prüfen und separat committen; anschließend Docker auf `npm ci` umstellen.
- Chromium-/Touch-/Tastaturtests, Reload, Storage-Ausfall und Hilfeverhalten ergänzen.
- Darstellung, Kontraste und didaktische Verständlichkeit auf Schulgeräten testen.
- Aktuelle Framework-Advisories prüfen, nötige Patches einspielen und erneut testen.
- Erst danach öffentliche Traefik-Freigabe abstimmen.

Die in README und Roadmap beschriebene Anwendung bleibt ein Prototyp ohne Schülerkonten, Datenbank und Lehrkraft-Dashboard.
