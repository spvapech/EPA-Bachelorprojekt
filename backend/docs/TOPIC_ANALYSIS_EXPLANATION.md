# 📊 Topic-Analyse - Detaillierte Funktionsweise

## 🎯 Überblick

Die Topic-Analyse extrahiert automatisch Themen aus Mitarbeiter- und Kandidaten-Bewertungen und berechnet deren durchschnittliche Bewertung, Sentiment und Häufigkeit.

---

## 🗄️ Datenbank-Struktur

### **Tabelle: `candidates`** (Kandidaten-Bewertungen)

**Bewertungsfelder:**
- `durchschnittsbewertung` - Gesamtbewertung (1.00 - 5.00)
- 10 Kategorie-Bewertungen: `sternebewertung_*`

**Textfelder:**
- `titel` - Titel der Bewertung
- `stellenbeschreibung` - Beschreibung der Stelle
- `verbesserungsvorschlaege` - Verbesserungsvorschläge

**Meta-Daten:**
- `datum` - Datum der Bewertung
- `company_id` - Zugehörige Firma

### **Tabelle: `employee`** (Mitarbeiter-Bewertungen)

**Bewertungsfelder:**
- `durchschnittsbewertung` - Gesamtbewertung (1.00 - 5.00)
- 13 Kategorie-Bewertungen: `sternebewertung_*`
  - `sternebewertung_arbeitsatmosphaere`
  - `sternebewertung_work_life_balance`
  - `sternebewertung_karriere_weiterbildung`
  - `sternebewertung_gehalt_sozialleistungen`
  - `sternebewertung_kollegenzusammenhalt`
  - `sternebewertung_vorgesetztenverhalten`
  - `sternebewertung_kommunikation`
  - `sternebewertung_arbeitsbedingungen`
  - und weitere...

**Textfelder:**
- `titel` - Titel der Bewertung
- `jobbeschreibung` - Jobbeschreibung
- `gut_am_arbeitgeber_finde_ich` - Positive Kommentare
- `schlecht_am_arbeitgeber_finde_ich` - Negative Kommentare
- `verbesserungsvorschlaege` - Verbesserungsvorschläge

**Meta-Daten:**
- `datum` - Datum der Bewertung
- `company_id` - Zugehörige Firma

---

## 🔍 Topic-Definitionen

Die Analyse verwendet **7 vordefinierte Topics** mit spezifischen Keywords und zugeordneten Datenbank-Kategorien:

### **1. Work-Life Balance** 🕐

**Keywords (Regex-Patterns):**
```regex
\bwork[\s-]*life[\s-]*balance\b
\büberstunden\b
\barbeitszeit\b
\burlaub\b
\bfreizeit\b
\bprivatleben\b
\bflexibilität\b
\bhomeoffice\b
\berreichbarkeit\b
```

**Zugeordnete DB-Kategorien:**
- `employee.sternebewertung_work_life_balance`

---

### **2. Führungsqualität** 👔

**Keywords:**
```regex
\bführung\b
\bmanagement\b
\bvorgesetzte\b
\bchef\b
\bleitung\b
\bführungskräfte\b
\bvorgesetztenverhalten\b
\bkompetenz\b
\bentscheidung\b
```

**Zugeordnete DB-Kategorien:**
- `employee.sternebewertung_vorgesetztenverhalten`

---

### **3. Gehalt & Benefits** 💰

**Keywords:**
```regex
\bgehalt\b
\bbezahlung\b
\blohn\b
\bvergütung\b
\bbenefits\b
\bsozialleistungen\b
\baltersvorsorge\b
\bprämie\b
\bbonus\b
```

**Zugeordnete DB-Kategorien:**
- `employee.sternebewertung_gehalt_sozialleistungen`

---

### **4. Teamzusammenhalt** 🤝

**Keywords:**
```regex
\bteam\b
\bkollegen\b
\bzusammenhalt\b
\bkollegenzusammenhalt\b
\batmosphäre\b
\barbeitsatmosphäre\b
\bzusammenarbeit\b
\bgemeinschaft\b
```

