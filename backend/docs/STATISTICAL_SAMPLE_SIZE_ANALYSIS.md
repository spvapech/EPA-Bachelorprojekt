# 📊 Methodische Begründung der Stichprobengrößen-Entscheidungen

**Bachelorarbeit – Gruppe P1-3**  
**Datum:** 3. Februar 2026  

---

## Vorbemerkung zur methodischen Einordnung

Die in diesem Dokument diskutierten Stichprobengrößen (n≈30, n≈64, n≈100) basieren auf etablierter statistischer Literatur (Rice 2006, Cohen 1988, Maxwell et al. 2008), stellen jedoch **projektspezifische Entscheidungen** dar, keine universellen Standards. Sie reflektieren einen **Trade-off zwischen statistischer Idealvorstellung und praktischer Machbarkeit** in einem Review-Analyse-System.

**Zentrale methodische Limitation:**  
Alle Orientierungswerte setzen Parameter voraus, die **in der Realität unbekannt** sind: wahre Effektstärken (d, f), tatsächliche Verteilungsformen, empirische Streuungen (s). Ohne Pilot-Daten bleiben Power-Kalkulationen spekulativ.

**Forschungslogische Konsequenz:**  
Wir berichten **Effektstärken und Konfidenzintervalle zusätzlich zu p-Werten** und prüfen die Robustheit durch Sensitivitätsanalysen mit nicht-parametrischen Tests.

---

## 1. Theoretische Grundlagen: Kritische Reflexion etablierter Heuristiken

### 1.1 Zentraler Grenzwertsatz (CLT) und die „30er-Regel"

**Literatur-Aussage:**  
Rice (2006, S. 172) formuliert: "For most distributions, samples of size 30 or more will have means that are **approximately** normally distributed." Der CLT gilt **asymptotisch** (n → ∞), nicht diskret ab einem fixen n.

**Methodische Einordnung:**  
Die häufig genannte „30er-Regel" ist eine **didaktische Faustregel**, keine mathematisch-exakte Schwelle. Die benötigte Stichprobengröße hängt von der **Ausgangsverteilung** ab: Bei stark schiefen Verteilungen kann n ≫ 50 erforderlich sein (Lumley et al. 2002).

**Projektspezifische Herausforderung:**  
Sternebewertungen (1-5) sind **ordinal** (nicht metrisch) und oft **rechtsschief** (Häufung positiver Reviews). Ceiling-Effekte bei 5★ und Floor-Effekte bei 1★ verstärken die Abweichung von Normalverteilung.

**Unsere Entscheidung:**  
Wir verwenden **n≈30 als unteren Risikomarker**, nicht als Validitätsschwelle. Bei n<30 führen wir zusätzlich nicht-parametrische Tests durch (Mann-Whitney-U, Kruskal-Wallis), um die Robustheit zu prüfen. **Wichtig:** Eine a-priori-Pilotstudie zur empirischen Verteilungsabschätzung war im Projektkontext nicht möglich – dies bleibt eine methodische Limitation.

*Literatur: Rice (2006), Lumley et al. (2002), Hogg et al. (2018)*

### 1.2 Power-Analyse und Effektstärken-Konventionen

**Literatur-Aussage:**  
Cohen (1988, S. 25-27) betont explizit: "The terms 'small', 'medium', and 'large' are relative [...] to the specific content and research method." Die Werte d=0.2/0.5/0.8 sind **Konventionen zur Vergleichbarkeit**, keine Naturkonstanten.

**Methodische Herausforderung:**  
Cohen's d setzt **metrisches Skalenniveau** voraus. Bei ordinalen Sternebewertungen ist dies eine **Approximation** (Norman 2010). Zudem ist die wahre Effektstärke zwischen Unternehmen/Topics **unbekannt**.

**Pragmatische Entscheidung:**  
Wir behandeln Ratings als **quasi-intervallskaliert** – nicht weil dies ideal ist, sondern aus drei Gründen:  
1. **Praktikabilität** (Standard-Visualisierungen, Vergleichbarkeit mit anderen Plattformen)  
2. **Empirische Robustheit** bei großen n (Norman 2010)  
3. **Transparenz** durch parallele nicht-parametrische Sensitivitätsanalysen

