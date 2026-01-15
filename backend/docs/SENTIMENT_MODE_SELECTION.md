# Sentiment Analyse: Modell-Auswahl und Ergebnisse

**Datum:** 15. Januar 2026  
**Autor:** Backend-Team  
**Version:** 1.0

## 📋 Zusammenfassung

Dieses Dokument beschreibt die Entscheidung für die Verwendung von Lexicon- vs. Transformer-basierten Sentiment-Analyse-Modellen in verschiedenen Teilen des Systems und präsentiert die Testergebnisse, die diese Entscheidungen unterstützen.

## 🎯 Modell-Übersicht

### Lexicon-Modus
- **Ansatz:** Regelbasiert mit vordefinierten deutschen Wortlisten
- **Technologie:** Einfache Textverarbeitung mit Wörterbüchern
- **Dependencies:** Keine (nur Python Standard-Library)
- **Geschwindigkeit:** Sehr schnell (~0.001s pro Text)
- **Genauigkeit:** Begrenzt, ca. 27% auf realen Daten

### Transformer-Modus
- **Ansatz:** Machine Learning mit German BERT Model
- **Technologie:** `oliverguhr/german-sentiment-bert`
- **Dependencies:** `transformers` + `torch` (~2GB)
- **Geschwindigkeit:** Langsamer (~0.1s pro Text)
- **Genauigkeit:** Deutlich höher, ca. 48% auf realen Daten

## 📊 Test-Ergebnisse

### Test-Setup
- **Datum:** 15. Januar 2026
- **Datensatz:** 128 echte Mitarbeiter-Bewertungen aus der Datenbank
- **Methode:** Vergleich von explizit positiven ("gut_am_arbeitgeber") und negativen ("schlecht_am_arbeitgeber") Kommentaren
- **Evaluation:** Ground Truth basierend auf Feld-Typ (positive/negative Kommentare)

### Quantitative Ergebnisse

| Metrik | Lexicon | Transformer | Verbesserung |
|--------|---------|-------------|--------------|
| **Gesamt-Genauigkeit** | 27.34% | **48.44%** | **+21.09%** |
| Positive Texte | 9.52% | **44.44%** | **+34.92%** |
| Negative Texte | 44.62% | **52.31%** | **+7.69%** |
| Durchschn. Confidence | 0.308 | **0.943** | **+206%** |
| Durchschn. Polarity | -0.198 | -0.077 | - |

### Wichtige Erkenntnisse

#### ✅ **Transformer ist deutlich überlegen**
- **+21% absolute Verbesserung** in Gesamt-Genauigkeit
- **+35% besser bei positiven Texten** - Lexicon versagt hier fast vollständig
- **+206% höhere Confidence** - Transformer ist sicherer in seinen Vorhersagen
- Bessere Kontextverständnis für komplexe Sätze

#### ⚠️ **Lexicon-Schwächen**
- Erkennt nur **9.52% der positiven Texte** korrekt
- Tendenz zu neutral/negativen Klassifikationen
- Versteht keinen Satzkontext oder Ironie
- Probleme mit zusammengesetzten Aussagen

#### 📈 **Transformer-Stärken**
- Fast **doppelte Genauigkeit** gegenüber Lexicon
- Deutlich bessere Erkennung positiver Sentiments
- Höhere Confidence-Werte zeigen robustere Entscheidungen
- Versteht komplexe Satzstrukturen

### Beispiel-Misklassifikationen

#### Lexicon-Fehler (typisch)
```
Text: "Der Zusammenhalt ist gut. Bezahlung ist top. Das macht einen Jobwechsel so schwer."
Erwartet: positive
Lexicon: neutral ❌
Transformer: positive ✅
```

**Problem:** Lexicon versteht nicht, dass "schwer" hier positiv gemeint ist (wegen guter Bedingungen).

#### Beide Modelle schwierig
```
Text: "Die interessanten Projekte und das Maß an projektinternen Gestaltungsmöglichkeiten."
Erwartet: positive
Beide: neutral
```

**Problem:** Sehr sachlich formuliert ohne explizite Sentiment-Wörter.

## 🎯 Modell-Auswahl im Projekt

### Wo wird Transformer verwendet? ✅