**Zugeordnete DB-Kategorien (2!):**
- `employee.sternebewertung_kollegenzusammenhalt`
- `employee.sternebewertung_arbeitsatmosphaere`

---

### **5. Karriereentwicklung** 📈

**Keywords:**
```regex
\bkarriere\b
\bweiterbildung\b
\bentwicklung\b
\baufstieg\b
\bförderung\b
\bschulungen\b
\bbeförderung\b
\bperspektive\b
```

**Zugeordnete DB-Kategorien:**
- `employee.sternebewertung_karriere_weiterbildung`

---

### **6. Kommunikation** 💬

**Keywords:**
```regex
\bkommunikation\b
\binformation\b
\btransparenz\b
\bfeedback\b
\bgespräch\b
\baustausch\b
\brückmeldung\b
```

**Zugeordnete DB-Kategorien:**
- `employee.sternebewertung_kommunikation`

---

### **7. Arbeitsbedingungen** 🏢

**Keywords:**
```regex
\barbeitsbedingungen\b
\bausstattung\b
\bbüro\b
\barbeitsplatz\b
\btechnik\b
\bumgebung\b
\binfrastruktur\b
```

**Zugeordnete DB-Kategorien:**
- `employee.sternebewertung_arbeitsbedingungen`

---

## ⚙️ Analyse-Algorithmus

### **Schritt 1: Daten laden**

```python
# Alle Reviews der Firma abrufen
candidates_data = supabase.table("candidates")
    .select("*")
    .eq("company_id", company_id)
    .execute()

employee_data = supabase.table("employee")
    .select("*")
    .eq("company_id", company_id)
    .execute()

all_reviews = candidates_data + employee_data
```

---

### **Schritt 2: Topic-Erkennung (Keyword-Matching)**

Für jeden Review wird überprüft, ob ein Topic erwähnt wird:

```python
# Textfelder die durchsucht werden
text_fields = [
    'stellenbeschreibung',           # candidates
    'verbesserungsvorschlaege',      # candidates
    'jobbeschreibung',               # employee
    'gut_am_arbeitgeber_finde_ich',  # employee
    'schlecht_am_arbeitgeber_finde_ich',  # employee
    'titel'                          # beide
]

# Für jedes Textfeld
for field in text_fields:
    text = review.get(field, "")
    
    # Für jedes Keyword-Pattern
    for keyword_pattern in keywords:
        if re.search(keyword_pattern, text, re.IGNORECASE):
            mentioned = True  # Topic gefunden!
            break
```

**Wichtig:** 
- ✅ Case-insensitive (Groß-/Kleinschreibung egal)
- ✅ Regex-basiert (findet auch Variationen)
- ✅ Mindestens 1 Keyword muss vorkommen

---

### **Schritt 3: Satz-Extraktion für Examples**

Wenn ein Topic gefunden wurde, wird der relevante Satz extrahiert:

```python
# Text in Sätze aufteilen
sentences = re.split(r'[.!?]+', text)

# Satz mit Keyword finden
for sentence in sentences:
    if re.search(keyword_pattern, sentence, re.IGNORECASE):
        # Nur Sätze mit mindestens 20 Zeichen
        if len(sentence.strip()) > 20:
            mention_texts.append(sentence.strip())
            break  # Nur ERSTER Satz pro Textfeld
```

**Regeln:**
- ✅ Nur der **erste Satz** mit Keyword wird genommen
- ✅ Mindestlänge: **20 Zeichen**
- ✅ Maximal **3 Sätze pro Review**

---

### **Schritt 4: Bewertungs-Sammlung**

Wenn ein Topic im Text erwähnt wurde, werden die Bewertungen gesammelt:

```python
ratings = []

# 1. Gesamtbewertung des Reviews
avg_rating = review.get("durchschnittsbewertung")
if avg_rating:
    ratings.append(float(avg_rating))

# 2. Spezifische Kategorie-Bewertungen
for field in rating_fields:  # z.B. ["sternebewertung_work_life_balance"]
    field_rating = review.get(field)
    if field_rating:
        ratings.append(float(field_rating))
```

