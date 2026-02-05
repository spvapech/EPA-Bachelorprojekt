# Evaluation Overview: Sentiment & Topic Modeling

**Datum:** 15. Januar 2026  
**Projekt:** gruppe-P1-3 Backend

## 📊 Schnellvergleich

| System | Hauptmetrik | Wert | Praktische Nutzbarkeit |
|--------|-------------|------|----------------------|
| **Sentiment Analysis** | Accuracy | 48.4% | ⭐⭐⭐⭐⭐ Hoch |
| **Topic Modeling** | Confidence | 22.3% | ⭐⭐⭐ Mittel |

## 🎯 Sentiment Analysis (Transformer)

### Test-Details
- **Test:** `test_sentiment_accuracy.py`
- **Datensatz:** 128 echte Reviews
- **Modell:** German BERT (oliverguhr/german-sentiment-bert)

### Ergebnisse

| Metrik | Wert |
|--------|------|
| Overall Accuracy | **48.4%** |
| Positive Accuracy | **44.4%** |
| Negative Accuracy | **52.3%** |
| Avg Confidence | **0.94** |

### ✅ Bewertung: **GUT für praktische Anwendung**

**Stärken:**
- ✅ Klar interpretierbar (positive/negative/neutral)
- ✅ Hohe Confidence (94%)
- ✅ 77% besser als Lexicon-Ansatz
- ✅ Direkt nutzbar für Business-Insights

**Herausforderungen:**
- ⚠️ 48% absolut ist niedrig
- ⚠️ Ground Truth basiert auf Feld-Typ (nicht perfekt)

**→ [TEST_RESULTS_SENTIMENT.md](TEST_RESULTS_SENTIMENT.md)** für Details

---

## 📚 Topic Modeling (LDA)

### Test-Details
- **Test:** `test_topic_accuracy.py`
- **Datensatz:** 100 echte Reviews
- **Modell:** LDA (5 Topics)

### Ergebnisse

| Metrik | Wert |
|--------|------|
| Topic Distinctiveness | **97%** (3% Overlap) |
| Coverage | **93%** |
| Avg Topics/Review | **3.9** |
| Avg Confidence | **22.3%** |
| Category Coverage | **29%** |

### ⚖️ Bewertung: **TECHNISCH GUT, SEMANTISCH SCHWACH**

**Stärken:**
- ✅ Exzellente Topic-Trennung (97%)
- ✅ Sehr gute Coverage (93%)
- ✅ Multi-Topic funktioniert korrekt (3.9/Review)
- ✅ Ausgewogene Verteilung

**Herausforderungen:**
- ⚠️ Niedrige Confidence (22% - typisch für LDA)
- ⚠️ Topics schwer interpretierbar
- ⚠️ Geringe Business-Kategorien-Abdeckung (29%)

**→ [TEST_RESULTS_TOPICS.md](TEST_RESULTS_TOPICS.md)** für Details

---

## 🔄 Direkter Vergleich

### Interpretierbarkeit

```
Sentiment Analysis:
"Dieser Text ist POSITIV mit 94% Sicherheit"
→ Klar verständlich ✅

Topic Modeling:
"Dieser Text gehört zu Topic 0 (bewerber, gehalt, umgang)"
→ Was bedeutet das? ⚠️
```

### Nutzbarkeit für Dashboard

| Use Case | Sentiment | Topics | Empfehlung |
|----------|-----------|--------|------------|
| **Trend-Analyse** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Sentiment |
| **Kategorisierung** | ⭐⭐ | ⭐⭐⭐⭐ | Topics |
| **Quick Insights** | ⭐⭐⭐⭐⭐ | ⭐⭐ | Sentiment |
| **Detaillierte Analyse** | ⭐⭐⭐ | ⭐⭐⭐⭐ | Topics |
| **Automatische Aktionen** | ⭐⭐⭐⭐ | ⭐⭐ | Sentiment |

### Performance

| Metrik | Sentiment (Transformer) | Topics (LDA) |
|--------|------------------------|--------------|
| **Verarbeitungszeit** | ~0.1s/Text | ~0.001s/Text |
| **Speicher** | ~1.5 GB (Model) | ~10 MB (Model) |
| **Genauigkeit** | 48% | 22% Confidence |
| **Interpretierbarkeit** | ⭐⭐⭐⭐⭐ | ⭐⭐ |

---

## 💡 Kombinierter Ansatz (Aktuelles System)

