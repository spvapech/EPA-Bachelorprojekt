# Gruppe P1-3 — Projekt

## 📋 Requirements / Dependencies

Um das Projekt lokal laufen zu lassen, benötigst du:

* **Python** >= 3.13
* **Node.js** v20
* **uv** → https://docs.astral.sh/uv/
* IDE deiner Wahl, bevorzugt **VSCode**

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

## 💡 Tipps

* Am besten hast du **2 Terminal-Sessions** offen, um Backend und Frontend gleichzeitig zu nutzen!
* Stelle sicher, dass die `.env`-Datei im Backend-Ordner korrekt konfiguriert ist
* Für Production-Build des Frontends: `npm run build`

## 📁 Projektstruktur

```
gruppe-P1-3/
├── backend/              # FastAPI Backend
│   ├── main.py          # Haupteinstiegspunkt
│   ├── config.py        # Konfiguration
│   ├── database/        # Datenbankverbindungen (Supabase)
│   ├── migrations/      # SQL-Migrationen
│   └── requirements.txt # Python Dependencies
├── frontend/            # React/Vite Frontend
│   ├── src/            # Quellcode
│   ├── public/         # Statische Assets
│   └── package.json    # Node.js Dependencies
└── requirements.txt     # Python Dependencies (Projekt-Root)
```

## 🛠️ Technologie-Stack

* **Backend:** FastAPI, Uvicorn, Supabase, Python-dotenv
* **Frontend:** React 19, Vite, ESLint
* **Datenbank:** Supabase (PostgreSQL)
