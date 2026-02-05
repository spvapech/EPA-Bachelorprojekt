# 📊 Statistical Validation Implementation

Implementierung der statistischen Methodik aus `STATISTICAL_SAMPLE_SIZE_METHODOLOGY.md`.

## 🎯 Überblick

Dieses Modul validiert Stichprobengrößen und reichert Analyse-Ergebnisse mit statistischen Metadaten an, basierend auf etablierter wissenschaftlicher Literatur:

- **Rice (2006)**: CLT-Approximation (n≈30 Heuristik)
- **Cohen (1988)**: Power-Analyse (n≈64 für d=0.5, 80% Power)
- **Maxwell et al. (2008)**: AIPE-Ansatz (n≈100 für MoE≤±0.20)
- **Maxwell & Delaney (2017)**: ANOVA (n≈30 pro Gruppe für f=0.25)
- **Schönbrodt & Perugini (2013)**: Korrelationsstabilität (n≈250)

## 📁 Module

### 1. `statistical_validator.py`
Kern-Validierungslogik für Stichprobengrößen.

**Hauptklassen:**
- `StatisticalValidator`: Hauptklasse für alle Validierungen
- `RiskLevel`: Enum für Risikoeinschätzungen (limited/constrained/acceptable/solid)
- `SampleSizeAssessment`: Dataclass für vollständige Bewertungen

**Hauptfunktionen:**
```python
validator = StatisticalValidator()

# Einzelne Stichprobe bewerten
assessment = validator.assess_sample_size(n=75)
# Returns: SampleSizeAssessment mit risk_level, ci_width, recommendations

# Gruppenvergleich bewerten (t-test)
comparison = validator.assess_comparison(n1=85, n2=45, comparison_type="two_group")

# ANOVA bewerten
anova = validator.assess_comparison(n1=390, n2=13, comparison_type="anova")

# Korrelationsstabilität bewerten
correlation = validator.validate_correlation_stability(n=250)
```

### 2. `statistical_enrichment.py`
Utility-Funktionen zum Anreichern von API-Responses mit statistischen Metadaten.

**Hauptfunktionen:**
```python
# Allgemeine Anreicherung
enriched = enrich_with_statistical_metadata(
    data={"result": "value"},
    sample_size=75,
    analysis_type="general"
)

# Topic-Analyse anreichern
enriched_topics = enrich_topic_analysis_with_metadata(
    topics_data=[{"name": "Work-Life Balance", "count": 45, ...}],
    total_sample_size=150
)

# Vergleichsanalyse anreichern
enriched = enrich_comparison_with_metadata(
    data={"avg_employee": 3.5, "avg_candidate": 3.8},
    n1=85,
    n2=45,
    group1_label="Employee",
    group2_label="Candidates"
)

# UI-Badge-Konfiguration
badge_config = get_ui_badge_config("limited")
# Returns: {"color": "red", "icon": "⚠️", "label": "Begrenzte Datenbasis"}

# Methodische Notizen für Berichte
notes = get_methodological_notes(sample_size=75, analysis_type="comparison")
```

## 🔌 API-Endpunkte

### Validierungs-Endpunkte

#### `GET /api/analytics/statistical/validate-sample-size`
Validiert einzelne Stichprobengröße.

**Parameter:**
- `n` (int, required): Stichprobengröße

**Response:**
```json
{
  "sample_size": 75,
  "risk_level": "acceptable",
  "risk_description": "Akzeptable Basis",
  "clt_assessment": "CLT-Approximation wahrscheinlich ausreichend...",
  "power_assessment": "Power wahrscheinlich ≈80%...",
  "ci_width_estimate": 0.23,
  "recommendations": [
    "Effektstärken (Cohen's d) und Konfidenzintervalle zusätzlich zu p-Werten berichten",
    "Nicht-parametrische Sensitivitätsanalysen parallel durchführen"
  ],
  "requires_nonparametric": false
}
```

#### `GET /api/analytics/statistical/validate-comparison`
Validiert Gruppenvergleiche.

**Parameter:**
- `n1` (int, required): Größe Gruppe 1 (oder Gesamt-n für ANOVA)
- `n2` (int, required): Größe Gruppe 2 (oder k Gruppen für ANOVA)
- `comparison_type` (str): "two_group" oder "anova"

#### `GET /api/analytics/statistical/validate-correlation`
Validiert Korrelationsanalyse.

**Parameter:**
- `n` (int, required): Stichprobengröße