#### 1. Topic Rating Service (`services/topic_rating_service.py`)
```python
self.sentiment_analyzer = SentimentAnalyzer(mode="transformer")
```

**Begründung:**
- ✅ **Business-kritisch:** Rating-Analysen beeinflussen wichtige Entscheidungen
- ✅ **Genauigkeit wichtiger als Geschwindigkeit:** Ergebnisse müssen verlässlich sein
- ✅ **Einzelne Analysen:** Nicht viele Texte gleichzeitig
- ✅ **ROI:** +21% Genauigkeit rechtfertigt längere Verarbeitungszeit

**Anwendungsfall:**
- Analyse von Mitarbeiter-Reviews mit Star-Ratings
- Kombination von Topics, Sentiment und Bewertungen
- Dashboard-Visualisierungen für Management

#### 2. Topic Trends API (`routes/topics.py` - Topic-Trend-Analyse)
```python
sentiment_analyzer = SentimentAnalyzer(mode="transformer")
```

**Begründung:**
- ✅ **Trend-Analysen:** Zeitliche Entwicklung von Sentiments
- ✅ **Strategische Insights:** Für Business-Entscheidungen
- ✅ **Komplexe Texte:** Oft nuancierte Formulierungen
- ✅ **Dashboard-Feature:** Qualität wichtiger als Antwortzeit

**Anwendungsfall:**
- Topic-Sentiment-Trends über Zeit
- Vergleich: Neue vs. alte Reviews
- Delta-Berechnungen für Verbesserungen/Verschlechterungen

#### 3. LDA Topic Model - Einzelne Predictions (`models/lda_topic_model.py`)
```python
def predict_topics(..., sentiment_mode="transformer")
```

**Begründung:**
- ⚖️ **Flexibel:** Parameter-gesteuerte Wahl
- ✅ **Default zu Lexicon:** Für Performance bei Batch
- ✅ **Option für Transformer:** Wenn Genauigkeit gewünscht
- ✅ **API-kontrolliert:** Caller entscheidet basierend auf Use Case

**Anwendungsfall:**
- Einzelne Text-Analysen mit hoher Qualität
- API-Endpoints für präzise Vorhersagen
- On-Demand Analysen

### Wo wird Lexicon verwendet? 🏃‍♂️

#### 1. LDA Topic Model - Batch-Analysen (`models/lda_topic_model.py`)
```python
def analyze_topics_with_sentiment(texts: List[str]):
    sentiment_analyzer = SentimentAnalyzer(mode="lexicon")
```

**Begründung:**
- ⚡ **Performance:** Verarbeitung vieler Texte gleichzeitig
- ⚡ **Geschwindigkeit > Genauigkeit:** Für Überblicks-Analysen akzeptabel
- ⚡ **Skalierbarkeit:** Hunderte Texte in Sekunden
- ⚡ **Resourcen:** Keine GPU/schwere Models nötig

**Anwendungsfall:**
- Batch-Import von Excel-Dateien
- Initiales Modell-Training mit vielen Texten
- Überblicks-Statistiken

**Kompromiss:**
- Akzeptiere **~27% Genauigkeit** für **100x Geschwindigkeit**
- Für grobe Trends ausreichend
- Bei Bedarf: Später mit Transformer verfeinern

## 📈 Performance-Vergleich

| Szenario | Lexicon | Transformer | Empfehlung |
|----------|---------|-------------|------------|
| **Einzelne Review-Analyse** | <0.001s | ~0.1s | ✅ Transformer |
| **100 Reviews** | ~0.1s | ~10s | ⚖️ Situationsabhängig |
| **1000 Reviews (Batch)** | ~1s | ~100s | ✅ Lexicon |
| **Echtzeit-Dashboard** | ✅ | ❌ | ✅ Lexicon (mit Cache) |
| **Offline-Reports** | ✅ | ✅ | ✅ Transformer |
| **Trend-Analysen** | ❌ | ✅ | ✅ Transformer |

## 🔄 Fallback-Strategie

### Automatischer Fallback
Das System implementiert einen automatischen Fallback zu Lexicon, wenn:
- `transformers` Library nicht installiert ist
- Model-Loading fehlschlägt (Speicher, Netzwerk)
- Laufzeit-Fehler im Transformer auftreten