**Beispiel für "Work-Life Balance":**
```
Review mit Text: "Die Work-Life-Balance ist super!"

Gesammelte Bewertungen:
- durchschnittsbewertung: 4.5 ⭐
- sternebewertung_work_life_balance: 5.0 ⭐

ratings = [4.5, 5.0]
```

---

### **Schritt 5: Durchschnitts-Bewertung berechnen**

```python
avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
```

**Formel:**
$$\text{avg\_rating} = \frac{\sum_{i=1}^{n} \text{rating}_i}{n}$$

Wobei:
- $n$ = Anzahl der gesammelten Bewertungen
- $\text{rating}_i$ = Einzelne Bewertung (durchschnittsbewertung oder Kategorie-Bewertung)

**Beispiel:**
```
Ratings: [4.5, 5.0, 3.8, 4.2, 4.0]
Durchschnitt: (4.5 + 5.0 + 3.8 + 4.2 + 4.0) / 5 = 4.3 ⭐
```

---

### **Schritt 6: Sentiment-Bestimmung**

Basierend auf der durchschnittlichen Bewertung wird das Sentiment bestimmt:

```python
if avg_rating >= 3.5:
    sentiment = "Positiv"
    color = "green"
elif avg_rating >= 2.5:
    sentiment = "Neutral"
    color = "orange"
else:
    sentiment = "Negativ"
    color = "red"
```

**Sentiment-Schwellenwerte:**

| Bewertung | Sentiment | Farbe | Badge |
|-----------|-----------|-------|-------|
| ≥ 3.5 ⭐ | Positiv | Grün | 🟢 |
| 2.5 - 3.4 ⭐ | Neutral | Orange | 🟠 |
| < 2.5 ⭐ | Negativ | Rot | 🔴 |

---

### **Schritt 7: Timeline-Daten erstellen**

Bewertungen werden nach Monaten gruppiert:

```python
monthly_ratings = defaultdict(list)

for review in mentions:
    date = datetime.fromisoformat(review["datum"])
    month_key = date.strftime("%b")  # "Jan", "Feb", ...
    
    if avg_rating:
        monthly_ratings[month_key].append(float(avg_rating))

# Durchschnitt pro Monat berechnen
for month_name in ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun"]:
    if month_name in monthly_ratings:
        month_avg = sum(monthly_ratings[month_name]) / len(monthly_ratings[month_name])
        timeline_data.append({
            "month": month_name,
            "rating": round(month_avg, 1)
        })
```

**Beispiel:**
```json
[
  {"month": "Jan", "rating": 4.2},
  {"month": "Feb", "rating": 3.8},
  {"month": "Mär", "rating": 4.1},
  {"month": "Apr", "rating": 4.5},
  {"month": "Mai", "rating": 4.0},
  {"month": "Jun", "rating": 4.3}
]
```

---

### **Schritt 8: Typical Statements auswählen**

```python
# Die ersten 3 gesammelten Sätze werden verwendet
typical_statements = example_texts[:3] if example_texts else [
    f"Keine spezifischen Aussagen zu {topic_name} gefunden"
]

# Haupt-Example (für Tabelle): Erster Satz, gekürzt auf 80 Zeichen
example = typical_statements[0]
if len(example) > 80:
    example = example[:77] + "..."
```

**Auswahl-Regeln:**
- ✅ **Maximal 3 Aussagen** pro Topic
- ✅ **Reihenfolge:** Erste gefundene Sätze (keine Sortierung nach Rating)
- ✅ **Kürzung:** Haupt-Example wird auf 80 Zeichen gekürzt
- ✅ **Fallback:** Wenn keine Aussagen gefunden, Standardtext

---

## 📤 Rückgabe-Format

### **Topic-Objekt Struktur:**

