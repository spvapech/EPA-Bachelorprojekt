# Topic Overview API

## Endpoint: `/api/analytics/company/{company_id}/topic-overview`

### Beschreibung
Dieser Endpoint analysiert alle Reviews einer Firma und extrahiert automatisch Topics mit ihren Statistiken. Die Daten werden so aufbereitet, dass sie direkt in der `TopicOverviewCard` Komponente im Frontend angezeigt werden können.

### HTTP Method
`GET`

### Parameter
- `company_id` (path parameter, required): Die ID der Firma

### Response Format
```json
{
  "topics": [
    {
      "id": 1,
      "topic": "Work-Life Balance",
      "frequency": 145,
      "avgRating": 2.8,
      "sentiment": "Negativ",
      "example": "Überstunden sind die Regel, Privatleben leidet stark...",
      "color": "red",
      "timelineData": [
        { "month": "Jan", "rating": 2.5 },
        { "month": "Feb", "rating": 2.6 },
        { "month": "Mär", "rating": 2.4 },
        { "month": "Apr", "rating": 2.7 },
        { "month": "Mai", "rating": 2.9 },
        { "month": "Jun", "rating": 3.0 }
      ],
      "typicalStatements": [
        "Überstunden sind Standard, niemand fragt nach",
        "Ständige Erreichbarkeit wird erwartet",
        "Urlaub wird oft kurzfristig abgelehnt"
      ]
    }
  ],
  "total_reviews": 250,
  "total_topics": 7
}
```

### Analysierte Topics

Die Funktion analysiert automatisch folgende Topics:

1. **Work-Life Balance**
   - Keywords: work-life-balance, überstunden, arbeitszeit, urlaub, freizeit, privatleben, flexibilität, homeoffice, erreichbarkeit
   - Rating-Felder: `sternebewertung_work_life_balance`

2. **Führungsqualität**
   - Keywords: führung, management, vorgesetzte, chef, leitung, führungskräfte, vorgesetztenverhalten, kompetenz, entscheidung
   - Rating-Felder: `sternebewertung_vorgesetztenverhalten`

3. **Gehalt & Benefits**
   - Keywords: gehalt, bezahlung, lohn, vergütung, benefits, sozialleistungen, altersvorsorge, prämie, bonus
   - Rating-Felder: `sternebewertung_gehalt_sozialleistungen`

4. **Teamzusammenhalt**
   - Keywords: team, kollegen, zusammenhalt, kollegenzusammenhalt, atmosphäre, arbeitsatmosphäre, zusammenarbeit, gemeinschaft
   - Rating-Felder: `sternebewertung_kollegenzusammenhalt`, `sternebewertung_arbeitsatmosphaere`

5. **Karriereentwicklung**
   - Keywords: karriere, weiterbildung, entwicklung, aufstieg, förderung, schulungen, beförderung, perspektive
   - Rating-Felder: `sternebewertung_karriere_weiterbildung`

6. **Kommunikation**
   - Keywords: kommunikation, information, transparenz, feedback, gespräch, austausch, rückmeldung
   - Rating-Felder: `sternebewertung_kommunikation`

7. **Arbeitsbedingungen**
   - Keywords: arbeitsbedingungen, ausstattung, büro, arbeitsplatz, technik, umgebung, infrastruktur
   - Rating-Felder: `sternebewertung_arbeitsbedingungen`

### Wie funktioniert die Analyse?

1. **Text-Analyse**: Die Funktion durchsucht alle Textfelder (Stellenbeschreibung, Verbesserungsvorschläge, Jobbeschreibung, Gut/Schlecht am Arbeitgeber, etc.) nach den definierten Keywords.

2. **Häufigkeit**: Zählt, wie oft jedes Topic in den Reviews erwähnt wird.

3. **Durchschnittsbewertung**: Berechnet die durchschnittliche Rating aus:
   - Durchschnittsbewertung des Reviews
   - Spezifischen Sternebewertungen für die Topic-Kategorie

4. **Sentiment**: Wird automatisch basierend auf der Durchschnittsbewertung bestimmt:
   - `>= 3.5`: Positiv (grün)
   - `>= 2.5`: Neutral (orange)
   - `< 2.5`: Negativ (rot)

5. **Timeline**: Erstellt eine Zeitreihe der letzten 6 Monate mit den durchschnittlichen Bewertungen pro Monat.

6. **Typische Aussagen**: Extrahiert konkrete Sätze aus Reviews, die das Topic erwähnen, als Beispiele.

### Verwendung im Frontend

```javascript
// Beispiel: Daten abrufen und anzeigen
const fetchTopicOverview = async (companyId) => {
  try {
    const response = await fetch(`/api/analytics/company/${companyId}/topic-overview`);
    const data = await response.json();
    
    // data.topics kann direkt in TopicOverviewCard verwendet werden
    setTopicsData(data.topics);
  } catch (error) {
    console.error('Fehler beim Laden der Topic-Daten:', error);
  }
};
```

### Beispiel Request

```bash
curl http://localhost:8000/api/analytics/company/1/topic-overview
```

### Error Responses

- **404**: Firma nicht gefunden
- **500**: Server-Fehler bei der Analyse

### Hinweise

- Nur Topics mit mindestens einer Erwähnung werden zurückgegeben
- Topics werden nach Häufigkeit sortiert (absteigend)
- Die Timeline zeigt die letzten 6 Monate
- Wenn für einen Monat keine Daten vorliegen, wird die Durchschnittsbewertung verwendet