```python
# Aus sentiment_analyzer.py
if mode == "transformer":
    try:
        self._init_transformer()
        self._transformer_available = True
    except Exception as e:
        logger.warning(f"Falling back to lexicon mode: {e}")
        self.mode = "lexicon"
```

### Deployment-Optionen

#### Option A: Transformer in Production (Empfohlen)
```bash
# requirements.txt
transformers>=4.30.0
torch>=2.0.0
```
- ✅ Beste Qualität
- ✅ Alle Features verfügbar
- ❌ Größeres Docker Image (~2GB extra)
- ❌ Mehr RAM benötigt (~1-2GB)

#### Option B: Nur Lexicon
```bash
# requirements.txt
# transformers>=4.30.0  # auskommentiert
# torch>=2.0.0
```
- ✅ Kleines Image (~200MB)
- ✅ Wenig Ressourcen
- ❌ Geringere Qualität (-21%)
- ⚠️ Einige Features eingeschränkt

## 🎓 Lessons Learned

### Was funktioniert gut

1. **Hybride Strategie:** Verschiedene Modelle für verschiedene Use Cases
2. **Fallback-Mechanismus:** Robustheit durch automatischen Fallback
3. **Parameter-Kontrolle:** API-Caller können Mode wählen
4. **Klare Dokumentation:** Wann welches Model verwenden

### Was zu beachten ist

1. **Test-Metrik-Grenzen:** 
   - 27% Lexicon-Genauigkeit klingt schlecht, aber...
   - Datensatz ist sehr schwierig (echte Texte, nicht synthetisch)
   - Viele Texte sind tatsächlich ambivalent/neutral
   - Ground Truth basiert auf Feld-Typ, nicht manueller Annotation

2. **Transformer nicht perfekt:**
   - 48% ist besser als 27%, aber nicht 90%+
   - Komplexe deutsche Sätze bleiben herausfordernd
   - Ironie/Sarkasmus schwierig

3. **Context matters:**
   - Bei Batch-Jobs: Lexicon OK für Trends
   - Bei einzelnen wichtigen Entscheidungen: Transformer nutzen
   - Cache-Strategien können helfen

## 🚀 Empfehlungen

### Für Development
1. ✅ Immer beide Modi testen
2. ✅ Transformer als Standard für neue Features
3. ✅ Performance-Tests bei Batch-Operations
4. ✅ Monitoring der Analyse-Zeiten

### Für Production
1. ✅ Transformer-Dependencies installieren
2. ✅ Model-Cache vorladen beim Startup
3. ✅ Fallback-Logs monitoren
4. ✅ API-Rate-Limiting für Transformer-Endpoints

### Für die Zukunft
1. 🔮 Besseres deutsches Model evaluieren (z.B. GPT-4)
2. 🔮 Fine-tuning auf eigene Review-Daten
3. 🔮 Hybrid: Lexicon für Pre-Filtering, Transformer für Final-Decision
4. 🔮 Sentiment-Caching für häufige Texte

## 📚 Anhang

### Test ausführen
```bash
cd backend
python test_sentiment_accuracy.py
```

### Dependencies installieren
```bash
pip install transformers torch
# oder mit uv:
uv pip install transformers torch
```

### Code-Beispiel
```python
from models.sentiment_analyzer import SentimentAnalyzer

# Für genaue Analyse (z.B. Dashboard)
analyzer = SentimentAnalyzer(mode="transformer")
result = analyzer.analyze_sentiment("Tolle Firma, super Team!")
# → {'sentiment': 'positive', 'confidence': 0.98, ...}

# Für schnelle Batch-Analyse
analyzer = SentimentAnalyzer(mode="lexicon")
results = analyzer.analyze_batch(many_texts)
```

## 📞 Kontakt

Bei Fragen zur Modell-Auswahl oder Test-Ergebnissen:
- GitHub Issues: [gruppe-P1-3/issues](https://github.com/IIS-Bachelorprojekt/gruppe-P1-3/issues)
- Dokumentation: `backend/docs/`

---

**Letzte Aktualisierung:** 15. Januar 2026  
**Nächste Review:** Bei neuen Model-Versionen oder signifikanten Datenänderungen