#### `GET /api/analytics/company/{company_id}/statistical-assessment`
Umfassende statistische Bewertung für Unternehmensdaten.

**Response:**
```json
{
  "company_id": 123,
  "sample_sizes": {
    "total": 130,
    "employee": 85,
    "candidate": 45
  },
  "overall_assessment": {...},
  "employee_assessment": {...},
  "candidate_assessment": {...},
  "comparison_assessment": {...},
  "topic_anova_assessment": {...},
  "summary": {
    "data_quality": "acceptable",
    "can_compare_employee_candidate": true,
    "can_perform_topic_analysis": false,
    "primary_limitation": "Power may be insufficient for small effects"
  }
}
```

### Integrierte Endpunkte

#### `GET /api/analytics/company/{company_id}/topic-overview`
Jetzt mit statistischen Metadaten angereichert:

**Response (zusätzliche Felder):**
```json
{
  "topics": [
    {
      "id": 1,
      "name": "Work-Life Balance",
      "frequency": 45,
      "avg_rating": 3.2,
      "statistical_meta": {
        "sample_size": 45,
        "risk_level": "constrained",
        "risk_description": "Eingeschränkte Aussagekraft",
        "ci_width_estimate": 0.29,
        "share_of_total": 51.1
      }
    }
  ],
  "total_reviews": 88,
  "total_topics": 8,
  "statistical_meta": {
    "sample_size": 88,
    "risk_level": "acceptable",
    "risk_description": "Akzeptable Basis",
    "ci_width_estimate": 0.21,
    "requires_nonparametric": false,
    "analysis_type": "anova",
    "warnings": [...]
  }
}
```

## 🧪 Testing

Führen Sie die Tests aus:

```bash
cd backend
python test_statistical_implementation.py
```

**Test-Coverage:**
1. ✅ Sample Size Validation (n=15 bis n=250)
2. ✅ Group Comparison Validation (t-test & ANOVA)
3. ✅ Correlation Stability Assessment
4. ✅ Statistical Enrichment Functions
5. ✅ Utility Functions (UI badges, methodological notes)
6. ✅ Edge Cases (sehr kleine/große Stichproben, unausgeglichene Gruppen)
7. ✅ Methodology Alignment (Verifikation mit Literaturwerten)

## 📊 Risiko-Levels

Die Implementation verwendet **4 Risiko-Stufen** auf einem **kontinuierlichen Spektrum**:

| Level | n-Bereich | UI-Label | Bedeutung |
|-------|-----------|----------|-----------|
| **LIMITED** | n < 30 | ⚠️ Begrenzte Datenbasis | CLT unsicher, nicht-parametrisch bevorzugen |
| **CONSTRAINED** | 30 ≤ n < 64 | ⚡ Eingeschränkte Aussagekraft | Power wahrscheinlich <80%, breite CIs |
| **ACCEPTABLE** | 64 ≤ n < 100 | ✓ Akzeptable Basis | Moderate Robustheit, MoE >±0.20 |
| **SOLID** | n ≥ 100 | ✓✓ Solide Datenbasis | Gute Robustheit, MoE ≈±0.20 oder schmaler |

**WICHTIG:** Diese Grenzen sind **heuristisch**, nicht absolute Schwellen. Die Übergänge sind **fließend** – benachbarte Kategorien unterscheiden sich graduell, nicht qualitativ.

## 🎨 Frontend-Integration

### UI-Badge-Beispiel

```jsx
// Get statistical metadata from API
const { statistical_meta } = topicData;

// Get badge configuration
const badgeConfig = {
  limited: { color: 'red', icon: '⚠️', label: 'Begrenzte Datenbasis' },
  constrained: { color: 'orange', icon: '⚡', label: 'Eingeschränkte Aussagekraft' },
  acceptable: { color: 'yellow', icon: '✓', label: 'Akzeptable Basis' },
  solid: { color: 'green', icon: '✓✓', label: 'Solide Datenbasis' }
};

const badge = badgeConfig[statistical_meta.risk_level];

return (
  <Badge color={badge.color}>
    {badge.icon} {badge.label} (n={statistical_meta.sample_size})
  </Badge>
);
```

### Tooltip-Beispiel

```jsx
<Tooltip content={
  <div>
    <p><strong>Statistische Einordnung</strong></p>
    <p>Stichprobengröße: n={statistical_meta.sample_size}</p>
    <p>Konfidenzintervall: ±{statistical_meta.ci_width_estimate}★</p>
    {statistical_meta.warnings?.map((w, i) => (
      <p key={i} className="text-red-500">⚠️ {w.message}</p>
    ))}
  </div>
}>
  <InfoIcon />
</Tooltip>
```

