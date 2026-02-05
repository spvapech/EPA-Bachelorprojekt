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
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import TopicDetailModal from "./modals/TopicDetailModal"
import TopicTableModal from "./modals/TopicTableModal"
import { FileText } from "lucide-react"
import { API_URL } from "@/config"

export function TopicOverviewCard({ companyId = 1, onDataChange, onLoadingChange }) {
    const [topicsData, setTopicsData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedTopic, setSelectedTopic] = useState(null)
    const [detailModalOpen, setDetailModalOpen] = useState(false)
    const [tableModalOpen, setTableModalOpen] = useState(false)
    const [sourceFilter, setSourceFilter] = useState(null) // null = both, 'employee', 'candidates'
    const [isModalOpen, setIsModalOpen] = useState(false) // Track if any modal is open
    
    // Kommuniziere Loading-State nach außen
    useEffect(() => {
        if (onLoadingChange) {
            onLoadingChange(loading);
        }
    }, [loading, onLoadingChange]);

    // Daten von API laden
    useEffect(() => {
        const fetchTopics = async () => {
            try {
                // Nur beim ersten Laden oder wenn kein Modal offen ist, Loading-State setzen
                if (topicsData.length === 0) {
                    setLoading(true)
                }
                setError(null)
                
                // Build URL with optional source filter
                let url = `${API_URL}/analytics/company/${companyId}/topic-overview`
                if (sourceFilter) {
                    url += `?source=${sourceFilter}`
                }
                
                const response = await fetch(url)
                
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
    }, [companyId, sourceFilter]) // Re-fetch when sourceFilter changes
    
    // Export data nach außen (für PDF Export)
    useEffect(() => {
        if (onDataChange && !loading) {
            const totalTopics = topicsData.length;
            const avgRating = totalTopics > 0 
                ? (topicsData.reduce((sum, t) => sum + t.avgRating, 0) / totalTopics).toFixed(1)
                : 0;
            const totalMentions = topicsData.reduce((sum, t) => sum + t.frequency, 0);
            
            onDataChange({
                topics: topicsData,
                sourceFilter,
                stats: {
                    totalTopics,
                    avgRating,
                    totalMentions
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topicsData, sourceFilter, loading]);
    
    // Track modal state
    useEffect(() => {
        setIsModalOpen(tableModalOpen || detailModalOpen)
    }, [tableModalOpen, detailModalOpen])

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
    
    // Funktion zum Neuladen eines Topics mit der aktuellen Datenquelle
    const reloadTopicWithSource = async (topicName, newSourceFilter) => {
        try {
            // Build URL mit neuem Source-Filter
            let url = `${API_URL}/analytics/company/${companyId}/topic-overview`
            if (newSourceFilter) {
                url += `?source=${newSourceFilter}`
            }
            
            const response = await fetch(url)
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`)
            }
            
            const data = await response.json()
            
            // Finde das spezifische Topic aus den neuen Daten
            const updatedTopic = (data.topics || []).find(t => t.topic === topicName)
            
            if (updatedTopic) {
                setSelectedTopic(updatedTopic)
            }
        } catch (err) {
            console.error('Error reloading topic:', err)
        }
    }
    
    // Handler für Source-Filter-Änderung im Detail-Modal
    const handleDetailSourceFilterChange = async (newSourceFilter) => {
        if (selectedTopic) {
            // Speichere den Topic-Namen vor dem Update
            const topicName = selectedTopic.topic
            
            // Update den globalen Filter
            setSourceFilter(newSourceFilter)
            
            // Lade das Topic mit der neuen Quelle neu
            await reloadTopicWithSource(topicName, newSourceFilter)
        }
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
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-lg font-bold text-slate-800">
                        Topic Übersicht
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="flex items-center justify-center h-20">
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
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-lg font-bold text-slate-800">
                        Topic Übersicht
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="flex items-center justify-center h-20">
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
                className="rounded-3xl shadow-sm hover:shadow-md transition-shadow"
            >
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-lg font-bold text-slate-800">
                        Topic Übersicht
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                    {/* Datenquellen Filter */}
                    <div className="flex gap-2 mb-4">
                        <Button
                            variant="outline"
                            onClick={() => setSourceFilter(null)}
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
                            onClick={() => setSourceFilter('employee')}
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
                            onClick={() => setSourceFilter('candidates')}
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
                    
                    {/* Statistical Warning Banner */}
                    {topicsData.some(t => t.statistical_meta?.risk_level === 'limited') && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <span className="text-red-600 text-lg">⚠️</span>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-800">
                                        Achtung: Einige Topics haben begrenzte Datenbasis
                                    </p>
                                    <p className="text-xs text-red-700 mt-1">
                                        {topicsData.filter(t => t.statistical_meta?.risk_level === 'limited').length} Topic(s) 
                                        mit weniger als 30 Reviews - Ergebnisse mit Vorsicht interpretieren
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div 
                        className="cursor-pointer"
                        onClick={handleCardClick}
                    >
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-slate-600 mb-0.5">Total Topics</p>
                                <p className="text-2xl font-bold text-slate-900">{totalTopics}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-600 mb-0.5">Ø Rating</p>
                                <p className="text-2xl font-bold text-slate-900">{avgRating}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-600 mb-0.5">Total Mentions</p>
                                <p className="text-2xl font-bold text-slate-900">{totalMentions}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-3 text-center">
                            Klicken Sie hier, um alle Topics anzuzeigen
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Table Modal */}
            <TopicTableModal
                open={tableModalOpen}
                onOpenChange={setTableModalOpen}
                topics={topicsData}
                onTopicSelect={handleTopicSelect}
                sourceFilter={sourceFilter}
                onSourceFilterChange={setSourceFilter}
            />

            {/* Detail Modal */}
            {selectedTopic && (
                <TopicDetailModal
                    open={detailModalOpen}
                    onOpenChange={setDetailModalOpen}
                    topic={selectedTopic}
                    onBackToTable={handleBackToTable}
                    sourceFilter={sourceFilter}
                    onSourceFilterChange={handleDetailSourceFilterChange}
                    companyId={companyId}
                />
            )}
        </>
    )
}