Unter Annahme mittlerer Effekte (d≈0.5, Power≈0.80, α=0.05) ergibt sich n≈64 pro Gruppe (Cohen 1988). **Wichtig:** Ohne Pilot-Daten bleibt dies spekulativ.

*Literatur: Cohen (1988), Norman (2010), Faul et al. (2007)*

### 1.3 Konfidenzintervalle und Präzisions-Design

**Literatur-Ansatz:**  
Maxwell et al. (2008) empfehlen den **AIPE-Ansatz** (Accuracy in Parameter Estimation): Forscher definieren **a priori** die gewünschte Präzision, kein universeller Standard existiert.

**Projektspezifische Festlegung:**  
Wir definieren als Ziel: **Margin of Error (MoE) ≤ ±0.20** auf der 5-Punkt-Skala. Diese Wahl reflektiert eine **Designentscheidung zwischen Interpretierbarkeit und Datenverfügbarkeit**: ±0.20 entspricht ~4% der Skalenspanne, was wir als "noch tolerabel" einstufen.

**Kritische Abhängigkeit:**  
Unter Annahme s≈1.0 folgt n≈100. **Wichtig:** Diese Ableitung steht und fällt mit der angenommenen Streuung. Bei s<1.0 (homogene Reviews) ist weniger n ausreichend, bei s>1.0 (polarisierte Reviews) mehr n erforderlich. **Konsequenz:** Nach ersten empirischen Daten muss n re-kalibriert werden.

*Literatur: Maxwell et al. (2008), Cumming (2014)*

---

## 2. Projektspezifische Orientierungswerte

Die folgenden Werte dienen der **operativen Dashboard-Kommunikation**, nicht der statistischen Gültigkeitsprüfung. Sie markieren Punkte auf einem kontinuierlichen Risikospektrum:

| Stichprobengröße | Forschungslogische Einordnung | UI-Kommunikation |
|------------------|-------------------------------|------------------|
| n < 30 | CLT-Approximation unsicher; nicht-parametrische Tests bevorzugen | "Begrenzte Datenbasis" |
| n = 30-64 | Power für mittlere Effekte wahrscheinlich <80%; breite CIs | "Eingeschränkte Aussagekraft" |
| n = 65-100 | Moderate Robustheit; MoE noch >±0.20 | "Akzeptable Basis" |
| n > 100 | Gute Robustheit; MoE ≈±0.20 oder schmaler | "Solide Datenbasis" |

**Kritische Klarstellung:**  
Diese Einteilung dient **ausschließlich der Nutzer-Information im UI**, nicht der Feststellung statistischer Validität. Die Grenzen sind heuristisch und setzen idealisierende Annahmen voraus (moderate Schiefe, s≈1.0, d≈0.5).

**Methodische Konsequenz:**  
Unabhängig von n berichten wir immer: Effektstärken, Konfidenzintervalle, Stichprobengröße. Bei n<30 zusätzlich nicht-parametrische Sensitivitätstests.

---

## 3. ANOVA und Multiple Vergleiche (Topic-Analyse)

**Relevanz:** Unser System vergleicht 13 Topics (Employee) bzw. 10 Topics (Candidates) gleichzeitig.

**Wissenschaftliche Belege:**

1. **Keppel, G., & Wickens, T. D. (2004).** *Design and Analysis: A Researcher's Handbook* (4th ed.). Pearson.
   - Kapitel 11: "The Single-Factor Design"
   - **Formel für ANOVA:** F = MS_between / MS_within
   - **Heuristische Orientierung aus der Literatur:** n = 20-30 pro Gruppe als Ausgangspunkt

2. **Maxwell, S. E., Delaney, H. D., & Kelley, K. (2017).** *Designing Experiments and Analyzing Data: A Model Comparison Perspective* (3rd ed.). Routledge.
   - **Orientierung für ANOVA:** n ≈ 25-30 pro Gruppe als Richtwert
   - Bei k = 13 Gruppen (Topics): **Gesamt n ≈ 325-390**

3. **Cohen, J. (1988).** *Statistical Power Analysis* (siehe oben)
   - **ANOVA Power-Tabellen (unter Annahmen):**
     - Falls f = 0.25 (kleine Effektstärke), α = 0.05, Power ≈ 0.80, k = 13 → **n ≈ 30 pro Gruppe**
     - **Total: 13 × 30 = 390 Reviews**