## 📝 Methodische Hinweise

### Immer berichten:
1. **Effektstärken** (Cohen's d) zusätzlich zu p-Werten
2. **Konfidenzintervalle** für alle Schätzungen
3. **Stichprobengröße** explizit angeben

### Bei n < 30:
1. **Nicht-parametrische Tests** bevorzugen (Mann-Whitney-U, Kruskal-Wallis)
2. **CLT-Unsicherheit** explizit erwähnen
3. **Ergebnisse vorsichtig interpretieren**

### Bei n < 64:
1. **Ex-post Power-Analyse** durchführen
2. **Null-Befunde** nicht als "kein Effekt" interpretieren (Typ-II-Fehler möglich)

### Bei n < 100:
1. **Breite Konfidenzintervalle** beachten (MoE > ±0.20★)
2. **Schätzungen unpräzise** kommunizieren

### ANOVA-spezifisch:
1. **Ungleiche Gruppengrößen** reduzieren Power für kleine Gruppen
2. **Pro Gruppe n≈30** als Orientierung (bei k=13 Topics → n≈390 gesamt)
3. **Kruskal-Wallis** parallel als Robustheitsprüfung

### Korrelationen:
1. **n < 250**: Korrelationen können volatil sein
2. **Ex-post Bootstrapping** bei kleinen n empfohlen

## 🔧 Konfiguration

### Standard-Annahmen
```python
# In StatisticalValidator
assumed_std = 1.0    # Angenommene Standardabweichung für CI-Berechnung
alpha = 0.05         # Signifikanzniveau (95% CI)
z_critical = 1.96    # Z-Wert für 95% CI
```

### Heuristische Werte
```python
HEURISTIC_CLT = 30              # Rice (2006)
HEURISTIC_POWER = 64            # Cohen (1988) für d=0.5
HEURISTIC_PRECISION = 100       # Maxwell et al. (2008) für MoE≤±0.20
HEURISTIC_ANOVA_PER_GROUP = 30  # Maxwell & Delaney (2017) für f=0.25
```

## 📚 Referenzen

1. **Cohen, J. (1988).** *Statistical Power Analysis for the Behavioral Sciences* (2nd ed.). Routledge.
2. **Lumley, T., et al. (2002).** "The importance of the normality assumption in large public health data sets." *Annual Review of Public Health*, 23, 151-169.
3. **Maxwell, S. E., & Delaney, H. D. (2017).** *Designing Experiments and Analyzing Data: A Model Comparison Perspective* (3rd ed.). Routledge.
4. **Maxwell, S. E., et al. (2008).** "Sample size planning for statistical power and accuracy in parameter estimation." *Annual Review of Psychology*, 59, 537-563.
5. **Norman, G. (2010).** "Likert scales, levels of measurement and the 'laws' of statistics." *Advances in Health Sciences Education*, 15(5), 625-632.
6. **Rice, J. A. (2006).** *Mathematical Statistics and Data Analysis* (3rd ed.). Duxbury Press.
7. **Schönbrodt, F. D., & Perugini, M. (2013).** "At what sample size do correlations stabilize?" *Journal of Research in Personality*, 47(5), 609-612.

Siehe `STATISTICAL_SAMPLE_SIZE_METHODOLOGY.md` für vollständige methodische Begründung.

## 🚀 Nächste Schritte

1. **Frontend-Integration**: UI-Badges und Tooltips implementieren
2. **Dashboard-Integration**: Company-spezifische Assessments anzeigen
3. **Export-Funktion**: Methodische Notizen in PDF-Berichte einbinden
4. **Monitoring**: Tracking der tatsächlichen Stichprobengrößen über Zeit

## ⚠️ Wichtige Disclaimers

1. **Keine absoluten Schwellen**: Alle Grenzen sind heuristisch und kontextabhängig
2. **Parameter-Unkenntnis**: Wahre Effektstärken und Verteilungen sind unbekannt
3. **Ex-post Validierung**: Nach Datenerhebung empirische Werte prüfen
4. **Externe Validität**: Ergebnisse nicht ohne weiteres verallgemeinerbar
5. **Ordinale Daten**: Quasi-intervallskalare Behandlung ist Approximation

---

**Version:** 1.0  
**Status:** ✅ Produktionsbereit  
**Letzte Aktualisierung:** 3. Februar 2026
