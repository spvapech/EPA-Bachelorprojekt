# Changelog: Topic-Filterung nach Datenquellen

**Datum:** 1. Februar 2026  
**Version:** 2.0  
**Autor:** GitHub Copilot

## Übersicht

Dieses Update implementiert eine vollständige Trennung der Topic-Definitionen für Bewerber und Mitarbeiter, sowie eine verbesserte Benutzeroberfläche für die Datenquellen-Filterung.

---

## 🎯 Hauptänderungen

### 1. Backend: Separate Topic-Definitionen

**Datei:** `backend/routes/analytics.py`

#### Vorher
- Alle Topics wurden für beide Datenquellen (Bewerber und Mitarbeiter) gemeinsam verwendet
- Keine Unterscheidung zwischen bewerbungs- und arbeitsspezifischen Themen
- 7 generische Topics

#### Nachher
- **Mitarbeiter-Topics (13):**
  1. Work-Life Balance
  2. Vorgesetztenverhalten
  3. Gehalt & Sozialleistungen
  4. Kollegenzusammenhalt
  5. Karriere & Weiterbildung
  6. Kommunikation
  7. Arbeitsbedingungen
  8. Arbeitsatmosphäre
  9. Image
  10. Interessante Aufgaben
  11. Umwelt- & Sozialbewusstsein
  12. Umgang mit älteren Kollegen
  13. Gleichberechtigung

- **Bewerber-Topics (10):**
  1. Erklärung der weiteren Schritte
  2. Zufriedenstellende Reaktion
  3. Vollständigkeit der Infos
  4. Zufriedenstellende Antworten
  5. Angenehme Atmosphäre
  6. Professionalität des Gesprächs
  7. Wertschätzende Behandlung
  8. Erwartbarkeit des Prozesses
  9. Zeitgerechte Zu- oder Absage
  10. Schnelle Antwort

#### Implementierungsdetails

```python
# Logik zur Auswahl der richtigen Topics basierend auf der Quelle
if source == "employee":
    topic_definitions = employee_topic_definitions
    reviews_to_analyze = employee_data
elif source == "candidates":
    topic_definitions = candidate_topic_definitions
    reviews_to_analyze = candidates_data
else:
    # Wenn keine Quelle angegeben oder "alle", kombiniere beide
    topic_definitions = {**employee_topic_definitions, **candidate_topic_definitions}
    reviews_to_analyze = all_reviews
```

**Vorteile:**
- ✅ Präzisere Topic-Erkennung
- ✅ Relevantere Keywords pro Datenquelle
- ✅ Bessere Zuordnung zu Bewertungskriterien aus der Datenbank
- ✅ Korrekte Review-Anzahl pro Quelle

---

### 2. Frontend: Verbesserte Datenquellen-Filterung

#### TopicOverviewCard (`frontend/src/components/dashboard/TopicOverviewCard.jsx`)

**Neue Features:**

1. **Filter-Buttons in der Hauptkarte**
   ```jsx
   <div className="flex gap-2 mb-4">
     <Button>Alle</Button>
     <Button>Mitarbeiter</Button>
     <Button>Bewerber</Button>
   </div>
   ```

2. **Intelligentes Laden ohne Modal-Neustart**
   - Bei Filter-Änderung wird nur beim ersten Laden der Loading-State gesetzt
   - Modals bleiben geöffnet während Daten neu geladen werden
   ```jsx
   if (topicsData.length === 0) {
       setLoading(true)
   }
   ```

3. **Topic-Neuladung bei Quelle-Wechsel**
   - Neue Funktion `reloadTopicWithSource()` lädt Topic mit neuer Datenquelle
   - Handler `handleDetailSourceFilterChange()` koordiniert den Filterwechsel
   ```jsx
   const reloadTopicWithSource = async (topicName, newSourceFilter) => {
       // Lädt Topic-Daten mit neuer Quelle
       // Findet und aktualisiert das spezifische Topic
   }
   ```

#### TopicTableModal (`frontend/src/components/dashboard/modals/TopicTableModal.jsx`)

**Beibehaltene Features:**
- ✅ Datenquellen-Filter im Modal
- ✅ Alle/Mitarbeiter/Bewerber Buttons
- ✅ Sofortige Aktualisierung der Topic-Liste

#### TopicDetailModal (`frontend/src/components/dashboard/modals/TopicDetailModal.jsx`)

**Entfernte Features:**
- ❌ Datenquellen-Filter aus dem "Ansicht anpassen" Panel entfernt
- Grund: Konsistenz - Filter wird nur in Hauptkarte und Tabellen-Übersicht benötigt

---

### 3. LDA Topic Modeling

**Status:** ✅ Bereits aktuell

Das LDA-Modell (`backend/models/lda_topic_model.py`) berücksichtigt bereits alle Rating-Kriterien aus beiden Tabellen:

```python
candidate_criteria = [
    'erklaerung_der_weiteren_schritte', 'zufriedenstellende_reaktion',
    'vollstaendigkeit_der_infos', 'zufriedenstellende_antworten',
    'angenehme_atmosphaere', 'professionalitaet_des_gespraechs',
    'wertschaetzende_behandlung', 'erwartbarkeit_des_prozesses',
    'zeitgerechte_zu_oder_absage', 'schnelle_antwort'
]

employee_criteria = [
    'arbeitsatmosphaere', 'image', 'work_life_balance',
    'karriere_weiterbildung', 'gehalt_sozialleistungen',
    'kollegenzusammenhalt', 'umwelt_sozialbewusstsein',
    'vorgesetztenverhalten', 'kommunikation', 'interessante_aufgaben',
    'umgang_mit_aelteren_kollegen', 'arbeitsbedingungen',
    'gleichberechtigung'
]
```

**Neu trainierte Modelle:**
- Modell: `lda_model_20260201_143902`
- Datengrundlage: 2000 Dokumente (1000 Bewerber + 1000 Mitarbeiter)
- Topics: 15 kombinierte Topics

---

## 📊 Datenbankstruktur

### Candidates Tabelle
```sql
-- 10 Bewertungskriterien für Bewerber
sternebewertung_erklaerung_der_weiteren_schritte
sternebewertung_zufriedenstellende_reaktion
sternebewertung_vollstaendigkeit_der_infos
sternebewertung_zufriedenstellende_antworten
sternebewertung_angenehme_atmosphaere
sternebewertung_professionalitaet_des_gespraechs
sternebewertung_wertschaetzende_behandlung
sternebewertung_erwartbarkeit_des_prozesses
sternebewertung_zeitgerechte_zu_oder_absage
sternebewertung_schnelle_antwort
```

### Employee Tabelle
```sql
-- 13 Bewertungskriterien für Mitarbeiter
sternebewertung_arbeitsatmosphaere
sternebewertung_image
sternebewertung_work_life_balance
sternebewertung_karriere_weiterbildung
sternebewertung_gehalt_sozialleistungen
sternebewertung_kollegenzusammenhalt
sternebewertung_umwelt_sozialbewusstsein
sternebewertung_vorgesetztenverhalten
sternebewertung_kommunikation
sternebewertung_interessante_aufgaben
sternebewertung_umgang_mit_aelteren_kollegen
sternebewertung_arbeitsbedingungen
sternebewertung_gleichberechtigung
```

---

## 🔄 API-Änderungen

### GET `/api/analytics/company/{company_id}/topic-overview`

**Query-Parameter:**
- `source` (optional): `"candidates"`, `"employee"`, oder `null` für beide

**Verhalten:**

| Source-Wert | Topics | Reviews |
|-------------|--------|---------|
| `"employee"` | 13 Mitarbeiter-Topics | Nur Employee-Reviews |
| `"candidates"` | 10 Bewerber-Topics | Nur Candidates-Reviews |
| `null` oder nicht angegeben | 23 kombinierte Topics | Alle Reviews |

**Response-Format:**
```json
{
  "topics": [
    {
      "id": 1,
      "topic": "Work-Life Balance",
      "frequency": 150,
      "avgRating": 4.2,
      "sentiment": "Positiv",
      "example": "...",
      "timelineData": [...],
      "typicalStatements": [...],
      "reviewDetails": [...]
    }
  ],
  "total_reviews": 1000,
  "total_topics": 13
}
```

---

## 🎨 UI/UX Verbesserungen

### Flüssiger Filter-Wechsel
- **Problem:** Modal schloss und öffnete sich bei Filter-Änderung
- **Lösung:** Loading-State nur beim ersten Laden, Daten werden im Hintergrund aktualisiert

### Konsistente Filter-Position
- **Hauptkarte:** Filter oberhalb der Statistiken
- **Tabellen-Modal:** Filter unterhalb des Titels
- **Detail-Modal:** Kein Filter (verwendet Filter aus übergeordneter Ansicht)

### Visuelle Hervorhebung
```jsx
// Aktiver Filter
className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500"

// Inaktiver Filter
className="hover:bg-slate-100"
```

---

## 🧪 Testing

### Manuelle Tests durchgeführt:
- ✅ Filter-Wechsel in Hauptkarte
- ✅ Filter-Wechsel in Tabellen-Modal
- ✅ Modal bleibt beim Filter-Wechsel offen
- ✅ Korrekte Topics werden für jede Quelle angezeigt
- ✅ Review-Anzahl stimmt mit Quelle überein

### Zu testende Szenarien:
1. Wechsel von "Alle" → "Mitarbeiter" → "Bewerber"
2. Topic-Detail öffnen mit verschiedenen Filtern
3. Zurück zur Tabelle und Filter ändern
4. Mehrere Companies mit verschiedenen Filtern

---

## 📝 Verwendung

### Für Entwickler

1. **Topics nur für Mitarbeiter abrufen:**
```bash
curl http://localhost:8000/api/analytics/company/1/topic-overview?source=employee
```