**⚠️ Kritische Einschränkung (gilt analog zu t-Tests):**  
Die Annahme **f ≈ 0.25** ist **rein konventionell und empirisch nicht vorab bekannt**. Ebenso wie bei Cohen's d für t-Tests handelt es sich um eine Konvention zur Studienplanung, nicht um empirische Gewissheit. Die tatsächliche Effektstärke zwischen Topics kann:
- **Kleiner sein** (f < 0.25) → höhere n erforderlich für gleiche Power
- **Größer sein** (f > 0.25) → niedrigere n ausreichend

Ohne Pilot-Daten bleibt jede Power-Kalkulation spekulativ.

**Post-hoc Korrektur (Bonferroni, Tukey):**

4. **Armstrong, R. A. (2014).** "When to use the Bonferroni correction." *Ophthalmic and Physiological Optics*, 34(5), 502-508.
   - **DOI:** 10.1111/opo.12131
   - **Problem:** Multiple Vergleiche erhöhen Type-I-Error
   - **Lösung:** Adjustiere α-Level: α_adjusted = α / k
   - **Beispiel:** Bei 13 Topics: α = 0.05/13 = 0.0038

---

## 4. Sentiment-Analyse Validierung

**Wissenschaftliche Belege:**

1. **Liu, B. (2012).** *Sentiment Analysis and Opinion Mining*. Morgan & Claypool.
   - **Häufige Praxisbereiche** (keine normativen Schwellen): ca. 100–500 annotierte Beispiele für Sentiment-Validierung
   - Größere Stichproben führen tendenziell zu robusteren Evaluations-Metriken

2. **Mohammad, S. M., & Turney, P. D. (2013).** "Crowdsourcing a word-emotion association lexicon." *Computational Intelligence*, 29(3), 436-465.
   - **DOI:** 10.1111/j.1467-8640.2012.00460.x
   - **Beobachteter Praxisbereich:** Für reliable Inter-Annotator Agreement (Kappa) werden häufig n ≥ 200 Samples verwendet
   - **Wichtig:** Kein universal definierter Mindestwert, sondern domänenabhängige Konvention

---

## 5. Empfehlungen für das Review-Analyse-System

### 5.1 Heuristische Orientierungswerte auf einem Risikokontinuum

Die folgenden Werte markieren **Punkte auf einem kontinuierlichen Risikospektrum**, keine dichotomen Schwellen. Sie dienen der operativen Orientierung im Dashboard-System:

| Analyse-Typ | Risiko-Marker 1 | Risiko-Marker 2 | Risiko-Marker 3 | Literatur-Basis |
|-------------|-----------------|-----------------|-----------------|-----------------|
| **Grundstatistik** (Mittelwert, CI) | n≈30 | n≈100 | n≈200 | Rice 2006 (CLT-Heuristik), Maxwell et al. 2008 (AIPE) |
| **Gruppen-Vergleich** (2 Gruppen) | n≈64 (falls d≈0.5) | n≈100 | n≈200 | Cohen 1988 (Konvention), Faul et al. 2007 |
| **Topic-Analyse** (ANOVA, k=13) | n≈390 (falls f≈0.25) | n≈500 | n≈1000 | Maxwell & Delaney 2017, Cohen 1988 |
| **Korrelations-Analyse** | n≈100 | n≈250 | n≈500 | Schönbrodt & Perugini 2013 (empirisch) |
| **Sentiment-Validierung** | n≈100 | n≈200 | n≈500 | Liu 2012, Mohammad & Turney 2013 (Praxisbereiche) |

**Interpretation:**  
Je weiter rechts in der Tabelle, desto **geringer das methodische Risiko** (kontinuierlich abnehmend). Die Marker sind **keine Garantien** für Validität, sondern heuristische Anhaltspunkte unter idealisierten Annahmen.

**Methodische Einschränkungen (gelten für alle Werte):**
1. **Verteilungsannahme:** Moderate Schiefe vorausgesetzt (bei starker Schiefe: höhere n nötig)
2. **Effektannahme:** d=0.5 bzw. f=0.25 sind Konventionen, nicht empirisch bekannt
3. **Streuungsannahme:** s≈1.0 unterstellt (bei s≠1.0: Anpassung erforderlich)
4. **Skalenspezifität:** Nur für 1-5-Sterne-Review-Systeme validiert

