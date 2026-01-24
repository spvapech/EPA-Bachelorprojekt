# PowerPoint-Folien: TimelineCard Komponente

## FOLIE 1: Übersicht

**Titel: TimelineCard - Zeitbasierte Bewertungsanalyse**

**Hauptpunkte:**
• Visualisierung von Bewertungsdaten über die Zeit
• Interaktives Liniendiagramm für Mitarbeiter- und Bewerberbewertungen
• Drei Metriken: Ø Score, Trend, Anzahl
• 6-Monats-Prognose für zukünftige Entwicklungen
• Filterbare Ansichten nach Zeitraum und Datenquelle
• React-Komponente mit Recharts-Bibliothek

---

## FOLIE 2: Metriken & Datenquellen

**Titel: Flexible Analyse-Optionen**

**Drei Metriken:**
• **Ø Score** (0-5 Skala)
  → Historische Entwicklung + 6-Monats-Prognose
  → Orange gestrichelte Linie für Vorhersage

• **Trend** (Monat-zu-Monat Veränderung)
  → Delta-Berechnung zwischen Monaten
  → Positive/negative Trends farblich markiert
  → Referenzlinie bei y=0

• **Anzahl** (Bewertungen pro Zeitraum)
  → Zeigt Datenvolumen über Zeit
  → Keine Prognose verfügbar

**Datenquellen & Zeitgranularität:**
• Mitarbeiter ↔ Bewerber (Toggle-Button)
• Gesamter Zeitraum (bis 10 Jahre) oder einzelnes Jahr

---

## FOLIE 3: Interaktive Features

**Titel: Benutzerfreundliche Bedienung**

**Filter & Navigation:**
• Metrik-Auswahl (Ø Score, Trend, Anzahl)
• Granularität (Gesamtzeitraum / Jahr)
• Jahr-Auswahl bei Jahresansicht
• Datenquellen-Toggle (Mitarbeiter/Bewerber)

**Visualisierung:**
• Blaue Linie = Historische Daten
• Orange gestrichelte Linie = Prognose
• Grüne Linie = Trend-Modus
• Gestrichelte Trennlinie zwischen Historie & Prognose

**Interaktion:**
• Tooltips mit detaillierten Werten beim Hover
• Modal-Ansicht: Klick öffnet Vollbild-Dialog
• Zusammenfassungsstatistiken (Durchschnitt, Max/Min)

---

## FOLIE 4: Technische Umsetzung

**Titel: Implementierung & Prognose**

**Backend-Integration:**
• API: `/analytics/company/{companyId}/timeline`
• Parameter: `days`, `forecast_months`, `source`
• Automatische Datenaktualisierung bei Filteränderungen

**Prognosefunktion:**
• 6-Monats-Vorhersage für Ø Score & Trend
• Lineare Extrapolation basierend auf historischen Daten
• Bridge-Point verbindet Historie & Prognose nahtlos

**Technische Features:**
• Performance-Optimierung durch `useMemo`
• Automatische Y-Achsen-Skalierung je Metrik
• Wiederverwendbare Sub-Komponenten
• Error Handling & Loading States
• Responsive Design

