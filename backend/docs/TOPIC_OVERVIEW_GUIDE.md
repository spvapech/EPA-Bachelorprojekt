# 🎯 Topic Overview - Vollständiger Guide

## 📋 Inhaltsverzeichnis

- [Was ist Topic Overview?](#-was-ist-topic-overview)
- [Features](#-features)
- [Schnellstart](#-schnellstart)
- [Integration](#-integration)
- [Analysierte Topics](#-analysierte-topics)
- [API-Referenz](#-api-referenz)
- [Anpassungen](#-anpassungen)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Was ist Topic Overview?

Eine Backend-Funktion, die automatisch **Topics aus Bewertungen extrahiert** und analysiert. Die Daten werden im gleichen Format wie Dummy-Daten ausgegeben und können direkt in der `TopicOverviewCard` Komponente verwendet werden.

### Funktionsweise

```
Datenbank Reviews → Topic Analyse → Frontend-Format
                     ↓
        ┌───────────────────────────┐
        │ • Häufigkeit zählen       │
        │ • Ratings berechnen       │
        │ • Sentiment bestimmen     │
        │ • Timeline erstellen      │
        │ • Beispiele extrahieren   │
        └───────────────────────────┘
```

---

## ✨ Features

### 1. **Automatische Topic-Erkennung**
- 7 vordefinierte Topics
- Keyword-basierte Analyse aller Review-Texte
- Regex-Muster für robuste Erkennung

### 2. **Häufigkeitsanalyse**
- Zählt Erwähnungen pro Topic
- Berücksichtigt alle Textfelder

### 3. **Durchschnittsbewertung**
- Kombiniert Gesamt-Ratings und spezifische Kategorie-Ratings
- Gewichtete Berechnung

### 4. **Sentiment-Bestimmung**
- Automatisch: Positiv (≥3.5), Neutral (≥2.5), Negativ (<2.5)
- Inklusive Farbcodierung (grün, orange, rot)

### 5. **Timeline-Daten**
- Letzte 6 Monate mit monatlichen Durchschnittswerten
- Ready für Line Charts

### 6. **Typische Aussagen**
- Extrahiert konkrete Sätze aus Reviews als Beispiele
- Bis zu 3 Statements pro Topic

---

## 🚀 Schnellstart

### 1. Backend starten

```bash
cd backend
uv run uvicorn main:app --reload
```

### 2. API testen

**Option A: Browser**
```
http://localhost:8000/api/analytics/company/1/topic-overview
```

**Option B: cURL**
```bash
curl http://localhost:8000/api/analytics/company/1/topic-overview
```

**Option C: Test-Script**
```bash
python backend/test_topic_overview.py
```

### 3. Beispiel-Response

```json
{
  "topics": [
    {
      "id": 1,
      "topic": "Work-Life Balance",
      "frequency": 45,
      "avgRating": 2.8,
      "sentiment": "Negativ",
      "color": "red",
      "example": "Überstunden sind die Regel...",
      "timelineData": [
        { "month": "Jan", "rating": 2.5 },
        { "month": "Feb", "rating": 2.6 },
        { "month": "Mär", "rating": 2.4 },
        { "month": "Apr", "rating": 2.7 },
        { "month": "Mai", "rating": 2.9 },
        { "month": "Jun", "rating": 3.0 }
      ],
      "typicalStatements": [
        "Überstunden sind Standard",
        "Ständige Erreichbarkeit wird erwartet",
        "Urlaub wird oft kurzfristig abgelehnt"
      ]
    }
  ],
  "total_reviews": 120,
  "total_topics": 5
}
```

---

## 🔌 Integration

### Option 1: Bestehende Komponente anpassen (Empfohlen)

Öffne `frontend/src/components/dashboard/TopicOverviewCard.jsx`:

```jsx
// ❌ ALT: Hardcoded Dummy-Daten entfernen
const topicsData = [
    { id: 1, topic: "Work-Life Balance", ... }
]

// ✅ NEU: API-Daten laden
import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config'

const TopicOverviewCard = ({ companyId }) => {
  const [topicsData, setTopicsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `${API_BASE_URL}/api/analytics/company/${companyId}/topic-overview`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch topics')
        }
        
        const data = await response.json()
        setTopicsData(data.topics || [])
      } catch (err) {
        console.error('Error fetching topics:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (companyId) {
      fetchTopics()
    }
  }, [companyId])

  if (loading) return <div>Loading topics...</div>
  if (error) return <div>Error: {error}</div>
  if (!topicsData.length) return <div>No topics found</div>

  // Rest der Komponente bleibt gleich
  return (
    // ... bestehender JSX Code
  )
}
```

### Option 2: Fertige Komponente verwenden

Verwende die Beispiel-Datei als Vorlage:
```bash
cp frontend/src/components/dashboard/TopicOverviewCard_EXAMPLE_WITH_API.jsx \
   frontend/src/components/dashboard/TopicOverviewCard.jsx
```

---

## 📊 Analysierte Topics

### 1. Work-Life Balance 🕐
**Keywords:**
- `work-life-balance`, `überstunden`, `arbeitszeit`
- `urlaub`, `freizeit`, `privatleben`
- `flexibilität`, `homeoffice`, `erreichbarkeit`

**Rating-Feld:** `sternebewertung_work_life_balance`

---

### 2. Führungsqualität 👔
**Keywords:**
- `führung`, `management`, `vorgesetzte`
- `chef`, `leitung`, `führungskräfte`
- `vorgesetztenverhalten`, `kompetenz`, `entscheidung`

**Rating-Feld:** `sternebewertung_vorgesetztenverhalten`

---

### 3. Gehalt & Benefits 💰
**Keywords:**
- `gehalt`, `bezahlung`, `lohn`, `vergütung`
- `benefits`, `sozialleistungen`, `altersvorsorge`
- `prämie`, `bonus`

**Rating-Feld:** `sternebewertung_gehalt_sozialleistungen`

---

### 4. Teamzusammenhalt 🤝
**Keywords:**
- `team`, `kollegen`, `zusammenhalt`
- `kollegenzusammenhalt`, `atmosphäre`, `arbeitsatmosphäre`
- `zusammenarbeit`, `gemeinschaft`

**Rating-Felder:**
- `sternebewertung_kollegenzusammenhalt`
- `sternebewertung_arbeitsatmosphaere`

---

### 5. Karriereentwicklung 📈
**Keywords:**
- `karriere`, `weiterbildung`, `entwicklung`
- `aufstieg`, `förderung`, `schulungen`
- `beförderung`, `perspektive`

**Rating-Feld:** `sternebewertung_karriere_weiterbildung`

---

### 6. Kommunikation 💬
**Keywords:**
- `kommunikation`, `information`, `transparenz`
- `feedback`, `gespräch`, `austausch`, `rückmeldung`

**Rating-Feld:** `sternebewertung_kommunikation`

---

### 7. Arbeitsbedingungen 🏢
**Keywords:**
- `arbeitsbedingungen`, `ausstattung`, `büro`
- `arbeitsplatz`, `technik`, `umgebung`, `infrastruktur`

**Rating-Feld:** `sternebewertung_arbeitsbedingungen`

---

## 🔧 API-Referenz

### Endpoint

```
GET /api/analytics/company/{company_id}/topic-overview
```

### Parameter

| Parameter | Typ | Required | Beschreibung |
|-----------|-----|----------|--------------|
| `company_id` | Path | ✅ | ID der zu analysierenden Firma |

### Response

```typescript
{
  topics: Array<{
    id: number
    topic: string
    frequency: number        // Anzahl Erwähnungen
    avgRating: number       // 0.0 - 5.0
    sentiment: string       // "Positiv" | "Neutral" | "Negativ"
    color: string          // "green" | "orange" | "red"
    example: string        // Kurzbeispiel (max 80 Zeichen)
    timelineData: Array<{
      month: string       // "Jan", "Feb", ...
      rating: number      // Durchschnitt für diesen Monat
    }>
    typicalStatements: string[]  // Bis zu 3 Beispiele
  }>
  total_reviews: number
  total_topics: number
}
```

### Status Codes

| Code | Beschreibung |
|------|--------------|
| 200 | Success |
| 404 | Company not found |
| 500 | Server error |

---

## ⚙️ Anpassungen

### Neue Topics hinzufügen

Öffne `backend/routes/analytics.py`, Funktion `get_topic_overview()`:

```python
topic_definitions = {
    # Bestehende Topics...
    
    "Dein neues Topic": {
        "keywords": [
            r'\bkeyword1\b',
            r'\bkeyword2\b',
            r'\bkeyword3\b'
        ],
        "rating_fields": ["sternebewertung_xyz"]
    }
}
```

### Keywords erweitern

```python
"Work-Life Balance": {
    "keywords": [
        r'\bwork[\s-]*life[\s-]*balance\b',
        r'\büberstunden\b',
        # Füge weitere hinzu:
        r'\bfeierabend\b',
        r'\bwochenende\b',
        r'\bstress\b'
    ],
    "rating_fields": ["sternebewertung_work_life_balance"]
}
```

### Sentiment-Schwellenwerte anpassen

In `analyze_topic()` Funktion:

```python
# Standardwerte
if avg_rating >= 3.5:
    sentiment = "Positiv"
    color = "green"
elif avg_rating >= 2.5:
    sentiment = "Neutral"
    color = "orange"
else:
    sentiment = "Negativ"
    color = "red"

# Anpassen nach Bedarf
if avg_rating >= 4.0:  # Strenger
    sentiment = "Positiv"
```

---

## 🔍 Troubleshooting

### Problem: Keine Topics werden gefunden

**Lösung:**
1. Prüfe, ob Reviews in der Datenbank existieren:
```bash
curl http://localhost:8000/api/analytics/company/1/reviews
```

2. Prüfe, ob Keywords in den Texten vorkommen
3. Erweitere die Keywords in `topic_definitions`

---

### Problem: Ratings sind 0.0

**Lösung:**
1. Prüfe, ob `durchschnittsbewertung` in Reviews vorhanden ist
2. Prüfe, ob Rating-Felder (`sternebewertung_*`) existieren
3. Stelle sicher, dass Keywords im Text gefunden werden

---

### Problem: Timeline ist leer

**Lösung:**
1. Prüfe, ob `datum` Feld in Reviews vorhanden ist
2. Stelle sicher, dass Reviews in den letzten 6 Monaten existieren
3. Prüfe Datumsformat: ISO 8601 (YYYY-MM-DDTHH:mm:ss)

---

### Problem: Keine typicalStatements

**Lösung:**
1. Prüfe, ob Textfelder gefüllt sind
2. Erweitere Keywords für bessere Treffererkennung
3. Reduziere Mindestlänge für Sätze (aktuell 20 Zeichen)

---

## 💡 Best Practices

### 1. Performance
- API-Calls cachen im Frontend
- Implementiere Pagination für große Datensätze
- Verwende `useEffect` Dependencies korrekt

### 2. Error Handling
```jsx
try {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = await response.json()
  // Verarbeite Daten
} catch (error) {
  console.error('Fehler:', error)
  // Zeige User-freundliche Fehlermeldung
}
```

### 3. Loading States
```jsx
{loading && <Skeleton />}
{error && <ErrorMessage error={error} />}
{!loading && !error && data && <Content data={data} />}
```

---

## 📚 Weitere Ressourcen

- **Technische Details**: `TOPIC_ANALYSIS_EXPLANATION.md`
- **API-Dokumentation**: `TOPIC_OVERVIEW_API.md`
- **Frontend-Beispiel**: `TopicOverviewCard_EXAMPLE_WITH_API.jsx`
- **Hauptdokumentation**: `README.md`

---

## ✅ Checkliste

- [x] Backend-Funktion implementiert
- [x] API-Endpoint registriert
- [x] Test-Script erstellt
- [x] Dokumentation geschrieben
- [x] Frontend-Beispiel erstellt
- [ ] **→ Frontend integrieren**
- [ ] **→ Mit echten Daten testen**

---

## 🎯 Next Steps

1. ✅ Backend starten und API testen
2. ✅ Frontend-Komponente anpassen
3. ✅ Mit echten Firmendaten testen
4. 🔄 Keywords nach Bedarf verfeinern
5. 🚀 In Production deployen

---

**Status**: ✅ Vollständig implementiert und dokumentiert  
**Version**: 1.0  
**Letzte Aktualisierung**: 6. Januar 2026