**Externe Validität:** Nicht übertragbar auf andere Plattformen/Skalierungen ohne erneute Prüfung.

### 5.2 Praktische Implementierung

```python
class StatisticalValidator:
    """
    Validiert statistische Anforderungen basierend auf wissenschaftlicher Literatur.
    """
    
    # Heuristische Orientierungswerte basierend auf wissenschaftlicher Literatur
    # WICHTIG: Keine absoluten Schwellen, sondern Risikomarker
    HEURISTIC_CLT = 30          # Rice (2006): Daumenregel für CLT-Approximation
    HEURISTIC_POWER = 64        # Cohen (1988): ~80% Power bei d=0.5 (unter Annahmen)
    HEURISTIC_PRECISION = 100   # Maxwell et al. (2008): Schmalere CIs (projektspezifisch)
    HEURISTIC_CORRELATION = 250 # Schönbrodt & Perugini (2013): Stabilere Korrelationen
    HEURISTIC_ANOVA_PER_GROUP = 30  # Keppel & Wickens (2004): Orientierung
    
    def validate_sample_size(self, n: int, analysis_type: str) -> dict:
        """
        Validiert Stichprobengröße für verschiedene Analyse-Typen.
        
        Args:
            n: Stichprobengröße
            analysis_type: Art der Analyse ('basic', 'comparison', 'topic', 'correlation')
            
        Returns:
            dict mit Validierungs-Status und Empfehlungen
        """
        requirements = {
            'basic': {
                'high_risk': self.HEURISTIC_CLT,
                'moderate_risk': self.HEURISTIC_PRECISION,
                'citation': 'Rice (2006), Maxwell et al. (2008)'
            },
            'comparison': {
                'high_risk': self.HEURISTIC_POWER,
                'moderate_risk': self.HEURISTIC_PRECISION * 2,
                'citation': 'Cohen (1988), Faul et al. (2007)'
            },
            'topic': {
                'high_risk': self.HEURISTIC_ANOVA_PER_GROUP * 13,  # 390
                'moderate_risk': 500,
                'citation': 'Maxwell & Delaney (2017)'
            },
            'correlation': {
                'high_risk': self.HEURISTIC_CORRELATION,
                'moderate_risk': 500,
                'citation': 'Schönbrodt & Perugini (2013)'
            }
        }
        
        req = requirements.get(analysis_type, requirements['basic'])
        
        if n < req['high_risk']:
            status = 'HIGH_RISK'
            message = f"❌ Hohe Unsicherheit (n={n} < {req['high_risk']})"
            recommendation = f"Orientierung: n≥{req['high_risk']} für plausiblere Analysen ({req['citation']})"
        elif n < req['moderate_risk']:
            status = 'MODERATE_RISK'
            message = f"⚠️ Moderate Robustheit (n={n})"
            recommendation = f"Orientierung: n≥{req['moderate_risk']} für robustere Analysen (heuristisch)"
        else:
            status = 'LOW_RISK'
            message = f"✅ Gute Datenbasis (n={n})"
            recommendation = "Stichprobengröße überschreitet gängige heuristische Orientierungswerte"
        
        return {
            'status': status,
            'sample_size': n,
            'high_risk_threshold': req['high_risk'],
            'moderate_risk_threshold': req['moderate_risk'],
            'message': message,
            'recommendation': recommendation,
            'citation': req['citation'],
            'note': 'Orientierungswerte – keine normativen Schwellen'
        }
```

---

## 6. Wissenschaftliche Literatur-Verzeichnis

### Peer-Reviewed Artikel

1. **Armstrong, R. A. (2014).** When to use the Bonferroni correction. *Ophthalmic and Physiological Optics*, 34(5), 502-508. DOI: 10.1111/opo.12131

2. **Button, K. S., et al. (2013).** Power failure: why small sample size undermines the reliability of neuroscience. *Nature Reviews Neuroscience*, 14(5), 365-376. DOI: 10.1038/nrn3475

3. **Cohen, J. (1988).** *Statistical Power Analysis for the Behavioral Sciences* (2nd ed.). Routledge.

4. **Cumming, G. (2014).** The New Statistics: Why and How. *Psychological Science*, 25(1), 7-29. DOI: 10.1177/0956797613504966

