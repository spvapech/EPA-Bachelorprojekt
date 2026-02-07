import { useState, useEffect, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from "recharts"
import { Building2, Plus, X, ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle, ThumbsDown, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CompanySearchSelect } from "@/components/CompanySearchSelect"
import { exportCompareAsPDF } from "@/utils/pdfExport"
import { API_URL } from "../config"

// Colors for up to 3 companies
const COMPANY_COLORS = ["#3b82f6", "#f59e0b", "#10b981"] // blue, amber, green
const COMPANY_BG = ["bg-blue-50", "bg-amber-50", "bg-emerald-50"]
const COMPANY_BORDER = ["border-blue-200", "border-amber-200", "border-emerald-200"]
const COMPANY_TEXT = ["text-blue-700", "text-amber-700", "text-emerald-700"]

const CATEGORY_LABELS = {
    avg_arbeitsatmosphaere: "Arbeitsatmosphäre",
    avg_image: "Image",
    avg_work_life_balance: "Work-Life-Balance",
    avg_karriere_weiterbildung: "Karriere/Weiterbildung",
    avg_gehalt_sozialleistungen: "Gehalt/Sozialleistungen",
    avg_kollegenzusammenhalt: "Kollegenzusammenhalt",
    avg_umwelt_sozialbewusstsein: "Umwelt-/Sozialbewusstsein",
    avg_vorgesetztenverhalten: "Vorgesetztenverhalten",
    avg_kommunikation: "Kommunikation",
    avg_interessante_aufgaben: "Interessante Aufgaben",
    avg_umgang_aelteren_kollegen: "Umgang m. ä. Kollegen",
    avg_arbeitsbedingungen: "Arbeitsbedingungen",
    avg_gleichberechtigung: "Gleichberechtigung",
}

const MAX_COMPANIES = 3

const ComparePage = () => {
    const location = useLocation()
    const navigate = useNavigate()

    // Each slot: { id, name, query }
    const initialCompanies = location.state?.companies ?? []
    const [slots, setSlots] = useState(() => {
        const initial = initialCompanies.map((c) => ({
            id: c.id != null ? String(c.id) : null,
            name: c.name ?? "",
            query: c.name ?? "",
        }))
        // Always start with at least 2 slots
        while (initial.length < 2) {
            initial.push({ id: null, name: "", query: "" })
        }
        return initial
    })

    // Per-company data keyed by company id
    const [companyData, setCompanyData] = useState({})
    const [loadingIds, setLoadingIds] = useState(new Set())

    // ---------- Slot management ----------
    const updateSlotQuery = (index, value) => {
        setSlots((prev) => {
            const next = [...prev]
            next[index] = { ...next[index], query: value, id: null, name: "" }
            return next
        })
    }

    const selectCompanyForSlot = (index, company) => {
        if (!company) return
        // Prevent selecting a company already in another slot
        const alreadySelected = slots.some(
            (s, i) => i !== index && s.id === String(company.id)
        )
        if (alreadySelected) return

        setSlots((prev) => {
            const next = [...prev]
            next[index] = {
                id: String(company.id),
                name: company.name,
                query: company.name,
            }
            return next
        })
    }

    const clearSlot = (index) => {
        setSlots((prev) => {
            const next = [...prev]
            if (next.length > 2) {
                // Remove slot entirely if more than 2
                next.splice(index, 1)
            } else {
                // Just clear the slot
                next[index] = { id: null, name: "", query: "" }
            }
            return next
        })
    }

    const addSlot = () => {
        if (slots.length >= MAX_COMPANIES) return
        setSlots((prev) => [...prev, { id: null, name: "", query: "" }])
    }

    // ---------- Data fetching ----------
    const fetchCompanyData = useCallback(async (companyId) => {
        if (!companyId || companyData[companyId]) return

        setLoadingIds((prev) => new Set(prev).add(companyId))

        try {
            const [ratingsRes, avgRes, trendRes, timelineRes, overviewRes, negTopicsRes] =
                await Promise.allSettled([
                    fetch(`${API_URL}/companies/${companyId}/ratings`),
                    fetch(`${API_URL}/companies/${companyId}/ratings/avg`),
                    fetch(
                        `${API_URL}/companies/${companyId}/ratings/trend?mode=stable_months&months=12`
                    ),
                    fetch(
                        `${API_URL}/analytics/company/${companyId}/timeline?days=1825&forecast_months=0&source=employee`
                    ),
                    fetch(
                        `${API_URL}/analytics/company/${companyId}/overview`
                    ),
                    fetch(
                        `${API_URL}/topics/company/${companyId}/negative-topics`
                    ),
                ])

            const ratings =
                ratingsRes.status === "fulfilled" && ratingsRes.value.ok
                    ? await ratingsRes.value.json()
                    : null
            const avg =
                avgRes.status === "fulfilled" && avgRes.value.ok
                    ? await avgRes.value.json()
                    : null
            const trendJson =
                trendRes.status === "fulfilled" && trendRes.value.ok
                    ? await trendRes.value.json()
                    : null
            const timelineJson =
                timelineRes.status === "fulfilled" && timelineRes.value.ok
                    ? await timelineRes.value.json()
                    : null
            const overviewJson =
                overviewRes.status === "fulfilled" && overviewRes.value.ok
                    ? await overviewRes.value.json()
                    : null
            const negTopicsJson =
                negTopicsRes.status === "fulfilled" && negTopicsRes.value.ok
                    ? await negTopicsRes.value.json()
                    : null

            // Parse trend
            let trend = null
            if (trendJson) {
                const deltaRaw =
                    trendJson.overall?.deltaPoints ?? trendJson.overall?.avgDelta
                const delta =
                    typeof deltaRaw === "number"
                        ? deltaRaw
                        : parseFloat(deltaRaw)
                if (Number.isFinite(delta)) {
                    const rounded = Math.round(delta * 10) / 10
                    let sign = "flat"
                    if (rounded > 0.05) sign = "up"
                    else if (rounded < -0.05) sign = "down"
                    trend = { avgDelta: rounded.toFixed(1), sign }
                }
            }

            // Parse most critical category (lowest rated)
            let mostCritical = null
            if (avg && typeof avg === "object") {
                const entries = Object.entries(avg)
                    .map(([key, value]) => ({
                        key,
                        title: CATEGORY_LABELS[key] ?? key,
                        score: Number(value),
                    }))
                    .filter((x) => CATEGORY_LABELS[x.key] && Number.isFinite(x.score))
                if (entries.length) {
                    const min = entries.reduce((best, cur) =>
                        cur.score < best.score ? cur : best, entries[0]
                    )
                    mostCritical = { topicName: min.title, score: min.score.toFixed(2) }
                }
            }

            // Parse negative topic (highest impact = mentions × (5 - rating))
            let negativeTopic = null
            const negList = negTopicsJson?.negative_topics || []
            if (Array.isArray(negList) && negList.length) {
                const mentionsOf = (t) => { const n = Number(t?.mention_count); return Number.isFinite(n) ? n : 0 }
                const ratingOf = (t) => { const r = Number(t?.avg_rating); return Number.isFinite(r) ? r : NaN }
                const impactOf = (t) => { const r = ratingOf(t); return Number.isFinite(r) ? Math.max(0, mentionsOf(t)) * Math.max(0, 5 - r) : 0 }
                const chosen = negList.reduce((best, cur) => {
                    const bi = impactOf(best), ci = impactOf(cur)
                    if (ci > bi) return cur
                    if (ci < bi) return best
                    const br = ratingOf(best), cr = ratingOf(cur)
                    if (Number.isFinite(br) && Number.isFinite(cr)) {
                        if (cr < br) return cur
                        if (cr > br) return best
                    }
                    return mentionsOf(cur) > mentionsOf(best) ? cur : best
                }, negList[0])
                negativeTopic = {
                    ...chosen,
                    topic_label: chosen?.topic_label || chosen?.topic || chosen?.topic_text,
                }
            }

            // Fallback: use topic-overview if negative-topics returned nothing
            if (!negativeTopic) {
                try {
                    const fallbackRes = await fetch(`${API_URL}/analytics/company/${companyId}/topic-overview`)
                    if (fallbackRes.ok) {
                        const fallbackJson = await fallbackRes.json()
                        const topics = Array.isArray(fallbackJson?.topics) ? fallbackJson.topics : []
                        if (topics.length) {
                            const normSent = (s) => String(s || "").toLowerCase()
                            const isNeg = (t) => normSent(t?.sentiment).includes("neg")
                            const isNeu = (t) => normSent(t?.sentiment).includes("neu")
                            const isPos = (t) => normSent(t?.sentiment).includes("pos")
                            const hasNoSentiment = (t) => !normSent(t?.sentiment)
                            const ratingOf = (t) => { const r = Number(t?.avgRating); return Number.isFinite(r) ? r : NaN }
                            const freqOf = (t) => { const f = Number(t?.frequency); return Number.isFinite(f) ? f : 0 }

                            const negativeOnly = topics.filter(isNeg)
                            const neutralOnly = topics.filter(isNeu)
                            const noSentimentOnly = topics.filter(hasNoSentiment)
                            const basePool = negativeOnly.length
                                ? negativeOnly
                                : (neutralOnly.length ? neutralOnly : (noSentimentOnly.length ? noSentimentOnly : topics.filter((t) => !isPos(t))))

                            const withRating = basePool.filter((t) => Number.isFinite(ratingOf(t)))
                            const ratingPool = withRating.length ? withRating : basePool

                            if (ratingPool.length) {
                                const impactOf = (t) => {
                                    const f = Math.max(0, freqOf(t))
                                    const r = ratingOf(t)
                                    if (!Number.isFinite(r)) return 0
                                    return f * Math.max(0, 5 - r)
                                }
                                const chosen = ratingPool.reduce((best, cur) => {
                                    const bi = impactOf(best), ci = impactOf(cur)
                                    if (ci > bi) return cur
                                    if (ci < bi) return best
                                    const br = ratingOf(best), cr = ratingOf(cur)
                                    if (Number.isFinite(br) && Number.isFinite(cr)) {
                                        if (cr < br) return cur
                                        if (cr > br) return best
                                    }
                                    return freqOf(cur) > freqOf(best) ? cur : best
                                }, ratingPool[0])
                                negativeTopic = {
                                    ...chosen,
                                    topic_label: chosen?.topic || chosen?.topic_label,
                                }
                            }
                        }
                    }
                } catch (_) { /* ignore fallback errors */ }
            }

            setCompanyData((prev) => ({
                ...prev,
                [companyId]: {
                    ratings,
                    categoryRatings: avg,
                    trend,
                    mostCritical,
                    negativeTopic,
                    timeline: timelineJson?.timeline ?? [],
                    overview: overviewJson,
                },
            }))
        } catch (err) {
            console.error("Error fetching data for company", companyId, err)
        } finally {
            setLoadingIds((prev) => {
                const next = new Set(prev)
                next.delete(companyId)
                return next
            })
        }
    }, [companyData])

    // Fetch data when slots change
    useEffect(() => {
        slots.forEach((slot) => {
            if (slot.id) fetchCompanyData(slot.id)
        })
    }, [slots, fetchCompanyData])

    // ---------- Derived data ----------
    const activeSlots = slots.filter((s) => s.id && companyData[s.id])

    // Build radar chart data
    const radarData = Object.entries(CATEGORY_LABELS).map(([key, label]) => {
        const point = { category: label }
        activeSlots.forEach((slot) => {
            const val = companyData[slot.id]?.categoryRatings?.[key]
            point[slot.name] = val != null ? Number(Number(val).toFixed(2)) : 0
        })
        return point
    })

    // Build bar chart data (same data, different view)
    const barData = radarData

    // Build timeline overlay data
    const buildTimelineOverlay = () => {
        const monthMap = {}
        const monthOrder = []
        activeSlots.forEach((slot) => {
            const timeline = companyData[slot.id]?.timeline ?? []
            timeline.forEach((entry) => {
                if (!entry.date || entry.is_forecast) return
                if (!monthMap[entry.date]) {
                    monthMap[entry.date] = { date: entry.date_display || entry.date }
                    monthOrder.push(entry.date)
                }
                monthMap[entry.date][slot.name] = entry.score
            })
        })
        return monthOrder
            .sort()
            .map((key) => monthMap[key])
    }

    const timelineOverlay = buildTimelineOverlay()

    const getNegativeTopicName = (t) => {
        if (!t) return "–"
        if (t.topic_label) return String(t.topic_label)
        if (t.topic_text) return String(t.topic_text)
        if (t.topic) return String(t.topic)
        if (Array.isArray(t.topic_words) && t.topic_words.length) return String(t.topic_words[0])
        if (Array.isArray(t.categories) && t.categories.length) return String(t.categories[0])
        return "–"
    }

    const [exporting, setExporting] = useState(false)

    const handleExportPDF = async () => {
        if (activeSlots.length < 2) return
        setExporting(true)
        try {
            // Kurz warten damit Charts stabil sind
            await new Promise(r => setTimeout(r, 300))

            const companies = activeSlots.map((slot, i) => {
                const data = companyData[slot.id]
                return {
                    name: slot.name,
                    id: slot.id,
                    score: data?.ratings?.avg_overall ?? null,
                    trend: data?.trend ?? null,
                    mostCritical: data?.mostCritical ?? null,
                    negativeTopic: data?.negativeTopic ?? null,
                    categoryRatings: data?.categoryRatings ?? {},
                }
            })

            await exportCompareAsPDF({
                companies,
                radarChartElement: document.getElementById('compare-radar-chart-export'),
                barChartElement: document.getElementById('compare-bar-chart-export'),
                timelineChartElement: document.getElementById('compare-timeline-chart-export'),
                categoryData: radarData,
            })
        } catch (err) {
            console.error('PDF-Export fehlgeschlagen:', err)
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="shrink-0"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        Firmenvergleich
                    </h1>
                    <p className="text-sm text-slate-500">
                        Vergleichen Sie bis zu {MAX_COMPANIES} Firmen nebeneinander
                    </p>
                </div>
                {activeSlots.length >= 2 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                        disabled={exporting}
                        className="shrink-0 gap-2"
                    >
                        {exporting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        {exporting ? 'Exportiert...' : 'PDF Export'}
                    </Button>
                )}
            </div>

            <div className="px-6 py-6 max-w-[1400px] mx-auto space-y-6">
                {/* Company selectors */}
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold text-slate-800">
                            Firmen auswählen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {slots.map((slot, index) => (
                                <div
                                    key={index}
                                    className={`relative rounded-xl border-2 p-4 transition-all ${
                                        slot.id
                                            ? `${COMPANY_BG[index]} ${COMPANY_BORDER[index]}`
                                            : "border-dashed border-slate-300 bg-white"
                                    }`}
                                >
                                    {/* Color indicator */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div
                                            className="w-3 h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: COMPANY_COLORS[index] }}
                                        />
                                        <span className={`text-sm font-semibold ${COMPANY_TEXT[index]}`}>
                                            Firma {index + 1}
                                        </span>
                                        {slot.id && (
                                            <button
                                                onClick={() => clearSlot(index)}
                                                className="ml-auto p-1 rounded-full hover:bg-black/10 transition-colors"
                                            >
                                                <X className="h-4 w-4 text-slate-500" />
                                            </button>
                                        )}
                                    </div>

                                    {slot.id ? (
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-slate-500" />
                                            <span className="font-semibold text-slate-800 truncate">
                                                {slot.name}
                                            </span>
                                            {loadingIds.has(slot.id) && (
                                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                            )}
                                        </div>
                                    ) : (
                                        <CompanySearchSelect
                                            value={slot.query}
                                            onValueChange={(val) => updateSlotQuery(index, val)}
                                            onCompanySelect={(company) =>
                                                selectCompanyForSlot(index, company)
                                            }
                                            onCreateNew={null}
                                            variant="light"
                                        />
                                    )}
                                </div>
                            ))}

                            {/* Add slot button */}
                            {slots.length < MAX_COMPANIES && (
                                <button
                                    onClick={addSlot}
                                    className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-4 text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors min-h-[100px]"
                                >
                                    <Plus className="h-6 w-6" />
                                    <span className="text-sm font-medium">Firma hinzufügen</span>
                                </button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Show content only when at least 2 companies selected */}
                {activeSlots.length < 2 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                        <Building2 className="h-16 w-16" />
                        <p className="text-lg font-medium">
                            Wählen Sie mindestens 2 Firmen aus, um den Vergleich zu starten
                        </p>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Ø Score comparison */}
                            <Card className="rounded-2xl shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold text-slate-800">
                                        Ø Score
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {activeSlots.map((slot, i) => {
                                        const score =
                                            companyData[slot.id]?.ratings?.avg_overall
                                        return (
                                            <div
                                                key={slot.id}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                COMPANY_COLORS[i],
                                                        }}
                                                    />
                                                    <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                                                        {slot.name}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`text-xl font-extrabold ${
                                                        score > 3
                                                            ? "text-green-600"
                                                            : score >= 2
                                                            ? "text-slate-800"
                                                            : score != null
                                                            ? "text-red-500"
                                                            : "text-slate-400"
                                                    }`}
                                                >
                                                    {score != null ? score : "–"}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </CardContent>
                            </Card>

                            {/* Trend comparison */}
                            <Card className="rounded-2xl shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold text-slate-800">
                                        Trend
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {activeSlots.map((slot, i) => {
                                        const trend = companyData[slot.id]?.trend
                                        return (
                                            <div
                                                key={slot.id}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                COMPANY_COLORS[i],
                                                        }}
                                                    />
                                                    <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                                                        {slot.name}
                                                    </span>
                                                </div>
                                                {trend ? (
                                                    <div className="flex items-center gap-1.5">
                                                        {trend.sign === "up" ? (
                                                            <TrendingUp className="h-4 w-4 text-green-600" />
                                                        ) : trend.sign === "down" ? (
                                                            <TrendingDown className="h-4 w-4 text-red-600" />
                                                        ) : (
                                                            <Minus className="h-4 w-4 text-slate-400" />
                                                        )}
                                                        <span
                                                            className={`text-lg font-extrabold ${
                                                                trend.sign === "up"
                                                                    ? "text-green-600"
                                                                    : trend.sign === "down"
                                                                    ? "text-red-600"
                                                                    : "text-slate-500"
                                                            }`}
                                                        >
                                                            {parseFloat(trend.avgDelta) > 0
                                                                ? "+"
                                                                : ""}
                                                            {trend.avgDelta}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 font-bold">
                                                        –
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </CardContent>
                            </Card>

                            {/* Most Critical comparison */}
                            <Card className="rounded-2xl shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-slate-800">
                                        Most Critical
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {activeSlots.map((slot, i) => {
                                        const mc = companyData[slot.id]?.mostCritical
                                        return (
                                            <div
                                                key={slot.id}
                                                className="flex items-center justify-between gap-2"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                                        style={{
                                                            backgroundColor:
                                                                COMPANY_COLORS[i],
                                                        }}
                                                    />
                                                    <span className="text-sm font-medium text-slate-700 truncate max-w-[80px]">
                                                        {slot.name}
                                                    </span>
                                                </div>
                                                <div className="text-right min-w-0">
                                                    <div className="text-sm font-bold text-red-600 truncate">
                                                        {mc ? mc.topicName : "–"}
                                                    </div>
                                                    {mc && (
                                                        <div className="text-xs font-semibold text-red-500">
                                                            {mc.score}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </CardContent>
                            </Card>

                            {/* Negative Topic comparison */}
                            <Card className="rounded-2xl shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold text-slate-800">
                                        Negative Topic
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {activeSlots.map((slot, i) => {
                                        const nt = companyData[slot.id]?.negativeTopic
                                        return (
                                            <div
                                                key={slot.id}
                                                className="flex items-center justify-between gap-2"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                                        style={{
                                                            backgroundColor:
                                                                COMPANY_COLORS[i],
                                                        }}
                                                    />
                                                    <span className="text-sm font-medium text-slate-700 truncate max-w-[80px]">
                                                        {slot.name}
                                                    </span>
                                                </div>
                                                <span className="text-lg font-extrabold text-orange-400 truncate max-w-[130px] text-right">
                                                    {getNegativeTopicName(nt)}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Category Ratings comparison - Radar + Bar charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Radar Chart */}
                            <Card className="rounded-2xl shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold text-slate-800">
                                        Kategorievergleich (Radar)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div id="compare-radar-chart-export">
                                    <ResponsiveContainer width="100%" height={400}>    <RadarChart
                                            data={radarData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius="70%"
                                        >
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis
                                                dataKey="category"
                                                tick={{ fontSize: 11, fill: "#64748b" }}
                                            />
                                            <PolarRadiusAxis
                                                domain={[0, 5]}
                                                tick={{ fontSize: 10, fill: "#94a3b8" }}
                                            />
                                            {activeSlots.map((slot, i) => (
                                                <Radar
                                                    key={slot.id}
                                                    name={slot.name}
                                                    dataKey={slot.name}
                                                    stroke={COMPANY_COLORS[i]}
                                                    fill={COMPANY_COLORS[i]}
                                                    fillOpacity={0.15}
                                                    strokeWidth={2}
                                                />
                                            ))}
                                            <Legend />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Bar Chart */}
                            <Card className="rounded-2xl shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold text-slate-800">
                                        Kategorievergleich (Balken)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div id="compare-bar-chart-export">
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart
                                            data={barData}
                                            layout="vertical"
                                            margin={{
                                                left: 20,
                                                right: 20,
                                                top: 10,
                                                bottom: 10,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#f1f5f9"
                                            />
                                            <XAxis
                                                type="number"
                                                domain={[0, 5]}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="category"
                                                width={130}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <Tooltip />
                                            <Legend />
                                            {activeSlots.map((slot, i) => (
                                                <Bar
                                                    key={slot.id}
                                                    dataKey={slot.name}
                                                    fill={COMPANY_COLORS[i]}
                                                    radius={[0, 4, 4, 0]}
                                                    barSize={activeSlots.length > 2 ? 8 : 12}
                                                />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Timeline comparison */}
                        {timelineOverlay.length > 0 && (
                            <Card className="rounded-2xl shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold text-slate-800">
                                        Bewertungsverlauf im Vergleich
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div id="compare-timeline-chart-export">
                                    <ResponsiveContainer width="100%" height={350}>
                                        <LineChart
                                            data={timelineOverlay}
                                            margin={{
                                                left: 10,
                                                right: 30,
                                                top: 10,
                                                bottom: 10,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#f1f5f9"
                                            />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 11 }}
                                                interval="preserveStartEnd"
                                            />
                                            <YAxis
                                                domain={[1, 5]}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <Tooltip />
                                            <Legend />
                                            {activeSlots.map((slot, i) => (
                                                <Line
                                                    key={slot.id}
                                                    type="monotone"
                                                    dataKey={slot.name}
                                                    stroke={COMPANY_COLORS[i]}
                                                    strokeWidth={2.5}
                                                    dot={{ r: 3 }}
                                                    activeDot={{ r: 5 }}
                                                    connectNulls
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Detailed category comparison table */}
                        <Card className="rounded-2xl shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-bold text-slate-800">
                                    Detailvergleich nach Kategorien
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 pr-4 font-semibold text-slate-600">
                                                Kategorie
                                            </th>
                                            {activeSlots.map((slot, i) => (
                                                <th
                                                    key={slot.id}
                                                    className="text-center py-3 px-4 font-semibold"
                                                >
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div
                                                            className="w-2.5 h-2.5 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    COMPANY_COLORS[i],
                                                            }}
                                                        />
                                                        <span className="truncate max-w-[100px]">
                                                            {slot.name}
                                                        </span>
                                                    </div>
                                                </th>
                                            ))}
                                            {activeSlots.length >= 2 && (
                                                <th className="text-center py-3 px-4 font-semibold text-slate-600">
                                                    Differenz
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(CATEGORY_LABELS).map(
                                            ([key, label]) => {
                                                const values = activeSlots.map(
                                                    (slot) => {
                                                        const v =
                                                            companyData[slot.id]
                                                                ?.categoryRatings?.[key]
                                                        return v != null
                                                            ? Number(v)
                                                            : null
                                                    }
                                                )
                                                const validValues = values.filter(
                                                    (v) => v != null
                                                )
                                                const maxVal = Math.max(...validValues)
                                                const minVal = Math.min(...validValues)
                                                const diff =
                                                    validValues.length >= 2
                                                        ? (maxVal - minVal).toFixed(2)
                                                        : null

                                                return (
                                                    <tr
                                                        key={key}
                                                        className="border-b last:border-b-0 hover:bg-slate-50 transition-colors"
                                                    >
                                                        <td className="py-3 pr-4 font-medium text-slate-700">
                                                            {label}
                                                        </td>
                                                        {values.map((val, i) => {
                                                            const isBest =
                                                                val != null &&
                                                                val === maxVal &&
                                                                validValues.length >= 2
                                                            const isWorst =
                                                                val != null &&
                                                                val === minVal &&
                                                                validValues.length >= 2 &&
                                                                maxVal !== minVal
                                                            return (
                                                                <td
                                                                    key={i}
                                                                    className={`text-center py-3 px-4 font-bold ${
                                                                        isBest
                                                                            ? "text-green-600"
                                                                            : isWorst
                                                                            ? "text-red-500"
                                                                            : "text-slate-800"
                                                                    }`}
                                                                >
                                                                    {val != null
                                                                        ? val.toFixed(2)
                                                                        : "–"}
                                                                </td>
                                                            )
                                                        })}
                                                        {activeSlots.length >= 2 && (
                                                            <td className="text-center py-3 px-4 font-semibold text-slate-500">
                                                                {diff != null
                                                                    ? `±${diff}`
                                                                    : "–"}
                                                            </td>
                                                        )}
                                                    </tr>
                                                )
                                            }
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    )
}

export default ComparePage