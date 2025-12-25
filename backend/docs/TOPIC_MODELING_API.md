# LDA Topic Modeling API - Dokumentation

## Übersicht

Diese API bietet Endpoints zur Durchführung von Topic Modeling mit LDA (Latent Dirichlet Allocation) auf Basis von Feedback-Daten aus der Datenbank. Das System nutzt Gensim zur Implementierung des LDA-Modells und kann Textdaten von Kandidaten und Mitarbeitern analysieren.

## Features

- ✅ Training von LDA-Modellen auf Datenbank-Texten
- ✅ Entdeckung von Topics in Feedback-Daten
- ✅ Vorhersage von Topics für neue Texte
- ✅ Analyse spezifischer Datensätze
- ✅ Speichern und Laden von trainierten Modellen
- ✅ Datenbankintegration mit Supabase

## Installation

### 1. Gensim installieren

```bash
cd backend
uv sync
```

oder mit pip:

```bash
pip install gensim>=4.3.0
```

### 2. Backend starten

```bash
cd backend
uv run uvicorn main:app --reload
```

## API Endpoints

### 1. Model Status abfragen

**GET** `/api/topics/status`

Gibt Informationen über den aktuellen Modellstatus zurück.

**Response:**
```json
{
  "status": "trained",
  "num_topics": 5,
  "vocabulary_size": 250,
  "num_documents": 100,
  "passes": 15,
  "iterations": 400
}
```

### 2. Datenbank-Statistiken

**GET** `/api/topics/database/stats`

Zeigt Statistiken über verfügbare Daten für Topic Modeling.

**Response:**
```json
{
  "status": "success",
  "data": {
    "candidates_total": 50,
    "employee_total": 75,
    "total_records": 125,
    "timestamp": "2025-12-24T10:00:00"
  }
}
```

### 3. Model trainieren

**POST** `/api/topics/train`

Trainiert ein neues LDA-Modell auf Daten aus der Datenbank.

**Request Body:**
```json
{
  "source": "both",
  "num_topics": 5,
  "limit": 100
}
```

**Parameter:**
- `source`: Datenquelle - `"candidates"`, `"employee"` oder `"both"` (default: `"both"`)
- `num_topics`: Anzahl der zu extrahierenden Topics (2-20, default: 5)
- `limit`: Maximale Anzahl Datensätze pro Quelle (optional)

**Response:**
```json
{
  "status": "success",
  "message": "Model trained successfully on 125 documents",
  "data": {
    "status": "success",
    "num_topics": 5,
    "num_documents": 125,
    "vocabulary_size": 350,
    "topics": [
      {
        "topic_id": 0,
        "words": [
          {"word": "arbeitsatmosphäre", "weight": 0.045},
          {"word": "team", "weight": 0.038}
        ]
      }
    ],
    "trained_at": "2025-12-24T10:00:00",
    "data_sources": {
      "candidates_count": 50,
      "employee_count": 75,
      "total_count": 125
    },
    "model_saved": true,
    "model_path": "models/lda_model_20251224_100000"
  }
}
```

### 4. Topics abrufen

**GET** `/api/topics/topics?num_words=10`

Gibt alle entdeckten Topics mit ihren Top-Wörtern zurück.

**Query Parameter:**
- `num_words`: Anzahl der Top-Wörter pro Topic (default: 10)

**Response:**
```json
{
  "status": "success",
  "num_topics": 5,
  "topics": [
    {
      "topic_id": 0,
      "words": [
        {"word": "kommunikation", "weight": 0.052},
        {"word": "team", "weight": 0.045},
        {"word": "zusammenarbeit", "weight": 0.038}
      ]
    }
  ]
}
```

### 5. Topics für Text vorhersagen

**POST** `/api/topics/predict`

Analysiert einen Text und gibt relevante Topics zurück.

**Request Body:**
```json
{
  "text": "Die Arbeitsatmosphäre ist sehr gut und das Team arbeitet hervorragend zusammen.",
  "threshold": 0.1
}
```

**Parameter:**
- `text`: Zu analysierender Text (required)
- `threshold`: Minimale Wahrscheinlichkeit für Topics (0.0-1.0, default: 0.1)

**Response:**
```json
{
  "status": "success",
  "text_preview": "Die Arbeitsatmosphäre ist sehr gut und das Team arbeitet hervorragend zusammen.",
  "num_topics_found": 2,
  "topics": [
    {"topic_id": 0, "probability": 0.65},
    {"topic_id": 2, "probability": 0.25}
  ]
}
```

### 6. Datensatz analysieren

**POST** `/api/topics/analyze-record`

Analysiert einen spezifischen Datensatz aus der Datenbank.

**Request Body:**
```json
{
  "record_id": 42,
  "source": "employee",
  "fields": ["jobbeschreibung", "verbesserungsvorschlaege"]
}
```

**Parameter:**
- `record_id`: ID des Datensatzes (required)
- `source`: Quelle - `"candidates"` oder `"employee"` (required)
- `fields`: Spezifische Felder zur Analyse (optional)

