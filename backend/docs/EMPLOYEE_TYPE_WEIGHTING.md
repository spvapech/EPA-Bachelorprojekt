# Employee Type Weighting für LDA Topic Modeling

## Übersicht

Die LDA Topic-Analyse wurde erweitert, um verschiedene Mitarbeitertypen unterschiedlich zu gewichten. Dies stellt sicher, dass Bewertungen von verschiedenen Mitarbeitergruppen entsprechend ihrer Relevanz und Erfahrung unterschiedlich stark in die Analyse einfließen.

## Mitarbeitertypen und Gewichtungen

| Mitarbeitertyp | Gewicht | Begründung |
|----------------|---------|------------|
| **Manager** | 2.0 | Höchste Gewichtung - Manager haben umfassende Einblicke in Unternehmensstrukturen und -prozesse |
| **Employee** | 1.5 | Hohe Gewichtung - Vollzeitangestellte haben langfristige und tiefgehende Erfahrungen |
| **Student** | 0.8 | Niedrigere Gewichtung - Studenten haben oft temporäre Positionen mit eingeschränktem Einblick |
| **Nicht-Employee** | 0.5 | Niedrigste Gewichtung - Externe oder ehemalige Mitarbeiter haben möglicherweise veraltete Informationen |
| **Unbekannt** | 1.0 | Standard-Gewichtung - Wenn der Status nicht bestimmt werden kann |

## Technische Implementierung

### 1. Datenbank-Integration

Die `TopicModelDatabase` Klasse wurde erweitert um die Methode `get_employee_texts_with_metadata()`:

```python
from services.topic_model_service import TopicModelDatabase

db = TopicModelDatabase()
employee_data = db.get_employee_texts_with_metadata(limit=100)

# Gibt zurück:
# [
#   {
#     'text': 'Bewertungstext...',
#     'status': 'Manager',
#     'id': 123,
#     'source': 'employee'
#   },
#   ...
# ]
```

### 2. LDA-Modell mit Gewichtung

Das `LDATopicAnalyzer` Modell unterstützt jetzt Metadaten:

```python
from models.lda_topic_model import LDATopicAnalyzer

analyzer = LDATopicAnalyzer(num_topics=5)

# Training mit Gewichtung
texts = [item['text'] for item in employee_data]
metadata = [{'status': item['status']} for item in employee_data]

result = analyzer.train_model(texts, metadata=metadata)
```

### 3. API-Endpunkt

Der `/api/topics/train` Endpunkt wurde erweitert:

```bash
# Mit Gewichtung (Standard)
curl -X POST http://localhost:8000/api/topics/train \
  -H "Content-Type: application/json" \
  -d '{
    "source": "employee",
    "num_topics": 5,
    "use_employee_weighting": true
  }'

# Ohne Gewichtung (alte Methode)
curl -X POST http://localhost:8000/api/topics/train \
  -H "Content-Type: application/json" \
  -d '{
    "source": "employee",
    "num_topics": 5,
    "use_employee_weighting": false
  }'
```

## Gewichtungsalgorithmus

Die Gewichtung wird auf Bag-of-Words Ebene angewendet:

```python
# Ohne Gewichtung
bow = [(word_id, frequency)]
# Beispiel: [(0, 3), (1, 2), (2, 1)]

# Mit Gewichtung (Manager, weight=2.0)
weighted_bow = [(word_id, int(frequency * weight))]
# Beispiel: [(0, 6), (1, 4), (2, 2)]
```

Dies bedeutet, dass:
- Manager-Bewertungen doppelt so stark in die Topic-Verteilung einfließen
- Student-Bewertungen mit 80% ihrer Frequenz berücksichtigt werden
- Nicht-Employee-Bewertungen nur mit 50% ihrer Frequenz zählen

## Status-Mappings

Die folgenden Status-Werte werden automatisch erkannt und gemappt:

### Employee (Gewicht: 1.5)
- "Employee", "employee"
- "Angestellter", "Angestellte"
- "Mitarbeiter", "Mitarbeiterin"

### Manager (Gewicht: 2.0)
- "Manager", "manager"
- "Führungskraft", "Fuehrungskraft"
- "Leitung"

### Student (Gewicht: 0.8)
- "Student", "Studentin"
- "Praktikant", "Praktikantin"

### Nicht-Employee (Gewicht: 0.5)
- "Nicht-Employee", "nicht employee", "nichtemployee"
- "Ex-Employee", "ex employee"
- "Ehemaliger", "Ehemalige"

## Training mit Gewichtung

### Beispiel 1: Einfaches Training

