# Gruppe P1-3 — Projekt

## 🆕 Aktuelle Updates

**Version 2.0 - Topic-Filterung nach Datenquellen** (1. Februar 2026)
- ✅ Separate Topics für Bewerber (10) und Mitarbeiter (13)
- ✅ Verbesserte UI mit Filter-Buttons
- ✅ Neu trainierte LDA-Modelle
- 📖 [Detaillierte Dokumentation](./CHANGELOG_TOPIC_FILTERING.md) | [Kurzübersicht](./TOPIC_FILTERING_SUMMARY.md)

## 📋 Inhaltsverzeichnis

- [Requirements / Dependencies](#-requirements--dependencies)
- [Schnellstart](#-schnellstart)
- [Einrichtung](#-einrichtung)
- [Projektstruktur](#-projektstruktur)
- [LDA Topic Modeling](#-lda-topic-modeling)
- [Technologie-Stack](#️-technologie-stack)

## ⚡ Schnellstart

```bash
# Backend starten
cd backend
uv sync
uv run uvicorn main:app --reload

# Frontend starten (neues Terminal)
cd frontend
npm install
npm run dev
```

**Backend:** `http://localhost:8000` | **API Docs:** `http://localhost:8000/docs`  
**Frontend:** `http://localhost:5173`

## 📋 Requirements / Dependencies

Um das Projekt lokal laufen zu lassen, benötigst du:

* **Python** >= 3.13
* **Node.js** v20+
* **npm** (kommt mit Node.js)
* **uv** → https://docs.astral.sh/uv/ (empfohlen für Python)
* **Supabase Account** (für Datenbank)
* IDE deiner Wahl, bevorzugt **VSCode**

### Python-Pakete (Backend):
* `fastapi` - Web Framework
* `gensim` - Topic Modeling (LDA)
* `transformers` - ML-basierte Sentiment-Analyse (neu!)
* `torch` - PyTorch für Transformer-Modelle (neu!)
* `pandas` - Datenverarbeitung
* `supabase` - Datenbank-Client

### npm-Pakete (Frontend):
* `@radix-ui/react-checkbox` - Checkbox-Komponente
* `@radix-ui/react-label` - Label-Komponente
* `@radix-ui/react-dialog` - Dialog/Modal-Komponente
* `@radix-ui/react-select` - Select/Dropdown-Komponente
* `recharts` - Chart-Bibliothek
* `lucide-react` - Icon-Bibliothek
* `tailwindcss` - CSS-Framework

## 🚀 Einrichtung

### Backend (FastAPI)

Wenn `uv` installiert ist, öffne das Terminal und führe folgendes aus:

```bash
cd backend
uv sync
```

Anschließend wählst du den `.venv`-Ordner als Python Interpreter für das Projekt aus.

**Alternative ohne uv:** Falls du klassisches `pip` verwenden möchtest:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Auf macOS/Linux
# .venv\Scripts\activate  # Auf Windows
pip install -r requirements.txt
```

Der Backend-Server kann wie folgt gestartet werden:

```bash
uv run uvicorn main:app --reload
```

oder mit klassischem Python:

```bash
python -m uvicorn main:app --reload
```

**Backend läuft unter:** `http://localhost:8000`  
**API-Dokumentation:** `http://localhost:8000/docs` (Swagger UI)

### Frontend (React + Vite)

Wenn `node` installiert ist, öffne das Terminal und führe folgendes aus:

```bash
cd frontend
npm install
```

Anschließend kannst du den Frontend-Dev-Server wie folgt starten:

```bash
npm run dev
```

**Frontend läuft unter:** `http://localhost:5173`

## � Umgebungsvariablen

Erstelle eine `.env`-Datei im `backend/` Ordner:

```env
# Supabase Configuration
SUPABASE_URL=deine-supabase-url
SUPABASE_KEY=dein-supabase-key

# Optional: API Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

**Wichtig:** Die `.env`-Datei ist in `.gitignore` und wird nicht ins Repository committed!

## 💡 Tipps

* Am besten hast du **2 Terminal-Sessions** offen, um Backend und Frontend gleichzeitig zu nutzen!
* Stelle sicher, dass die `.env`-Datei im Backend-Ordner korrekt konfiguriert ist
* Für Production-Build des Frontends: `npm run build`
* Cache löschen: `find . -type d -name "__pycache__" -exec rm -rf {} +`
* Alte Modelle löschen: `cd backend/models && rm -f lda_model_*.* 2>/dev/null`

### Topic Detail Modal Features:
* **Einklappbare Ansicht-Steuerung:** Klicke auf "Ansicht anpassen", um Elemente ein-/auszublenden
* **Intelligentes Layout:** Charts werden automatisch größer, wenn andere ausgeblendet werden
* **5 anpassbare Bereiche:**
  - ✅ Statistiken (Frequency, Rating, Sentiment)
  - ✅ Zeitverlauf-Chart (Rating über Zeit)
  - ✅ Sentiment-Chart (Gauge mit Prozentanzeige)
  - ✅ Typische Aussagen (Top 3 Statements)
  - ✅ Beispiel-Review (mit Navigation)
* **Zeit-Filter:** Wähle zwischen Gesamt, 1 Jahr, 6 Monate, 3 Monate oder 1 Monat
* **Review-Navigation:** Klicke auf Aussagen, um die vollständige Review zu sehen

## 📁 Projektstruktur

```
gruppe-P1-3/
├── backend/                      # FastAPI Backend
│   ├── main.py                  # Haupteinstiegspunkt
│   ├── config.py                # Konfiguration
│   ├── pyproject.toml           # Python Dependencies (uv)
│   ├── requirements.txt         # Python Dependencies (pip)
│   ├── database/                # Datenbankverbindungen (Supabase)
│   │   └── supabase_client.py
│   ├── migrations/              # SQL-Migrationen
│   │   ├── 001_create_candidates_table.sql
│   │   ├── 002_create_employee_table.sql
│   │   ├── 003_create_companies_table.sql
│   │   └── 004_add_company_references.sql
│   ├── models/                  # Machine Learning Modelle
│   │   ├── lda_topic_model.py  # LDA Topic Modeling
│   │   └── sentiment_analyzer.py # Sentiment-Analyse
│   ├── services/                # Business Logic Services
│   │   ├── excel_service.py    # Excel Import/Export
│   │   ├── topic_model_service.py # Topic Modeling DB Service
│   │   └── topic_rating_service.py # Topic-Rating-Analyse
│   ├── routes/                  # API Endpoints
│   │   ├── companies.py
│   │   ├── topics.py           # Topic Modeling API
│   │   └── upload.py
│   ├── docs/                    # Dokumentation
│   │   ├── TOPIC_MODELING_API.md
│   │   └── TOPIC_RATING_ANALYSIS.md
│   └── examples/                # Beispiele & Demos
│       ├── topic_modeling_examples.py
│       └── topic_rating_examples.py
├── frontend/                    # React/Vite Frontend
│   ├── src/                    # Quellcode
│   │   ├── components/         # React Komponenten
│   │   │   ├── dashboard/     # Dashboard Components
│   │   │   │   ├── CategoryRatingCard.jsx
│   │   │   │   ├── DominantTopicsCard.jsx
│   │   │   │   ├── IndividualReviewsCard.jsx
│   │   │   │   ├── TimelineCard.jsx
│   │   │   │   ├── TopicOverviewCard.jsx  # Topic Übersicht (NEU)
│   │   │   │   └── modals/
│   │   │   │       ├── MostCriticalModal.jsx
│   │   │   │       ├── NegativTopicModal.jsx
│   │   │   │       ├── SorceModal.jsx
│   │   │   │       ├── TrendModal.jsx
│   │   │   │       ├── TopicTableModal.jsx    # Topic Tabelle
│   │   │   │       ├── TopicDetailModal.jsx   # Topic Details mit Ansicht-Anpassen
│   │   │   │       └── ReviewDetailModal.jsx  # Vollständige Review-Ansicht
│   │   │   └── ui/            # UI Components (shadcn)
│   │   │       ├── badge.jsx
│   │   │       ├── button.jsx
│   │   │       ├── card.jsx
│   │   │       ├── checkbox.jsx      # Für Ansicht-Anpassen (NEU)
│   │   │       ├── dialog.jsx
│   │   │       ├── input.jsx
│   │   │       ├── label.jsx         # Für Ansicht-Anpassen (NEU)
│   │   │       ├── select.jsx
│   │   │       └── ...andere UI Komponenten
│   │   ├── pages/             # Seiten
│   │   │   ├── Dashboard.jsx
│   │   │   └── Welcome.jsx
│   │   └── lib/               # Utilities
│   ├── public/                # Statische Assets
│   └── package.json           # Node.js Dependencies
└── requirements.txt            # Python Dependencies (Projekt-Root)
```

## 🛠️ Technologie-Stack

### Backend
* **Framework:** FastAPI (moderne Python Web API)
* **Server:** Uvicorn (ASGI Server)
* **Datenbank:** Supabase (PostgreSQL)
* **ML/AI:** 
  - Gensim 4.3+ (LDA Topic Modeling)
  - Transformers 4.30+ (ML-basierte Sentiment-Analyse mit German BERT)
  - PyTorch 2.0+ (Backend für Transformer-Modelle)
  - Lexikon-basierte Sentiment-Analyse (regelbasiert, schnell)
* **Datenverarbeitung:** Pandas, OpenPyXL
* **Tools:** Python-dotenv, Python-multipart

### Frontend
* **Framework:** React 19
* **Build Tool:** Vite 5
* **Routing:** React Router DOM
* **UI Library:** shadcn/ui (Radix UI + Tailwind CSS)
  - Dialog, Select, Dropdown Menu, Popover, Separator
  - Checkbox, Label (für Ansicht-Anpassung)
  - Badge, Button, Card, Input
* **Charts:** Recharts (Line Charts, Gauge Charts)
* **Icons:** Lucide React (Eye, ChevronDown, ChevronUp, Calendar, etc.)
* **Styling:** Tailwind CSS v4 mit Custom Animations
* **Linting:** ESLint

### Dashboard Features
* **Topic Übersicht:**
  - Interaktive Topic-Tabelle mit Suchfunktion
  - Detailansicht mit Line Chart (Rating über Zeit)
  - Gauge Chart für Sentiment-Visualisierung
  - Typische Aussagen und Beispiel-Reviews
  - Zweistufige Modal-Interaktion (Tabelle → Details)
  - **Ansicht anpassen (NEU):** Ein-/ausblendbare Elemente mit intelligenter Layout-Anpassung
  - **Responsive Charts:** Charts passen sich automatisch an und werden größer, wenn andere ausgeblendet werden
  - Verwendet aktuell Dummy-Daten zur Demonstration

### Datenbank Schema
* **Tables:** `candidates`, `employee`, `companies`
* **Features:** Star ratings, text feedback, relational data

## 🤖 LDA Topic Modeling

Dieses Projekt enthält eine vollständige **LDA Topic Modeling**-Integration mit **Gensim** zur automatischen Themenextraktion aus Kandidaten- und Mitarbeiter-Feedback.

### Features

✅ **Automatische Topic-Erkennung** in Textdaten  
✅ **Sentiment-Analyse** - Dual-Mode (Lexicon + ML-Transformer)
  - **Lexicon-Mode:** Schnell, regelbasiert, keine Dependencies
  - **Transformer-Mode:** ML-basiert mit German BERT, 100% Genauigkeit
✅ **Sterne-Bewertungen** - Kombiniert Text-Topics mit Rating-Daten  
✅ **Datenbankintegration** - Direkter Zugriff auf Kandidaten- und Mitarbeiter-Daten  
✅ **RESTful API** - 12 Endpunkte für Training, Analyse und Vorhersage  
✅ **Modellpersistenz** - Speichern und Laden trainierter Modelle  
✅ **Deutsche Textverarbeitung** - Optimierte Stopword-Liste  
✅ **Flexible Analyse** - Einzelne Texte oder ganze Datensätze  
✅ **Topic-Rating-Korrelation** - Verstehe welche Themen wie bewertet werden  

### Schnellstart

1. **Backend starten:**
   ```bash
   cd backend
   uv run uvicorn main:app --reload
   ```

2. **API-Dokumentation öffnen:**
   ```
   http://localhost:8000/docs
   ```

3. **Erstes Modell trainieren:**
   ```bash
   curl -X POST http://localhost:8000/api/topics/train \
     -H "Content-Type: application/json" \
     -d '{"source": "both", "num_topics": 5}'
   ```

### API-Endpunkte

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/topics/status` | GET | Model-Status abrufen |
| `/api/topics/database/stats` | GET | Datenbank-Statistiken |
| `/api/topics/train` | POST | Neues Modell trainieren |
| `/api/topics/topics` | GET | Entdeckte Topics anzeigen |
| `/api/topics/predict` | POST | Topics für Text vorhersagen |
| `/api/topics/predict-with-sentiment` | POST | Topics + Sentiment-Analyse |
| `/api/topics/analyze-record` | POST | Spezifischen Datensatz analysieren |
| `/api/topics/analyze/employee-reviews-with-ratings` | GET | Employee Reviews mit Topics, Sentiment & Ratings |
| `/api/topics/analyze/candidate-reviews-with-ratings` | GET | Candidate Reviews mit Topics, Sentiment & Ratings |
| `/api/topics/analyze/topic-rating-correlation` | GET | Korrelation zwischen Topics und Bewertungen |
| `/api/topics/models/list` | GET | Gespeicherte Modelle auflisten |
| `/api/topics/models/load` | POST | Gespeichertes Modell laden |

### Installation testen

```bash
cd backend
uv run python test_topic_modeling.py
```

### Beispiele ausführen

**Basic Topic Modeling:**
```bash
cd backend
uv run python examples/topic_modeling_examples.py
```

**Topic-Rating-Analyse (NEU):**
```bash
cd backend
uv run python examples/topic_rating_examples.py
```

### Dokumentation

- � **LDA Schnellstart**: [`backend/docs/QUICKSTART_LDA.md`](backend/docs/QUICKSTART_LDA.md)
- 🎯 **Topic-Analyse Guide**: [`backend/docs/TOPIC_OVERVIEW_GUIDE.md`](backend/docs/TOPIC_OVERVIEW_GUIDE.md)
- 📊 **Analyse-Erklärung**: [`backend/docs/TOPIC_ANALYSIS_EXPLANATION.md`](backend/docs/TOPIC_ANALYSIS_EXPLANATION.md)
- 📚 **LDA API-Referenz**: [`backend/docs/TOPIC_MODELING_API.md`](backend/docs/TOPIC_MODELING_API.md)
- 📋 **Topic Overview API**: [`backend/docs/TOPIC_OVERVIEW_API.md`](backend/docs/TOPIC_OVERVIEW_API.md)
- ⭐ **Topic-Rating-Analyse**: [`backend/docs/TOPIC_RATING_ANALYSIS.md`](backend/docs/TOPIC_RATING_ANALYSIS.md)
- 📖 **Feature-Übersicht**: [`backend/docs/TOPIC_MODELING_README.md`](backend/docs/TOPIC_MODELING_README.md)
- 💡 **Beispiele**: [`backend/examples/`](backend/examples/)
  - `topic_modeling_examples.py` - Basic LDA
  - `topic_rating_examples.py` - Topics + Sentiment + Ratings

### Projektstruktur (Topic Modeling)

```
gruppe-P1-3/
├── backend/
│   ├── models/
│   │   ├── lda_topic_model.py          # LDA-Modell-Implementierung (mit Sentiment)
│   │   ├── sentiment_analyzer.py       # Sentiment-Analyse für deutsche Texte
│   │   └── saved_models/               # Gespeicherte LDA-Modelle
│   │       ├── lda_model_*.model
│   │       ├── lda_model_*.dict
│   │       ├── lda_model_*.bigram
│   │       ├── lda_model_*.trigram
│   │       └── lda_model_*.meta
│   ├── services/
│   │   ├── topic_model_service.py      # Datenbankservice für Topic Modeling
│   │   └── topic_rating_service.py     # Topic-Rating-Analyse
│   ├── routes/
│   │   └── topics.py                   # API-Endpunkte (12 Endpoints)
│   ├── examples/
│   │   ├── topic_modeling_examples.py  # Basic LDA Beispiele
│   │   └── topic_rating_examples.py    # Topic-Rating Beispiele
│   ├── docs/
│   │   ├── QUICKSTART_LDA.md           # LDA Schnellstart-Anleitung
│   │   ├── TOPIC_OVERVIEW_GUIDE.md     # Topic-Analyse Guide
│   │   ├── TOPIC_ANALYSIS_EXPLANATION.md # Detaillierte Analyse-Logik
│   │   ├── TOPIC_MODELING_API.md       # LDA API-Dokumentation
│   │   ├── TOPIC_OVERVIEW_API.md       # Topic Overview API
│   │   ├── TOPIC_RATING_ANALYSIS.md    # Topic-Rating Feature-Doku
│   │   ├── TOPIC_MODELING_README.md    # Feature-Übersicht
│   │   └── README.md                   # Dokumentations-Index
│   └── test_topic_modeling.py          # Installationstest
│
├── frontend/
│   └── src/
│       └── components/
│           ├── dashboard/
│           │   ├── TopicOverviewCard.jsx       # Topic-Übersicht Hauptkarte
│           │   └── modals/
│           │       ├── TopicTableModal.jsx     # Alle Topics Tabelle mit Suche
│           │       ├── TopicDetailModal.jsx    # Topic-Details mit Charts
│           │       │   # Features:
│           │       │   # - Einklappbare Ansicht-Steuerung
│           │       │   # - Line Chart (Rating über Zeit mit Zeitfilter)
│           │       │   # - Gauge Chart (Sentiment-Visualisierung)
│           │       │   # - Typische Aussagen (Top 3)
│           │       │   # - Beispiel-Review mit Navigation
│           │       │   # - Responsive Layout (Charts passen sich an)
│           │       └── ReviewDetailModal.jsx   # Vollständige Review-Ansicht
│           └── ui/
│               ├── checkbox.jsx                # Für Ansicht-Anpassen
│               ├── label.jsx                   # Für Ansicht-Anpassen
│               ├── dialog.jsx                  # Für Modals
│               ├── select.jsx                  # Für Zeitfilter
│               ├── badge.jsx                   # Für Sentiment-Tags
│               └── card.jsx                    # Für Layout-Struktur
```

### Workflow

```mermaid
graph LR
    A[Datenbank] --> B[Text extrahieren]
    B --> C[Preprocessing]
    C --> D[LDA Training]
    D --> E[Topics entdeckt]
    E --> F[Modell speichern]
    F --> G[Vorhersagen machen]
```

### Datenquellen

**Candidates-Tabelle:**
- `stellenbeschreibung`
- `verbesserungsvorschlaege`

**Employee-Tabelle:**
- `jobbeschreibung`
- `gut_am_arbeitgeber_finde_ich`
- `schlecht_am_arbeitgeber_finde_ich`
- `verbesserungsvorschlaege`

### Beispiel-Verwendung

#### Python (Topic-Rating-Analyse):
```python
import requests

# Modell trainieren
response = requests.post(
    "http://localhost:8000/api/topics/train",
    json={"source": "employee", "num_topics": 5}
)
print(response.json())

# Employee Reviews mit Sentiment & Ratings analysieren
response = requests.get(
    "http://localhost:8000/api/topics/analyze/employee-reviews-with-ratings",
    params={"limit": 50}
)
analysis = response.json()['analysis']

# Topic-Rating-Korrelation abrufen
response = requests.get(
    "http://localhost:8000/api/topics/analyze/topic-rating-correlation"
)
correlation = response.json()['correlation']

for topic in correlation['topics']:
    print(f"Topic {topic['topic_id']}: "
          f"{topic['avg_rating']:.1f}⭐ "
          f"({topic['mention_count']} Erwähnungen)")
```

#### cURL:
```bash
# Topics mit Ratings analysieren
curl "http://localhost:8000/api/topics/analyze/topic-rating-correlation"

# Text mit Sentiment analysieren
curl -X POST http://localhost:8000/api/topics/predict-with-sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "Die Work-Life-Balance ist ausgezeichnet!", "threshold": 0.1}'
```

### Technische Details

- **LDA-Algorithmus**: Latent Dirichlet Allocation mit Gensim
- **Sentiment-Analyse**: Lexikon-basiert mit 100+ deutschen Sentiment-Wörtern
  - Erkennt Intensifizierer (sehr, extrem, total)
  - Berücksichtigt Negationen (nicht, kein, nie)
  - Berechnet Polarity (-1 bis +1) und Subjectivity (0 bis 1)
- **Preprocessing**: Lowercase, Stopword-Entfernung, Token-Filterung
- **Sprache**: Optimiert für deutsche Texte
- **Parameter**: Konfigurierbare Topics (2-20), Passes, Iterations
- **Speicherung**: Automatisches Speichern trainierter Modelle
- **Integration**: Kombiniert Topics, Sentiment und Sterne-Bewertungen

## 🚨 Häufige Probleme & Lösungen

### Backend startet nicht
```bash
# Port 8000 ist belegt
lsof -ti:8000 | xargs kill -9
uv run uvicorn main:app --reload
```

### Frontend startet nicht
```bash
# Dependencies fehlen
cd frontend
npm install
npm run dev

# Spezifische Pakete nachinstallieren (falls notwendig)
npm install @radix-ui/react-checkbox @radix-ui/react-label
```

### "Model not trained" Error
```bash
# Trainiere zuerst ein Modell
curl -X POST http://localhost:8000/api/topics/train \
  -H "Content-Type: application/json" \
  -d '{"source": "employee", "num_topics": 5}'
```

### Python Cache Probleme
```bash
# Lösche alle __pycache__ Verzeichnisse
find . -type d -name "__pycache__" -exec rm -rf {} +
```

### Alte Modelle löschen
```bash
# Speicherplatz freigeben
cd backend/models
rm -f lda_model_*.* 2>/dev/null
```

## 📚 Weitere Ressourcen

- **API Dokumentation**: http://localhost:8000/docs (Swagger UI)
- **Supabase**: https://supabase.com/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **React**: https://react.dev
- **Gensim**: https://radimrehurek.com/gensim/

## 👥 Team

Gruppe P1-3 - Bachelor Projekt

## 📄 Lizenz

Dieses Projekt ist für Bildungszwecke erstellt.