5. **Faul, F., Erdfelder, E., Lang, A. G., & Buchner, A. (2007).** G*Power 3: A flexible statistical power analysis program. *Behavior Research Methods*, 39(2), 175-191. DOI: 10.3758/BF03193146

6. **Heckman, J. J. (1979).** Sample selection bias as a specification error. *Econometrica*, 47(1), 153-161. DOI: 10.2307/1912352

7. **Ioannidis, J. P. (2005).** Why most published research findings are false. *PLoS Medicine*, 2(8), e124. DOI: 10.1371/journal.pmed.0020124

8. **Liu, B. (2012).** *Sentiment Analysis and Opinion Mining*. Morgan & Claypool Publishers.

9. **Lumley, T., Diehr, P., Emerson, S., & Chen, L. (2002).** The importance of the normality assumption in large public health data sets. *Annual Review of Public Health*, 23(1), 151-169. DOI: 10.1146/annurev.publhealth.23.100901.140546

10. **Maxwell, S. E., Kelley, K., & Rausch, J. R. (2008).** Sample size planning for statistical power and accuracy in parameter estimation. *Annual Review of Psychology*, 59, 537-563. DOI: 10.1146/annurev.psych.59.103006.093735

11. **Mohammad, S. M., & Turney, P. D. (2013).** Crowdsourcing a word-emotion association lexicon. *Computational Intelligence*, 29(3), 436-465. DOI: 10.1111/j.1467-8640.2012.00460.x

12. **Schönbrodt, F. D., & Perugini, M. (2013).** At what sample size do correlations stabilize? *Journal of Research in Personality*, 47(5), 609-612. DOI: 10.1016/j.jrp.2013.05.009

### Lehrbücher (Standard-Referenzen)

13. **Hogg, R. V., McKean, J. W., & Craig, A. T. (2018).** *Introduction to Mathematical Statistics* (8th ed.). Pearson.

14. **Keppel, G., & Wickens, T. D. (2004).** *Design and Analysis: A Researcher's Handbook* (4th ed.). Pearson.

15. **Maxwell, S. E., Delaney, H. D., & Kelley, K. (2017).** *Designing Experiments and Analyzing Data* (3rd ed.). Routledge.

16. **Rice, J. A. (2006).** *Mathematical Statistics and Data Analysis* (3rd ed.). Duxbury Press.

17. **Shadish, W. R., Cook, T. D., & Campbell, D. T. (2002).** *Experimental and Quasi-Experimental Designs for Generalized Causal Inference*. Houghton Mifflin.

18. **Smithson, M. (2003).** *Confidence Intervals*. SAGE Publications.

---

## 7. Zusammenfassung für die praktische Anwendung

### Kernaussagen für das Review-Analyse-System

**1. Risikokontinuum statt Schwellenwerte:**  
Die Eignung einer Stichprobe für statistische Analysen liegt auf einem **kontinuierlichen Spektrum**. Wir verwenden heuristische Marker zur operativen Orientierung, nicht als dichotome Ja/Nein-Entscheidungen.

**2. Projektspezifische Orientierungswerte (nicht übertragbar):**

- **n ≈ 30:** Marker ab dem CLT-Approximation bei normalnahen Verteilungen plausibler wird (Rice 2006)
- **n ≈ 64-100:** Bereich ab dem Power für mittlere Effekte plausibler wird (Cohen 1988, unter Annahmen)
- **n ≈ 250+:** Bereich ab dem Korrelationen stabiler werden (Schönbrodt & Perugini 2013, empirisch)
- **n ≈ 390+:** Orientierung für Topic-ANOVA mit k=13 bei angenommener kleiner Effektstärke (Maxwell & Delaney 2017)

**3. Methodische Einschränkungen (für alle Werte):**

- **Abhängig von unbekannten Parametern:** Wahre Effektstärken (d, f), tatsächliche Streuung (s), Verteilungsform
- **Kontextspezifisch:** Nur für 1-5-Sterne-Review-Systeme mit moderater Schiefe
- **Re-Kalibrierung erforderlich:** Nach ersten empirischen Daten anpassen

**4. Kompromisse transparent gemacht:**

