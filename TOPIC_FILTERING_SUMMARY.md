# Topic-Filterung Update - Kurzübersicht

**Datum:** 1. Februar 2026  
**Version:** 2.0

## Was wurde geändert?

### 🎯 Hauptfeatures

1. **Separate Topics für Bewerber und Mitarbeiter**
   - Mitarbeiter: 13 arbeitsspezifische Topics
   - Bewerber: 10 bewerbungsspezifische Topics
   - Intelligente Kombination bei "Alle"

2. **Verbesserte UI-Filterung**
   - Filter-Buttons in Hauptkarte
   - Flüssiger Wechsel ohne Modal-Neustart
   - Konsistente Filter-Position

3. **Neu trainierte LDA-Modelle**
   - Kombiniertes Modell mit 2000 Dokumenten
   - Modell: `lda_model_20260201_143902`

## 📊 Topics im Detail

### Mitarbeiter (13 Topics)
1. Work-Life Balance
2. Vorgesetztenverhalten  
3. Gehalt & Sozialleistungen
4. Kollegenzusammenhalt
5. Karriere & Weiterbildung
6. Kommunikation
7. Arbeitsbedingungen
8. Arbeitsatmosphäre
9. Image
10. Interessante Aufgaben
11. Umwelt- & Sozialbewusstsein
12. Umgang mit älteren Kollegen
13. Gleichberechtigung

### Bewerber (10 Topics)
1. Erklärung der weiteren Schritte
2. Zufriedenstellende Reaktion
3. Vollständigkeit der Infos
4. Zufriedenstellende Antworten
5. Angenehme Atmosphäre
6. Professionalität des Gesprächs
7. Wertschätzende Behandlung
8. Erwartbarkeit des Prozesses
9. Zeitgerechte Zu- oder Absage
10. Schnelle Antwort

## 🔧 Technische Änderungen

### Backend
- **Datei:** `backend/routes/analytics.py`
- Separate Topic-Definitionen mit spezifischen Keywords
- Korrekte Zuordnung zu Datenbank-Bewertungsfeldern
- Intelligente Filterung der Reviews nach Quelle

### Frontend
- **TopicOverviewCard:** Filter-Buttons + intelligentes Laden
- **TopicTableModal:** Filter beibehalten
- **TopicDetailModal:** Filter entfernt (nutzt übergeordneten Filter)

## 📖 API-Verwendung

```bash
# Nur Mitarbeiter-Topics
GET /api/analytics/company/1/topic-overview?source=employee

# Nur Bewerber-Topics  
GET /api/analytics/company/1/topic-overview?source=candidates

# Alle Topics (kombiniert)
GET /api/analytics/company/1/topic-overview
```

## 🚀 Deployment

```bash
# 1. Alte Modelle entfernen
cd backend/models/saved_models && rm -f lda_model_*.*

# 2. Neues Modell trainieren
cd backend && uv run python train_models.py

# 3. Services starten
# Backend
cd backend && uv run uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm run dev
```

## ✅ Vorteile

- ✅ Präzisere Topic-Erkennung
- ✅ Relevantere Ergebnisse pro Datenquelle
- ✅ Bessere Benutzerführung
- ✅ Flüssigere UI ohne Unterbrechungen
- ✅ Konsistente Datenstruktur

## 📚 Ausführliche Dokumentation

Siehe: [CHANGELOG_TOPIC_FILTERING.md](./CHANGELOG_TOPIC_FILTERING.md)

---

**Projekt:** gruppe-P1-3  
**Repository:** IIS-Bachelorprojekt/gruppe-P1-3
