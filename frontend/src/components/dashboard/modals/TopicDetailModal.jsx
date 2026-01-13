import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar, ArrowLeft, X, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import ReviewDetailModal from "./ReviewDetailModal"

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
        <div className="relative w-full flex flex-col items-center justify-center">
            <svg width="340" height="180" viewBox="0 0 340 180">
                {/* Background arc */}
                <path
                    d="M 40 170 A 130 130 0 0 1 300 170"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="24"
                    strokeLinecap="round"
                />

                {/* Colored segments */}
                <path
                    d="M 40 170 A 130 130 0 0 1 127 52"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="24"
                    strokeLinecap="round"
                />
                <path
                    d="M 127 52 A 130 130 0 0 1 213 52"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="24"
                    strokeLinecap="round"
                />
                <path
                    d="M 213 52 A 130 130 0 0 1 300 170"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="24"
                    strokeLinecap="round"
                />

                {/* Needle */}
                <g transform={`rotate(${needleRotation} 170 170)`}>
                    <line
                        x1="170"
                        y1="170"
                        x2="170"
                        y2="70"
                        stroke={getColor()}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <circle cx="170" cy="170" r="8" fill={getColor()} />
                </g>
            </svg>

            {/* Labels - below the chart, centered under each segment */}
            <div className="relative w-[340px] mt-1">
                <span className="absolute left-[30px] text-xs text-slate-600 font-semibold">Negativ</span>
                <span className="absolute left-1/2 -translate-x-1/2 text-xs text-slate-600 font-semibold">Neutral</span>
                <span className="absolute right-[30px] text-xs text-slate-600 font-semibold">Positiv</span>
            </div>
        </div>
    )
}