- Verwendung von **Mittelwerten** für ordinale Daten: praktikabilitäts- und vergleichbarkeitsgetrieben, nicht weil ideal
- Behandlung als **quasi-intervallskaliert**: robuste Approximation bei großen n (Norman 2010), aber methodischer Kompromiss  

---

---

## 8. Technischer Anhang: Implementierungs-Details

**Hinweis:** Dieser Abschnitt dokumentiert die technische Umsetzung für Entwicklungszwecke. Für die Bachelorarbeit sind die methodischen Abschnitte 1-7 relevant.

### 8.1 Backend-Integration

```python
# backend/services/statistical_validator.py

from typing import Dict, Any
import math
from scipy import stats
import numpy as np

class StatisticalQualityAssurance:
    """
    Qualitätssicherung für Review-Analysen basierend auf literatur-informierten Heuristiken.
    
    WICHTIGE METHODISCHE EINSCHRÄNKUNGEN:
    - Alle Konstanten markieren Punkte auf einem Risikokontinuum, keine Schwellen
    - Gültigkeit setzt moderate Schiefe, s≈1.0 und unbekannte Effektstärken voraus
    - Werte sind projektspezifisch für 1-5-Sterne-Review-Systeme
    - Nach ersten empirischen Daten re-kalibrieren
    """
    
    # Heuristische Risiko-Marker (literatur-informiert, nicht normativ)
    HEURISTIC_CLT = 30          # Rice (2006): Daumenregel für CLT-Approximation
    HEURISTIC_POWER_MEDIUM = 64 # Cohen (1988): falls d≈0.5 (Konvention, nicht empirisch)
    HEURISTIC_PRECISION = 100   # Projektspezifisch: MoE ≤±0.20 bei s≈1.0
    HEURISTIC_STABLE_CORR = 250 # Schönbrodt & Perugini (2013): empirisch beobachtet
    
    @staticmethod
    def calculate_confidence_interval(
        ratings: list,
        confidence: float = 0.95
    ) -> Dict[str, float]:
        """
        Berechnet Konfidenzintervall nach Smithson (2003).
        """
        n = len(ratings)
        mean = np.mean(ratings)
        std = np.std(ratings, ddof=1)
        se = std / np.sqrt(n)
        
        t_crit = stats.t.ppf((1 + confidence) / 2, df=n-1)
        margin = t_crit * se
        
        return {
            'mean': mean,
            'lower': mean - margin,
            'upper': mean + margin,
            'margin_of_error': margin,
            'confidence_level': confidence,
            'sample_size': n,
            'citation': 'Smithson (2003)'
        }
    
    @staticmethod
    def assess_statistical_power(
        n: int,
        effect_size: float = 0.5,
        alpha: float = 0.05
    ) -> Dict[str, Any]:
        """
        Power-Analyse nach Cohen (1988) und Faul et al. (2007).
        """
        z_alpha = stats.norm.ppf(1 - alpha/2)
        ncp = effect_size * np.sqrt(n/2)  # Non-centrality parameter
        z_beta = ncp - z_alpha
        power = stats.norm.cdf(z_beta)
        
        adequate = power >= 0.80
        
        return {
            'power': power,
            'adequate': adequate,
            'sample_size': n,
            'effect_size': effect_size,
            'recommendation': 'Adequate' if adequate else f'Increase to n={StatisticalQualityAssurance.MIN_POWER_MEDIUM}',
            'citation': 'Cohen (1988), Faul et al. (2007)'
        }
    
    @staticmethod
    def check_sample_adequacy(
        n: int,
        analysis_type: str = 'basic'
    ) -> Dict[str, Any]:
        """
        Bewertet Stichproben-Qualität basierend auf heuristischen Orientierungswerten.
        
        WICHTIG: Dies sind keine absoluten Schwellen, sondern Risikoeinschätzungen.
        """
        checks = {
            'clt_approximation_plausible': n >= StatisticalQualityAssurance.HEURISTIC_CLT,
            'power_likely_adequate': n >= StatisticalQualityAssurance.HEURISTIC_POWER_MEDIUM,
            'estimation_moderately_precise': n >= StatisticalQualityAssurance.HEURISTIC_PRECISION,
            'correlations_more_stable': n >= StatisticalQualityAssurance.HEURISTIC_STABLE_CORR
        }
        
        if n < 30:
            level = 'EXPLORATORY'
            color = 'red'
            message = f"⚠️ n={n} < 30: Normalapproximation unsicher (Rice 2006)"
        elif n < 64:
            level = 'LIMITED_ROBUSTNESS'
            color = 'yellow'
            message = f"⚠️ n={n}: Power für d=0.5 wahrscheinlich < 80% (Cohen 1988)"
        elif n < 100:
            level = 'MODERATE_ROBUSTNESS'
            color = 'blue'
            message = f"✅ n={n}: CLT-Approximation plausibler, CI noch relativ breit"
        elif n < 250:
            level = 'GOOD_ROBUSTNESS'
            color = 'green'
            message = f"✅ n={n}: Gute Datenbasis für robuste Analysen"
        else:
            level = 'HIGH_ROBUSTNESS'
            color = 'green'
            message = f"✅ n={n}: Sehr robuste Datenbasis (Schönbrodt & Perugini 2013)"
        
        return {
            'sample_size': n,
            'quality_level': level,
            'color_code': color,
            'message': message,
            'checks': checks,
            'recommendations': StatisticalQualityAssurance._get_recommendations(n),
            'note': 'Diese Bewertung basiert auf heuristischen Orientierungswerten und setzt normalverteilte Daten voraus.'
        }
    
    @staticmethod
    def _get_recommendations(n: int) -> list:
        """Gibt heuristische Empfehlungen basierend auf Stichprobengröße."""
        recs = []
        
        if n < 30:
            recs.append("Prüfe Verteilung empirisch; erwäge non-parametrische Tests")
            recs.append("Ziel n≥30 für plausiblere CLT-Approximation (Rice 2006 als Heuristik)")
        if n < 64:
            recs.append("Ziel n≥64 für ~80% Power bei d=0.5 (Cohen 1988, unter Annahmen)")
        if n < 100:
            recs.append("Ziel n≥100 für schmalere Konfidenzintervalle (projektspezifische Entscheidung)")
        if n < 250:
            recs.append("Bei Korrelationsanalysen: n≥250 reduziert Instabilität (Schönbrodt & Perugini 2013)")
        
        if not recs:
            recs.append("✅ Stichprobengröße überschreitet gängige heuristische Orientierungswerte")
        
        return recs
```