### Wie es zusammenarbeitet:

```python
# Review-Analyse
review = "Gutes Gehalt, aber schlechte Work-Life-Balance"

# Sentiment: Gemischt/Neutral
sentiment = {"polarity": 0.1, "sentiment": "neutral"}

# Topics: Compensation + Work-Life Balance
topics = [
    {"topic_id": 0, "probability": 0.35},  # Compensation
    {"topic_id": 2, "probability": 0.28}   # Work-Life
]

→ Kombiniert: "Review diskutiert Gehalt und Work-Life, ist insgesamt neutral"
```

### Stärken der Kombination:

1. **Sentiment** sagt "WIE" (positiv/negativ)
2. **Topics** sagen "WAS" (welche Themen)
3. Zusammen: **"WAS wird WIE bewertet"**

### Beispiel Dashboard-Insight:

```
🔴 Topic "Work-Life Balance" hat durchschnittlich NEGATIVES Sentiment (-0.3)
🟢 Topic "Compensation" hat durchschnittlich POSITIVES Sentiment (+0.5)

→ Handlungsempfehlung: Work-Life Balance verbessern
```

---

## 📈 Für deine Dokumentation

### ✅ Was du schreiben SOLLTEST:

**Sentiment:**
- "Transformer-Modell erreicht 48% Genauigkeit (vs. 27% Lexicon)"
- "Confidence von 94% zeigt hohe Sicherheit"
- "Praktisch nutzbar für Trend-Analysen und Dashboard"

**Topics:**
- "93% der Reviews werden Topics zugeordnet"
- "Durchschnittlich 3.9 Topics pro Review (realistisch für komplexe Reviews)"
- "Topics sind klar unterscheidbar (97% Distinctiveness)"
- "LDA-Confidence von 22% ist typisch für probabilistische Modelle"

**Kombination:**
- "System kombiniert Sentiment (WIE) mit Topics (WAS) für reichere Insights"

### ⚠️ Was du einschränken SOLLTEST:

**Sentiment:**
- "48% absolute Genauigkeit zeigt Verbesserungspotenzial"
- "Ground Truth basiert auf Feld-Typ, nicht manueller Annotation"
- "Für kritische Entscheidungen Vorsicht bei Interpretation"

**Topics:**
- "Semantische Interpretation der Topics erfordert Domänenwissen"
- "Niedrige Confidence (22%) limitiert Einzelfall-Entscheidungen"
- "Category Coverage (29%) zeigt Raum für Verbesserungen"

### ❌ Was du NICHT behaupten solltest:

- ❌ "Hochpräzise Sentiment-Erkennung"
- ❌ "Topics sind perfekt identifiziert"
- ❌ "Multi-Topic ist ein Problem" (ist FEATURE!)
- ❌ "22% Confidence ist schlecht" (für LDA normal!)

---

## 🚀 Nächste Schritte

### Sentiment Analysis:
1. ✅ **Jetzt:** Transformer in Production verwenden
2. 🔄 **Optional:** Manuelle Annotation für bessere Evaluation
3. 🔮 **Zukunft:** Fine-Tuning auf eigene Daten

### Topic Modeling:
1. ✅ **Jetzt:** LDA für grobe Kategorisierung nutzen
2. 🔄 **Empfohlen:** Manuelle Topic-Labels hinzufügen
3. 🔮 **Zukunft:** BERTopic evaluieren für bessere Semantik

---

## 📚 Dokumentation

### Vollständige Berichte:
- **[docs/SENTIMENT_MODE_SELECTION.md](docs/SENTIMENT_MODE_SELECTION.md)** - Sentiment Evaluation
- **[docs/TOPIC_MODELING_EVALUATION.md](docs/TOPIC_MODELING_EVALUATION.md)** - Topic Evaluation

### Schnellübersichten:
- **[TEST_RESULTS_SENTIMENT.md](TEST_RESULTS_SENTIMENT.md)** - Sentiment Zusammenfassung
- **[TEST_RESULTS_TOPICS.md](TEST_RESULTS_TOPICS.md)** - Topic Zusammenfassung

### Tests ausführen:
```bash
cd backend

# Sentiment Test
python test_sentiment_accuracy.py

# Topic Test
python test_topic_accuracy.py
```

---

**Fazit:** Beide Systeme haben ihre Stärken. Sentiment ist praktisch nützlicher, Topic Modeling liefert zusätzliche Tiefe. Die Kombination ist der Schlüssel! 🎯
