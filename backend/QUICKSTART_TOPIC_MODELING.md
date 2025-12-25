# LDA Topic Modeling - Schnellstart

## ✅ Installation abgeschlossen!

Das LDA Topic Modeling ist erfolgreich in dein Projekt integriert.

## 📦 Was wurde hinzugefügt?

### Neue Dateien:
```
backend/
├── models/
│   └── lda_topic_model.py          # LDA-Modell-Implementierung
├── services/
│   └── topic_model_service.py      # Datenbankservice für Topic Modeling
├── routes/
│   └── topics.py                   # API-Endpunkte (/api/topics/*)
├── examples/
│   └── topic_modeling_examples.py  # Beispielcode
├── docs/
│   └── TOPIC_MODELING_API.md       # Vollständige API-Dokumentation
├── test_topic_modeling.py          # Testscript
└── TOPIC_MODELING_README.md        # Feature-Dokumentation
```

### Aktualisierte Dateien:
- `main.py` - Neue Routes eingebunden
- `pyproject.toml` - Gensim-Abhängigkeit hinzugefügt
- `requirements.txt` - Gensim-Abhängigkeit hinzugefügt

## 🚀 Schnellstart

### 1. Backend starten
```bash
cd backend
uv run uvicorn main:app --reload
```

### 2. API-Dokumentation öffnen
Öffne in deinem Browser:
```
http://localhost:8000/docs
```

### 3. Erstes Modell trainieren

**Option A: Über Swagger UI**
1. Gehe zu `/api/topics/train`
2. Klicke auf "Try it out"
3. Verwende diesen Request Body:
```json
{
  "source": "both",
  "num_topics": 5,
  "limit": 100
}
```
4. Klicke auf "Execute"

**Option B: Mit curl**
```bash
curl -X POST http://localhost:8000/api/topics/train \
  -H "Content-Type: application/json" \
  -d '{"source": "both", "num_topics": 5}'
```

**Option C: Mit Python**
```python
import requests

response = requests.post(
    "http://localhost:8000/api/topics/train",
    json={"source": "both", "num_topics": 5}
)
print(response.json())
```

## 📊 Verfügbare API-Endpunkte

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/topics/status` | GET | Model-Status abrufen |
| `/api/topics/database/stats` | GET | Datenbank-Statistiken |
| `/api/topics/train` | POST | Neues Modell trainieren |
| `/api/topics/topics` | GET | Topics anzeigen |
| `/api/topics/predict` | POST | Topics für Text vorhersagen |
| `/api/topics/analyze-record` | POST | Datensatz analysieren |
| `/api/topics/models/list` | GET | Gespeicherte Modelle |
| `/api/topics/models/load` | POST | Modell laden |

## 🧪 Beispiele ausführen

```bash
cd backend
uv run python examples/topic_modeling_examples.py
```

## 💡 Typischer Workflow

1. **Model trainieren** (einmalig oder bei neuen Daten)
   ```bash
   POST /api/topics/train
   ```

2. **Topics ansehen**
   ```bash
   GET /api/topics/topics?num_words=10
   ```

3. **Text analysieren**
   ```bash
   POST /api/topics/predict
   Body: {"text": "Dein Text hier"}
   ```

4. **Datensatz aus DB analysieren**
   ```bash
   POST /api/topics/analyze-record
   Body: {"record_id": 1, "source": "candidates"}
   ```

## 🔍 Beispiel-Output

### Training:
```json
{
  "status": "success",
  "message": "Model trained successfully on 125 documents",
  "data": {
    "num_topics": 5,
    "num_documents": 125,
    "vocabulary_size": 350,
    "topics": [
      {
        "topic_id": 0,
        "words": [
          {"word": "team", "weight": 0.045},
          {"word": "zusammenarbeit", "weight": 0.038}
        ]
      }
    ]
  }
}
```

### Prediction:
```json
{
  "status": "success",
  "topics": [
    {"topic_id": 0, "probability": 0.65},
    {"topic_id": 2, "probability": 0.25}
  ]
}
```

## 📖 Dokumentation

- **Ausführliche API-Doku**: [`docs/TOPIC_MODELING_API.md`](docs/TOPIC_MODELING_API.md)
- **Feature-Übersicht**: [`TOPIC_MODELING_README.md`](TOPIC_MODELING_README.md)
- **Beispiele**: [`examples/topic_modeling_examples.py`](examples/topic_modeling_examples.py)

## 🎯 Nächste Schritte

1. ✅ **Backend starten** und API testen
2. 📊 **Daten hinzufügen** in die Kandidaten/Employee-Tabellen
3. 🤖 **Modell trainieren** mit deinen echten Daten
4. 🔍 **Topics analysieren** und interpretieren
5. 🌐 **Frontend-Integration** (optional)

## ⚙️ Konfiguration

### Standard-Parameter:
- **num_topics**: 5 (empfohlen: 3-10)
- **source**: "both" (candidates + employee)
- **threshold**: 0.1 (für Vorhersagen)

### Datenquellen:
- **Candidates**: `stellenbeschreibung`, `verbesserungsvorschlaege`
- **Employee**: `jobbeschreibung`, `gut_am_arbeitgeber_finde_ich`, 
  `schlecht_am_arbeitgeber_finde_ich`, `verbesserungsvorschlaege`

## 🐛 Troubleshooting

### "No model trained yet"
→ Führe zuerst `POST /api/topics/train` aus

### "No text data found"
→ Füge Daten in die Datenbank ein (candidates/employee Tabellen)

### Import-Fehler
→ Stelle sicher, dass gensim installiert ist: `uv add gensim`

### Schlechte Topic-Qualität
→ Trainiere mit mehr Daten (mind. 30-50 Dokumente)
→ Passe `num_topics` an

## 📞 Support

Bei Fragen oder Problemen:
1. Siehe vollständige Dokumentation in `docs/TOPIC_MODELING_API.md`
2. Prüfe die Beispiele in `examples/topic_modeling_examples.py`
3. Verwende die Swagger UI für interaktive Tests

---

**Viel Erfolg mit deinem Topic Modeling! 🚀**