```json
{
  "id": 1,
  "topic": "Work-Life Balance",
  "frequency": 45,
  "avgRating": 3.8,
  "sentiment": "Positiv",
  "example": "Die Work-Life-Balance ist hervorragend, viel Flexibilität!",
  "color": "green",
  "timelineData": [
    {"month": "Jan", "rating": 4.2},
    {"month": "Feb", "rating": 3.8},
    {"month": "Mär", "rating": 4.1},
    {"month": "Apr", "rating": 4.5},
    {"month": "Mai", "rating": 4.0},
    {"month": "Jun", "rating": 4.3}
  ],
  "typicalStatements": [
    "Die Work-Life-Balance ist hervorragend, viel Flexibilität!",
    "Viele Überstunden, keine Freizeit mehr",
    "Gute Homeoffice-Regelungen vorhanden"
  ]
}
```

### **Vollständige API-Antwort:**

```json
{
  "topics": [
    { /* Topic-Objekt */ },
    { /* Topic-Objekt */ },
    ...
  ],
  "total_reviews": 123,
  "total_topics": 7
}
```

---

## 🔢 Berechnungs-Beispiele

### **Beispiel 1: Einfache Berechnung**

**Gegeben:**
- 3 Reviews erwähnen "Work-Life Balance"

**Review 1:**
- Text: "Die Work-Life-Balance ist super!"
- durchschnittsbewertung: 4.5
- sternebewertung_work_life_balance: 5.0

**Review 2:**
- Text: "Viele Überstunden"
- durchschnittsbewertung: 2.0
- sternebewertung_work_life_balance: 1.5

**Review 3:**
- Text: "Flexible Arbeitszeiten"
- durchschnittsbewertung: 4.0
- sternebewertung_work_life_balance: 4.5

**Berechnung:**
```
Ratings: [4.5, 5.0, 2.0, 1.5, 4.0, 4.5]
Durchschnitt: (4.5 + 5.0 + 2.0 + 1.5 + 4.0 + 4.5) / 6 = 3.6 ⭐

Frequency: 3 (3 Reviews)
Sentiment: Positiv (3.6 ≥ 3.5)
Color: green
```

---

### **Beispiel 2: Topic mit 2 Kategorien (Teamzusammenhalt)**

**Review:**
- Text: "Das Team ist toll!"
- durchschnittsbewertung: 4.0
- sternebewertung_kollegenzusammenhalt: 4.5
- sternebewertung_arbeitsatmosphaere: 4.2

**Berechnung:**
```
Ratings: [4.0, 4.5, 4.2]
Durchschnitt: (4.0 + 4.5 + 4.2) / 3 = 4.23 ⭐
Gerundet: 4.2 ⭐
```

---

### **Beispiel 3: Nur Candidates (keine spezifische Kategorie)**

**Review (Kandidat):**
- Text: "Gute Kommunikation während des Prozesses"
- durchschnittsbewertung: 4.3
- ❌ Keine sternebewertung_kommunikation (existiert nicht in candidates-Tabelle)

**Berechnung:**
```
Ratings: [4.3]  # Nur durchschnittsbewertung
Durchschnitt: 4.3 / 1 = 4.3 ⭐
```

---

## ⚠️ Wichtige Hinweise

### **Was wird gezählt?**
- ✅ Nur Reviews mit **Erwähnung des Topics** im Text
- ✅ Sowohl Kandidaten- als auch Mitarbeiter-Reviews
- ✅ Alle Textfelder werden durchsucht

### **Was wird NICHT gezählt?**
- ❌ Reviews ohne Keyword-Erwähnung (auch wenn Kategorie-Bewertung vorhanden)
- ❌ Sätze unter 20 Zeichen
- ❌ Reviews ohne Bewertungen (durchschnittsbewertung = NULL)

### **Limitierungen:**
- ⚠️ Keywords sind statisch (keine dynamische Topic-Extraktion)
- ⚠️ Keine echte NLP-Sentiment-Analyse (nur bewertungsbasiert)
- ⚠️ Example-Auswahl erfolgt chronologisch (keine Relevanz-Sortierung)
- ⚠️ Keine Deduplizierung ähnlicher Aussagen
- ⚠️ Kandidaten-Kategorien werden aktuell nicht für Topics verwendet

---

## 🚀 API-Endpunkt

### **Endpoint:**
```
GET /api/analytics/company/{company_id}/topic-overview
```

