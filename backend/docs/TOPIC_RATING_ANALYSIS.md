# Topic-Rating-Analyse API - Erweiterte Funktionen

## 🎯 Übersicht

Die erweiterte Topic-Rating-Analyse kombiniert drei leistungsstarke Analyseformen:

1. **LDA Topic Modeling** - Entdeckt automatisch Themen in Texten
2. **Sentiment-Analyse** - Erkennt ob Texte positiv, neutral oder negativ sind
3. **Sterne-Bewertungen** - Nutzt vorhandene Rating-Daten aus der Datenbank

## 🚀 Neue API-Endpoints

### 1. Employee Reviews mit Ratings analysieren

**GET** `/api/topics/analyze/employee-reviews-with-ratings`

Analysiert Mitarbeiter-Reviews und kombiniert Topics, Sentiment und Sterne-Bewertungen.

**Parameter:**
- `limit` (optional): Maximale Anzahl der zu analysierenden Reviews

**Response:**
```json
{
  "status": "success",
  "analysis": {
    "total_reviews": 150,
    "reviews": [
      {
        "id": 1,
        "titel": "Toller Arbeitgeber",
        "datum": "2024-01-15",
        "durchschnittsbewertung": 4.5,
        "text_analyses": [
          {
            "field": "gut_am_arbeitgeber_finde_ich",
            "text_preview": "Die Arbeitsatmosphäre ist sehr gut...",
            "topics": [
              {
                "topic_id": 2,
                "probability": 0.78
              }
            ],
            "sentiment": {
              "polarity": 0.65,
              "sentiment": "positive",
              "subjectivity": 0.45,
              "confidence": 0.65
            },
            "dominant_topic": 2
          }
        ],
        "ratings": {
          "arbeitsatmosphaere": 4.5,
          "work_life_balance": 4.0,
          "gehalt_sozialleistungen": 3.5,
          "kollegenzusammenhalt": 5.0
        },
        "overall_sentiment": {
          "sentiment": "positive",
          "avg_polarity": 0.55,
          "avg_subjectivity": 0.42
        },
        "topics_summary": [
          {
            "topic_id": 2,
            "mentions": 3,
            "avg_probability": 0.72
          }
        ]
      }
    ]
  }
}
```

**Verwendung:**
```bash
curl http://localhost:8000/api/topics/analyze/employee-reviews-with-ratings?limit=50
```

---

### 2. Candidate Reviews mit Ratings analysieren

**GET** `/api/topics/analyze/candidate-reviews-with-ratings`

Analysiert Kandidaten-Feedback mit Topics, Sentiment und Bewertungen.

**Parameter:**
- `limit` (optional): Maximale Anzahl der zu analysierenden Reviews

**Response:** Ähnlich wie Employee-Analyse, aber mit Kandidaten-spezifischen Feldern.

**Verwendung:**
```bash
curl http://localhost:8000/api/topics/analyze/candidate-reviews-with-ratings?limit=30
```

---

### 3. Topic-Rating-Korrelation

**GET** `/api/topics/analyze/topic-rating-correlation`

Zeigt die Korrelation zwischen entdeckten Topics und Bewertungen.

**Parameter:**
- `limit` (optional): Maximale Anzahl der Reviews für die Analyse

**Response:**
```json
{
  "status": "success",
  "correlation": {
    "total_topics": 5,
    "topics": [
      {
        "topic_id": 2,
        "mention_count": 85,
        "ratings": [4.5, 4.2, 4.8, 3.9, 4.1],
        "avg_rating": 4.3,
        "sentiments": {
          "positive": 70,
          "neutral": 12,
          "negative": 3
        },
        "top_words": [
          {"word": "atmosphäre", "weight": 0.045},
          {"word": "team", "weight": 0.038},
          {"word": "kollegen", "weight": 0.032}
        ]
      }
    ],
    "summary": {
      "total_reviews_analyzed": 150
    }
  }
}
```

