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
import { useState, useEffect } from "react"
import TopicDetailModal from "./modals/TopicDetailModal"
import TopicTableModal from "./modals/TopicTableModal"
import { FileText } from "lucide-react"
import { API_URL } from "@/config"

export function TopicOverviewCard({ companyId = 1 }) {
    const [topicsData, setTopicsData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedTopic, setSelectedTopic] = useState(null)
    const [detailModalOpen, setDetailModalOpen] = useState(false)
    const [tableModalOpen, setTableModalOpen] = useState(false)

    // Daten von API laden
    useEffect(() => {
        const fetchTopics = async () => {
            try {
                setLoading(true)
                setError(null)
                
                const response = await fetch(
                    `${API_URL}/analytics/company/${companyId}/topic-overview`
                )
                
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`)
                }
                
                const data = await response.json()
                setTopicsData(data.topics || [])
            } catch (err) {
                console.error('Error fetching topics:', err)
                setError(err.message)
                setTopicsData([])
            } finally {
                setLoading(false)
            }
        }

        if (companyId) {
            fetchTopics()
        }
    }, [companyId])

    const handleCardClick = () => {
        setTableModalOpen(true)
    }

    const handleTopicSelect = (topic) => {
        setSelectedTopic(topic)
        setTableModalOpen(false)
        setDetailModalOpen(true)
    }

    const handleBackToTable = () => {
        setDetailModalOpen(false)
        setTableModalOpen(true)
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
    const avgRating = totalTopics > 0 
        ? (topicsData.reduce((sum, t) => sum + t.avgRating, 0) / totalTopics).toFixed(1)
        : 0
    const totalMentions = topicsData.reduce((sum, t) => sum + t.frequency, 0)

    // Loading State
    if (loading) {
        return (
            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800">
                        Topic Übersicht
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-32">
                        <p className="text-slate-500">Lade Topic-Daten...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Empty State
    if (topicsData.length === 0) {
        return (
            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800">
                        Topic Übersicht
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-32">
                        <p className="text-slate-500">
                            {error ? `Fehler: ${error}` : 'Keine Topics gefunden'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

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
                    onBackToTable={handleBackToTable}
                />
            )}
        </>
    )
}
