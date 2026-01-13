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

export function TimelineCard({ companyId }) {
    const [timelineData, setTimelineData] = useState([])
    const [forecastData, setForecastData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [metric, setMetric] = useState("Ø Score")
    const [timeRange, setTimeRange] = useState("1 Jahr")
    const [modalOpen, setModalOpen] = useState(false)

    useEffect(() => {
        if (!companyId) return

        const fetchTimelineData = async () => {
            try {
                setLoading(true)
                setError(null)

                // Calculate days based on time range
                let days = 365
                if (timeRange === "6 Monate") days = 180
                else if (timeRange === "3 Monate") days = 90
                else if (timeRange === "2 Jahre") days = 730

                const response = await fetch(
                    `${API_URL}/analytics/company/${companyId}/timeline?days=${days}&forecast_months=6`
                )

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`)
                }

                const data = await response.json()

                setTimelineData(data.timeline || [])
                setForecastData(data.forecast || [])
            } catch (err) {
                console.error('Error fetching timeline data:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchTimelineData()
    }, [companyId, timeRange])

    // Prepare chart data - combine historical and forecast with bridge point
    const chartData = useMemo(() => {
        if (timelineData.length === 0) return []

        // Historical data points - last point gets both values to bridge the lines
        const historical = timelineData.map((item, index) => {
            const isLast = index === timelineData.length - 1
            return {
                date: item.date_display || item.date,
                historical: item.score,
                // Bridge point: last historical also gets forecast value to connect lines
                forecast: isLast && forecastData.length > 0 ? item.score : null,
                count: item.count
            }
        })

        // Forecast data points
        const forecast = forecastData.map(item => ({
            date: item.date_display || item.date,
            historical: null,
            forecast: item.score,
            count: null
        }))

        return [...historical, ...forecast]
    }, [timelineData, forecastData])

    // Find the last historical date for reference line
    const lastHistoricalDate = timelineData.length > 0 
        ? (timelineData[timelineData.length - 1].date_display || timelineData[timelineData.length - 1].date)
        : null

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const historicalValue = payload.find(p => p.dataKey === "historical")?.value
            const forecastValue = payload.find(p => p.dataKey === "forecast")?.value
            const countValue = payload.find(p => p.payload?.count)?.payload?.count

            return (
                <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                    <p className="font-semibold text-slate-800 mb-1">{label}</p>
                    {historicalValue !== null && historicalValue !== undefined && (
                        <p className="text-blue-600 text-sm">
                            Historisch: <span className="font-bold">{historicalValue.toFixed(2)}</span>
                        </p>
                    )}
                    {forecastValue !== null && forecastValue !== undefined && (
                        <p className="text-orange-500 text-sm">
                            Prognose: <span className="font-bold">{forecastValue.toFixed(2)}</span>
                        </p>
                    )}
                    {countValue && (
                        <p className="text-slate-500 text-xs mt-1">
                            Bewertungen: {countValue}
                        </p>
                    )}
                </div>
            )
        }
        return null
    }

    // Filter dropdowns component (reusable)
    const FilterDropdowns = () => (
        <div className="flex items-center gap-2">
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
                    <DropdownMenuItem onClick={() => setMetric("Rating")}>
                        Rating
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setMetric("Anzahl")}>
                        Anzahl
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="rounded-full h-9 gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        {timeRange}
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTimeRange("3 Monate")}>
                        3 Monate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeRange("6 Monate")}>
                        6 Monate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeRange("1 Jahr")}>
                        1 Jahr
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeRange("2 Jahre")}>
                        2 Jahre
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
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
                    domain={[0, 5]}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Reference line separating historical and forecast */}
                {lastHistoricalDate && forecastData.length > 0 && (
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

                {/* Historical data line - solid blue */}
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

                {/* Forecast data line - dashed orange */}
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
            <div className="flex items-center gap-2">
                <div className="h-1 w-6 rounded-full bg-orange-500" style={{ 
                    background: "repeating-linear-gradient(90deg, #f97316 0px, #f97316 8px, transparent 8px, transparent 12px)" 
                }}></div>
                <span className="text-slate-600">Prognose</span>
            </div>
            {lastHistoricalDate && forecastData.length > 0 && (
                <div className="flex items-center gap-2">
                    <div className="h-4 w-px bg-slate-400" style={{ borderLeft: "2px dashed #94a3b8" }}></div>
                    <span className="text-slate-600">Trennlinie</span>
                </div>
            )}
        </div>
    )

    // Summary stats component (reusable)
    const SummaryStats = () => (
        timelineData.length > 0 && (
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
    )

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
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
