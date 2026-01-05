import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import TopicDetailModal from "./modals/TopicDetailModal"
import TopicTableModal from "./modals/TopicTableModal"
import { FileText } from "lucide-react"

// Beispieldaten - später von API ersetzen
const topicsData = [
    {
        id: 1,
        topic: "Work-Life Balance",
        frequency: 145,
        avgRating: 2.8,
        sentiment: "Negativ",
        example: "Überstunden sind die Regel, Privatleben leidet stark...",
        color: "red",
        timelineData: [
            { month: "Jan", rating: 2.5 },
            { month: "Feb", rating: 2.6 },
            { month: "Mär", rating: 2.4 },
            { month: "Apr", rating: 2.7 },
            { month: "Mai", rating: 2.9 },
            { month: "Jun", rating: 3.0 },
        ],
        typicalStatements: [
            "Überstunden sind Standard, niemand fragt nach",
            "Ständige Erreichbarkeit wird erwartet",
            "Urlaub wird oft kurzfristig abgelehnt"
        ]
    },
    {
        id: 2,
        topic: "Führungsqualität",
        frequency: 132,
        avgRating: 3.2,
        sentiment: "Neutral",
        example: "Führungskräfte sind teilweise kompetent, aber...",
        color: "orange",
        timelineData: [
            { month: "Jan", rating: 3.0 },
            { month: "Feb", rating: 3.1 },
            { month: "Mär", rating: 3.3 },
            { month: "Apr", rating: 3.2 },
            { month: "Mai", rating: 3.4 },
            { month: "Jun", rating: 3.2 },
        ],
        typicalStatements: [
            "Entscheidungen werden nicht transparent kommuniziert",
            "Feedback wird selten gegeben",
            "Manche Vorgesetzte sind sehr engagiert"
        ]
    },
    {
        id: 3,
        topic: "Gehalt & Benefits",
        frequency: 189,
        avgRating: 3.8,
        sentiment: "Positiv",
        example: "Gehalt ist branchenüblich, gute Zusatzleistungen...",
        color: "green",
        timelineData: [
            { month: "Jan", rating: 3.6 },
            { month: "Feb", rating: 3.7 },
            { month: "Mär", rating: 3.8 },
            { month: "Apr", rating: 3.9 },
            { month: "Mai", rating: 3.8 },
            { month: "Jun", rating: 3.9 },
        ],
        typicalStatements: [
            "Faire Bezahlung für die Branche",
            "Gute Sozialleistungen und Altersvorsorge",
            "Regelmäßige Gehaltsanpassungen möglich"
        ]
    },
    {
        id: 4,
        topic: "Teamzusammenhalt",
        frequency: 167,
        avgRating: 4.1,
        sentiment: "Positiv",
        example: "Tolles Team, super Atmosphäre unter Kollegen...",
        color: "green",
        timelineData: [
            { month: "Jan", rating: 4.0 },
            { month: "Feb", rating: 4.0 },
            { month: "Mär", rating: 4.2 },
            { month: "Apr", rating: 4.1 },
            { month: "Mai", rating: 4.2 },
            { month: "Jun", rating: 4.1 },
        ],
        typicalStatements: [
            "Kollegen unterstützen sich gegenseitig",
            "Sehr gute Teamevents",
            "Offene und freundliche Kommunikation"
        ]
    },
    {
        id: 5,
        topic: "Karriereentwicklung",
        frequency: 98,
        avgRating: 2.5,
        sentiment: "Negativ",
        example: "Wenige Weiterbildungsmöglichkeiten, kaum Aufstiegschancen...",
        color: "red",
        timelineData: [
            { month: "Jan", rating: 2.4 },
            { month: "Feb", rating: 2.5 },
            { month: "Mär", rating: 2.6 },
            { month: "Apr", rating: 2.4 },
            { month: "Mai", rating: 2.5 },
            { month: "Jun", rating: 2.6 },
        ],
        typicalStatements: [
            "Keine klaren Karrierepfade erkennbar",
            "Weiterbildungen müssen selbst finanziert werden",
            "Beförderungen sind sehr selten"
        ]
    },
]

export function TopicOverviewCard() {
    const [selectedTopic, setSelectedTopic] = useState(null)
    const [detailModalOpen, setDetailModalOpen] = useState(false)
    const [tableModalOpen, setTableModalOpen] = useState(false)

    const handleCardClick = () => {
        setTableModalOpen(true)
    }

    const handleTopicSelect = (topic) => {
        setSelectedTopic(topic)
        setTableModalOpen(false)
        setDetailModalOpen(true)
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

    // Statistiken für die Übersichtskarte
    const totalTopics = topicsData.length
    const avgRating = (topicsData.reduce((sum, t) => sum + t.avgRating, 0) / totalTopics).toFixed(1)
    const totalMentions = topicsData.reduce((sum, t) => sum + t.frequency, 0)

    return (
        <>
            <Card 
                className="rounded-3xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={handleCardClick}
            >
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800">
                        Topic Übersicht
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-slate-600 mb-1">Total Topics</p>
                            <p className="text-3xl font-bold text-slate-900">{totalTopics}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 mb-1">Ø Rating</p>
                            <p className="text-3xl font-bold text-slate-900">{avgRating}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 mb-1">Total Mentions</p>
                            <p className="text-3xl font-bold text-slate-900">{totalMentions}</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-4 text-center">
                        Klicken Sie hier, um alle Topics anzuzeigen
                    </p>
                </CardContent>
            </Card>

            {/* Table Modal */}
            <TopicTableModal
                open={tableModalOpen}
                onOpenChange={setTableModalOpen}
                topics={topicsData}
                onTopicSelect={handleTopicSelect}
            />

            {/* Detail Modal */}
            {selectedTopic && (
                <TopicDetailModal
                    open={detailModalOpen}
                    onOpenChange={setDetailModalOpen}
                    topic={selectedTopic}
                />
            )}
        </>
    )
}