**Response:**
```json
{
  "status": "success",
  "record_id": 42,
  "source": "employee",
  "fields_analyzed": ["jobbeschreibung", "verbesserungsvorschlaege"],
  "text_length": 450,
  "topics": [
    {"topic_id": 1, "probability": 0.55},
    {"topic_id": 3, "probability": 0.30}
  ],
  "record_data": {
    "titel": "Software Engineer",
    "status": "active",
    "datum": "2025-01-15T00:00:00"
  }
}
```

### 7. Gespeicherte Modelle auflisten

**GET** `/api/topics/models/list`

Listet alle gespeicherten Modelle auf.

**Response:**
```json
{
  "status": "success",
  "count": 3,
  "models": [
    "lda_model_20251224_100000",
    "lda_model_20251223_150000",
    "lda_model_20251222_140000"
  ]
}
```

### 8. Gespeichertes Modell laden

**POST** `/api/topics/models/load?model_name=lda_model_20251224_100000`

Lädt ein zuvor gespeichertes Modell.

**Query Parameter:**
- `model_name`: Name des zu ladenden Modells (required)

**Response:**
```json
{
  "status": "success",
  "message": "Model 'lda_model_20251224_100000' loaded successfully",
  "metadata": {
    "num_topics": 5,
    "passes": 15,
    "iterations": 400,
    "vocabulary_size": 350,
    "num_documents": 125,
    "trained_at": "20251224_100000"
  }
}
```

## Workflow-Beispiele

### Beispiel 1: Neues Modell trainieren und Topics analysieren

```bash
# 1. Modell trainieren
curl -X POST http://localhost:8000/api/topics/train \
  -H "Content-Type: application/json" \
  -d '{"source": "both", "num_topics": 5}'

# 2. Topics abrufen
curl http://localhost:8000/api/topics/topics?num_words=10

# 3. Eigenen Text analysieren
curl -X POST http://localhost:8000/api/topics/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "Die Kommunikation im Team ist ausgezeichnet."}'
```

### Beispiel 2: Spezifischen Datensatz analysieren

```bash
# Employee-Datensatz analysieren
curl -X POST http://localhost:8000/api/topics/analyze-record \
  -H "Content-Type: application/json" \
  -d '{
    "record_id": 5,
    "source": "employee",
    "fields": ["gut_am_arbeitgeber_finde_ich", "verbesserungsvorschlaege"]
  }'
```

## Datenquellen

### Candidates-Tabelle
Standardfelder für Topic Modeling:
- `stellenbeschreibung`
- `verbesserungsvorschlaege`

### Employee-Tabelle
Standardfelder für Topic Modeling:
- `jobbeschreibung`
- `gut_am_arbeitgeber_finde_ich`
- `schlecht_am_arbeitgeber_finde_ich`
- `verbesserungsvorschlaege`

## Technische Details

### LDA-Parameter

- **num_topics**: Anzahl der zu extrahierenden Topics (2-20)
- **passes**: Anzahl der Durchläufe durch das Korpus (default: 15)
- **iterations**: Anzahl der Iterationen (default: 400)

### Text-Preprocessing

Das System führt folgende Preprocessing-Schritte durch:

1. Lowercase-Konvertierung
2. Entfernung von Satzzeichen
3. Entfernung von Zahlen
4. Entfernung von Stopwörtern (Englisch + Deutsch)
5. Filterung kurzer Tokens (< 3 Zeichen)
6. Dictionary-Filterung (min. 2 Dokumente, max. 50% der Dokumente)

### Modellspeicherung

Trainierte Modelle werden im `models/` Verzeichnis gespeichert mit:
- `.model` - LDA-Modell
- `.dict` - Wörterbuch
- `.meta` - Metadaten

## Swagger UI

Die vollständige API-Dokumentation ist verfügbar unter:
```
http://localhost:8000/docs
```

## Fehlerbehandlung

### Häufige Fehler

**400 - Bad Request**
- Kein Modell trainiert
- Keine Textdaten verfügbar
- Ungültige Parameter

**404 - Not Found**
- Datensatz nicht gefunden
- Modell nicht gefunden

**500 - Internal Server Error**
- Fehler beim Training
- Datenbankfehler

## Best Practices

1. **Erste Nutzung**: Trainiere zuerst ein Modell mit `/api/topics/train`
2. **Datenqualität**: Stelle sicher, dass genügend Textdaten vorhanden sind (min. 20-30 Dokumente)
3. **Topic-Anzahl**: Starte mit 5 Topics und passe basierend auf Ergebnissen an
4. **Modelle speichern**: Trainierte Modelle werden automatisch gespeichert
5. **Re-Training**: Trainiere das Modell neu, wenn neue Daten hinzukommen

## Support & Weiterentwicklung

Mögliche Erweiterungen:
- [ ] Integration von erweiterten deutschen Stopword-Listen
- [ ] Visualisierung von Topics (z.B. mit pyLDAvis)
- [ ] Batch-Analyse aller Datensätze
- [ ] Export von Topic-Ergebnissen
- [ ] Topic-Trend-Analyse über Zeit
