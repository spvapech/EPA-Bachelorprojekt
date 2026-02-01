# Backend - LDA Topic Modeling System

## 📚 Dokumentation

Alle Dokumentationen befinden sich im **[docs/](docs/)** Ordner.

**Schnellstart:**
- [Erste Schritte](docs/QUICKSTART_TOPIC_MODELING.md)
- [Neues Modell trainieren](docs/QUICKSTART_NEW_MODEL.md)
- [Dokumentations-Index](docs/README.md)

## 🚀 Quick Start

```bash
# Backend starten
uv run uvicorn main:app --reload

# API Docs öffnen
open http://localhost:8000/docs

# Tests ausführen
python test_lda_topic_modeling.py

# Modell trainieren
python train_models.py
```

## 📁 Struktur

```
backend/
├── docs/           # 📚 Vollständige Dokumentation
├── models/         # 🤖 LDA & Sentiment Models
├── services/       # 🔧 Business Logic
├── routes/         # 🌐 API Endpoints
└── examples/       # 💡 Verwendungsbeispiele
```

## 🎯 Features

- ✅ LDA Topic Modeling (Version 2.0)
- ✅ Separate Topics für Bewerber (10) und Mitarbeiter (13)
- ✅ 200+ deutsche Stopwords
- ✅ 73 Bewertungskriterien aus DB-Schema
- ✅ Bigram/Trigram Support
- ✅ Source-Filter (Bewerber/Mitarbeiter/Alle)
- ✅ Sentiment-Analyse (Dual-Mode)
  - Lexicon-basiert (schnell, regelbasiert)
  - Transformer-basiert (ML, German BERT, hochpräzise)
- ✅ RESTful API
- ✅ Umfassende Test-Suite (13 Tests)

## 🧪 Testing

```bash
# Alle LDA-Tests ausführen
python test_lda_topic_modeling.py

# Test-Ergebnisse anzeigen
cat TEST_RESULTS_LDA.md
```

**Status**: ✅ Alle 13 Tests bestanden (Stand: 1. Februar 2026)

## 📖 Weitere Infos

Siehe **[docs/README.md](docs/README.md)** für vollständige Dokumentation.
