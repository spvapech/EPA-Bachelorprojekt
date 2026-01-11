# Sentiment Analysis - Upgrade Guide

## Überblick

Das Sentiment-Analyse-Modul wurde erweitert und unterstützt jetzt **zwei Modi**:

### 1. **Lexicon-based** (Regelbasiert) - Standard
- ✅ **Schnell** und ohne zusätzliche Dependencies
- ✅ Vordefinierte deutsche Wörter
- ❌ Begrenzt auf bekannte Wörter
- ❌ Versteht keinen Kontext

### 2. **Transformer-based** (Machine Learning) - Neu! 🆕
- ✅ **Lernt automatisch** aus Kontext
- ✅ Erkennt **beliebige Wörter**
- ✅ Versteht Bedeutung und Nuancen
- ✅ Höhere Genauigkeit
- ❌ Benötigt zusätzliche Pakete (transformers, torch)
- ❌ Etwas langsamer

## Installation

### Für Lexicon-Mode (Standard)
```bash
# Keine zusätzlichen Pakete nötig
```

### Für Transformer-Mode (ML-basiert)
```bash
# Mit pip
pip install transformers torch

# Oder mit uv
uv pip install transformers torch
```

## Verwendung

### Basic Usage

```python
from models.sentiment_analyzer import SentimentAnalyzer

# Lexicon-Modus (Standard)
analyzer = SentimentAnalyzer(mode="lexicon")

# Transformer-Modus (ML)
analyzer = SentimentAnalyzer(mode="transformer")

# Analyse
result = analyzer.analyze_sentiment("Das ist ein fantastischer Arbeitgeber!")
print(result)
# {'polarity': 0.95, 'sentiment': 'positive', 'confidence': 0.98}
```

### Modi wechseln

```python
analyzer = SentimentAnalyzer(mode="lexicon")

# Später zu Transformer wechseln
analyzer.set_mode("transformer")
```

### Batch-Analyse

```python
texts = [
    "Großartige Firma!",
    "Schreckliche Erfahrung",
    "Geht so..."
]

results = analyzer.analyze_batch(texts)
summary = analyzer.get_sentiment_summary(results)
```

## Vergleich der Modi

| Feature | Lexicon | Transformer |
|---------|---------|-------------|
| **Geschwindigkeit** | ⚡⚡⚡ Sehr schnell | ⚡⚡ Schnell |
| **Genauigkeit** | ⭐⭐⭐ Gut | ⭐⭐⭐⭐⭐ Exzellent |
| **Dependencies** | ✅ Keine | ❌ transformers, torch |
| **Unbekannte Wörter** | ❌ Nicht erkannt | ✅ Erkannt |
| **Kontext-Verständnis** | ❌ Begrenzt | ✅ Sehr gut |
| **Modellgröße** | ~ 1 KB | ~ 500 MB |

## Test durchführen

```bash
cd backend
python test_sentiment_modes.py
```

Dies zeigt einen direkten Vergleich beider Modi!

## Beispiele

### Lexicon-Mode Limitation

```python
analyzer = SentimentAnalyzer(mode="lexicon")

# Bekanntes Wort: ✓
result = analyzer.analyze_sentiment("Das ist ausgezeichnet!")
# → positive (erkannt: "ausgezeichnet" ist in der Liste)

# Unbekanntes Wort: ✗
result = analyzer.analyze_sentiment("Das ist brillant!")
# → neutral (nicht erkannt: "brillant" fehlt in der Liste)
```

### Transformer-Mode Advantage

```python
analyzer = SentimentAnalyzer(mode="transformer")

# Beide werden korrekt erkannt! ✓
result1 = analyzer.analyze_sentiment("Das ist ausgezeichnet!")
# → positive (Modell versteht die Bedeutung)

result2 = analyzer.analyze_sentiment("Das ist brillant!")
# → positive (Modell lernt aus Kontext!)
```

## Verwendetes Modell

**Transformer-Mode** verwendet:
- **Model**: `oliverguhr/german-sentiment-bert`
- **Basis**: BERT, speziell für deutsche Sentiment-Analyse trainiert
- **Labels**: positive, neutral, negative
- **Training**: Auf deutschen Reviews und Texten

## Performance

### Lexicon-Mode
- ~0.1ms pro Text
- Ideal für Echtzeit-Anwendungen
- Keine GPU nötig

### Transformer-Mode
- ~50-100ms pro Text (CPU)
- ~5-10ms pro Text (GPU)
- Besser für Batch-Verarbeitung

## Integration in bestehenden Code

Der Code ist **vollständig rückwärtskompatibel**! 

```python
# Alt (funktioniert weiterhin)
analyzer = SentimentAnalyzer()
result = analyzer.analyze_sentiment(text)

# Neu (explizit Lexicon)
analyzer = SentimentAnalyzer(mode="lexicon")

# Neu (ML-basiert)
analyzer = SentimentAnalyzer(mode="transformer")
```

## Empfehlung

**Für Entwicklung/Testing**: Lexicon-Mode (schnell, keine Setup-Zeit)

**Für Production**: Transformer-Mode (höhere Genauigkeit)

**Für Echtzeit**: Lexicon-Mode (minimale Latenz)

**Für Batch-Jobs**: Transformer-Mode (beste Qualität)

## Troubleshooting

### Fehler: "transformers library not found"
```bash
pip install transformers torch
```

### Modell lädt zu langsam
Das Modell (~500MB) wird beim ersten Mal heruntergeladen und gecacht.

### Out of Memory
Reduzieren Sie die Batch-Größe oder nutzen Sie Lexicon-Mode.

## Weitere Verbesserungen

Das Transformer-Modell kann auch:
- 🎯 Feinere Sentiment-Abstufungen (sehr positiv, leicht negativ, etc.)
- 🌍 Mehrsprachige Analyse (mit multilingualen Modellen)
- 🎓 Custom Training auf eigenen Daten
- 📊 Emotions-Erkennung (Freude, Wut, Trauer, etc.)

Bei Interesse können diese Features hinzugefügt werden!