**Interpretation:**
- `mention_count`: Wie oft wurde das Topic erwähnt?
- `avg_rating`: Durchschnittliche Sterne-Bewertung bei diesem Topic
- `sentiments`: Wie viele Reviews waren positiv/neutral/negativ?
- `top_words`: Die wichtigsten Wörter für dieses Topic

**Verwendung:**
```bash
curl http://localhost:8000/api/topics/analyze/topic-rating-correlation
```

---

### 4. Text mit Sentiment vorhersagen

**POST** `/api/topics/predict-with-sentiment`

Analysiert einen einzelnen Text und gibt Topics + Sentiment zurück.

**Request Body:**
```json
{
  "text": "Die Arbeitsatmosphäre ist sehr gut und das Team ist super.",
  "threshold": 0.1
}
```

**Response:**
```json
{
  "status": "success",
  "text_preview": "Die Arbeitsatmosphäre ist sehr gut und das Team ist super.",
  "topics": [
    {
      "topic_id": 2,
      "probability": 0.78,
      "sentiment": {
        "polarity": 0.75,
        "sentiment": "positive",
        "subjectivity": 0.55,
        "confidence": 0.75
      }
    }
  ]
}
```

**Verwendung:**
```bash
curl -X POST http://localhost:8000/api/topics/predict-with-sentiment \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Sehr gute Work-Life-Balance!",
    "threshold": 0.1
  }'
```

---

## 📊 Sentiment-Analyse Details

### Technologie
Die Sentiment-Analyse verwendet einen **lexikon-basierten Ansatz** (Rule-based), der speziell für deutsche Texte optimiert ist:

- ✅ **Keine externe API** benötigt
- ✅ **Schnell und effizient**
- ✅ **Transparent und nachvollziehbar**
- ✅ **Über 100 deutsche Sentiment-Wörter**
- ✅ **Berücksichtigt Intensifizierer** ("sehr gut", "extrem schlecht")
- ✅ **Erkennt Negationen** ("nicht gut" → negativ)

### Polarity (Polarität)
- **Range**: -1.0 (sehr negativ) bis +1.0 (sehr positiv)
- **0.0**: neutral
- **> 0.1**: positiv
- **< -0.1**: negativ

### Subjectivity (Subjektivität)
- **Range**: 0.0 (objektiv) bis 1.0 (subjektiv)
- **0.0**: Fakten-basiert
- **1.0**: Meinungs-basiert

### Confidence (Konfidenz)
- Absolute Polarität (|polarity|)
- Höhere Werte = klarere Sentiment-Aussage

---

## 🔄 Vollständiger Workflow

### 1. Modell trainieren
```bash
curl -X POST http://localhost:8000/api/topics/train \
  -H "Content-Type: application/json" \
  -d '{"source": "employee", "num_topics": 5}'
```

### 2. Employee Reviews analysieren
```bash
curl http://localhost:8000/api/topics/analyze/employee-reviews-with-ratings?limit=100
```

### 3. Topic-Rating-Korrelation prüfen
```bash
curl http://localhost:8000/api/topics/analyze/topic-rating-correlation
```

### 4. Einzelnen Text testen
```bash
curl -X POST http://localhost:8000/api/topics/predict-with-sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "Das Gehalt könnte besser sein.", "threshold": 0.1}'
```

---

## 💡 Anwendungsfälle

### Use Case 1: Identifiziere Problem-Bereiche
```
Topic 3: "gehalt", "bezahlung", "vergütung"
- Durchschnittliche Bewertung: 2.8 ⭐
- Sentiment: 65% negativ
→ Aktion: Gehaltsstruktur überprüfen
```

### Use Case 2: Finde Stärken
```
Topic 1: "team", "kollegen", "zusammenarbeit"
- Durchschnittliche Bewertung: 4.7 ⭐
- Sentiment: 85% positiv
→ Aktion: In Marketing hervorheben
```

### Use Case 3: Trend-Analyse
```
Vergleiche Topics über Zeit:
- Q1 2024: Topic "work-life-balance" → 3.2 ⭐
- Q4 2024: Topic "work-life-balance" → 4.1 ⭐
→ Verbesserung erkennbar
```

