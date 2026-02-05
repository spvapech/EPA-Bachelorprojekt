# 📊 Methodische Begründung der Stichprobengrößen-Entscheidungen

**Bachelorarbeit – Gruppe P1-3**  
**Datum:** 3. Februar 2026  

---

## Vorbemerkung zur methodischen Einordnung

Die in diesem Dokument diskutierten Stichprobengrößen (n≈30, n≈64, n≈100) basieren auf etablierter statistischer Literatur (Rice 2006, Cohen 1988, Maxwell et al. 2008), stellen jedoch **projektspezifische Entscheidungen** dar, keine universellen Standards. Sie reflektieren einen **Trade-off zwischen statistischer Idealvorstellung und praktischer Machbarkeit** in einem Review-Analyse-System.

**Zentrale methodische Limitation:**  
Alle Orientierungswerte setzen Parameter voraus, die **in der Realität unbekannt** sind: wahre Effektstärken (d, f), tatsächliche Verteilungsformen, empirische Streuungen (s). **Eine a-priori-Pilotstudie war im Projektkontext nicht möglich** – dies bleibt eine methodische Einschränkung.

**Forschungslogische Konsequenz:**  
Wir berichten **Effektstärken und Konfidenzintervalle zusätzlich zu p-Werten** und prüfen die Robustheit durch Sensitivitätsanalysen mit nicht-parametrischen Tests.

---

## 1. Zentraler Grenzwertsatz (CLT) und die „30er-Regel"

**Literatur-Aussage:**  
Rice (2006, S. 172) formuliert: "For most distributions, samples of size 30 or more will have means that are **approximately** normally distributed." Der CLT gilt **asymptotisch** (n → ∞), nicht diskret ab einem fixen n.

**Methodische Einordnung:**  
Die häufig genannte „30er-Regel" ist eine **didaktische Faustregel**, keine mathematisch-exakte Schwelle. Die benötigte Stichprobengröße hängt von der **Ausgangsverteilung** ab: Bei stark schiefen Verteilungen kann n ≫ 50 erforderlich sein (Lumley et al. 2002).

**Projektspezifische Herausforderung:**  
Sternebewertungen (1-5) sind **ordinal** (nicht metrisch) und oft **rechtsschief** (Häufung positiver Reviews). Ceiling-Effekte bei 5★ verstärken die Abweichung von Normalverteilung.

**Unsere Entscheidung:**  
Wir verwenden **n≈30 als unteren Risikomarker**, nicht als Validitätsschwelle. Bei n<30 führen wir zusätzlich nicht-parametrische Tests durch (Mann-Whitney-U). **Wichtig:** Die Übergänge zwischen Risikobereichen sind **fließend** – benachbarte Kategorien unterscheiden sich graduell, nicht qualitativ.

**Literatur:** Rice (2006), Lumley et al. (2002)

---

## 2. Power-Analyse und Effektstärken-Konventionen

**Literatur-Aussage:**  
Cohen (1988, S. 25-27) betont: "The terms 'small', 'medium', and 'large' are relative [...] to the specific content and research method." Die Werte d=0.2/0.5/0.8 sind **Konventionen**, keine Naturkonstanten.

**Methodische Herausforderung:**  
Cohen's d setzt **metrisches Skalenniveau** voraus. Bei ordinalen Sternebewertungen ist dies eine **Approximation** (Norman 2010). Zudem ist die wahre Effektstärke **unbekannt**.

**Pragmatische Entscheidung:**  
Wir behandeln Ratings als **quasi-intervallskaliert** aus drei Gründen:  
1. **Praktikabilität** (Standard-Visualisierungen)  
2. **Empirische Robustheit** bei großen n (Norman 2010)  
3. **Transparenz** durch parallele nicht-parametrische Sensitivitätsanalysen

Unter Annahme mittlerer Effekte (d≈0.5) ergibt sich n≈64 pro Gruppe (Cohen 1988). **Ohne Pilot-Daten bleibt dies spekulativ.** 

