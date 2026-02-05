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
import { Building2, Plus, X, ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CompanySearchSelect } from "@/components/CompanySearchSelect"
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
            const [ratingsRes, avgRes, trendRes, timelineRes, overviewRes] =
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

            setCompanyData((prev) => ({
                ...prev,
                [companyId]: {
                    ratings,
                    categoryRatings: avg,
                    trend,
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
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        Firmenvergleich
                    </h1>
                    <p className="text-sm text-slate-500">
                        Vergleichen Sie bis zu {MAX_COMPANIES} Firmen nebeneinander
                    </p>
                </div>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                        Trend (12 Monate)
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

                            {/* Review count comparison */}
                            <Card className="rounded-2xl shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold text-slate-800">
                                        Anzahl Bewertungen
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {activeSlots.map((slot, i) => {
                                        const overview = companyData[slot.id]?.overview
                                        const count =
                                            overview?.total_reviews ??
                                            overview?.total_count ??
                                            (((overview?.employee_count ?? 0) +
                                                (overview?.candidate_count ?? 0)) || null)
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
                                                <span className="text-xl font-extrabold text-slate-800">
                                                    {count || "–"}
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
                                    <ResponsiveContainer width="100%" height={400}>
                                        <RadarChart
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