2. **Topics nur für Bewerber abrufen:**
```bash
curl http://localhost:8000/api/analytics/company/1/topic-overview?source=candidates
```

3. **Alle Topics abrufen:**
```bash
curl http://localhost:8000/api/analytics/company/1/topic-overview
```

### Für Benutzer

1. **Filter in der Hauptkarte:**
   - Wähle "Alle", "Mitarbeiter" oder "Bewerber"
   - Die Statistiken aktualisieren sich automatisch

2. **In der Tabellen-Ansicht:**
   - Filter kann auch nach dem Öffnen geändert werden
   - Tabelle aktualisiert sich ohne Neustart

3. **In der Detail-Ansicht:**
   - Verwendet automatisch den in der Hauptkarte gewählten Filter
   - Keine manuelle Filter-Auswahl nötig

---

## 🔍 Technische Details

### Mapping: Keywords → Rating-Felder

Jedes Topic ist mit den entsprechenden Bewertungsfeldern aus der Datenbank verknüpft:

```python
"Work-Life Balance": {
    "keywords": [
        r'\bwork[\s-]*life[\s-]*balance\b',
        r'\büberstunden\b',
        r'\barbeitszeit\b',
        # ...
    ],
    "rating_fields": ["sternebewertung_work_life_balance"]
}
```

### Review-Analyse
Die `analyze_topic()` Funktion:
1. Durchsucht Reviews nach Keywords (Regex)
2. Extrahiert Ratings aus den zugeordneten Feldern
3. Berechnet Durchschnittsbewertung
4. Ermittelt Sentiment (Positiv/Neutral/Negativ)
5. Erstellt Timeline-Daten nach Monat/Jahr
6. Sammelt typische Aussagen und Beispiele

---

## 🚀 Migration & Deployment

### Schritte beim Update:

1. **Alte Modelle entfernen:**
```bash
cd backend/models/saved_models
rm -f lda_model_*.*
```

2. **Backend-Code aktualisieren:**
   - `backend/routes/analytics.py` mit neuen Topic-Definitionen

3. **Frontend-Code aktualisieren:**
   - `frontend/src/components/dashboard/TopicOverviewCard.jsx`
   - `frontend/src/components/dashboard/modals/TopicTableModal.jsx`
   - `frontend/src/components/dashboard/modals/TopicDetailModal.jsx`

4. **Neue Modelle trainieren:**
```bash
cd backend
uv run python train_models.py
```

5. **Services neu starten:**
```bash
# Backend
cd backend
uv run uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm run dev
```

---

## 📈 Performance-Überlegungen

### Optimierungen:
- Topics werden nur einmal pro Filter-Änderung geladen
- Modal-State bleibt erhalten → keine unnötigen Re-Renders
- Reviews werden im Backend gefiltert → weniger Datenübertragung

### Potential für weitere Optimierung:
- Caching von Topic-Ergebnissen pro Company/Source-Kombination
- Lazy Loading für Timeline-Daten
- Pagination für große Topic-Listen

---

## 🐛 Bekannte Einschränkungen

1. **LDA-Modell ist source-unabhängig:**
   - Das trainierte Modell enthält beide Datenquellen
   - Für source-spezifische LDA-Modelle müssten separate Modelle trainiert werden

2. **Filter-Persistenz:**
   - Filter-Auswahl wird nicht im Browser gespeichert
   - Bei Page-Reload wird Standard ("Alle") verwendet

3. **Company-Wechsel:**
   - Filter bleibt beim Company-Wechsel erhalten
   - Könnte verwirrend sein, wenn neue Company andere Datenstruktur hat

---

## 📚 Weiterführende Dokumentation

- **LDA Topic Modeling:** `backend/docs/LDA_Topic_Modeling/`
- **Sentiment Analysis:** `backend/docs/Sentiment_Analysis/`
- **Analyse Pipeline:** `backend/docs/Analyse_Pipeline/`
- **API Dokumentation:** `backend/docs/`

---

## ✅ Checkliste für zukünftige Änderungen

Bei Hinzufügen neuer Bewertungskriterien:

- [ ] Datenbank-Migration erstellen
- [ ] Rating-Feld in entsprechender Tabelle hinzufügen
- [ ] Topic-Definition in `analytics.py` aktualisieren
- [ ] Keywords für neues Topic definieren
- [ ] LDA-Modell mit `get_rating_criteria_keywords()` prüfen
- [ ] Frontend-Komponenten testen
- [ ] Dokumentation aktualisieren
- [ ] Neue Modelle trainieren

---

## 👥 Kontakt & Support

Bei Fragen oder Problemen:
- GitHub Issues: [IIS-Bachelorprojekt/gruppe-P1-3](https://github.com/IIS-Bachelorprojekt/gruppe-P1-3)
- Dokumentation: `backend/docs/`

---

**Ende der Dokumentation**
