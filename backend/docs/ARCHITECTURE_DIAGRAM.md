# 📐 Architektur-Übersicht: Statistische Validierung

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/JavaScript)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  TopicOverview   │  │ CompanyDashboard │  │  StatisticalInfo │          │
│  │     Card         │  │                  │  │     Tooltip      │          │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          │
│           │                     │                      │                     │
│           └─────────────────────┴──────────────────────┘                     │
│                                 │                                            │
│                        Fetch API Requests                                    │
│                                 │                                            │
└─────────────────────────────────┼────────────────────────────────────────────┘
                                  │
                                  │ HTTP/JSON
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND API (FastAPI)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  routes/analytics.py                                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────┐       │ │
│  │  │ GET /api/analytics/company/{id}/topic-overview              │       │ │
│  │  │  ➜ Returns: topics with statistical_meta                    │       │ │
│  │  └─────────────────────────────────────────────────────────────┘       │ │
│  │                                                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────┐       │ │
│  │  │ GET /api/analytics/statistical/validate-sample-size         │       │ │
│  │  │  ➜ Returns: risk_level, ci_width, recommendations           │       │ │
│  │  └─────────────────────────────────────────────────────────────┘       │ │
│  │                                                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────┐       │ │
│  │  │ GET /api/analytics/company/{id}/statistical-assessment      │       │ │
│  │  │  ➜ Returns: comprehensive company data quality analysis     │       │ │
│  │  └─────────────────────────────────────────────────────────────┘       │ │
│  │                                                                          │ │
│  └──────────────┬───────────────────────────────────────────────────────┬──┘ │
│                 │                                                         │    │
│                 │ uses                                                    │    │
│                 ▼                                                         ▼    │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐     │
│  │ statistical_enrichment.py    │  │ statistical_validator.py         │     │
│  │ ───────────────────────────  │  │ ──────────────────────────────── │     │
│  │                              │  │                                  │     │
│  │ enrich_with_metadata()       │  │ StatisticalValidator             │     │
│  │ enrich_topic_analysis()      │  │ ├─ assess_sample_size()         │     │
│  │ enrich_comparison()          │  │ ├─ assess_comparison()          │     │
│  │ get_ui_badge_config()        │◄─┤ └─ validate_correlation()       │     │
│  │ get_methodological_notes()   │  │                                  │     │
│  │                              │  │ RiskLevel Enum                   │     │
│  └──────────────────────────────┘  │ ├─ LIMITED                       │     │
│                                     │ ├─ CONSTRAINED                   │     │
│                                     │ ├─ ACCEPTABLE                    │     │
│                                     │ └─ SOLID                         │     │
│                                     │                                  │     │
│                                     │ SampleSizeAssessment             │     │
│                                     │ ├─ risk_level                    │     │
│                                     │ ├─ ci_width_estimate             │     │
│                                     │ ├─ recommendations               │     │
│                                     │ └─ to_dict()                     │     │
│                                     └──────────────────────────────────┘     │
│                                                                               │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    │
                                    │ reads from
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE (Supabase/PostgreSQL)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │  employee       │  │  candidates     │  │  companies      │            │
│  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │            │
│  │  - id           │  │  - id           │  │  - id           │            │
│  │  - company_id   │  │  - company_id   │  │  - name         │            │
│  │  - rating       │  │  - rating       │  │  - ...          │            │
│  │  - text         │  │  - text         │  └─────────────────┘            │
│  │  - datum        │  │  - datum        │                                  │
│  │  - ...          │  │  - ...          │                                  │
│  └─────────────────┘  └─────────────────┘                                  │
│                                                                               │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    │
                                    │ informed by
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCIENTIFIC METHODOLOGY                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  STATISTICAL_SAMPLE_SIZE_METHODOLOGY.md                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  📚 Rice (2006)              → HEURISTIC_CLT = 30                       │ │
│  │  📚 Cohen (1988)             → HEURISTIC_POWER = 64                     │ │
│  │  📚 Maxwell et al. (2008)    → HEURISTIC_PRECISION = 100                │ │
│  │  📚 Maxwell & Delaney (2017) → HEURISTIC_ANOVA_PER_GROUP = 30           │ │
│  │  📚 Schönbrodt (2013)        → Correlation stability n≈250               │ │
│  │  📚 Norman (2010)            → Quasi-interval treatment                 │ │
│  │  📚 Lumley et al. (2002)     → CLT with skewed distributions           │ │
│  │                                                                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                              DATA FLOW EXAMPLE
═══════════════════════════════════════════════════════════════════════════════

