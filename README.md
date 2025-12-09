# Gruppe P1-3 — Projekt

## Requirements / Dependencies

Um das Projekt lokal laufen zu lassen, ist es notwendig folgendes installiert zu haben

* Node.js v20
* uv -> https://docs.astral.sh/uv/
* IDE eurer Wahl, bevorzugt VSCode

## Einrichtung

### Backend

ist uv installiert, öffne das terminal und führe folgendes aus:

```
cd backend
uv sync
```

Anschließend wählt ihr den .venv-Ordner als Python Interpreter für das Projekt aus.

Der Backend server kann wie folgt gestartet werden:

```
uv run uvicorn main:app --reload
```

###

ist node installiert, öffne das Terminal und führe folgendes aus:

```
cd frontend
npm install
```

Anschließend könnt ihr den Frontend dev server wie folgt starten:

```
npm run dev
```

Am besten habt ihr 2 Terminal sessions offen, um beides zusammen nutzen zu können!