export default function TopicDetailModal({ open, onOpenChange, topic, onBackToTable, sourceFilter, onSourceFilterChange }) {
    const [currentExampleIndex, setCurrentExampleIndex] = React.useState(3) // Start at index 3 (4th element)
    const [timeFilter, setTimeFilter] = React.useState("all") // "all", "1y", "6m", "3m", "1m"
    const [reviewDetailModalOpen, setReviewDetailModalOpen] = React.useState(false)
    const [selectedReviewDetail, setSelectedReviewDetail] = React.useState(null)
    const [selectedReviewIndex, setSelectedReviewIndex] = React.useState(0)
    
    // Visibility toggles for different sections
    const [visibility, setVisibility] = React.useState({
        statistics: true,
        timelineChart: true,
        sentimentChart: true,
        typicalStatements: true,
        exampleReview: true
    })
    
    // Toggle for collapsing the visibility control panel
    const [isControlPanelOpen, setIsControlPanelOpen] = React.useState(false)
    
    if (!topic) return null

    // Reset index when topic changes
    React.useEffect(() => {
        setCurrentExampleIndex(3)
    }, [topic])
    
    // Toggle visibility function
    const toggleVisibility = (section) => {
        setVisibility(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }
    
    // Count visible charts to adjust grid layout
    const visibleChartsCount = [visibility.timelineChart, visibility.sentimentChart].filter(Boolean).length

    // Handle clicking on an example review
    const handleExampleClick = () => {
        if (topic.reviewDetails && topic.reviewDetails[currentExampleIndex]) {
            setSelectedReviewDetail(topic.reviewDetails[currentExampleIndex])
            setSelectedReviewIndex(currentExampleIndex)
            setReviewDetailModalOpen(true)
        }
    }

    // Handle navigation in ReviewDetailModal
    const handleReviewNavigation = (newIndex) => {
        if (topic.reviewDetails && topic.reviewDetails[newIndex]) {
            setSelectedReviewDetail(topic.reviewDetails[newIndex])
            setSelectedReviewIndex(newIndex)
        }
    }

    // Filter timeline data based on selected time period
    const getFilteredTimelineData = () => {
        if (!topic.timelineData || topic.timelineData.length === 0) {
            return []
        }

        if (timeFilter === "all") {
            return topic.timelineData
        }

        const now = new Date()
        
        let monthsToShow = 12

        switch (timeFilter) {
            case "1y":
                monthsToShow = 12
                break
            case "6m":
                monthsToShow = 6
                break
            case "3m":
                monthsToShow = 3
                break
            case "1m":
                monthsToShow = 1
                break
            default:
                return topic.timelineData
        }

        // Calculate cutoff date (N months ago)
        const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsToShow, 1)
        
        // Filter data based on year and month
        const filteredData = topic.timelineData.filter(item => {
            if (!item.year || !item.monthNum) {
                return false
            }
            
            // Create a date object for this item (first day of the month)
            const itemDate = new Date(item.year, item.monthNum - 1, 1)
            
            // Include if itemDate is on or after cutoffDate
            return itemDate >= cutoffDate
        })

        return filteredData
    }

    const filteredTimelineData = getFilteredTimelineData()

    const totalExamples = topic.typicalStatements?.length || 0
    // Beispiel-Review shows indices 3-12 (10 examples total)
    const beispielReviewStartIndex = 3
    const beispielReviewEndIndex = 12 // Index 3-12 = 10 examples
    const remainingExamples = 10 // Always show 10 examples in Beispiel-Review
    const hasMultipleExamples = totalExamples > beispielReviewStartIndex + 1

    const goToPrevious = () => {
        setCurrentExampleIndex((prev) => 
            prev > beispielReviewStartIndex ? prev - 1 : beispielReviewEndIndex
        )
    }

    const goToNext = () => {
        setCurrentExampleIndex((prev) => 
            prev < beispielReviewEndIndex ? prev + 1 : beispielReviewStartIndex
        )
    }

    const getSentimentBadgeVariant = (sentiment) => {
        switch (sentiment) {
            case "Positiv":
                return "success"
            case "Neutral":
                return "warning"
            case "Negativ":
                return "destructive"
            default:
                return "outline"
        }
    }

    // Calculate sentiment percentage based on average rating
    // Rating: 1-5, convert to percentage where 5 = 100%, 3 = 50%, 1 = 0%
    const getSentimentPercentage = () => {
        const rating = topic.avgRating
        // Normalize rating from 1-5 scale to 0-100% scale
        const percentage = ((rating - 1) / 4) * 100
        return Math.round(percentage)
    }

    const sentimentPercentage = getSentimentPercentage()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[85vw] !w-[85vw] !h-[85vh] !max-h-[85vh] flex flex-col p-0 !translate-x-[-50%] !translate-y-[-50%] !top-[50%] !left-[50%] rounded-2xl !shadow-none overflow-hidden border border-slate-200">
                {/* Sticky Header */}
                <DialogHeader className="sticky top-0 z-10 bg-white border-b border-slate-200 p-8 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {onBackToTable && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onBackToTable}
                                    className="h-8 w-8 rounded-full hover:bg-slate-100"
                                    title="Zurück zur Tabelle"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            )}
                            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                {topic.topic}
                                <Badge variant={getSentimentBadgeVariant(topic.sentiment)}>
                                    {topic.sentiment}
                                </Badge>
                            </DialogTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 rounded-full hover:bg-slate-100"
                            title="Schließen"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    
                    {/* Visibility Controls - Collapsible */}
                    <div className="mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsControlPanelOpen(!isControlPanelOpen)}
                            className="w-full justify-between p-4 h-auto hover:bg-slate-100 rounded-lg border border-slate-200"
                        >
                            <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-slate-600" />
                                <span className="text-sm font-semibold text-slate-700">Ansicht anpassen</span>
                            </div>
                            {isControlPanelOpen ? (
                                <ChevronUp className="h-4 w-4 text-slate-600" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-slate-600" />
                            )}
                        </Button>
                        
                        {isControlPanelOpen && (
                        <div className="mt-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            {/* Source Filter Buttons */}
                            <div className="mb-4 pb-4 border-b border-slate-200">
                                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Datenquelle filtern</Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => onSourceFilterChange(null)}
                                        size="sm"
                                        className={`flex-1 ${
                                            sourceFilter === null 
                                                ? 'bg-blue-500 text-white hover:bg-blue-600 border-blue-500' 
                                                : 'hover:bg-slate-100'
                                        }`}
                                    >
                                        Alle
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => onSourceFilterChange('employee')}
                                        size="sm"
                                        className={`flex-1 ${
                                            sourceFilter === 'employee' 
                                                ? 'bg-blue-500 text-white hover:bg-blue-600 border-blue-500' 
                                                : 'hover:bg-slate-100'
                                        }`}
                                    >
                                        Mitarbeiter
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => onSourceFilterChange('candidates')}
                                        size="sm"
                                        className={`flex-1 ${
                                            sourceFilter === 'candidates' 
                                                ? 'bg-blue-500 text-white hover:bg-blue-600 border-blue-500' 
                                                : 'hover:bg-slate-100'
                                        }`}
                                    >
                                        Bewerber
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Visibility Controls */}
                            <Label className="text-sm font-semibold text-slate-700 mb-2 block">Sichtbare Bereiche</Label>
                            <div className="grid grid-cols-5 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="statistics" 
                                        checked={visibility.statistics}
                                        onCheckedChange={() => toggleVisibility('statistics')}
                                    />
                                    <Label 
                                        htmlFor="statistics" 
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Statistiken
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="timelineChart" 
                                        checked={visibility.timelineChart}
                                        onCheckedChange={() => toggleVisibility('timelineChart')}
                                    />
                                    <Label 
                                        htmlFor="timelineChart" 
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Zeitverlauf
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="sentimentChart" 
                                        checked={visibility.sentimentChart}
                                        onCheckedChange={() => toggleVisibility('sentimentChart')}
                                    />
                                    <Label 
                                        htmlFor="sentimentChart" 
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Sentiment
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="typicalStatements" 
                                        checked={visibility.typicalStatements}
                                        onCheckedChange={() => toggleVisibility('typicalStatements')}
                                    />
                                    <Label 
                                        htmlFor="typicalStatements" 
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Aussagen
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="exampleReview" 
                                        checked={visibility.exampleReview}
                                        onCheckedChange={() => toggleVisibility('exampleReview')}
                                    />
                                    <Label 
                                        htmlFor="exampleReview" 
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Beispiel-Review
                                    </Label>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="overflow-y-auto px-8 pb-8">
                    <div className="space-y-6 mt-4">
                    {/* Statistik-Übersicht */}
                    {visibility.statistics && (
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
                    )}

                    {/* Charts Row - Dynamic layout based on visible charts */}
                    {(visibility.timelineChart || visibility.sentimentChart) && (
                    <div className={`grid gap-6 ${
                        visibleChartsCount === 2 
                            ? 'grid-cols-1 lg:grid-cols-2' 
                            : 'grid-cols-1'
                    }`}>
                        {/* Line Chart - Rating über Zeit */}
                        {visibility.timelineChart && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold">
                                        Bewertung über Zeit
                                    </CardTitle>
                                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                                        <SelectTrigger className="w-[140px]">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder="Zeitraum" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Gesamt</SelectItem>
                                            <SelectItem value="1y">Letztes Jahr</SelectItem>
                                            <SelectItem value="6m">Letzte 6 Monate</SelectItem>
                                            <SelectItem value="3m">Letzte 3 Monate</SelectItem>
                                            <SelectItem value="1m">Letzter Monat</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className={visibleChartsCount === 1 ? 'h-96' : 'h-64'}>
                                    {filteredTimelineData.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center">
                                                <p className="text-slate-500 text-sm">
                                                    Keine Daten für den ausgewählten Zeitraum verfügbar
                                                </p>
                                                <p className="text-slate-400 text-xs mt-1">
                                                    Bitte wählen Sie einen anderen Filter
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart 
                                                data={filteredTimelineData}
                                                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                <XAxis
                                                    dataKey="month"
                                                    stroke="#64748b"
                                                    fontSize={12}
                                                    label={{ 
                                                        value: 'Monat', 
                                                        position: 'insideBottom', 
                                                        offset: -5,
                                                        style: { fontSize: 14, fontWeight: 600, fill: '#475569' }
                                                    }}
                                                />
                                                <YAxis
                                                    domain={[0, 5]}
                                                    stroke="#64748b"
                                                    fontSize={12}
                                                    label={{ 
                                                        value: 'Ø Bewertung', 
                                                        angle: -90, 
                                                        position: 'center',
                                                        style: { fontSize: 14, fontWeight: 600, fill: '#475569', textAnchor: 'middle' }
                                                    }}
                                                    ticks={[0, 1, 2, 3, 4, 5]}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "white",
                                                        border: "1px solid #e5e7eb",
                                                        borderRadius: "8px",
                                                        padding: "8px 12px",
                                                    }}
                                                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                                                    formatter={(value) => [`${value.toFixed(2)} ⭐`, 'Bewertung']}
                                                />
                                                <Legend 
                                                    wrapperStyle={{ paddingTop: '10px' }}
                                                    formatter={() => 'Durchschnittsbewertung'}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="rating"
                                                    name="Bewertung"
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
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        )}

                        {/* Gauge Chart - Sentiment */}
                        {visibility.sentimentChart && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">
                                    Sentiment-Analyse
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <GaugeChart sentiment={topic.sentiment} />
                                <div className="text-center mt-4 space-y-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-4xl font-bold text-slate-900">
                                            {sentimentPercentage}%
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        Gesamtstimmung:{" "}
                                        <span className="font-bold text-slate-900">
                                            {topic.sentiment}
                                        </span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        )}
                    </div>
                    )}

                    {/* Typische Aussagen */}
                    {visibility.typicalStatements && (
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
                                        className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                                        onClick={() => {
                                            if (topic.reviewDetails && topic.reviewDetails[index]) {
                                                setSelectedReviewDetail(topic.reviewDetails[index])
                                                setSelectedReviewIndex(index)
                                                setReviewDetailModalOpen(true)
                                            }
                                        }}
                                        title="Klicken Sie, um die vollständige Review zu lesen"
                                    >
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                                            {index + 1}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-700 leading-relaxed">
                                                "{statement}"
                                            </p>
                                            <p className="text-xs text-blue-600 mt-1 font-medium">
                                                → Klicken für vollständige Review
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                    )}

                    {/* Beispiel-Review mit Navigation */}
                    {visibility.exampleReview && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold">
                                    Beispiel-Review
                                </CardTitle>
                                {hasMultipleExamples && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-600">
                                            {currentExampleIndex - 2} / {remainingExamples}
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
                            <div 
                                className="cursor-pointer hover:bg-slate-50 -m-4 p-4 rounded-lg transition-colors"
                                onClick={handleExampleClick}
                                title="Klicken Sie, um die vollständige Review zu lesen"
                            >
                                <p className="text-sm text-slate-700 italic leading-relaxed">
                                    "{topic.typicalStatements?.[currentExampleIndex] || topic.example}"
                                </p>
                                <p className="text-xs text-blue-600 mt-2 font-medium">
                                    → Klicken für vollständige Review
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    )}
                </div>
                </div>

                {/* Review Detail Modal */}
                <ReviewDetailModal 
                    open={reviewDetailModalOpen}
                    onOpenChange={setReviewDetailModalOpen}
                    reviewDetail={selectedReviewDetail}
                    allReviewDetails={topic.reviewDetails || []}
                    currentIndex={selectedReviewIndex}
                    onNavigate={handleReviewNavigation}
                />
            </DialogContent>
        </Dialog>
    )
}
