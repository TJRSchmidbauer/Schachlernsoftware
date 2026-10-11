# Pilot mit 5–8 Lernenden

Ziel: herausfinden, ob die Hilfestufen verstanden werden, ob Lernende das Motiv in neuen Stellungen wiedererkennen und wo die Bedienung stockt. Es geht nicht um Bewertung der Kinder, sondern der Software.

## Voraussetzungen (vor dem ersten Termin)
- [ ] Next.js-Sicherheitsupdate geprüft und eingespielt (`docs/QUALITY.md`), CI grün.
- [ ] Zugang geklärt: Schulnetz-Rechner oder Tablets, Domain/Tunnel eingerichtet. Kein Zugriff aus dem offenen Internet nötig; ein Zugang nur im Schulnetz oder per Tunnel genügt.
- [ ] Schachdidaktische Durchsicht der Inhalte (zwei Gabel-, zwei Fesselungsstellungen) durch eine Trainerin oder einen Trainer.
- [ ] Einwilligung/Information nach Vorgabe der Schule. Die App speichert nur lokal; beobachtet wird per Notiz, nicht per Aufnahme.
- [ ] Kürzel für Lernende vorab verteilt (z. B. Tiername plus Zahl). Keine Klarnamen in der App oder in Exportcodes.
- [ ] Geräte getestet: Touch, Tastatur, Bildschirmgröße, Kontrast bei Raumlicht.

## Ablauf je Sitzung (ca. 30 Minuten)
1. Kurzer Einstieg (2 Min.): „Wir testen das Programm, nicht dich. Hilfe nutzen ist erlaubt.“
2. Gabel-Pfad selbstständig durcharbeiten (10–12 Min.). Beobachtende greifen nur ein, wenn jemand 2 Min. nicht weiterkommt.
3. Fesselungs-Pfad (10–12 Min.).
4. Kurzes Gespräch (5 Min.) mit den Fragen unten.
5. Lernende erzeugen ihren Export-Code; Lehrkraft sammelt Codes auf `/lehrkraft/`.
6. Nach 1 und 3 Tagen: ein Motiv wiederholen lassen (Wiederholungsregel prüfen).

## Beobachtungsbogen (eine Zeile je Lernende:r)
| Kürzel | Gerät | Alter/Klasse | Vorwissen (0–3) | Szene mit Stocken | Hilfestufe max. | Hilfe sinnvoll genutzt? | Fehlzug verstanden? | Ohne Pfeile erkannt? | Auffälliges |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

Vorwissen: 0 keine Regeln, 1 Figuren ziehen, 2 spielt gelegentlich, 3 Vereinsspiel.

## Fragen im Gespräch
1. Was hat der Springer (der Läufer, der Turm) in der Aufgabe gemacht? Erkläre es mit eigenen Worten.
2. Wofür waren die Hilfen? Welche war am nützlichsten, welche unklar?
3. Was passierte beim falschen Zug? Warum war er schlecht?
4. Würdest du das Motiv in einer richtigen Partie erkennen? Zeige eine Stellung auf dem echten Brett.
5. Was war langweilig, zu schwer oder verwirrend?

## Transferprobe (ohne Software)
Auf einem echten Brett 2 neue Stellungen je Motiv vorlegen, die nicht in der App vorkommen. Notiert wird: erkannt ja/nein, Zug gefunden ja/nein, Begründung in eigenen Worten ja/nein. Das ist der eigentliche Lernnachweis; Ergebnisse in der App allein sind keiner.

## Auswertung
Erfolgskriterien für eine Weiterentwicklung (Vorschläge, gemeinsam anpassen):
- Mindestens 2/3 der Lernenden lösen ohne Beobachter-Eingriff beide Pfade.
- Mindestens die Hälfte nutzt Hilfestufen gezielt und nennt eine hilfreiche.
- Mindestens die Hälfte besteht die Transferprobe in mindestens einem Motiv.
- Kein Gerät mit nicht bedienbarem Brett oder unlesbarem Kontrast.

Befunde als Issues festhalten (Etikett `pilot`), geordnet nach: blockiert Lernen · verwirrt · stört · Wunsch. Danach entscheiden: Inhalte anpassen (Phase C), Bedienung anpassen (Phase B) oder Plattformbedarf (Phase E) prüfen.

## Grenzen
Fünf bis acht Lernende belegen keine Wirksamkeit. Der Pilot zeigt Verständlichkeit und Bedienprobleme, keine Lernergebnisse über längere Zeit.
