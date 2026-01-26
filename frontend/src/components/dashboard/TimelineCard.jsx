import * as React from "react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Legend,
} from "recharts"
import { Filter, ChevronDown, Maximize2, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect, useMemo } from "react"
import { API_URL } from "@/config"

const SOURCE_LABEL = {
    employee: "Mitarbeiter",
    candidates: "Bewerber",
}

const GRANULARITY_LABEL = {
    overall: "ges. Zeitraum",
    year: "Jahr",
}

function parseYear(period) {
    if (!period) return null
    const y = Number(String(period).slice(0, 4))
    return Number.isFinite(y) ? y : null
}

export function TimelineCard({ companyId }) {
    const [timelineData, setTimelineData] = useState([])
    const [forecastData, setForecastData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [metric, setMetric] = useState("Ø Score")
    const [source, setSource] = useState("employee")
    const [granularity, setGranularity] = useState("overall")
    const [selectedYear, setSelectedYear] = useState(null)
    const [years, setYears] = useState([])
    const [modalOpen, setModalOpen] = useState(false)

    // Fetch available years from timeline data
    useEffect(() => {
        if (!companyId) return

        const fetchYears = async () => {
            try {
                // Fetch with large days to get all available data to extract years
                const response = await fetch(
                    `${API_URL}/analytics/company/${companyId}/timeline?days=3650&forecast_months=0&source=${source}`
                )
                if (!response.ok) throw new Error(`API Error (years): ${response.status}`)
                const json = await response.json()

                const ys = (json.timeline || [])
                    .map((d) => parseYear(d.date))
                    .filter((y) => y !== null)

                const uniq = Array.from(new Set(ys)).sort((a, b) => a - b)
                setYears(uniq)

                if (granularity === "year") {
                    const newest = uniq.length ? uniq[uniq.length - 1] : null
                    setSelectedYear((prev) => {
                        if (prev == null) return newest
                        if (uniq.includes(prev)) return prev
                        return newest
                    })
                }
            } catch (e) {
                console.error("Error fetching years:", e)
                setYears([])
            }
        }

        fetchYears()
    }, [companyId, granularity, source])

    useEffect(() => {
        if (!companyId) return

        const fetchTimelineData = async () => {
            try {
                setLoading(true)
                setError(null)

                // Calculate days based on granularity
                let days = 3650 // Default: 10 years for "overall"
                
                if (granularity === "year") {
                    if (selectedYear) {
                        const now = new Date()
                        const yearStart = new Date(selectedYear, 0, 1)
                        // Calculate days from today back to the start of the selected year
                        const daysToYearStart = Math.ceil((now - yearStart) / (1000 * 60 * 60 * 24))
                        // Add buffer to ensure we get all data for that year (full year + extra)
                        days = daysToYearStart + 400
                    } else {
                        // Wait for selectedYear to be set
                        setTimelineData([])
                        setForecastData([])
                        setLoading(false)
                        return
                    }
                }

                const response = await fetch(
                    `${API_URL}/analytics/company/${companyId}/timeline?days=${days}&forecast_months=6&source=${source}`
                )

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`)
                }

                const data = await response.json()

                let filteredTimeline = data.timeline || []
                
                // Filter by selected year if granularity is "year"
                if (granularity === "year" && selectedYear) {
                    filteredTimeline = filteredTimeline.filter((item) => {
                        const itemYear = parseYear(item.date)
                        return itemYear === selectedYear
                    })
                }

                setTimelineData(filteredTimeline)
                setForecastData(data.forecast || [])
            } catch (err) {
                console.error('Error fetching timeline data:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchTimelineData()
    }, [companyId, granularity, selectedYear, source])

    // Calculate trend (delta) for each month compared to previous month
    const trendData = useMemo(() => {
        if (timelineData.length < 2 || metric !== "Trend") return []
        
        const trends = []
        for (let i = 0; i < timelineData.length; i++) {
            if (i === 0) {
                // First month: no previous month to compare, set to 0 or null
                trends.push({
                    date: timelineData[i].date_display || timelineData[i].date,
                    trend: 0,
                    score: timelineData[i].score,
                    prevScore: null
                })
            } else {
                const current = timelineData[i].score
                const previous = timelineData[i - 1].score
                const delta = current - previous
                trends.push({
                    date: timelineData[i].date_display || timelineData[i].date,
                    trend: delta,
                    score: current,
                    prevScore: previous
                })
            }
        }
        return trends
    }, [timelineData, metric])

    // Calculate forecast trends
    const forecastTrendData = useMemo(() => {
        if (metric !== "Trend" || forecastData.length === 0 || timelineData.length === 0) return []
        
        const forecastTrends = []
        const lastHistoricalScore = timelineData[timelineData.length - 1].score
        
        // First forecast month: trend from last historical to first forecast
        if (forecastData.length > 0) {
            const firstForecastScore = forecastData[0].score
            forecastTrends.push({
                date: forecastData[0].date_display || forecastData[0].date,
                trend: firstForecastScore - lastHistoricalScore,
                score: firstForecastScore,
                prevScore: lastHistoricalScore
            })
        }
        
        // Subsequent forecast months: trend from previous forecast month
        for (let i = 1; i < forecastData.length; i++) {
            const current = forecastData[i].score
            const previous = forecastData[i - 1].score
            forecastTrends.push({
                date: forecastData[i].date_display || forecastData[i].date,
                trend: current - previous,
                score: current,
                prevScore: previous
            })
        }
        
        return forecastTrends
    }, [forecastData, timelineData, metric])

    // Prepare chart data - combine historical and forecast with bridge point
    const chartData = useMemo(() => {
        if (timelineData.length === 0) return []

        // For Trend metric, combine historical trends and forecast trends
        if (metric === "Trend") {
            const historicalTrends = trendData.map(item => ({
                date: item.date,
                historical: item.trend,
                forecast: null,
                count: null,
                score: item.score,
                prevScore: item.prevScore
            }))
            
            // Add bridge point: last historical also gets forecast value matching its own trend
            // This ensures the forecast line starts exactly where the historical line ends
            if (historicalTrends.length > 0 && forecastTrendData.length > 0) {
                const lastHistorical = historicalTrends[historicalTrends.length - 1]
                lastHistorical.forecast = lastHistorical.historical
            }
            
            // Add forecast trends - start from the last historical date (skip first forecast point as it's already on the bridge point)
            const forecastTrends = []
            if (forecastTrendData.length > 0 && historicalTrends.length > 0) {
                // First forecast point at last historical date (bridge point - already handled above)
                // Start from second forecast point onwards
                for (let i = 1; i < forecastTrendData.length; i++) {
                    forecastTrends.push({
                        date: forecastTrendData[i].date,
                        historical: null,
                        forecast: forecastTrendData[i].trend,
                        count: null,
                        score: forecastTrendData[i].score,
                        prevScore: forecastTrendData[i].prevScore
                    })
                }
            }
            
            return [...historicalTrends, ...forecastTrends]
        }

        // Historical data points - last point gets both values to bridge the lines
        const historical = timelineData.map((item, index) => {
            const isLast = index === timelineData.length - 1
            return {
                date: item.date_display || item.date,
                historical: metric === "Anzahl" ? item.count : item.score,
                // Bridge point: last historical also gets forecast value to connect lines
                // For "Anzahl" mode, forecast is null since we can't forecast count
                forecast: isLast && forecastData.length > 0 && metric === "Ø Score" ? item.score : null,
                count: item.count,
                score: item.score
            }
        })

        // Forecast data points - only show forecast for "Ø Score" mode
        const forecast = metric === "Ø Score" ? forecastData.map(item => ({
            date: item.date_display || item.date,
            historical: null,
            forecast: item.score,
            count: null,
            score: null
        })) : []

        return [...historical, ...forecast]
    }, [timelineData, forecastData, metric, trendData, forecastTrendData])

    // Find the last historical date for reference line
    const lastHistoricalDate = timelineData.length > 0 
        ? (timelineData[timelineData.length - 1].date_display || timelineData[timelineData.length - 1].date)
        : null

    // Calculate Y-axis domain based on metric
    const yAxisDomain = useMemo(() => {
        if (metric === "Anzahl") {
            const maxCount = Math.max(...timelineData.map(item => item.count || 0), 1)
            // Add some padding (20% or at least 1)
            const padding = Math.max(maxCount * 0.2, 1)
            return [0, Math.ceil(maxCount + padding)]
        }
        if (metric === "Trend") {
            // For trend, we need to handle negative values
            const trendValues = trendData.map(item => item.trend)
            const minTrend = Math.min(...trendValues, 0)
            const maxTrend = Math.max(...trendValues, 0)
            const padding = Math.max(Math.abs(minTrend), Math.abs(maxTrend)) * 0.2
            return [Math.floor(minTrend - padding), Math.ceil(maxTrend + padding)]
        }
        return [0, 5] // Default for "Ø Score"
    }, [timelineData, metric, trendData])

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const historicalValue = payload.find(p => p.dataKey === "historical")?.value
            const forecastValue = payload.find(p => p.dataKey === "forecast")?.value
            const dataPoint = payload[0]?.payload

            return (
                <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                    <p className="font-semibold text-slate-800 mb-1">{label}</p>
                    {metric === "Trend" && historicalValue !== null && historicalValue !== undefined && (
                        <>
                            <p className="text-blue-600 text-sm">
                                Trend: <span className={`font-bold ${historicalValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {historicalValue >= 0 ? '+' : ''}{historicalValue.toFixed(2)}
                                </span>
                            </p>
                            {dataPoint?.score !== null && dataPoint?.score !== undefined && (
                                <p className="text-slate-600 text-xs mt-1">
                                    Aktuell: <span className="font-semibold">{dataPoint.score.toFixed(2)}</span>
                                </p>
                            )}
                            {dataPoint?.prevScore !== null && dataPoint?.prevScore !== undefined && (
                                <p className="text-slate-500 text-xs">
                                    Vorher: <span className="font-semibold">{dataPoint.prevScore.toFixed(2)}</span>
                                </p>
                            )}
                        </>
                    )}
                    {metric !== "Trend" && historicalValue !== null && historicalValue !== undefined && (
                        <p className="text-blue-600 text-sm">
                            Historisch: <span className="font-bold">
                                {metric === "Anzahl" 
                                    ? Math.round(historicalValue) 
                                    : historicalValue.toFixed(2)}
                            </span>
                        </p>
                    )}
                    {forecastValue !== null && forecastValue !== undefined && (
                        <p className="text-orange-500 text-sm">
                            {metric === "Trend" ? "Prognose Trend: " : "Prognose: "}
                            <span className={`font-bold ${metric === "Trend" && forecastValue >= 0 ? 'text-green-600' : metric === "Trend" ? 'text-red-600' : ''}`}>
                                {metric === "Trend" && forecastValue >= 0 ? '+' : ''}{forecastValue.toFixed(2)}
                            </span>
                        </p>
                    )}
                    {metric === "Ø Score" && dataPoint?.count && (
                        <p className="text-slate-500 text-xs mt-1">
                            Bewertungen: {dataPoint.count}
                        </p>
                    )}
                </div>
            )
        }
        return null
    }

    // Filter dropdowns component (reusable)
    const FilterDropdowns = () => (
        <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Source Toggle Switch */}
            <button
                onClick={() => setSource(source === "employee" ? "candidates" : "employee")}
                className="relative inline-flex items-center bg-slate-100 rounded-full p-1 h-9 cursor-pointer hover:bg-slate-150 transition-colors border border-slate-200 shadow-sm hover:shadow-md"
            >
                <div className="flex items-center">
                    <span
                        className={`relative z-10 px-4 py-1 text-sm font-medium transition-colors duration-300 ${
                            source === "employee" ? "text-white" : "text-slate-600"
                        }`}
                    >
                        Mitarbeiter
                    </span>
                    <span
                        className={`relative z-10 px-4 py-1 text-sm font-medium transition-colors duration-300 ${
                            source === "candidates" ? "text-white" : "text-slate-600"
                        }`}
                    >
                        Bewerber
                    </span>
                </div>
                {/* Sliding background */}
                <div
                    className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ${
                        source === "employee" ? "bg-blue-500" : "bg-green-500"
                    }`}
                    style={{
                        left: source === "employee" ? "4px" : "50%",
                        right: source === "employee" ? "50%" : "4px",
                    }}
                />
            </button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="rounded-full h-9 gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        {metric}
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setMetric("Ø Score")}>
                        Ø Score
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setMetric("Trend")}>
                        Trend
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Granularity */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="rounded-full h-9 gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        {GRANULARITY_LABEL[granularity]}
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { 
                        setGranularity("overall")
                        setSelectedYear(null)
                    }}>
                        ges. Zeitraum
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                        setGranularity("year")
                        // selectedYear wird im years-effect automatisch auf "neuestes" gesetzt, falls null
                    }}>
                        Jahr
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Year selector only for year-view */}
            {granularity === "year" && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="rounded-full h-9 gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            {selectedYear ? `Jahr ${selectedYear}` : "Jahr wählen"}
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {years.length === 0 ? (
                            <DropdownMenuItem disabled>Keine Jahre</DropdownMenuItem>
                        ) : (
                            years.map((y) => (
                                <DropdownMenuItem key={y} onClick={() => setSelectedYear(y)}>
                                    {y}
                                </DropdownMenuItem>
                            ))
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    )

    // Chart component (reusable for card and modal)
    const TimelineChart = ({ height = 280 }) => (
        <ResponsiveContainer width="100%" height={height === "100%" ? "100%" : height}>
            <LineChart 
                data={chartData} 
                margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
            >
                <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e2e8f0"
                    vertical={false}
                />
                <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    interval="preserveStartEnd"
                />
                <YAxis 
                    domain={yAxisDomain}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                        if (metric === "Anzahl") return Math.round(value).toString()
                        if (metric === "Trend") return (value >= 0 ? '+' : '') + value.toFixed(1)
                        return value.toFixed(1)
                    }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Reference line at y=0 for Trend mode */}
                {metric === "Trend" && (
                    <ReferenceLine 
                        y={0} 
                        stroke="#94a3b8" 
                        strokeDasharray="3 3"
                        strokeWidth={1}
                    />
                )}

                {/* Reference line separating historical and forecast (for Trend mode) */}
                {metric === "Trend" && lastHistoricalDate && forecastTrendData.length > 0 && (
                    <ReferenceLine 
                        x={lastHistoricalDate} 
                        stroke="#94a3b8" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        label={{ 
                            value: "", 
                            position: "top",
                            fill: "#64748b",
                            fontSize: 11,
                            fontWeight: 500
                        }}
                    />
                )}

                {/* Reference line separating historical and forecast (only for "Ø Score" mode) */}
                {metric === "Ø Score" && lastHistoricalDate && forecastData.length > 0 && (
                    <ReferenceLine 
                        x={lastHistoricalDate} 
                        stroke="#94a3b8" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        label={{ 
                            value: "", 
                            position: "top",
                            fill: "#64748b",
                            fontSize: 11,
                            fontWeight: 500
                        }}
                    />
                )}

                {/* Historical data line - solid blue (not shown for Trend mode) */}
                {metric !== "Trend" && (
                    <Line 
                        type="monotone" 
                        dataKey="historical" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#2563eb" }}
                        name="Historisch"
                        connectNulls={false}
                    />
                )}

                {/* Forecast data line - dashed orange (only for "Ø Score" mode) */}
                {metric === "Ø Score" && (
                    <Line 
                        type="monotone" 
                        dataKey="forecast" 
                        stroke="#f97316" 
                        strokeWidth={3}
                        strokeDasharray="8 4"
                        dot={{ fill: "#f97316", r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#ea580c" }}
                        name="Prognose"
                        connectNulls={false}
                    />
                )}

                {/* Historical trend line - solid green */}
                {metric === "Trend" && (
                    <Line 
                        type="monotone" 
                        dataKey="historical" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#059669" }}
                        name="Trend Historisch"
                        connectNulls={false}
                    />
                )}

                {/* Forecast trend line - dashed orange (for Trend mode) */}
                {metric === "Trend" && forecastTrendData.length > 0 && (
                    <Line 
                        type="monotone" 
                        dataKey="forecast" 
                        stroke="#f97316" 
                        strokeWidth={3}
                        strokeDasharray="8 4"
                        dot={{ fill: "#f97316", r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#ea580c" }}
                        name="Trend Prognose"
                        connectNulls={false}
                    />
                )}
            </LineChart>
        </ResponsiveContainer>
    )

    // Legend component (reusable)
    const ChartLegend = ({ compact = false }) => (
        <div className={`${compact ? 'mt-2' : 'mt-4'} flex items-center justify-center gap-6 ${compact ? 'text-xs' : 'text-sm'}`}>
            <div className="flex items-center gap-2">
                <div className="h-1 w-6 rounded-full bg-blue-500"></div>
                <span className="text-slate-600">Historisch</span>
            </div>
            {metric === "Trend" && (
                <>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-6 rounded-full bg-green-500"></div>
                        <span className="text-slate-600">Trend Historisch</span>
                    </div>
                    {forecastTrendData.length > 0 && (
                        <>
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-6 rounded-full bg-orange-500" style={{ 
                                    background: "repeating-linear-gradient(90deg, #f97316 0px, #f97316 8px, transparent 8px, transparent 12px)" 
                                }}></div>
                                <span className="text-slate-600">Trend Prognose</span>
                            </div>
                            {lastHistoricalDate && (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-px bg-slate-400" style={{ borderLeft: "2px dashed #94a3b8" }}></div>
                                    <span className="text-slate-600">Trennlinie</span>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
            {metric === "Ø Score" && forecastData.length > 0 && (
                <>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-6 rounded-full bg-orange-500" style={{ 
                            background: "repeating-linear-gradient(90deg, #f97316 0px, #f97316 8px, transparent 8px, transparent 12px)" 
                        }}></div>
                        <span className="text-slate-600">Prognose</span>
                    </div>
                    {lastHistoricalDate && (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-px bg-slate-400" style={{ borderLeft: "2px dashed #94a3b8" }}></div>
                            <span className="text-slate-600">Trennlinie</span>
                        </div>
                    )}
                </>
            )}
        </div>
    )

    // Summary stats component (reusable)
    const SummaryStats = () => {
        if (timelineData.length === 0) return null

        if (metric === "Anzahl") {
            const totalCount = timelineData.reduce((sum, d) => sum + (d.count || 0), 0)
            const avgCount = (totalCount / timelineData.length).toFixed(1)
            const maxCount = Math.max(...timelineData.map(d => d.count || 0))

            return (
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs text-slate-500">Datenpunkte</p>
                        <p className="text-lg font-bold text-slate-800">{timelineData.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Ø Anzahl</p>
                        <p className="text-lg font-bold text-blue-600">{avgCount}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Max Anzahl</p>
                        <p className="text-lg font-bold text-blue-600">{maxCount}</p>
                    </div>
                </div>
            )
        }

        if (metric === "Trend") {
            const avgTrend = trendData.length > 1 
                ? (trendData.slice(1).reduce((sum, d) => sum + d.trend, 0) / (trendData.length - 1)).toFixed(2)
                : "0.00"
            const maxTrend = Math.max(...trendData.map(d => d.trend))
            const minTrend = Math.min(...trendData.map(d => d.trend))
            const positiveTrends = trendData.filter(d => d.trend > 0).length
            const negativeTrends = trendData.filter(d => d.trend < 0).length

            return (
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs text-slate-500">Datenpunkte</p>
                        <p className="text-lg font-bold text-slate-800">{timelineData.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Ø Trend</p>
                        <p className={`text-lg font-bold ${parseFloat(avgTrend) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {parseFloat(avgTrend) >= 0 ? '+' : ''}{avgTrend}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Max/Min</p>
                        <p className="text-lg font-bold text-slate-800">
                            {maxTrend >= 0 ? '+' : ''}{maxTrend.toFixed(2)} / {minTrend.toFixed(2)}
                        </p>
                    </div>
                </div>
            )
        }

        return (
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-xs text-slate-500">Datenpunkte</p>
                    <p className="text-lg font-bold text-slate-800">{timelineData.length}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500">Ø Historisch</p>
                    <p className="text-lg font-bold text-blue-600">
                        {(timelineData.reduce((sum, d) => sum + d.score, 0) / timelineData.length).toFixed(2)}
                    </p>
                </div>
                {forecastData.length > 0 && (
                    <div>
                        <p className="text-xs text-slate-500">Ø Prognose</p>
                        <p className="text-lg font-bold text-orange-500">
                            {(forecastData.reduce((sum, d) => sum + d.score, 0) / forecastData.length).toFixed(2)}
                        </p>
                    </div>
                )}
            </div>
        )
    }

    if (loading) {
        return (
            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800">
                        Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[280px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p className="text-slate-500">Lade Timeline-Daten...</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error || chartData.length === 0) {
        return (
            <Card className="rounded-3xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-bold text-slate-800">
                        Timeline
                    </CardTitle>
                    <FilterDropdowns />
                </CardHeader>
                <CardContent>
                    <div className="h-[280px] flex items-center justify-center">
                        <p className="text-slate-500">
                            {error ? `Fehler: ${error}` : "Keine Daten für diesen Zeitraum verfügbar"}
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            {/* Main Card */}
            <Card 
                className="rounded-3xl shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 group"
                onClick={() => setModalOpen(true)}
            >
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Timeline
                        <Maximize2 className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardTitle>

                    <div onClick={(e) => e.stopPropagation()}>
                        <FilterDropdowns />
                    </div>
                </CardHeader>

                <CardContent className="pb-6">
                    <div className="h-[280px] w-full">
                        <TimelineChart height={280} />
                    </div>

                    <ChartLegend />
                    <SummaryStats />
                    
                    <p className="text-xs text-slate-400 text-center mt-3">
                        Klicken zum Vergrößern
                    </p>
                </CardContent>
            </Card>

            {/* Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent 
                    className="overflow-hidden flex flex-col"
                    style={{ 
                        width: '90vw', 
                        maxWidth: '90vw', 
                        height: '85vh', 
                        maxHeight: '85vh' 
                    }}
                >
                    <DialogHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
                        <DialogTitle className="text-xl font-bold text-slate-800">
                            Timeline - Detailansicht
                        </DialogTitle>
                        <div onClick={(e) => e.stopPropagation()}>
                            <FilterDropdowns />
                        </div>
                    </DialogHeader>

                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Large Chart */}
                        <div className="flex-1 min-h-0">
                            <TimelineChart height={450} />
                        </div>

                        <ChartLegend compact={true} />

                        {/* Extended Stats in Modal - Compact */}
                        {timelineData.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
                                {metric === "Anzahl" ? (
                                    <>
                                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-0.5">Datenpunkte</p>
                                            <p className="text-lg font-bold text-slate-800">{timelineData.length}</p>
                                        </div>
                                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-0.5">Ø Anzahl</p>
                                            <p className="text-lg font-bold text-blue-600">
                                                {(timelineData.reduce((sum, d) => sum + (d.count || 0), 0) / timelineData.length).toFixed(1)}
                                            </p>
                                        </div>
                                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-0.5">Max Anzahl</p>
                                            <p className="text-lg font-bold text-blue-600">
                                                {Math.max(...timelineData.map(d => d.count || 0))}
                                            </p>
                                        </div>
                                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-0.5">Gesamt</p>
                                            <p className="text-lg font-bold text-slate-800">
                                                {timelineData.reduce((sum, d) => sum + (d.count || 0), 0)}
                                            </p>
                                        </div>
                                    </>
                                ) : metric === "Trend" ? (
                                    <>
                                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-0.5">Datenpunkte</p>
                                            <p className="text-lg font-bold text-slate-800">{timelineData.length}</p>
                                        </div>
                                        <div className="text-center p-2 bg-green-50 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-0.5">Ø Trend</p>
                                            <p className={`text-lg font-bold ${
                                                trendData.length > 1 && (trendData.slice(1).reduce((sum, d) => sum + d.trend, 0) / (trendData.length - 1)) >= 0
                                                    ? 'text-green-600' 
                                                    : 'text-red-600'
                                            }`}>
                                                {trendData.length > 1 
                                                    ? ((trendData.slice(1).reduce((sum, d) => sum + d.trend, 0) / (trendData.length - 1)) >= 0 ? '+' : '') + 
                                                      (trendData.slice(1).reduce((sum, d) => sum + d.trend, 0) / (trendData.length - 1)).toFixed(2)
                                                    : '0.00'}
                                            </p>
                                        </div>
                                        <div className="text-center p-2 bg-green-50 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-0.5">Max Trend</p>
                                            <p className="text-lg font-bold text-green-600">
                                                {Math.max(...trendData.map(d => d.trend)).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-center p-2 bg-red-50 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-0.5">Min Trend</p>
                                            <p className="text-lg font-bold text-red-600">
                                                {Math.min(...trendData.map(d => d.trend)).toFixed(2)}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-0.5">Datenpunkte</p>
                                            <p className="text-lg font-bold text-slate-800">{timelineData.length}</p>
                                        </div>
                                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-0.5">Ø Historisch</p>
                                            <p className="text-lg font-bold text-blue-600">
                                                {(timelineData.reduce((sum, d) => sum + d.score, 0) / timelineData.length).toFixed(2)}
                                            </p>
                                        </div>
                                        {forecastData.length > 0 && (
                                            <>
                                                <div className="text-center p-2 bg-orange-50 rounded-lg">
                                                    <p className="text-xs text-slate-500 mb-0.5">Ø Prognose</p>
                                                    <p className="text-lg font-bold text-orange-500">
                                                        {(forecastData.reduce((sum, d) => sum + d.score, 0) / forecastData.length).toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="text-center p-2 bg-slate-50 rounded-lg">
                                                    <p className="text-xs text-slate-500 mb-0.5">Trend</p>
                                                    <p className={`text-lg font-bold ${
                                                        forecastData[forecastData.length - 1]?.score > timelineData[timelineData.length - 1]?.score 
                                                            ? 'text-green-600' 
                                                            : 'text-red-600'
                                                    }`}>
                                                        {forecastData[forecastData.length - 1]?.score > timelineData[timelineData.length - 1]?.score 
                                                            ? '↑ Steigend' 
                                                            : '↓ Fallend'}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        <div className="mt-3 flex items-center justify-end flex-shrink-0">
                            <p className="text-xs text-slate-400">
                                {SOURCE_LABEL[source]} · {GRANULARITY_LABEL[granularity]}
                                {granularity === "year" && selectedYear ? ` · ${selectedYear}` : ""}
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
