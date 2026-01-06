# 🚀 LDA Topic Modeling - Schnellstart Guide

## 📋 Inhaltsverzeichnis

- [Übersicht](#-übersicht)
- [Installation & Setup](#-installation--setup)
- [Modell trainieren](#-modell-trainieren)
- [API-Endpunkte](#-api-endpunkte)
- [Parameter-Empfehlungen](#-parameter-empfehlungen)
- [Model-Qualität prüfen](#-model-qualität-prüfen)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Übersicht

**LDA (Latent Dirichlet Allocation) Topic Modeling** extrahiert automatisch Themen aus Kandidaten- und Mitarbeiter-Feedback. Die Lösung ist vollständig in das FastAPI-Backend integriert.

### ✨ Features

- ✅ **Automatische Topic-Erkennung** in Textdaten
- ✅ **Datenbankintegration** - Direkter Zugriff auf Kandidaten- und Mitarbeiter-Daten
- ✅ **RESTful API** - Einfache Integration über HTTP-Endpunkte
- ✅ **Modellpersistenz** - Speichern und Laden trainierter Modelle
- ✅ **Bigram/Trigram-Support** - Erkennt Phrasen wie `work_life_balance`
- ✅ **Deutsche Stopwords** - 200+ optimierte Stopwords für deutsche Texte
- ✅ **Flexible Analyse** - Einzelne Texte oder ganze Datensätze

### 🆕 Version 2.0 Verbesserungen

- **200+ deutsche Stopwords** (vorher ~50)
- **Domain-spezifische Stopwords** für Arbeitsthemen
- **Abkürzungsnormalisierung** (MA → mitarbeiter, WLB → work life balance)
- **Bigram/Trigram-Erkennung** für Phrasen
- **Optimierte LDA-Parameter** (alpha/eta auto-tuning)

---

## 📦 Installation & Setup

### 1. Dependencies installieren

```bash
cd backend
uv sync
```

Oder mit pip:
```bash
pip install gensim>=4.3.0
```

### 2. Backend starten

```bash
cd backend
uv run uvicorn main:app --reload
```

Backend läuft auf: `http://localhost:8000`  
API-Dokumentation: `http://localhost:8000/docs`

### 3. Datenbank-Statistiken prüfen

```bash
curl http://localhost:8000/api/topics/database/stats
```

**Beispiel-Response:**
```json
{
  "candidates_count": 45,
  "employee_count": 78,
  "total_records": 123,
  "has_data": true
}
```

---

## 🤖 Modell trainieren

### Option 1: Über API (Empfohlen für Produktion)

**Produktionsqualität trainieren:**
```bash
curl -X POST "http://localhost:8000/api/topics/train" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "both",
    "num_topics": 8,
    "passes": 20,
    "iterations": 500
  }'
```

**Schneller Test:**
```bash
curl -X POST "http://localhost:8000/api/topics/train" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "both",
    "num_topics": 5,
    "passes": 10
  }'
```

**Beispiel-Response:**
```json
{
  "status": "success",
  "message": "Model trained successfully on 125 documents",
  "data": {
    "num_topics": 8,
    "num_documents": 125,
    "vocabulary_size": 450,
    "model_path": "/path/to/lda_model_20260106_143022.model",
    "topics": [
      {
        "topic_id": 0,
        "words": [
          {"word": "gehalt", "weight": 0.052},
          {"word": "bezahlung", "weight": 0.041},
          {"word": "vergütung", "weight": 0.035}
        ]
      }
    ]
  }
}
```

---

### Option 2: Python-Skript (Empfohlen für Tests)

```bash
cd backend
python test_improved_topics.py
```

Das Skript zeigt:
- ✅ Preprocessing-Verbesserungen
- ✅ Bigram/Trigram-Erkennung
- ✅ Model-Training mit echten Daten
- ✅ Topic-Qualität im Vergleich

---

### Option 3: Swagger UI (Interaktiv)

1. Backend starten: `uv run uvicorn main:app --reload`
2. Browser öffnen: `http://localhost:8000/docs`
3. Navigiere zu `/api/topics/train`
4. Klicke auf **"Try it out"**
5. Passe Parameter an:
   ```json
   {
     "source": "both",
     "num_topics": 8,
     "passes": 20,
     "iterations": 500
   }
   ```
6. Klicke auf **"Execute"**

---

## 📊 API-Endpunkte

### Übersicht

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/topics/status` | GET | Model-Status abrufen |
| `/api/topics/database/stats` | GET | Datenbank-Statistiken |
| `/api/topics/train` | POST | Neues Modell trainieren |
| `/api/topics/topics` | GET | Entdeckte Topics anzeigen |
| `/api/topics/predict` | POST | Topics für Text vorhersagen |
| `/api/topics/analyze-record` | POST | Datensatz analysieren |
| `/api/topics/models/list` | GET | Gespeicherte Modelle auflisten |
| `/api/topics/models/load` | POST | Gespeichertes Modell laden |

---

### 1. Model-Status prüfen

```bash
curl http://localhost:8000/api/topics/status
```

**Response:**
```json
{
  "status": "trained",
  "num_topics": 8,
  "num_documents": 125,
  "vocabulary_size": 450
}
```

---

### 2. Topics anzeigen

```bash
curl "http://localhost:8000/api/topics/topics?num_words=15"
```

**Response:**
```json
{
  "status": "success",
  "num_topics": 8,
  "topics": [
    {
      "topic_id": 0,
      "words": [
        {"word": "gehalt", "weight": 0.052},
        {"word": "bezahlung", "weight": 0.041},
        {"word": "sozialleistungen", "weight": 0.035}
      ]
    }
  ]
}
```

---

### 3. Text analysieren

```bash
curl -X POST "http://localhost:8000/api/topics/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Das Gehalt ist fair und die Work-Life-Balance gut.",
    "threshold": 0.1
  }'
```

**Response:**
```json
{
  "status": "success",
  "topics": [
    {"topic_id": 0, "probability": 0.45, "label": "Gehalt & Benefits"},
    {"topic_id": 3, "probability": 0.35, "label": "Work-Life Balance"}
  ],
  "text_length": 52
}
```

---

### 4. Datensatz aus DB analysieren

```bash
curl -X POST "http://localhost:8000/api/topics/analyze-record" \
  -H "Content-Type: application/json" \
  -d '{
    "record_id": 1,
    "source": "employee"
  }'
```

---

### 5. Gespeicherte Modelle auflisten

```bash
curl http://localhost:8000/api/topics/models/list
```

**Response:**
```json
{
  "models": [
    {
      "filename": "lda_model_20260106_143022",
      "created_at": "2026-01-06 14:30:22",
      "size_mb": 2.4
    }
  ]
}
```

---

### 6. Gespeichertes Modell laden

```bash
curl -X POST "http://localhost:8000/api/topics/models/load" \
  -H "Content-Type: application/json" \
  -d '{"model_name": "lda_model_20260106_143022"}'
```

---

## ⚙️ Parameter-Empfehlungen

### Training-Parameter

```python
{
  "source": "both",        # "candidates" | "employee" | "both"
  "num_topics": 8,         # Anzahl der Topics (3-15 empfohlen)
  "passes": 20,            # Anzahl der Durchläufe (10-30)
  "iterations": 500,       # Iterationen pro Durchlauf (300-800)
  "limit": null            # Max. Dokumente (null = alle)
}
```

---

### Schnelles Prototyping ⚡

```json
{
  "num_topics": 5,
  "passes": 10,
  "iterations": 300
}
```

**Eigenschaften:**
- ⏱️ Dauer: ~30 Sekunden
- 🎯 Zweck: Schnelle Tests
- ⚠️ Qualität: Basic

---

### Produktionsqualität (Empfohlen) ✅

```json
{
  "num_topics": 8,
  "passes": 20,
  "iterations": 500
}
```

**Eigenschaften:**
- ⏱️ Dauer: ~1-2 Minuten
- 🎯 Zweck: Production-Ready
- ✅ Qualität: Hoch

---

### Maximale Qualität 🏆

```json
{
  "num_topics": 10,
  "passes": 30,
  "iterations": 800
}
```

**Eigenschaften:**
- ⏱️ Dauer: ~3-5 Minuten
- 🎯 Zweck: Research, Fine-Tuning
- 🌟 Qualität: Maximal

---

## 🔍 Model-Qualität prüfen

### Gute Topics sollten enthalten:

**Gehalt & Benefits:**
✅ `gehalt`, `bezahlung`, `vergütung`, `sozialleistungen`

**Work-Life Balance:**
✅ `work_life_balance`, `überstunden`, `homeoffice`, `flexibel`

**Team & Zusammenarbeit:**
✅ `team`, `kollegen`, `zusammenarbeit`, `atmosphäre`

**Führung & Management:**
✅ `führung`, `vorgesetzter`, `management`, `chef`

**Karriereentwicklung:**
✅ `entwicklung`, `weiterbildung`, `karriere`, `aufstieg`

**Kommunikation:**
✅ `kommunikation`, `feedback`, `transparenz`, `information`

---

### Schlechte Indikatoren:

**Füllwörter (sollten gefiltert sein):**
❌ `gut`, `schlecht`, `sehr`, `viel`, `man`
❌ `ding`, `sache`, `mal`, `dann`, `auch`

**Hilfsverben (sollten gefiltert sein):**
❌ `sein`, `haben`, `werden`, `machen`, `müssen`

---

### Qualitätskriterien:

| Kriterium | Gut ✅ | Schlecht ❌ |
|-----------|--------|-------------|
| **Kohärenz** | Wörter gehören thematisch zusammen | Zufällige Wort-Mixe |
| **Interpretierbarkeit** | Topic-Label klar erkennbar | Unklar, was gemeint ist |
| **Differenzierung** | Topics unterscheiden sich deutlich | Topics überlappen stark |
| **Relevanz** | Arbeitsrelevante Begriffe | Füllwörter dominieren |

---

## 💡 Typischer Workflow

```
1. Daten prüfen
   ↓
   curl /api/topics/database/stats

2. Modell trainieren
   ↓
   POST /api/topics/train

3. Topics ansehen
   ↓
   GET /api/topics/topics

4. Text analysieren
   ↓
   POST /api/topics/predict

5. Bei Bedarf neu trainieren
   ↓
   POST /api/topics/train (mit angepassten Parametern)
```

---

## 🛠️ Troubleshooting

### Problem: "No model trained yet"

**Lösung:** Trainiere zuerst ein Modell
```bash
curl -X POST http://localhost:8000/api/topics/train \
  -H "Content-Type: application/json" \
  -d '{"source": "both", "num_topics": 5}'
```

---

### Problem: "No text data found"

**Lösung:** Füge Daten in die Datenbank ein

Prüfe Datenbank-Status:
```bash
curl http://localhost:8000/api/topics/database/stats
```

Stelle sicher, dass folgende Felder gefüllt sind:
- **Candidates:** `stellenbeschreibung`, `verbesserungsvorschlaege`
- **Employee:** `jobbeschreibung`, `gut_am_arbeitgeber_finde_ich`, `schlecht_am_arbeitgeber_finde_ich`

---

### Problem: Topics sind zu allgemein

**Symptom:** Alle Topics enthalten ähnliche Wörter

**Lösung 1:** Erhöhe Anzahl der Topics
```json
{"num_topics": 10}
```

**Lösung 2:** Mehr Daten trainieren
```json
{"limit": null}  // Alle verfügbaren Daten verwenden
```

---

### Problem: Topics sind zu spezifisch/fragmentiert

**Symptom:** Viele Topics mit nur wenigen spezifischen Wörtern

**Lösung:** Reduziere Anzahl der Topics
```json
{"num_topics": 5}
```

---

### Problem: Bestimmte Wörter sollten gefiltert werden

**Lösung:** Füge sie zur Stopword-Liste hinzu

Öffne `backend/models/lda_topic_model.py`:
```python
self.domain_stopwords = set([
    # ... bestehende Stopwords ...
    'dein_neues_stopword',
    'weiteres_wort_filtern'
])
```

Dann trainiere das Modell neu.

---

### Problem: Modell lädt nicht

**Symptom:** Fehler beim Laden alter Modelle

**Ursache:** Alte Modelle ohne Bigram/Trigram-Support

**Lösung:** Trainiere ein neues Modell mit der aktuellen Version
```bash
curl -X POST http://localhost:8000/api/topics/train \
  -H "Content-Type: application/json" \
  -d '{"source": "both", "num_topics": 8}'
```

---

## 📚 Beispiele

### Python-Beispiel

```python
import requests

BASE_URL = "http://localhost:8000"

# 1. Modell trainieren
response = requests.post(
    f"{BASE_URL}/api/topics/train",
    json={
        "source": "both",
        "num_topics": 8,
        "passes": 20
    }
)
print(response.json())

# 2. Topics anzeigen
response = requests.get(f"{BASE_URL}/api/topics/topics?num_words=10")
topics = response.json()
for topic in topics["topics"]:
    print(f"Topic {topic['topic_id']}:")
    for word in topic["words"]:
        print(f"  - {word['word']}: {word['weight']:.3f}")

# 3. Text analysieren
response = requests.post(
    f"{BASE_URL}/api/topics/predict",
    json={
        "text": "Das Gehalt ist fair, aber die Work-Life-Balance könnte besser sein.",
        "threshold": 0.1
    }
)
print(response.json())
```

---

### JavaScript/Fetch-Beispiel

```javascript
const API_URL = 'http://localhost:8000'

// Modell trainieren
async function trainModel() {
  const response = await fetch(`${API_URL}/api/topics/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'both',
      num_topics: 8,
      passes: 20
    })
  })
  const data = await response.json()
  console.log('Training result:', data)
}

// Text analysieren
async function analyzeText(text) {
  const response = await fetch(`${API_URL}/api/topics/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, threshold: 0.1 })
  })
  const data = await response.json()
  console.log('Topics:', data.topics)
}

trainModel()
analyzeText('Die Work-Life-Balance ist ausgezeichnet!')
```

---

## 🎯 Nächste Schritte

1. ✅ **Backend starten** und API-Status prüfen
2. ✅ **Erstes Modell trainieren** mit Testparametern
3. ✅ **Topics überprüfen** und Qualität bewerten
4. ✅ **Parameter anpassen** für optimale Ergebnisse
5. ✅ **Modell speichern** für Produktion
6. 🔄 **Frontend integrieren** (optional)
7. 📊 **Monitoring** einrichten für Topic-Drift

---

## 📖 Weitere Dokumentation

- **API-Referenz**: [`TOPIC_MODELING_API.md`](TOPIC_MODELING_API.md)
- **Feature-Übersicht**: [`TOPIC_MODELING_README.md`](TOPIC_MODELING_README.md)
- **Verbesserungen v2.0**: [`TOPIC_MODELING_IMPROVEMENTS.md`](TOPIC_MODELING_IMPROVEMENTS.md)
- **Topic-Rating**: [`TOPIC_RATING_ANALYSIS.md`](TOPIC_RATING_ANALYSIS.md)
- **Beispiele**: [`examples/topic_modeling_examples.py`](../examples/topic_modeling_examples.py)

---

**Version:** 2.0  
**Letzte Aktualisierung:** 6. Januar 2026  
**Status:** ✅ Production-Ready
