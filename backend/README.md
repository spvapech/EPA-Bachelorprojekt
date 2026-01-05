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

# Modell trainieren
python test_improved_topics.py
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

- ✅ LDA Topic Modeling (Version 2.1)
- ✅ 200+ deutsche Stopwords
- ✅ 186 arbeitsrelevante Keywords
- ✅ 73 Bewertungskriterien aus DB
- ✅ Bigram/Trigram Support
- ✅ Sentiment-Analyse
- ✅ RESTful API

## 📖 Weitere Infos

Siehe **[docs/README.md](docs/README.md)** für vollständige Dokumentation.