---

## 🔍 Interpretationshilfe

### Hohe Rating + Positive Sentiment = ✅ Stärke
```json
{
  "avg_rating": 4.5,
  "sentiment": "positive",
  "polarity": 0.65
}
```
→ **Dieser Bereich läuft sehr gut!**

### Niedrige Rating + Negative Sentiment = ⚠️ Problem
```json
{
  "avg_rating": 2.3,
  "sentiment": "negative",
  "polarity": -0.55
}
```
→ **Hier besteht Handlungsbedarf!**

### Diskrepanz: Hohe Rating + Negative Sentiment = 🤔 Widerspruch
```json
{
  "avg_rating": 4.0,
  "sentiment": "negative",
  "polarity": -0.40
}
```
→ **Texte genauer analysieren - evtl. sarkastisch oder gemischt**

---

## 🛠️ Technische Details

### Module
- `models/sentiment_analyzer.py` - Sentiment-Analyse mit TextBlob-DE
- `models/lda_topic_model.py` - LDA Topic Modeling (erweitert)
- `services/topic_rating_service.py` - Kombinierte Analyse
- `routes/topics.py` - API-Endpoints

### Dependencies
- `textblob-de>=0.4.3` - Deutsche Sentiment-Analyse
- `gensim>=4.3.0` - LDA Topic Modeling

### Installation
```bash
cd backend
uv sync
```

---

## 📈 Performance-Tipps

1. **Große Datenmengen**: Nutze den `limit`-Parameter
2. **Schnelle Tests**: Verwende `predict-with-sentiment` für einzelne Texte
3. **Batch-Analyse**: `topic-rating-correlation` für Überblick
4. **Detailanalyse**: `employee-reviews-with-ratings` für jeden Review

---

## 🎓 Beispiel: Python-Client

```python
import requests

BASE_URL = "http://localhost:8000"

# 1. Modell trainieren
response = requests.post(
    f"{BASE_URL}/api/topics/train",
    json={"source": "employee", "num_topics": 5}
)
print("Training:", response.json()["status"])

# 2. Reviews analysieren
response = requests.get(
    f"{BASE_URL}/api/topics/analyze/employee-reviews-with-ratings",
    params={"limit": 50}
)
analysis = response.json()["analysis"]
print(f"Analysierte Reviews: {analysis['total_reviews']}")

# 3. Korrelation prüfen
response = requests.get(
    f"{BASE_URL}/api/topics/analyze/topic-rating-correlation"
)
correlation = response.json()["correlation"]

for topic in correlation["topics"]:
    print(f"\nTopic {topic['topic_id']}:")
    print(f"  Erwähnungen: {topic['mention_count']}")
    print(f"  Ø Rating: {topic['avg_rating']:.1f} ⭐")
    print(f"  Sentiment: {topic['sentiments']}")
    print(f"  Top-Wörter: {[w['word'] for w in topic['top_words'][:3]]}")
```

---

## ✅ Checkliste für erfolgreiche Analyse

- [ ] Backend läuft (`uvicorn main:app --reload`)
- [ ] Modell trainiert (`/api/topics/train`)
- [ ] Datenbank hat Reviews (Supabase)
- [ ] Reviews analysiert (`/analyze/employee-reviews-with-ratings`)
- [ ] Korrelation geprüft (`/analyze/topic-rating-correlation`)
- [ ] Erkenntnisse dokumentiert
- [ ] Handlungsempfehlungen abgeleitet

---

## 🆘 Troubleshooting

**Problem**: "Model not trained"
- **Lösung**: Zuerst `/api/topics/train` aufrufen

**Problem**: Keine Reviews gefunden
- **Lösung**: Datenbank-Verbindung prüfen, Excel-Daten importieren

**Problem**: Sentiment immer neutral
- **Lösung**: Texte zu kurz oder nur Fakten - längere, meinungsbasierte Texte nutzen

**Problem**: Topics nicht sinnvoll
- **Lösung**: `num_topics` anpassen (versuche 3-10 Topics)