**Ex-post Validierung:**  
In der Ergebnispräsentation werden empirische Effektstärken (Cohen's d) und deren Konfidenzintervalle berichtet, um die Plausibilität der a-priori-Annahmen nachträglich zu prüfen. Zentrale Befunde werden durch nicht-parametrische Sensitivitätsanalysen (Mann-Whitney-U, Kruskal-Wallis) abgesichert.

**Literatur:** Cohen (1988), Norman (2010)

---

## 3. Konfidenzintervalle und Präzisions-Design

**Literatur-Ansatz:**  
Maxwell et al. (2008) empfehlen den **AIPE-Ansatz**: Forscher definieren **a priori** die gewünschte Präzision, kein universeller Standard existiert.

**Projektspezifische Festlegung:**  
Wir definieren als Ziel: **Margin of Error (MoE) ≤ ±0.20** auf der 5-Punkt-Skala. Diese Wahl reflektiert eine **Designentscheidung zwischen Interpretierbarkeit und Datenverfügbarkeit**. 

**Domänenspezifische Begründung:**  
Im Review-Kontext gelten Unterschiede <0.20 Sterne üblicherweise als **praktisch vernachlässigbar** – Nutzer nehmen sie selten als inhaltlich bedeutsam wahr.

**Kritische Abhängigkeit:**  
Unter Annahme s≈1.0 folgt n≈100. **Wichtig:** Bei s<1.0 (homogene Reviews) ist weniger n ausreichend, bei s>1.0 (polarisierte Reviews) mehr n erforderlich. **Nach ersten empirischen Daten muss n re-kalibriert werden.**

**Literatur:** Maxwell et al. (2008)

---

## 4. Projektspezifische Orientierungswerte

Die folgenden Werte dienen der **Kommunikation im Dashboard**, nicht der statistischen Gültigkeitsprüfung. **Wichtig:** Die UI-Bezeichnungen sind rein kommunikativ und haben **keinen Einfluss auf die statistische Bewertung**. Sie markieren Punkte auf einem kontinuierlichen Risikospektrum:

| Stichprobengröße | Forschungslogische Einordnung | UI-Kommunikation |
|------------------|-------------------------------|------------------|
| n < 30 | CLT-Approximation unsicher; nicht-parametrische Tests bevorzugen | "Begrenzte Datenbasis" |
| n = 30-64 | Power für mittlere Effekte wahrscheinlich <80%; breite CIs | "Eingeschränkte Aussagekraft" |
| n = 65-100 | Moderate Robustheit; MoE noch >±0.20 | "Akzeptable Basis" |
| n > 100 | Gute Robustheit; MoE ≈±0.20 oder schmaler | "Solide Datenbasis" |

**Kritische Klarstellung:**  
Die Grenzen sind heuristisch und setzen idealisierende Annahmen voraus (moderate Schiefe, s≈1.0, d≈0.5). **Die Übergänge sind fließend** – benachbarte Kategorien unterscheiden sich graduell.

**Methodische Konsequenz:**  
Unabhängig von n berichten wir immer: Effektstärken, Konfidenzintervalle, Stichprobengröße. Bei n<30 zusätzlich nicht-parametrische Sensitivitätstests.

---

## 4.1 ANOVA für Topic-Vergleiche (k≥3 Gruppen)

**Methodische Erweiterung:**  
Bei Topic-Analysen mit k≥3 Kategorien verwenden wir **einfaktorielle ANOVA** mit Bonferroni-Korrektur für Post-Hoc-Vergleiche (α=0.05/k). 

**Stichprobenanforderung:**  
Maxwell & Delaney (2017) empfehlen für mittlere Effekte (f=0.25) bei k=13 Topics etwa **n≈30 pro Topic** (Gesamtstichprobe n≈390). Bei ungleicher Topic-Verteilung sinkt die Power für kleinere Gruppen.

**Robustheitsprüfung:**  
Parallel führen wir den nicht-parametrischen **Kruskal-Wallis-Test** durch, der keine Normalverteilung voraussetzt.

**Literatur:** Maxwell & Delaney (2017)

---

## 5. Wissenschaftliches Literaturverzeichnis (Auswahl)

1. **Cohen, J. (1988).** *Statistical Power Analysis for the Behavioral Sciences* (2nd ed.). Routledge.
2. **Lumley, T., et al. (2002).** "The importance of the normality assumption in large public health data sets." *Annual Review of Public Health*, 23, 151-169.
3. **Maxwell, S. E., & Delaney, H. D. (2017).** *Designing Experiments and Analyzing Data: A Model Comparison Perspective* (3rd ed.). Routledge.
4. **Maxwell, S. E., et al. (2008).** "Sample size planning for statistical power and accuracy in parameter estimation." *Annual Review of Psychology*, 59, 537-563.
5. **Norman, G. (2010).** "Likert scales, levels of measurement and the 'laws' of statistics." *Advances in Health Sciences Education*, 15(5), 625-632.
6. **Rice, J. A. (2006).** *Mathematical Statistics and Data Analysis* (3rd ed.). Duxbury Press.
7. **Schönbrodt, F. D., & Perugini, M. (2013).** "At what sample size do correlations stabilize?" *Journal of Research in Personality*, 47(5), 609-612.

*Vollständige Referenzliste mit DOIs siehe Anhang des 700-Zeilen-Dokuments.*

---

**Version:** 1.0 (kompakt für Bachelorarbeit)  
**Status:** Prüfungsgeeignet  
**Umfang:** ~3 Seiten statt 30+ Seiten
