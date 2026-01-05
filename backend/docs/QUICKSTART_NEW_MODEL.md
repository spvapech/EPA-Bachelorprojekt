# 🚀 Quick Start: LDA Modell neu trainieren

## Schritt-für-Schritt Anleitung

### Option 1: Über Python-Skript (Empfohlen für Tests)

```bash
# Im Backend-Verzeichnis
cd backend

# Test-Skript ausführen
python test_improved_topics.py
```

Das Skript:
- ✅ Zeigt Preprocessing-Verbesserungen
- ✅ Demonstriert Bigram/Trigram-Erkennung  
- ✅ Trainiert ein neues Modell mit echten Daten
- ✅ Vergleicht mit alten Modellen
- ✅ Speichert das neue Modell automatisch

### Option 2: Über API (Empfohlen für Produktion)

**1. Backend starten:**
```bash
cd backend
uv run uvicorn main:app --reload
```

**2. Neues Modell trainieren:**

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

**3. Topics anzeigen:**
```bash
curl -X GET "http://localhost:8000/api/topics/topics?num_words=15"
```

**4. Model-Status prüfen:**
```bash
curl -X GET "http://localhost:8000/api/topics/status"
```

### Option 3: Über Swagger UI (Interaktiv)

1. Backend starten: `uv run uvicorn main:app --reload`
2. Browser öffnen: http://localhost:8000/docs
3. Navigiere zu `/api/topics/train`
4. Klicke auf "Try it out"
5. Passe die Parameter an:
   ```json
   {
     "source": "both",
     "num_topics": 8,
     "passes": 20,
     "iterations": 500
   }
   ```
6. Klicke auf "Execute"

## 📊 Parameter-Empfehlungen

### Schnelles Prototyping
```json
{
  "num_topics": 5,
  "passes": 10,
  "iterations": 300
}
```
⏱️ Dauer: ~30 Sekunden

### Produktionsqualität (empfohlen)
```json
{
  "num_topics": 8,
  "passes": 20,
  "iterations": 500
}
```
⏱️ Dauer: ~1-2 Minuten

### Maximale Qualität
```json
{
  "num_topics": 10,
  "passes": 30,
  "iterations": 800
}
```
⏱️ Dauer: ~3-5 Minuten

## 🎯 Was ist neu?

### Verbesserte Stopwords
- **200+ deutsche Stopwords** statt vorher ~50
- **Domain-spezifische Stopwords** für nicht-arbeitsbezogene Begriffe
- Filtert Füllwörter wie "einfach", "nett", "okay", "viel", "man"

### Abkürzungsnormalisierung
- `MA` → `mitarbeiter`
- `AG` → `arbeitgeber`
- `WLB` → `work life balance`
- `HO` → `homeoffice`
- `GF` → `geschäftsführung`

### Bigram/Trigram Support
- Erkennt Phrasen wie `work_life_balance`
- Kombiniert `home_office`, `flexible_arbeitszeit`
- Bildet `team_work`, `remote_work`

### Optimierte LDA-Parameter
- `alpha='auto'`: Automatische Optimierung der Dokument-Topic-Verteilung
- `eta='auto'`: Automatische Optimierung der Topic-Wort-Verteilung
- `no_above=0.6`: Entfernt zu häufige Wörter (>60% der Dokumente)
- `keep_n=2000`: Fokus auf die 2000 relevantesten Begriffe

## 🔍 Model-Qualität prüfen

### Gute Topics sollten enthalten:
✅ `gehalt`, `bezahlung`, `vergütung`  
✅ `team`, `kollegen`, `zusammenarbeit`  
✅ `führung`, `vorgesetzter`, `management`  
✅ `homeoffice`, `remote`, `flexible_arbeitszeit`  
✅ `entwicklung`, `weiterbildung`, `karriere`  
✅ `kommunikation`, `feedback`, `transparenz`  

### Schlechte Indikatoren:
❌ `gut`, `schlecht`, `sehr`, `viel`  
❌ `ding`, `sache`, `mal`, `man`  
❌ `sein`, `haben`, `werden`, `machen`  

## 🛠️ Troubleshooting

### Topics sind zu allgemein?
**Lösung:** Erhöhe die Anzahl der Topics
```json
{"num_topics": 10}
```

### Topics sind zu spezifisch/fragmentiert?
**Lösung:** Reduziere die Anzahl der Topics
```json
{"num_topics": 5}
```

### Bestimmte Wörter sollten gefiltert werden?
**Lösung:** Füge sie in `backend/models/lda_topic_model.py` zur `domain_stopwords` Liste hinzu:
```python
self.domain_stopwords = set([
    # ... bestehende Stopwords ...
    'dein_neues_stopword',
    'weiteres_stopword'
])
```

Dann trainiere das Modell neu.

### Modell lädt nicht?
**Problem:** Alte Modelle ohne Bigram/Trigram-Support

**Lösung:** Trainiere ein komplett neues Modell über die API

## 📝 Nächste Schritte

1. ✅ Trainiere ein neues Modell mit den verbesserten Parametern
2. ✅ Überprüfe die Topic-Qualität in der Ausgabe
3. ✅ Passe Parameter basierend auf den Ergebnissen an
4. ✅ Integriere in das Frontend über die API
5. ✅ Überwache die Topic-Qualität über Zeit

## 📚 Weitere Dokumentation

- **Detaillierte Verbesserungen**: [TOPIC_MODELING_IMPROVEMENTS.md](TOPIC_MODELING_IMPROVEMENTS.md)
- **API-Dokumentation**: [docs/TOPIC_MODELING_API.md](docs/TOPIC_MODELING_API.md)
- **Allgemeine Dokumentation**: [TOPIC_MODELING_README.md](TOPIC_MODELING_README.md)

---

**Letzte Aktualisierung:** 5. Januar 2026  
**Version:** 2.0 - Optimiert für Arbeitsthemen