---

## Schlussbemerkung

Die in diesem Dokument diskutierten Orientierungswerte (n≈30, n≈64, n≈100, n≈250, n≈390) sind durch **peer-reviewed Literatur informiert**, stellen jedoch **heuristische Marker auf einem Risikokontinuum** dar. Sie basieren auf:

1. **Mathematischen Resultaten** (CLT als asymptotisches Theorem) **und Daumenregeln** („30er-Regel" als didaktische Konvention)
2. **Konventionellen Effektstärken** (d=0.5, f=0.25 nach Cohen 1988) – **nicht empirisch bekannt**
3. **Projektspezifischen Festlegungen** (MoE ≤±0.20 als „tolerabel", s≈1.0 als Annahme)
4. **Empirischen Beobachtungen** (Korrelationsstabilität bei n≈250, Schönbrodt & Perugini 2013)

**Kritische Reflexion zur Gültigkeit:**

Diese Werte sind **nicht universell**, sondern kontextspezifisch für Review-Systeme mit 1-5-Sterne-Skalen unter idealisierten Annahmen (moderate Schiefe, normalnahe Verteilung, s≈1.0). Sie:
- Markieren **Punkte auf einem kontinuierlichen Risikospektrum**, keine dichotomen Schwellen
- Erfordern **Re-Kalibrierung** nach ersten empirischen Daten
- Sind **nicht übertragbar** auf andere Plattformen/Kontexte ohne Validierung

Die implementierten Validierungen dienen der **Risikoreduktion**, nicht der Garantie von Validität:
- Warnung bei sehr kleinen n (erhöhtes Risiko für Zufallsbefunde)
- Graduierte Einschätzung statt binärer Entscheidungen
- Transparenz über methodische Limitationen

---

**Erstellt:** 3. Februar 2026  
**Version:** 1.0  
**Autoren:** Gruppe P1-3, Bachelor Projekt  
**Zweck:** Wissenschaftliche Fundierung der Stichprobengrößen-Empfehlungen für das Review-Analyse-System
