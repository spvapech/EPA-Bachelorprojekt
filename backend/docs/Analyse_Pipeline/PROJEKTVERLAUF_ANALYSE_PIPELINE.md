# 📊 Projektverlauf: Analyse-Pipeline & Rating-System - Umfassende Zusammenfassung

**Projekt:** gruppe-P1-3 Backend - Employee & Candidate Review Analysis  
**Zeitraum:** Dezember 2025 - Januar 2026  
**Autor:** Backend-Team  
**Version:** Final  
**Datum:** 16. Januar 2026

---

## 📋 Inhaltsverzeichnis

1. [Übersicht: Das Analyse-System](#übersicht-das-analyse-system)
2. [Datenquellen und Struktur](#datenquellen-und-struktur)
3. [Die drei Analyse-Säulen](#die-drei-analyse-säulen)
4. [Rating-Berechnung im Detail](#rating-berechnung-im-detail)
5. [Analyse-Pipeline Schritt-für-Schritt](#analyse-pipeline-schritt-für-schritt)
6. [Integration und Korrelation](#integration-und-korrelation)
7. [API-Endpoints](#api-endpoints)
8. [Praktische Beispiele](#praktische-beispiele)
9. [Fazit](#fazit)

---

## 🎯 Übersicht: Das Analyse-System

### Was macht das System?

Das Backend-System analysiert **Employee-** und **Candidate-Reviews** aus drei verschiedenen Perspektiven:

1. **📊 Quantitative Bewertung** - Sterne-Ratings (1-5)
2. **📝 Qualitative Analyse** - Text-Reviews
3. **🤖 ML-basierte Insights** - Topics & Sentiment

Diese drei Dimensionen werden **kombiniert**, um ein vollständiges Bild zu erstellen.

### Hauptziele

1. ✅ **Quantitative + Qualitative Daten verbinden**
2. ✅ **Automatische Themen-Erkennung** in Reviews
3. ✅ **Sentiment-Analyse** (positiv/neutral/negativ)
4. ✅ **Korrelationen finden** (z.B. "Gehalt = niedrig bewertet + negatives Sentiment")
5. ✅ **Actionable Insights** für Management

---

## 📊 Datenquellen und Struktur

### 1. Datenbank-Tabellen

Das System nutzt zwei Haupt-Tabellen in **Supabase (PostgreSQL)**:

#### **Employee-Tabelle** (Mitarbeiter-Reviews)

```sql
TABLE employee (
  -- Basis-Informationen
  id SERIAL PRIMARY KEY,
  company_id INTEGER,
  titel VARCHAR,
  datum DATE,
  status VARCHAR,
  
  -- Gesamt-Bewertung
  durchschnittsbewertung DECIMAL(2,1),  -- z.B. 4.3
  gerundete_durchschnittsbewertung INTEGER,  -- z.B. 4
  
  -- Text-Felder (Qualitative Daten)
  gut_am_arbeitgeber_finde_ich TEXT,
  schlecht_am_arbeitgeber_finde_ich TEXT,
  verbesserungsvorschlaege TEXT,
  jobbeschreibung TEXT,
  
  -- Kategorien-Bewertungen (Quantitative Daten)
  sternebewertung_arbeitsatmosphaere DECIMAL(2,1),
  sternebewertung_work_life_balance DECIMAL(2,1),
  sternebewertung_gehalt_sozialleistungen DECIMAL(2,1),
  sternebewertung_karriere_weiterbildung DECIMAL(2,1),
  sternebewertung_kollegenzusammenhalt DECIMAL(2,1),
  sternebewertung_vorgesetztenverhalten DECIMAL(2,1),
  sternebewertung_kommunikation DECIMAL(2,1),
  sternebewertung_interessante_aufgaben DECIMAL(2,1),
  sternebewertung_image DECIMAL(2,1),
  sternebewertung_umwelt_sozialbewusstsein DECIMAL(2,1),
  sternebewertung_umgang_mit_aelteren_kollegen DECIMAL(2,1),
  sternebewertung_arbeitsbedingungen DECIMAL(2,1),
  sternebewertung_gleichberechtigung DECIMAL(2,1),
  
  -- Kategorien-Kommentare (Qualitative Details)
  arbeitsatmosphaere TEXT,
  work_life_balance TEXT,
  gehalt_sozialleistungen TEXT,
  karriere_weiterbildung TEXT,
  kollegenzusammenhalt TEXT,
  vorgesetztenverhalten TEXT,
  kommunikation TEXT,
  interessante_aufgaben TEXT,
  image TEXT,
  umwelt_sozialbewusstsein TEXT,
  umgang_mit_aelteren_kollegen TEXT,
  arbeitsbedingungen TEXT,
  gleichberechtigung TEXT
)
```

**Wichtig:** Pro Kategorie gibt es **zwei Spalten**:
- `sternebewertung_X` = Numerische Bewertung (1-5 Sterne)
- `X` = Text-Kommentar zur Kategorie

#### **Candidates-Tabelle** (Bewerber-Feedback)

```sql
TABLE candidates (
  -- Basis-Informationen
  id SERIAL PRIMARY KEY,
  company_id INTEGER,
  titel VARCHAR,
  datum DATE,
  status VARCHAR,
  
  -- Gesamt-Bewertung
  durchschnittsbewertung DECIMAL(2,1),
  gerundete_durchschnittsbewertung INTEGER,
  
  -- Text-Felder
  stellenbeschreibung TEXT,
  verbesserungsvorschlaege TEXT,
  
  -- Bewerbungsprozess-Bewertungen
  sternebewertung_erklaerung_der_weiteren_schritte DECIMAL(2,1),
  sternebewertung_zufriedenstellende_reaktion DECIMAL(2,1),
  sternebewertung_vollstaendigkeit_der_infos DECIMAL(2,1),
  sternebewertung_zufriedenstellende_antworten DECIMAL(2,1),
  sternebewertung_angenehme_atmosphaere DECIMAL(2,1),
  sternebewertung_professionalitaet_des_gespraechs DECIMAL(2,1),
  sternebewertung_wertschaetzende_behandlung DECIMAL(2,1),
  sternebewertung_erwartbarkeit_des_prozesses DECIMAL(2,1),
  sternebewertung_zeitgerechte_zu_oder_absage DECIMAL(2,1),
  sternebewertung_schnelle_antwort DECIMAL(2,1)
)
```

**Wichtig:** Candidates haben **nur Ratings**, keine separaten Text-Kommentare pro Kategorie.

---

### 2. Datenimport-Prozess

**Quelle:** Excel-Dateien (von kununu, glassdoor, etc.)

**Prozess:**

```
Excel-Datei
    ↓
[1] Excel Upload API
    ↓
[2] Column Normalization
    - Lowercase
    - Umlaute (ä→ae, ö→oe, ü→ue, ß→ss)
    - Spaces → Underscores
    ↓
[3] Sternebewertung-Mapping
    - "Sternebewertung" + nächste Spalte → sternebewertung_<kategorie>
    - Beispiel: [Sternebewertung] [Gehalt/Sozialleistungen]
      → sternebewertung_gehalt_sozialleistungen
    ↓
[4] HTML-Entity-Decoding
    - &lt; → <
    - &gt; → >
    - &amp; → &
    - &quot; → "
    ↓
[5] Supabase-Import
    - Mapping zu DB-Spalten
    - Validation
    - Insert/Update
```

**Code:** `backend/services/excel_service.py`

---

## 🎯 Die drei Analyse-Säulen

Das System kombiniert drei verschiedene Analyse-Methoden:

### 1️⃣ **Sterne-Ratings** (Quantitative Analyse)

**Was:** Numerische Bewertungen von 1-5 Sternen

**Quellen:**
- `durchschnittsbewertung` - Gesamt-Rating
- `sternebewertung_*` - Kategorien-Ratings (13 bei Employee, 10 bei Candidates)

**Vorteile:**
- ✅ Objektiv und vergleichbar
- ✅ Einfach zu aggregieren
- ✅ Trends über Zeit erkennbar

**Nachteile:**
- ⚠️ Keine Details zu "Warum"
- ⚠️ Subjektiv (Was ist "4 Sterne"?)
- ⚠️ Fehlende Nuancen

**Verwendung:**
- Dashboard-Metriken (Durchschnitt, Trend)
- Kategorie-Vergleiche
- Benchmark gegen Konkurrenz
- Zeitreihen-Analysen

---

### 2️⃣ **Topic Modeling** (Themen-Erkennung)

**Was:** Automatische Erkennung von Themen in Text-Reviews mittels LDA

**Quellen:**
- Employee: `gut_am_arbeitgeber_finde_ich`, `schlecht_am_arbeitgeber_finde_ich`, `verbesserungsvorschlaege`
- Candidates: `stellenbeschreibung`, `verbesserungsvorschlaege`
- Alle Kategorien-Kommentare (bei Employee)

**Technologie:** LDA (Latent Dirichlet Allocation) mit Gensim

**Vorteile:**
- ✅ Entdeckt automatisch Themen
- ✅ Keine manuellen Labels nötig
- ✅ Erkennt versteckte Muster
- ✅ Multi-Topic pro Review

**Output:**
```json
{
  "topics": [
    {
      "topic_id": 2,
      "probability": 0.78,
      "top_words": ["team", "kollegen", "zusammenarbeit"]
    },
    {
      "topic_id": 4,
      "probability": 0.42,
      "top_words": ["gehalt", "bezahlung", "verguetung"]
    }
  ]
}
```

**Interpretation:**
- Topic 2 = Team/Kollegen (78% wahrscheinlich)
- Topic 4 = Gehalt (42% wahrscheinlich)

**Verwendung:**
- "Worüber sprechen Reviews?"
- Topic-Trends über Zeit
- Kategorisierung ohne Labels

---

### 3️⃣ **Sentiment-Analyse** (Stimmungserkennung)

**Was:** Erkennt ob Text positiv, neutral oder negativ ist

**Technologie:** 
- **Transformer-Modus:** German BERT Model (oliverguhr/german-sentiment-bert)
- **Lexicon-Modus:** Regelbasierte Wortlisten (Fallback)

**Vorteile:**
- ✅ Erkennt "Wie" etwas gesagt wird
- ✅ Ergänzt Rating-Zahlen
- ✅ Erkennt Kontext ("gut, aber...")

**Output:**
```json
{
  "sentiment": "positive",
  "polarity": 0.75,        // -1.0 (negativ) bis +1.0 (positiv)
  "confidence": 0.94,      // 0.0 bis 1.0
  "subjectivity": 0.55     // 0.0 (objektiv) bis 1.0 (subjektiv)
}
```

**Verwendung:**
- Sentiment pro Review
- Sentiment pro Topic
- Sentiment-Trends
- Positive/Negative Aspekte trennen

---

## 📐 Rating-Berechnung im Detail

### 1. Durchschnittsbewertung

**Formel:**

```
durchschnittsbewertung = Durchschnitt aller Kategorien-Ratings
```

**Beispiel (Employee):**

```python
ratings = [
    4.5,  # arbeitsatmosphaere
    4.0,  # work_life_balance
    3.5,  # gehalt_sozialleistungen
    5.0,  # kollegenzusammenhalt
    4.2,  # karriere_weiterbildung
    4.8,  # vorgesetztenverhalten
    4.0,  # kommunikation
    4.5,  # interessante_aufgaben
    4.3,  # image
    3.8,  # umwelt_sozialbewusstsein
    4.0,  # umgang_mit_aelteren_kollegen
    4.2,  # arbeitsbedingungen
    4.7   # gleichberechtigung
]

durchschnittsbewertung = sum(ratings) / len(ratings)
                       = 54.5 / 13
                       = 4.19
                       ≈ 4.2 (gerundet auf 1 Dezimalstelle)

gerundete_durchschnittsbewertung = round(4.19)
                                  = 4 (Sterne)
```

**Wichtig:**
- Alle 13 Kategorien gleich gewichtet
- Fehlende Ratings werden ignoriert (nicht als 0 gezählt)
- Durchschnitt nur aus vorhandenen Ratings

---

### 2. Overall Sentiment Berechnung

**Formel:**

```
overall_sentiment = Durchschnitt aller Text-Feld-Sentiments
```

**Beispiel:**

```python
# Analyse der 3 Text-Felder
sentiments = [
    {
        'field': 'gut_am_arbeitgeber_finde_ich',
        'polarity': 0.75,  # Positiv
        'sentiment': 'positive'
    },
    {
        'field': 'schlecht_am_arbeitgeber_finde_ich',
        'polarity': -0.60,  # Negativ
        'sentiment': 'negative'
    },
    {
        'field': 'verbesserungsvorschlaege',
        'polarity': 0.20,  # Leicht positiv
        'sentiment': 'positive'
    }
]

# Durchschnitt berechnen
avg_polarity = (0.75 + (-0.60) + 0.20) / 3
             = 0.35 / 3
             = 0.117

# Klassifizierung
if avg_polarity > 0.1:
    overall_sentiment = 'positive'
elif avg_polarity < -0.1:
    overall_sentiment = 'negative'
else:
    overall_sentiment = 'neutral'

# Ergebnis: 'positive' (0.117 > 0.1)
```

**Schwellwerte:**
- `> 0.1` → positive
- `< -0.1` → negative
- `-0.1 bis 0.1` → neutral

---

### 3. Topic-Summary Berechnung

**Formel:**

```
Für jedes Topic:
  - mention_count = Wie oft erwähnt?
  - avg_probability = Durchschnitt aller Wahrscheinlichkeiten
```

**Beispiel:**

```python
# Review hat 3 Text-Felder analysiert
text_analyses = [
    {
        'field': 'gut_am_arbeitgeber_finde_ich',
        'topics': [
            {'topic_id': 2, 'probability': 0.78},
            {'topic_id': 4, 'probability': 0.42}
        ]
    },
    {
        'field': 'schlecht_am_arbeitgeber_finde_ich',
        'topics': [
            {'topic_id': 4, 'probability': 0.65},
            {'topic_id': 1, 'probability': 0.35}
        ]
    },
    {
        'field': 'verbesserungsvorschlaege',
        'topics': [
            {'topic_id': 2, 'probability': 0.55}
        ]
    }
]

# Aggregation
topic_counts = {
    2: {'mentions': 2, 'total_prob': 0.78 + 0.55},
    4: {'mentions': 2, 'total_prob': 0.42 + 0.65},
    1: {'mentions': 1, 'total_prob': 0.35}
}

# Topic-Summary erstellen
topics_summary = [
    {
        'topic_id': 2,
        'mentions': 2,
        'avg_probability': (0.78 + 0.55) / 2 = 0.665
    },
    {
        'topic_id': 4,
        'mentions': 2,
        'avg_probability': (0.42 + 0.65) / 2 = 0.535
    },
    {
        'topic_id': 1,
        'mentions': 1,
        'avg_probability': 0.35
    }
]

# Sortiert nach avg_probability (absteigend)
# Ergebnis: [Topic 2 (0.665), Topic 4 (0.535), Topic 1 (0.35)]
```

---

## 🔄 Analyse-Pipeline Schritt-für-Schritt

### Vollständiger Analyse-Ablauf

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DATEN LADEN                                              │
├─────────────────────────────────────────────────────────────┤
│ • Query Supabase employee/candidates Tabelle               │
│ • Optional: Filter nach company_id                          │
│ • Optional: Limit für Performance                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. FÜR JEDES REVIEW                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐              │
│  │ 2a. TEXT-FELDER ANALYSIEREN             │              │
│  ├─────────────────────────────────────────┤              │
│  │ Für jedes Text-Feld:                    │              │
│  │   • gut_am_arbeitgeber_finde_ich        │              │
│  │   • schlecht_am_arbeitgeber_finde_ich   │              │
│  │   • verbesserungsvorschlaege            │              │
│  │                                          │              │
│  │ → LDA Topic Modeling                    │              │
│  │   Input: Text                            │              │
│  │   Output: Topics + Probabilities         │              │
│  │                                          │              │
│  │ → Sentiment-Analyse                      │              │
│  │   Input: Text                            │              │
│  │   Output: Sentiment + Polarity           │              │
│  └─────────────────────────────────────────┘              │
│                      ↓                                      │
│  ┌─────────────────────────────────────────┐              │
│  │ 2b. RATINGS EXTRAHIEREN                 │              │
│  ├─────────────────────────────────────────┤              │
│  │ • durchschnittsbewertung                │              │
│  │ • sternebewertung_arbeitsatmosphaere    │              │
│  │ • sternebewertung_work_life_balance     │              │
│  │ • ... (alle 13 Kategorien)              │              │
│  └─────────────────────────────────────────┘              │
│                      ↓                                      │
│  ┌─────────────────────────────────────────┐              │
│  │ 2c. AGGREGATIONEN                        │              │
│  ├─────────────────────────────────────────┤              │
│  │ • Overall Sentiment berechnen           │              │
│  │   (Durchschnitt aller Text-Sentiments)  │              │
│  │                                          │              │
│  │ • Topics Summary erstellen               │              │
│  │   (Häufigkeit + Avg Probability)         │              │
│  └─────────────────────────────────────────┘              │
│                      ↓                                      │
│  ┌─────────────────────────────────────────┐              │
│  │ 2d. REVIEW-ANALYSIS OBJEKT              │              │
│  ├─────────────────────────────────────────┤              │
│  │ {                                        │              │
│  │   id: 123,                               │              │
│  │   durchschnittsbewertung: 4.2,          │              │
│  │   text_analyses: [...],                  │              │
│  │   ratings: {...},                        │              │
│  │   overall_sentiment: {...},              │              │
│  │   topics_summary: [...]                  │              │
│  │ }                                        │              │
│  └─────────────────────────────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. RÜCKGABE                                                 │
├─────────────────────────────────────────────────────────────┤
│ {                                                           │
│   total_reviews: 150,                                       │
│   reviews: [review_analysis_1, review_analysis_2, ...]     │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

### Code-Flow (Detailliert)

**Service:** `TopicRatingAnalyzer` in `topic_rating_service.py`

```python
class TopicRatingAnalyzer:
    def __init__(self):
        self.db = TopicModelDatabase()
        # Transformer für beste Genauigkeit
        self.sentiment_analyzer = SentimentAnalyzer(mode="transformer")
    
    def analyze_employee_reviews_with_ratings(self, lda_model, limit=None):
        # 1. Daten laden
        query = self.db.supabase.table('employee').select('*')
        if limit:
            query = query.limit(limit)
        response = query.execute()
        reviews = response.data
        
        # 2. Für jedes Review
        analyzed_reviews = []
        for review in reviews:
            # 2a. Basis-Info extrahieren
            review_analysis = {
                'id': review.get('id'),
                'titel': review.get('titel'),
                'datum': review.get('datum'),
                'durchschnittsbewertung': review.get('durchschnittsbewertung'),
                'text_analyses': [],
                'ratings': {},
                'overall_sentiment': None,
                'topics_summary': []
            }
            
            # 2b. Text-Felder analysieren
            text_fields = [
                'gut_am_arbeitgeber_finde_ich',
                'schlecht_am_arbeitgeber_finde_ich',
                'verbesserungsvorschlaege'
            ]
            
            all_sentiments = []
            all_topics = []
            
            for field in text_fields:
                text = review.get(field)
                if text and text.strip():
                    # LDA Topics
                    topics = lda_model.predict_topics(text, threshold=0.1)
                    
                    # Sentiment
                    sentiment = self.sentiment_analyzer.analyze_sentiment(text)
                    all_sentiments.append(sentiment)
                    
                    # Speichern
                    review_analysis['text_analyses'].append({
                        'field': field,
                        'text_preview': text[:100] + '...',
                        'topics': topics,
                        'sentiment': sentiment,
                        'dominant_topic': topics[0]['topic_id'] if topics else None
                    })
                    
                    all_topics.extend(topics)
            
            # 2c. Overall Sentiment berechnen
            if all_sentiments:
                avg_polarity = sum(s['polarity'] for s in all_sentiments) / len(all_sentiments)
                
                if avg_polarity > 0.1:
                    overall_sentiment = 'positive'
                elif avg_polarity < -0.1:
                    overall_sentiment = 'negative'
                else:
                    overall_sentiment = 'neutral'
                
                review_analysis['overall_sentiment'] = {
                    'sentiment': overall_sentiment,
                    'avg_polarity': float(avg_polarity),
                    'avg_subjectivity': float(avg_subjectivity)
                }
            
            # 2d. Ratings extrahieren
            rating_fields = {
                'arbeitsatmosphaere': 'sternebewertung_arbeitsatmosphaere',
                'work_life_balance': 'sternebewertung_work_life_balance',
                'gehalt_sozialleistungen': 'sternebewertung_gehalt_sozialleistungen',
                # ... weitere 10 Kategorien
            }
            
            for category, field_name in rating_fields.items():
                rating = review.get(field_name)
                if rating is not None:
                    review_analysis['ratings'][category] = float(rating)
            
            # 2e. Topics Summary
            if all_topics:
                topic_counts = {}
                for topic_data in all_topics:
                    topic_id = topic_data['topic_id']
                    prob = topic_data['probability']
                    
                    if topic_id not in topic_counts:
                        topic_counts[topic_id] = {'count': 0, 'total_prob': 0.0}
                    
                    topic_counts[topic_id]['count'] += 1
                    topic_counts[topic_id]['total_prob'] += prob
                
                review_analysis['topics_summary'] = [
                    {
                        'topic_id': topic_id,
                        'mentions': data['count'],
                        'avg_probability': data['total_prob'] / data['count']
                    }
                    for topic_id, data in topic_counts.items()
                ]
                
                # Sortieren nach Wahrscheinlichkeit
                review_analysis['topics_summary'].sort(
                    key=lambda x: x['avg_probability'], 
                    reverse=True
                )
            
            analyzed_reviews.append(review_analysis)
        
        # 3. Rückgabe
        return {
            'total_reviews': len(analyzed_reviews),
            'reviews': analyzed_reviews
        }
```

---

## 🔗 Integration und Korrelation

### Topic-Rating-Korrelation

**Ziel:** Verstehen welche Topics mit welchen Ratings korrelieren

**Methode:**

```
Für jedes Topic:
  1. Sammle alle Reviews, die dieses Topic erwähnen
  2. Extrahiere deren Ratings
  3. Berechne Durchschnitt
  4. Zähle Sentiment-Verteilung
```

**Code:**

```python
def get_topic_rating_correlation(self, lda_model, limit=None):
    # 1. Alle Reviews analysieren
    analysis = self.analyze_employee_reviews_with_ratings(lda_model, limit)
    
    # 2. Aggregiere nach Topic
    topic_stats = {}
    
    for review in analysis['reviews']:
        avg_rating = review.get('durchschnittsbewertung')
        sentiment = review.get('overall_sentiment')
        
        for topic_summary in review.get('topics_summary', []):
            topic_id = topic_summary['topic_id']
            
            # Initialisiere Topic-Stats
            if topic_id not in topic_stats:
                topic_stats[topic_id] = {
                    'topic_id': topic_id,
                    'mention_count': 0,
                    'ratings': [],
                    'sentiments': {'positive': 0, 'neutral': 0, 'negative': 0}
                }
            
            # Zähle Erwähnungen
            topic_stats[topic_id]['mention_count'] += topic_summary['mentions']
            
            # Sammle Rating
            if avg_rating is not None:
                topic_stats[topic_id]['ratings'].append(float(avg_rating))
            
            # Zähle Sentiment
            if sentiment:
                sentiment_type = sentiment.get('sentiment', 'neutral')
                topic_stats[topic_id]['sentiments'][sentiment_type] += 1
    
    # 3. Berechne Durchschnitte
    for topic_id, stats in topic_stats.items():
        if stats['ratings']:
            stats['avg_rating'] = sum(stats['ratings']) / len(stats['ratings'])
        
        # Hole Topic-Wörter vom LDA-Model
        topic_words = lda_model.lda_model.show_topic(topic_id, 5)
        stats['top_words'] = [
            {'word': word, 'weight': float(weight)}
            for word, weight in topic_words
        ]
    
    # 4. Sortiere nach Häufigkeit
    topic_list = list(topic_stats.values())
    topic_list.sort(key=lambda x: x['mention_count'], reverse=True)
    
    return {
        'total_topics': len(topic_list),
        'topics': topic_list
    }
```

**Beispiel-Output:**

```json
{
  "total_topics": 5,
  "topics": [
    {
      "topic_id": 2,
      "mention_count": 85,
      "avg_rating": 4.3,
      "ratings": [4.5, 4.2, 4.8, 3.9, 4.1, ...],
      "sentiments": {
        "positive": 70,
        "neutral": 12,
        "negative": 3
      },
      "top_words": [
        {"word": "team", "weight": 0.045},
        {"word": "kollegen", "weight": 0.038},
        {"word": "zusammenarbeit", "weight": 0.032}
      ]
    },
    {
      "topic_id": 4,
      "mention_count": 72,
      "avg_rating": 2.8,
      "ratings": [2.5, 3.0, 2.2, 3.5, 2.1, ...],
      "sentiments": {
        "positive": 15,
        "neutral": 20,
        "negative": 37
      },
      "top_words": [
        {"word": "gehalt", "weight": 0.052},
        {"word": "bezahlung", "weight": 0.041},
        {"word": "verguetung", "weight": 0.035}
      ]
    }
  ]
}
```

**Interpretation:**

**Topic 2 (Team):**
- ✅ 85 Erwähnungen (sehr häufig)
- ✅ Ø 4.3 Sterne (gut!)
- ✅ 70 positive, 3 negative (überwiegend positiv)
- 💡 **Insight:** Team ist eine Stärke!

**Topic 4 (Gehalt):**
- ⚠️ 72 Erwähnungen (häufig)
- ❌ Ø 2.8 Sterne (schlecht!)
- ❌ 37 negative, 15 positive (überwiegend negativ)
- 💡 **Insight:** Gehalt ist ein Problem!

---

## 🌐 API-Endpoints

### 1. Employee-Reviews analysieren

**Endpoint:** `GET /api/topics/analyze/employee-reviews-with-ratings`

**Parameter:**
- `limit` (optional): Maximale Anzahl Reviews

**Request:**
```bash
curl "http://localhost:8000/api/topics/analyze/employee-reviews-with-ratings?limit=50"
```

**Response:**
```json
{
  "status": "success",
  "analysis": {
    "total_reviews": 50,
    "reviews": [
      {
        "id": 123,
        "titel": "Guter Arbeitgeber mit Verbesserungspotenzial",
        "datum": "2024-01-15",
        "durchschnittsbewertung": 4.2,
        "text_analyses": [
          {
            "field": "gut_am_arbeitgeber_finde_ich",
            "text_preview": "Das Team ist super und die Work-Life-Balance stimmt...",
            "topics": [
              {"topic_id": 2, "probability": 0.78}
            ],
            "sentiment": {
              "polarity": 0.75,
              "sentiment": "positive",
              "confidence": 0.94
            },
            "dominant_topic": 2
          },
          {
            "field": "schlecht_am_arbeitgeber_finde_ich",
            "text_preview": "Das Gehalt könnte besser sein...",
            "topics": [
              {"topic_id": 4, "probability": 0.65}
            ],
            "sentiment": {
              "polarity": -0.45,
              "sentiment": "negative",
              "confidence": 0.88
            },
            "dominant_topic": 4
          }
        ],
        "ratings": {
          "arbeitsatmosphaere": 4.5,
          "work_life_balance": 4.0,
          "gehalt_sozialleistungen": 3.0,
          "kollegenzusammenhalt": 5.0,
          "karriere_weiterbildung": 4.2
        },
        "overall_sentiment": {
          "sentiment": "positive",
          "avg_polarity": 0.15,
          "avg_subjectivity": 0.42
        },
        "topics_summary": [
          {
            "topic_id": 2,
            "mentions": 1,
            "avg_probability": 0.78
          },
          {
            "topic_id": 4,
            "mentions": 1,
            "avg_probability": 0.65
          }
        ]
      }
    ]
  }
}
```

---

### 2. Candidate-Reviews analysieren

**Endpoint:** `GET /api/topics/analyze/candidate-reviews-with-ratings`

**Ähnlich wie Employee, aber:**
- Text-Felder: `stellenbeschreibung`, `verbesserungsvorschlaege`
- Ratings: Bewerbungsprozess-Kategorien (10 statt 13)

---

### 3. Topic-Rating-Korrelation

**Endpoint:** `GET /api/topics/analyze/topic-rating-correlation`

**Request:**
```bash
curl "http://localhost:8000/api/topics/analyze/topic-rating-correlation?limit=100"
```

**Response:**
```json
{
  "status": "success",
  "correlation": {
    "total_topics": 5,
    "topics": [
      {
        "topic_id": 2,
        "mention_count": 85,
        "avg_rating": 4.3,
        "sentiments": {
          "positive": 70,
          "neutral": 12,
          "negative": 3
        },
        "top_words": [
          {"word": "team", "weight": 0.045},
          {"word": "kollegen", "weight": 0.038}
        ]
      }
    ],
    "summary": {
      "total_reviews_analyzed": 150
    }
  }
}
```

---

### 4. Einzelnen Text analysieren

**Endpoint:** `POST /api/topics/predict-with-sentiment`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/topics/predict-with-sentiment" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Die Work-Life-Balance ist ausgezeichnet und das Team ist super!",
    "threshold": 0.1
  }'
```

**Response:**
```json
{
  "status": "success",
  "text_preview": "Die Work-Life-Balance ist ausgezeichnet und das Team ist super!",
  "topics": [
    {
      "topic_id": 2,
      "probability": 0.82,
      "sentiment": {
        "polarity": 0.88,
        "sentiment": "positive",
        "confidence": 0.96
      },
      "top_words": [
        {"word": "team", "weight": 0.045},
        {"word": "work_life_balance", "weight": 0.038}
      ]
    }
  ]
}
```

---

### 5. Company-spezifische Analysen

**Endpoints:**
- `GET /api/analytics/company/{company_id}/overview`
- `GET /api/analytics/company/{company_id}/timeline`
- `GET /api/analytics/company/{company_id}/category-ratings`

**Features:**
- Filtern nach company_id
- Dashboard-Metriken
- Zeitreihen-Daten
- Kategorie-Vergleiche

---

## 💡 Praktische Beispiele

### Beispiel 1: Problem-Bereich identifizieren

**Szenario:** Management will wissen: "Was läuft schlecht?"

**Analyse:**

```json
// Topic 4 (Gehalt)
{
  "topic_id": 4,
  "mention_count": 72,              // Häufig erwähnt
  "avg_rating": 2.8,                // NIEDRIG!
  "sentiments": {
    "positive": 15,
    "neutral": 20,
    "negative": 37                   // Überwiegend negativ
  },
  "top_words": [
    {"word": "gehalt", "weight": 0.052},
    {"word": "bezahlung", "weight": 0.041},
    {"word": "unterbezahlt", "weight": 0.028}
  ]
}
```

**Insight:**
- 🔴 **Problem:** Gehalt ist kritischer Punkt
- 📊 **Daten:** 72 Erwähnungen, Ø 2.8 Sterne
- 💭 **Sentiment:** 37 negative vs. 15 positive
- 💡 **Action:** Gehaltsstruktur überprüfen

---

### Beispiel 2: Stärke für Marketing

**Szenario:** HR will Stärken für Stellenanzeigen

**Analyse:**

```json
// Topic 2 (Team)
{
  "topic_id": 2,
  "mention_count": 85,              // Sehr häufig erwähnt
  "avg_rating": 4.3,                // GUT!
  "sentiments": {
    "positive": 70,                  // Überwiegend positiv
    "neutral": 12,
    "negative": 3
  },
  "top_words": [
    {"word": "team", "weight": 0.045},
    {"word": "kollegen", "weight": 0.038},
    {"word": "zusammenarbeit", "weight": 0.032},
    {"word": "atmosphaere", "weight": 0.028}
  ]
}
```

**Insight:**
- ✅ **Stärke:** Team & Zusammenarbeit
- 📊 **Daten:** 85 Erwähnungen, Ø 4.3 Sterne
- 💭 **Sentiment:** 70 positive, nur 3 negative
- 💡 **Action:** In Stellenanzeigen hervorheben!

**Marketing-Text:**
> "Werden Sie Teil unseres **starken Teams** mit hervorragender **Zusammenarbeit** und **positiver Arbeitsatmosphäre**. Mit durchschnittlich **4.3 Sternen** von unseren Mitarbeitern bewertet!"

---

### Beispiel 3: Gemischtes Review verstehen

**Szenario:** Review hat 4.0 Sterne, aber negative Kommentare

**Review-Daten:**

```json
{
  "id": 456,
  "durchschnittsbewertung": 4.0,
  "ratings": {
    "arbeitsatmosphaere": 4.5,
    "work_life_balance": 4.5,
    "gehalt_sozialleistungen": 2.5,  // Niedrig!
    "kollegenzusammenhalt": 5.0,
    "karriere_weiterbildung": 4.0
  },
  "text_analyses": [
    {
      "field": "gut_am_arbeitgeber_finde_ich",
      "text": "Super Team, tolle Atmosphäre...",
      "sentiment": {"sentiment": "positive", "polarity": 0.75},
      "topics": [{"topic_id": 2, "probability": 0.82}]
    },
    {
      "field": "schlecht_am_arbeitgeber_finde_ich",
      "text": "Gehalt ist zu niedrig für die Branche...",
      "sentiment": {"sentiment": "negative", "polarity": -0.65},
      "topics": [{"topic_id": 4, "probability": 0.78}]
    }
  ],
  "overall_sentiment": {
    "sentiment": "positive",
    "avg_polarity": 0.05              // Fast neutral (gemischt!)
  }
}
```

**Interpretation:**

1. **Ratings:** Ø 4.0 Sterne (gut)
   - Aber: Gehalt nur 2.5 Sterne
   - Rest: 4.0-5.0 Sterne

2. **Text-Analyse:**
   - Positive: Team, Atmosphäre (Topic 2)
   - Negative: Gehalt (Topic 4)

3. **Sentiment:** Fast neutral (0.05) wegen Gegensätze

**Insight:**
- ✅ Team & Atmosphäre = Stärken
- ❌ Gehalt = Problem
- 💡 **Action:** Gehalt anpassen, um aus 4.0 → 4.5+ zu kommen

---

### Beispiel 4: Trend-Analyse über Zeit

**Szenario:** Hat sich die Work-Life-Balance verbessert?

**Daten:**

```json
// Q1 2024
{
  "topic_id": 3,  // Work-Life-Balance
  "period": "2024-Q1",
  "mention_count": 45,
  "avg_rating": 3.2,
  "sentiments": {"positive": 15, "neutral": 20, "negative": 10}
}

// Q4 2024
{
  "topic_id": 3,
  "period": "2024-Q4",
  "mention_count": 38,
  "avg_rating": 4.1,
  "sentiments": {"positive": 28, "neutral": 8, "negative": 2}
}
```

**Interpretation:**
- 📈 **Rating:** 3.2 → 4.1 (+0.9) ✅
- 📈 **Positive Sentiment:** 15 → 28 (+87%) ✅
- 📉 **Negative Sentiment:** 10 → 2 (-80%) ✅
- 💡 **Insight:** Maßnahmen haben gewirkt!

**Management-Report:**
> "Die Einführung von Homeoffice und flexiblen Arbeitszeiten zeigt Wirkung: Die Work-Life-Balance-Bewertung stieg von **3.2 auf 4.1 Sterne** (+28%). Positive Erwähnungen verdoppelten sich, negative Kommentare gingen um 80% zurück."

---

## 🎯 Fazit

### Was leistet das System?

Das Analyse-System kombiniert erfolgreich **drei Dimensionen**:

1. **📊 Quantitative Metriken**
   - Sterne-Ratings (objektiv, vergleichbar)
   - Durchschnitte und Trends
   - Kategorie-Breakdowns

2. **📝 Qualitative Insights**
   - Text-Reviews (Details, Kontext)
   - Kategorien-Kommentare
   - Verbesserungsvorschläge

3. **🤖 ML-basierte Analyse**
   - Topic Modeling (Was wird diskutiert?)
   - Sentiment-Analyse (Wie wird es bewertet?)
   - Korrelationen (Was hängt zusammen?)

### Stärken des Systems

**✅ Vollständiges Bild:**
- Zahlen (Ratings) + Texte (Reviews) + ML (Topics/Sentiment)
- Keine Dimension steht alleine

**✅ Actionable Insights:**
- Problem-Bereiche identifizieren (niedriges Rating + negatives Sentiment)
- Stärken für Marketing (hohes Rating + positives Sentiment)
- Trends erkennen (zeitliche Entwicklung)

**✅ Automatisiert:**
- Kein manuelles Labeling nötig
- Skalierbar auf tausende Reviews
- Echtzeit-Analysen möglich

**✅ Flexibel:**
- Company-spezifisch filtern
- Zeiträume anpassen
- Verschiedene Aggregationslevel

### Praktische Anwendungen

**Für Management:**
- Dashboard mit Key Metrics
- Problem-Bereiche priorisieren
- ROI von Maßnahmen messen

**Für HR:**
- Recruiting-Marketing (Stärken kommunizieren)
- Onboarding-Verbesserungen (häufige Themen)
- Exit-Interview-Analyse

**Für Produktmanagement:**
- Feature-Requests erkennen (Verbesserungsvorschläge)
- User Pain Points (negative Topics)
- Satisfaction Tracking

### Limitationen

**⚠️ Ground Truth:**
- Ratings sind subjektiv
- Sentiment-Analyse nicht perfekt (48% Accuracy)
- Topics nicht immer klar interpretierbar

**⚠️ Datenqualität:**
- HTML-Entities müssen bereinigt werden
- Fehlende Ratings (NULL-Werte)
- Kurze/generische Texte schwierig

**⚠️ Performance:**
- Transformer-Sentiment 100x langsamer als Lexicon
- LDA-Training bei vielen Texten zeitaufwendig
- API-Response-Zeit bei vielen Reviews

### Empfehlungen

**Sofort:**
1. ✅ Dashboard mit Topic-Rating-Korrelation
2. ✅ Alerting bei kritischen Topics (<3.0 Sterne)
3. ✅ Export-Funktion für Reports

**Kurzfristig:**
4. ✅ Zeitreihen-Visualisierung (Trends)
5. ✅ Competitor-Vergleich (Benchmark)
6. ✅ Aspect-Based Sentiment (pro Kategorie)

**Mittelfristig:**
7. ✅ Predictive Analytics (Forecast)
8. ✅ Anomalie-Erkennung (plötzliche Änderungen)
9. ✅ Automatische Zusammenfassungen (LLM)

---

## 📚 Weitere Dokumentation

**Technische Details:**
- [TOPIC_RATING_ANALYSIS.md](TOPIC_RATING_ANALYSIS.md) - API-Dokumentation
- [TOPIC_RATING_IMPLEMENTATION.md](TOPIC_RATING_IMPLEMENTATION.md) - Implementation Guide
- [RATING_CRITERIA_INTEGRATION.md](RATING_CRITERIA_INTEGRATION.md) - Bewertungskriterien

**Analyse-Komponenten:**
- [PROJEKTVERLAUF_LDA_ZUSAMMENFASSUNG.md](PROJEKTVERLAUF_LDA_ZUSAMMENFASSUNG.md) - LDA Topic Modeling
- [PROJEKTVERLAUF_SENTIMENT_ZUSAMMENFASSUNG.md](PROJEKTVERLAUF_SENTIMENT_ZUSAMMENFASSUNG.md) - Sentiment-Analyse

**Code:**
- `backend/services/topic_rating_service.py` - Haupt-Service
- `backend/routes/analytics.py` - Analytics-Endpoints
- `backend/models/lda_topic_model.py` - Topic Modeling
- `backend/models/sentiment_analyzer.py` - Sentiment-Analyse

---

## 👥 Credits

**Entwickelt von:** Backend-Team, gruppe-P1-3  
**Zeitraum:** Dezember 2025 - Januar 2026  
**Technologien:** FastAPI, Supabase, Gensim (LDA), BERT (Sentiment), Python 3.11+

---

**Stand:** 16. Januar 2026  
**Version:** 1.0 Final

---

## 📝 Appendix: Vollständiges Beispiel

### End-to-End Beispiel

```bash
# 1. Modell trainieren
curl -X POST "http://localhost:8000/api/topics/train" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "employee",
    "num_topics": 5,
    "limit": 1000
  }'

# Response: {"status": "success", "message": "Model trained successfully"}

# 2. Employee-Reviews analysieren
curl "http://localhost:8000/api/topics/analyze/employee-reviews-with-ratings?limit=10"

# Response: 
{
  "status": "success",
  "analysis": {
    "total_reviews": 10,
    "reviews": [
      {
        "id": 123,
        "durchschnittsbewertung": 4.2,
        "text_analyses": [...],
        "ratings": {...},
        "overall_sentiment": {...},
        "topics_summary": [...]
      }
    ]
  }
}

# 3. Topic-Rating-Korrelation
curl "http://localhost:8000/api/topics/analyze/topic-rating-correlation?limit=100"

# Response:
{
  "status": "success",
  "correlation": {
    "total_topics": 5,
    "topics": [
      {
        "topic_id": 2,
        "mention_count": 85,
        "avg_rating": 4.3,
        "sentiments": {"positive": 70, "neutral": 12, "negative": 3},
        "top_words": [
          {"word": "team", "weight": 0.045},
          {"word": "kollegen", "weight": 0.038}
        ]
      },
      {
        "topic_id": 4,
        "mention_count": 72,
        "avg_rating": 2.8,
        "sentiments": {"positive": 15, "neutral": 20, "negative": 37},
        "top_words": [
          {"word": "gehalt", "weight": 0.052},
          {"word": "bezahlung", "weight": 0.041}
        ]
      }
    ]
  }
}

# 4. Einzelnen Text testen
curl -X POST "http://localhost:8000/api/topics/predict-with-sentiment" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Das Team ist super, aber das Gehalt ist zu niedrig",
    "threshold": 0.1
  }'

# Response:
{
  "status": "success",
  "topics": [
    {
      "topic_id": 2,
      "probability": 0.62,
      "sentiment": {"sentiment": "positive", "polarity": 0.55}
    },
    {
      "topic_id": 4,
      "probability": 0.58,
      "sentiment": {"sentiment": "negative", "polarity": -0.45}
    }
  ]
}
```

**Interpretation:**
- Review diskutiert 2 Topics: Team (positiv) + Gehalt (negativ)
- System erkennt beide Aspekte korrekt
- Korrelation zeigt: Team = Stärke (4.3⭐), Gehalt = Problem (2.8⭐)

---

**Ende des Dokuments**
