import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Gauge Chart Component
const GaugeChart = ({ sentiment, value }) => {
    // Berechne den Winkel basierend auf dem Sentiment-Wert (-1 bis 1)
    // -1 = 0° (links), 0 = 90° (Mitte), 1 = 180° (rechts)
    const normalizedValue = ((value + 1) / 2) * 180
    const rotation = normalizedValue - 90

    const getColor = () => {
        if (sentiment === "Positiv") return "#22c55e"
        if (sentiment === "Neutral") return "#f97316"
        return "#ef4444"
    }

    const getSentimentValue = () => {
        if (sentiment === "Positiv") return 0.7
        if (sentiment === "Neutral") return 0.0
        return -0.7
    }

    const sentimentValue = getSentimentValue()
    const needleRotation = ((sentimentValue + 1) / 2) * 180 - 90

    return (
        <div className="relative w-full h-48 flex items-center justify-center">
            <svg width="280" height="160" viewBox="0 0 280 160">
                {/* Background arc */}
                <path
                    d="M 40 140 A 100 100 0 0 1 240 140"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="20"
                    strokeLinecap="round"
                />

                {/* Colored segments */}
                <path
                    d="M 40 140 A 100 100 0 0 1 107 47"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="20"
                    strokeLinecap="round"
                />
                <path
                    d="M 107 47 A 100 100 0 0 1 173 47"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="20"
                    strokeLinecap="round"
                />
                <path
                    d="M 173 47 A 100 100 0 0 1 240 140"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="20"
                    strokeLinecap="round"
                />

                {/* Needle */}
                <g transform={`rotate(${needleRotation} 140 140)`}>
                    <line
                        x1="140"
                        y1="140"
                        x2="140"
                        y2="60"
                        stroke={getColor()}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <circle cx="140" cy="140" r="8" fill={getColor()} />
                </g>
            </svg>

            {/* Labels */}
            <div className="absolute bottom-0 left-0 text-xs text-slate-600 font-semibold">
                Negativ
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-slate-600 font-semibold">
                Neutral
            </div>
            <div className="absolute bottom-0 right-0 text-xs text-slate-600 font-semibold">
                Positiv
            </div>
        </div>
    )
}

export default function TopicDetailModal({ open, onOpenChange, topic }) {
    const [currentExampleIndex, setCurrentExampleIndex] = React.useState(0)
    
    if (!topic) return null

    // Reset index when topic changes
    React.useEffect(() => {
        setCurrentExampleIndex(0)
    }, [topic])

    const totalExamples = topic.typicalStatements?.length || 0
    const hasMultipleExamples = totalExamples > 1

    const goToPrevious = () => {
        setCurrentExampleIndex((prev) => 
            prev > 0 ? prev - 1 : totalExamples - 1
        )
    }

    const goToNext = () => {
        setCurrentExampleIndex((prev) => 
            prev < totalExamples - 1 ? prev + 1 : 0
        )
    }

    const getSentimentBadgeVariant = (sentiment) => {
        switch (sentiment) {
            case "Positiv":
                return "default"
            case "Neutral":
                return "secondary"
            case "Negativ":
                return "destructive"
            default:
                return "outline"
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[92vw] !w-[92vw] !h-[85vh] !max-h-[85vh] flex flex-col p-8 !translate-x-[-50%] !translate-y-[-50%] !top-[50%] !left-[50%] rounded-2xl shadow-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                        {topic.topic}
                        <Badge variant={getSentimentBadgeVariant(topic.sentiment)}>
                            {topic.sentiment}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Statistik-Übersicht */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">
                                    Frequency
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-slate-900">
                                    {topic.frequency}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Erwähnungen</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">
                                    Ø Rating
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-slate-900">
                                    {topic.avgRating.toFixed(1)}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">von 5.0</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">
                                    Sentiment
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Badge
                                    variant={getSentimentBadgeVariant(topic.sentiment)}
                                    className="text-lg px-3 py-1"
                                >
                                    {topic.sentiment}
                                </Badge>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Line Chart - Rating über Zeit */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">
                                    Bewertung über Zeit
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={topic.timelineData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="month"
                                                stroke="#64748b"
                                                fontSize={12}
                                            />
                                            <YAxis
                                                domain={[0, 5]}
                                                stroke="#64748b"
                                                fontSize={12}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "white",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "8px",
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="rating"
                                                stroke={
                                                    topic.sentiment === "Positiv"
                                                        ? "#22c55e"
                                                        : topic.sentiment === "Neutral"
                                                        ? "#f97316"
                                                        : "#ef4444"
                                                }
                                                strokeWidth={3}
                                                dot={{ fill: "white", strokeWidth: 2, r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Gauge Chart - Sentiment */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">
                                    Sentiment-Analyse
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <GaugeChart sentiment={topic.sentiment} />
                                <div className="text-center mt-4">
                                    <p className="text-sm text-slate-600">
                                        Gesamtstimmung:{" "}
                                        <span className="font-bold text-slate-900">
                                            {topic.sentiment}
                                        </span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Typische Aussagen */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">
                                Typische Aussagen
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {topic.typicalStatements.slice(0, 3).map((statement, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                                    >
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                                            {index + 1}
                                        </span>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            "{statement}"
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Beispiel-Review mit Navigation */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold">
                                    Beispiel-Review
                                </CardTitle>
                                {hasMultipleExamples && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-600">
                                            {currentExampleIndex + 1} / {totalExamples}
                                        </span>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={goToPrevious}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={goToNext}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-700 italic leading-relaxed">
                                "{topic.typicalStatements?.[currentExampleIndex] || topic.example}"
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}