1. USER REQUEST:
   Frontend → GET /api/analytics/company/123/topic-overview
   
2. API PROCESSING:
   a) Fetch reviews from database
      SELECT * FROM employee WHERE company_id = 123
      → Returns 88 reviews
   
   b) Analyze topics
      → Work-Life Balance: 45 mentions, avg 3.2★
      → Gehalt: 28 mentions, avg 2.8★
      → Karriere: 15 mentions, avg 3.5★
   
   c) Enrich with statistical metadata
      enrich_topic_analysis_with_metadata(topics, total=88)
      
      → Calls StatisticalValidator.assess_sample_size() for each topic
      → Adds statistical_meta to each topic
      
   d) Add overall assessment
      enrich_with_statistical_metadata(result, sample_size=88)

3. API RESPONSE:
   {
     "topics": [
       {
         "name": "Work-Life Balance",
         "count": 45,
         "avg_rating": 3.2,
         "statistical_meta": {
           "risk_level": "constrained",
           "ci_width_estimate": 0.29,
           "warning": null
         }
       },
       {
         "name": "Karriere",
         "count": 15,
         "avg_rating": 3.5,
         "statistical_meta": {
           "risk_level": "limited",
           "ci_width_estimate": 0.51,
           "warning": "Nur 15 Reviews - Aussagekraft begrenzt"
         }
       }
     ],
     "statistical_meta": {
       "sample_size": 88,
       "risk_level": "acceptable",
       "analysis_type": "anova"
     }
   }

4. FRONTEND DISPLAY:
   TopicOverviewCard renders:
   
   ┌────────────────────────────────────────┐
   │ Work-Life Balance        45 Reviews    │
   │ ⚡ Eingeschränkte Aussagekraft          │
   │ ⭐⭐⭐ 3.2 (±0.29)                      │
   └────────────────────────────────────────┘
   
   ┌────────────────────────────────────────┐
   │ Karriere                 15 Reviews    │
   │ ⚠️  Begrenzte Datenbasis               │
   │ ⭐⭐⭐⭐ 3.5 (±0.51)                    │
   │ ⚠️  Nur 15 Reviews - begrenzt          │
   └────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                            RISK LEVEL LOGIC
═══════════════════════════════════════════════════════════════════════════════

Input: n (sample size)
                │
                ▼
    ┌───────────────────────┐
    │ n < 30?               │──YES──→ LIMITED      ⚠️  (red)
    └───────────────────────┘
                │ NO
                ▼
    ┌───────────────────────┐
    │ n < 64?               │──YES──→ CONSTRAINED  ⚡  (orange)
    └───────────────────────┘
                │ NO
                ▼
    ┌───────────────────────┐
    │ n < 100?              │──YES──→ ACCEPTABLE   ✓   (yellow)
    └───────────────────────┘
                │ NO
                ▼
            SOLID ✓✓ (green)


═══════════════════════════════════════════════════════════════════════════════
                           CONFIDENCE INTERVAL CALCULATION
═══════════════════════════════════════════════════════════════════════════════

Formula: MoE = z * (s / √n)

Where:
  z = 1.96         (95% confidence level)
  s = 1.0          (assumed standard deviation)
  n = sample size

Examples:
  n=30  → MoE = 1.96 * (1.0 / √30)  = ±0.36★
  n=64  → MoE = 1.96 * (1.0 / √64)  = ±0.24★
  n=100 → MoE = 1.96 * (1.0 / √100) = ±0.20★


═══════════════════════════════════════════════════════════════════════════════
                              FILE STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

backend/
├── services/
│   ├── statistical_validator.py      ← Core validation logic
│   ├── statistical_enrichment.py     ← Utility functions
│   └── topic_rating_service.py       ← Uses validators
│
├── routes/
│   └── analytics.py                  ← API endpoints (integrated)
│
├── docs/
│   ├── STATISTICAL_SAMPLE_SIZE_METHODOLOGY.md    ← Bachelor thesis chapter
│   ├── STATISTICAL_IMPLEMENTATION.md             ← Technical documentation
│   └── IMPLEMENTATION_SUMMARY.md                 ← This summary
│
├── test_statistical_implementation.py            ← Automated tests
└── examples_statistical_usage.py                 ← Practical examples


═══════════════════════════════════════════════════════════════════════════════
```

**Legende:**
- `→` : Function call / Data flow
- `◄─` : Uses / Depends on
- `┌─┐` : Module / Component boundary
- `⚠️` : Warning / High risk indicator
- `⚡` : Medium risk indicator
- `✓` : Acceptable / Low risk indicator
- `✓✓` : Solid / Very low risk indicator