```python
from models.lda_topic_model import LDATopicAnalyzer

# Testdaten
data = [
    {'text': 'Das Gehalt ist gut...', 'status': 'Manager'},
    {'text': 'Die Atmosphäre ist okay...', 'status': 'Employee'},
    {'text': 'Als Student finde ich...', 'status': 'Student'},
]

# Training
analyzer = LDATopicAnalyzer(num_topics=3)
texts = [d['text'] for d in data]
metadata = [{'status': d['status']} for d in data]

result = analyzer.train_model(texts, metadata=metadata)

# Gewichtungs-Statistiken anzeigen
print(result['weight_statistics'])
# Output:
# {
#   'Manager': {'count': 1, 'weight': 2.0},
#   'Employee': {'count': 1, 'weight': 1.5},
#   'Student': {'count': 1, 'weight': 0.8}
# }
```

### Beispiel 2: Training mit Datenbank

```python
from services.topic_model_service import TopicModelDatabase
from models.lda_topic_model import LDATopicAnalyzer

# Daten aus Datenbank laden
db = TopicModelDatabase()
data = db.get_all_texts(source="employee", include_metadata=True)

# Training mit Gewichtung
analyzer = LDATopicAnalyzer(num_topics=5)
result = analyzer.train_model(
    data["texts"], 
    metadata=data["detailed_metadata"]
)

print(f"Trainiert auf {result['num_documents']} Dokumenten")
print("Gewichtungs-Verteilung:", result['weight_statistics'])
```

## Auswirkungen auf die Analyse

### Szenario 1: Ohne Gewichtung
```
10 Manager-Bewertungen: "Gehalt ist exzellent"
100 Student-Bewertungen: "Gehalt ist zu niedrig"

Topic "Gehalt": Negativ dominiert (90% negativ)
```

### Szenario 2: Mit Gewichtung
```
10 Manager-Bewertungen × 2.0 = 20 gewichtete Stimmen
100 Student-Bewertungen × 0.8 = 80 gewichtete Stimmen

Topic "Gehalt": Ausgewogener (80% negativ)
```

## Vorteile

1. **Qualitätsorientierung**: Bewertungen von erfahreneren Mitarbeitern haben mehr Einfluss
2. **Verzerrung minimieren**: Temporäre oder externe Perspektiven werden angemessen gewichtet
3. **Flexibilität**: Gewichtungen können leicht angepasst werden
4. **Transparenz**: Gewichtungs-Statistiken werden im Trainingsergebnis ausgegeben

## Anpassung der Gewichtungen

Die Gewichtungen können im `LDATopicAnalyzer.__init__` angepasst werden:

```python
self.employee_type_weights = {
    'Employee': 1.5,      # Anpassen nach Bedarf
    'Manager': 2.0,       # Anpassen nach Bedarf
    'Student': 0.8,       # Anpassen nach Bedarf
    'Nicht-Employee': 0.5, # Anpassen nach Bedarf
    'default': 1.0
}
```

## Testing

Führe den Test aus, um die Funktionalität zu überprüfen:

```bash
cd backend
uv run python test_employee_weighting.py
```

Der Test zeigt:
- ✅ Korrekte Gewichtsberechnung für verschiedene Status-Typen
- ✅ Training mit gewichteten Testdaten
- ✅ Integration mit realen Datenbank-Daten
- ✅ Gewichtungs-Statistiken in den Ergebnissen

## API-Response mit Gewichtung

```json
{
  "status": "success",
  "message": "Model trained successfully on 150 documents",
  "data": {
    "status": "success",
    "num_topics": 5,
    "num_documents": 150,
    "vocabulary_size": 456,
    "employee_type_weights": {
      "Employee": 1.5,
      "Manager": 2.0,
      "Student": 0.8,
      "Nicht-Employee": 0.5,
      "default": 1.0
    },
    "weight_statistics": {
      "Manager": {"count": 20, "weight": 2.0},
      "Employee": {"count": 80, "weight": 1.5},
      "Student": {"count": 40, "weight": 0.8},
      "Nicht-Employee": {"count": 10, "weight": 0.5}
    },
    "topics": [...]
  }
}
```

## Kompatibilität

Die Implementierung ist **rückwärtskompatibel**:
- Alte API-Calls ohne `use_employee_weighting` funktionieren weiterhin
- `train_model()` kann ohne `metadata` Parameter aufgerufen werden
- Wenn `status` fehlt oder `null` ist, wird Standard-Gewichtung (1.0) verwendet

## Best Practices

1. **Immer Gewichtung verwenden** bei Employee-Daten aus der Datenbank
2. **Status-Feld pflegen** in der Datenbank für beste Ergebnisse
3. **Statistiken prüfen** nach dem Training, um Verteilung zu verstehen
4. **Gewichtungen anpassen** basierend auf spezifischen Anforderungen
5. **A/B Testing** durchführen: Training mit und ohne Gewichtung vergleichen

## Weitere Entwicklung

Mögliche zukünftige Erweiterungen:
- Dynamische Gewichtungen basierend auf Betriebszugehörigkeit
- Zeitliche Gewichtung (neuere Bewertungen höher gewichten)
- Abteilungs-spezifische Gewichtungen
- Kombinierte Gewichtungsfaktoren