### **Parameter:**
- `company_id` (Path): ID der zu analysierenden Firma

### **Beispiel-Request:**
```bash
curl http://localhost:8000/api/analytics/company/1/topic-overview
```

### **Beispiel-Response:**
```json
{
  "topics": [
    {
      "id": 1,
      "topic": "Work-Life Balance",
      "frequency": 45,
      "avgRating": 3.8,
      "sentiment": "Positiv",
      "example": "Die Work-Life-Balance ist hervorragend...",
      "color": "green",
      "timelineData": [...],
      "typicalStatements": [...]
    }
  ],
  "total_reviews": 123,
  "total_topics": 7
}
```

---

## 📊 Verwendete DB-Kategorien

| Topic | Employee Kategorien | Candidates Kategorien |
|-------|-------------------|---------------------|
| Work-Life Balance | sternebewertung_work_life_balance | ❌ Keine |
| Führungsqualität | sternebewertung_vorgesetztenverhalten | ❌ Keine |
| Gehalt & Benefits | sternebewertung_gehalt_sozialleistungen | ❌ Keine |
| Teamzusammenhalt | sternebewertung_kollegenzusammenhalt<br>sternebewertung_arbeitsatmosphaere | ❌ Keine |
| Karriereentwicklung | sternebewertung_karriere_weiterbildung | ❌ Keine |
| Kommunikation | sternebewertung_kommunikation | ❌ Keine |
| Arbeitsbedingungen | sternebewertung_arbeitsbedingungen | ❌ Keine |

**Hinweis:** Aktuell werden **nur Employee-Kategorien** für die Topic-Analyse verwendet. Kandidaten-Reviews werden nur über ihre `durchschnittsbewertung` einbezogen.

---

## 📖 Code-Referenz

Die vollständige Implementierung befindet sich in:
```
backend/routes/analytics.py
  - Zeile 345-636: Topic Overview Endpoint
  - Zeile 360-475: Topic Definitionen
  - Zeile 500-636: analyze_topic() Funktion
```

---

## 🔄 Ablauf-Diagramm

```
┌─────────────────────────┐
│ API Request für Firma X │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Lade alle Reviews       │
│ (candidates + employee) │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Für jedes Topic (1-7):  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Für jeden Review:       │
│ - Durchsuche Textfelder │
│ - Prüfe Keywords        │
└───────────┬─────────────┘
            │
         Keyword gefunden?
            │
    ┌───────┴───────┐
    │               │
   Ja              Nein
    │               │
    ▼               ▼
┌─────────┐   ┌──────────┐
│ Sammle: │   │ Ignoriere│
│ - Satz  │   │  Review  │
│ - Rating│   └──────────┘
└────┬────┘
     │
     ▼
┌─────────────────────────┐
│ Berechne Durchschnitt   │
│ aus allen Ratings       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Bestimme Sentiment      │
│ (Positiv/Neutral/Negativ)│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Erstelle Timeline       │
│ (monatliche Durchschnitte)│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Wähle Typical Statements│
│ (erste 3 Sätze)         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Rückgabe Topic-Objekt   │
└─────────────────────────┘
```

---

## ✅ Zusammenfassung

**Die Topic-Analyse funktioniert durch:**

1. **Keyword-basierte Topic-Erkennung** in Textkommentaren
2. **Kombination von Text + Bewertungen** (durchschnittsbewertung + Kategorie-Bewertungen)
3. **Durchschnittsberechnung** aller relevanten Bewertungen
4. **Sentiment-Bestimmung** basierend auf Bewertungs-Schwellenwerten
5. **Timeline-Erstellung** durch monatliche Gruppierung
6. **Example-Extraktion** durch Satz-Segmentierung

**Wichtigste Regel:** Ein Review wird nur gezählt, wenn das Topic **im Text erwähnt** wird, unabhängig davon, ob eine Kategorie-Bewertung vorhanden ist.

---

*Dokumentation erstellt: 6. Januar 2026*  
*Version: 1.0*  
*Datei: `backend/routes/analytics.py` (Zeile 345-636)*
