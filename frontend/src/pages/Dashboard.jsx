import * as React from "react"
import {
    Plus,
    ArrowDown,
    Search,
    Home,
    Download,
    X,
    Upload,
    FileSpreadsheet,
    Loader2,
    Menu,
    GitCompareArrows,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CompanySearchSelect } from "@/components/CompanySearchSelect"
import { TimelineCard } from "@/components/dashboard/TimelineCard"
import { TopicRatingCard } from "@/components/dashboard/TopicRatingCard"
import { DominantTopicsCard } from "@/components/dashboard/DominantTopicsCard"
import { IndividualReviewsCard } from "@/components/dashboard/IndividualReviewsCard"
import { TopicOverviewCard } from "@/components/dashboard/TopicOverviewCard"
import { useState, useEffect, useCallback, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import SorceModal from "../components/dashboard/modals/SorceModal"
import TrendModal from "../components/dashboard/modals/TrendModal"
import NegativTopicModal from "../components/dashboard/modals/NegativTopicModal"
import MostCriticalModal from "../components/dashboard/modals/MostCriticalModal"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { API_URL } from "../config"
import { exportKPIsAsPDF } from "../utils/pdfExport"
import { waitForMultipleCharts, validateChart, waitForImagesInElement } from "../utils/chartValidator"






export default function Dashboard() {
    const location = useLocation()
    const navigate = useNavigate()
    const companyFromWelcome = location.state?.companyId
    const companyNameFromWelcome = location.state?.companyName
    
    const [open, setOpen] = useState(false)
    const [openTrend, setOpenTrend] = useState(false)
    const [openNegative, setOpenNegative] = useState(false);
    const [openMostCritical, setOpenMostCritical] = useState(false);
    const [openCompany, setOpenCompany] = React.useState(false)
    const [selectedCompany, setSelectedCompany] = React.useState("")
    const [data, setData] = useState()
    const [trendData, setTrendData] = useState(null)
    const [companies, setCompanies] = useState([])
    const [mostCriticalData, setMostCriticalData] = useState(null)
    const [negativeTopicItem, setNegativeTopicItem] = useState(null)
    
    // Sidebar states - Starts closed if company comes from welcome
    const [sidebarOpen, setSidebarOpen] = useState(!companyFromWelcome)
    const [companyQuery, setCompanyQuery] = useState("")
    const [companySuggestions, setCompanySuggestions] = useState([])
    const [selectedCompanyId, setSelectedCompanyId] = useState(companyFromWelcome || null)
    const [selectedCompanyName, setSelectedCompanyName] = useState(companyNameFromWelcome || "")
    const [checking, setChecking] = useState(false)
    const [needsUpload, setNeedsUpload] = useState(false)
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState("")
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    
    // Timeline Filter State
    const [timelineFilters, setTimelineFilters] = useState({
        metric: "Ø Score",
        source: "employee",
        granularity: "overall",
        selectedYear: null
    })
    
    // Topic Rating Filter State
    const [topicRatingFilters, setTopicRatingFilters] = useState({
        source: "employee",
        granularity: "overall",
        selectedYear: null,
        visibleTopics: [],
        stats: {}
    })
    
    // Topic Overview Data State
    const [topicOverviewData, setTopicOverviewData] = useState({
        topics: [],
        sourceFilter: null,
        stats: {}
    })
    
    // Loading States für alle Dashboard-Komponenten
    const [dashboardLoadingStates, setDashboardLoadingStates] = useState({
        timelineChart: true,
        topicRatingChart: true,
        topicOverview: true,
        kpiCards: true
    })
    
    // Ref für aktuellen Loading State (für Closures)
    const loadingStatesRef = useRef(dashboardLoadingStates)
    
    // Aktualisiere Ref bei State-Änderungen
    useEffect(() => {
        loadingStatesRef.current = dashboardLoadingStates
    }, [dashboardLoadingStates])
    
    // State für PDF Export Loading
    const [exportingPDF, setExportingPDF] = useState(false)

    const effectiveCompanyId = selectedCompany || selectedCompanyId || companyFromWelcome || null
    
    async function getCompanies() {
        try {
            const res = await fetch(`${API_URL}/companies/`)
            if (!res.ok) return
            const data = await res.json()
            setCompanies(Array.isArray(data) ? data : [])
        } catch {
            // optional: ignorieren
        }
    }
    
    // Debounced fetch für Company Suggestions (300ms delay)
    const debounceTimeoutRef = useRef(null)
    
    const fetchCompanySuggestions = useCallback((q) => {
        // Clear vorheriger Timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current)
        }
        
        const query = q.trim()
        if (!query) {
            setCompanySuggestions([])
            setHighlightedIndex(-1)
            return
        }
        
        // Debounce: Warte 300ms bevor API-Call
        debounceTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`${API_URL}/companies/search?q=${encodeURIComponent(query)}`)
                if (!res.ok) return
                const data = await res.json()
                setCompanySuggestions(Array.isArray(data) ? data : [])
                setHighlightedIndex(-1)
            } catch (error) {
                console.error('Error fetching company suggestions:', error)
            }
        }, 300)
    }, [])
    
    const selectCompanyFromList = (company) => {
        setCompanyQuery(company.name)
        setSelectedCompanyId(company.id)
        setSelectedCompanyName(company.name)
        setCompanySuggestions([])
        setHighlightedIndex(-1)
    }
    
    // Handler for CompanySearchSelect
    const handleCompanySelectFromDropdown = (company) => {
        if (company) {
            setSelectedCompanyId(company.id)
            setSelectedCompanyName(company.name)
        } else {
            setSelectedCompanyId(null)
            setSelectedCompanyName("")
        }
    }

    // Handler for creating new company
    const handleCreateNewCompany = (companyName) => {
        setCompanyQuery(companyName)
        setNeedsUpload(true)
        setError("")
    }
    
    const handleKeyDown = (e) => {
        if (companySuggestions.length === 0) return
        
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlightedIndex(prev => 
                prev < companySuggestions.length - 1 ? prev + 1 : prev
            )
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (highlightedIndex >= 0 && highlightedIndex < companySuggestions.length) {
                selectCompanyFromList(companySuggestions[highlightedIndex])
            } else {
                handleCompanyCheck()
            }
        } else if (e.key === 'Escape') {
            setCompanySuggestions([])
            setHighlightedIndex(-1)
        }
    }
    
    const handleCompanyCheck = async () => {
        if (!companyQuery.trim()) {
            setError("Bitte geben Sie einen Firmennamen ein")
            return
        }
        
        setChecking(true)
        setError("")
        
        try {
            // If company was already selected from list, use it directly
            if (selectedCompanyId) {
                setSelectedCompany(selectedCompanyId)
                setSidebarOpen(false)
                setNeedsUpload(false)
                getCompanyData(selectedCompanyId)
                return
            }
            
            // Otherwise search in all companies or suggestions
            let match = companySuggestions.find(
                (c) => c.name.toLowerCase() === companyQuery.trim().toLowerCase()
            )
            
            // If not in suggestions, check in all companies
            if (!match) {
                match = companies.find(
                    (c) => c.name.toLowerCase() === companyQuery.trim().toLowerCase()
                )
            }
            
            if (match) {
                // Company exists in database
                setSelectedCompanyId(match.id)
                setSelectedCompanyName(match.name)
                setSelectedCompany(match.id)
                setSidebarOpen(false)
                setNeedsUpload(false)
                getCompanyData(match.id)
            } else {
                // Company does not exist, needs upload
                setNeedsUpload(true)
                setError("Firma nicht gefunden. Bitte laden Sie eine Excel-Datei hoch.")
            }
        } catch (err) {
            setError("Fehler bei der Überprüfung der Firma")
        } finally {
            setChecking(false)
        }
    }
    
    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            const validTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ]
            if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
                setFile(selectedFile)
                setError("")
            } else {
                setError("Bitte wählen Sie eine Excel-Datei (.xlsx oder .xls)")
                setFile(null)
            }
        }
    }
    
    const handleUpload = async () => {
        if (!file) {
            setError("Bitte wählen Sie zuerst eine Datei aus")
            return
        }
        
        setUploading(true)
        setError("")
        
        let createdCompanyId = null
        
        try {
            // First create the company if it doesn't exist
            let companyId = selectedCompanyId
            
            if (!companyId) {
                // Create new company
                const createRes = await fetch(`${API_URL}/companies/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: companyQuery.trim() })
                })
                
                if (!createRes.ok) {
                    const errorData = await createRes.json().catch(() => ({}))
                    throw new Error(errorData.detail || "Fehler beim Erstellen der Firma")
                }
                
                const newCompany = await createRes.json()
                companyId = newCompany.id
                createdCompanyId = companyId // Track for rollback
                setSelectedCompanyId(companyId)
                setSelectedCompanyName(newCompany.name)
            }
            
            // Upload the file
            const formData = new FormData()
            formData.append("file", file)
            formData.append("company_id", String(companyId))
            
            const response = await fetch(`${API_URL}/upload-excel`, {
                method: "POST",
                body: formData,
            })
            
            if (!response.ok) {
                // Get detailed error message from backend
                const errorData = await response.json().catch(() => ({}))
                const errorMessage = errorData.detail || "Upload fehlgeschlagen"
                throw new Error(errorMessage)
            }
            
            const result = await response.json()
            console.log("Upload erfolgreich:", result)
            
            // Close sidebar and show company
            setSelectedCompany(companyId)
            setSidebarOpen(false)
            setNeedsUpload(false)
            await getCompanies()
            getCompanyData(companyId)
        } catch (err) {
            // Rollback: Delete the company if it was just created and upload failed
            if (createdCompanyId) {
                try {
                    await fetch(`${API_URL}/companies/${createdCompanyId}`, {
                        method: "DELETE",
                    })
                    console.log("Rollback: Firma wurde gelöscht aufgrund fehlgeschlagenem Upload")
                    setSelectedCompanyId(null)
                    setSelectedCompanyName("")
                } catch (deleteErr) {
                    console.error("Fehler beim Rollback:", deleteErr)
                }
            }
            
            // Show detailed error message
            setError(err.message || "Fehler beim Hochladen der Datei")
        } finally {
            setUploading(false)
        }
    }
    
    useEffect(() => {
        getCompanies()
        
        // If company comes from welcome page, load its data
        if (companyFromWelcome) {
            setSelectedCompany(companyFromWelcome)
            getCompanyData(companyFromWelcome)
        }
        
        // Cleanup: Clear debounce timeout on unmount
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current)
            }
        }
    }, [])

    function getCompanyData(id) {
        console.log(id);



    }
    
    const handleSidebarToggle = () => {
        if (sidebarOpen && !selectedCompanyName) {
            // Versucht zu schließen, aber keine Firma ausgewählt
            setError("Bitte wählen Sie zuerst eine Firma aus, um die Analyse zu starten.")
            return
        }
        
        // Beim Schließen: Reset alle Upload-States zum Neutral-Zustand
        if (sidebarOpen) {
            setNeedsUpload(false)
            setCompanyQuery("")
            setFile(null)
            setError("")
            setCompanySuggestions([])
            setHighlightedIndex(-1)
        }
        
        setSidebarOpen(!sidebarOpen)

    }

    // Optimierte KPI-Daten-Ladung: Alle Requests parallel starten
    useEffect(() => {
        if (!effectiveCompanyId) {
            setData(null)
            setTrendData(null)
            setMostCriticalData(null)
            setNegativeTopicItem(null)
            return
        }
        
        // Parallel-Loading aller KPI-Daten mit Promise.allSettled
        const loadAllKPIs = async () => {
            const results = await Promise.allSettled([
                getAvg(),
                getTrend(),
                getMostCritical(),
                getNegativeTopic()
            ])
            
            // Log Fehler, aber blockiere nicht das UI
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.warn(`KPI ${index} failed:`, result.reason)
                }
            })
        }
        
        loadAllKPIs()
    }, [effectiveCompanyId])
    
    // Überprüfe ob KPI-Daten fertig geladen sind
    useEffect(() => {
        const kpiDataReady = data !== undefined && 
                            trendData !== null && 
                            mostCriticalData !== null && 
                            negativeTopicItem !== null
        
        setDashboardLoadingStates(prev => ({
            ...prev,
            kpiCards: !kpiDataReady
        }))
    }, [data, trendData, mostCriticalData, negativeTopicItem])
    
    async function getAvg() {
        const companyId = selectedCompany || selectedCompanyId || companyFromWelcome
        if (!companyId) {
            setData(null)
            return
        }
        try {
            const res = await fetch(`${API_URL}/companies/${companyId}/ratings`)
            if (!res.ok) throw new Error('Failed to fetch ratings')
            setData(await res.json())
        } catch (error) {
            console.error('Error fetching average ratings:', error)
            setData(null)
        }
    }

    async function getTrend() {
        const companyId = selectedCompany || selectedCompanyId || companyFromWelcome
        if (!companyId) {
            setTrendData(null);
            return;
        }

        try {
            // Dashboard KPI should match the stable 1Y definition: last 12 full months vs previous 12 full months
            const res = await fetch(
                `${API_URL}/companies/${companyId}/ratings/trend?mode=stable_months&months=12`
            );
            if (!res.ok) throw new Error('Failed to fetch trend');

            const json = await res.json();
            const deltaPointsRaw = json.overall?.deltaPoints ?? json.overall?.avgDelta;
            const deltaPoints = typeof deltaPointsRaw === 'number' ? deltaPointsRaw : parseFloat(deltaPointsRaw);

            if (!Number.isFinite(deltaPoints)) {
                setTrendData(null);
                return;
            }

            const rounded = Math.round(deltaPoints * 10) / 10;
            let sign = 'flat';
            if (rounded > 0.05) sign = 'up';
            else if (rounded < -0.05) sign = 'down';

            setTrendData({ avgDelta: rounded.toFixed(1), sign });
        } catch (error) {
            console.error('Error fetching trend:', error);
            setTrendData(null);
        }
    }

    async function getMostCritical() {
        const companyId = selectedCompany || selectedCompanyId || companyFromWelcome
        if (!companyId) {
            setMostCriticalData(null);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/companies/${companyId}/ratings/avg`);
            if (!res.ok) throw new Error('Failed to fetch critical data');

            const json = await res.json();

            if (!json || typeof json !== "object") {
                setMostCriticalData(null);
                return;
            }

            const labelMap = {
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
                avg_umgang_aelteren_kollegen: "Umgang mit älteren Kollegen",
                avg_arbeitsbedingungen: "Arbeitsbedingungen",
                avg_gleichberechtigung: "Gleichberechtigung",
            };

            const entries = Object.entries(json)
                .map(([key, value]) => ({
                    key,
                    title: labelMap[key] ?? key,
                    score: Number(value),
                }))
                .filter((x) => Number.isFinite(x.score));

            if (!entries.length) {
                setMostCriticalData(null);
                return;
            }

            const min = entries.reduce((best, cur) => (cur.score < best.score ? cur : best), entries[0]);
            setMostCriticalData({ topicName: min.title, score: min.score.toFixed(2) });
        } catch (error) {
            console.error('Error fetching most critical:', error);
            setMostCriticalData(null);
        }
    }

    async function getNegativeTopic() {
        const companyId = selectedCompany || selectedCompanyId || companyFromWelcome
        if (!companyId) {
            setNegativeTopicItem(null)
            return
        }

        try {
            const res = await fetch(`${API_URL}/topics/company/${companyId}/negative-topics`)
            if (res.ok) {
                const json = await res.json()
                const list = json?.negative_topics || []
                if (Array.isArray(list) && list.length) {
                    const mentionsOf = (t) => {
                        const n = Number(t?.mention_count)
                        return Number.isFinite(n) ? n : 0
                    }
                    const ratingOf = (t) => {
                        const r = Number(t?.avg_rating)
                        return Number.isFinite(r) ? r : NaN
                    }
                    const impactOf = (t) => {
                        const n = Math.max(0, mentionsOf(t))
                        const r = ratingOf(t)
                        if (!Number.isFinite(r)) return 0
                        return n * Math.max(0, 5 - r)
                    }

                    const chosen = list.reduce((best, cur) => {
                        const bi = impactOf(best)
                        const ci = impactOf(cur)
                        if (ci > bi) return cur
                        if (ci < bi) return best
                        // tie-breaker: lower rating, then higher mentions
                        const br = ratingOf(best)
                        const cr = ratingOf(cur)
                        if (Number.isFinite(br) && Number.isFinite(cr)) {
                            if (cr < br) return cur
                            if (cr > br) return best
                        }
                        return mentionsOf(cur) > mentionsOf(best) ? cur : best
                    }, list[0])

                    setNegativeTopicItem({
                        ...chosen,
                        title: "Negative Topic",
                        topic_label: chosen?.topic_label || chosen?.topic || chosen?.topic_text,
                        categories: Array.isArray(chosen?.categories) ? chosen.categories : (chosen?.topic_label ? [chosen.topic_label] : []),
                    })
                    return
                }
            }

            // Fallback (same idea as NegativTopicModal): use topic-overview if LDA/model endpoint isn't available
            const fallbackRes = await fetch(`${API_URL}/analytics/company/${companyId}/topic-overview`)
            if (!fallbackRes.ok) {
                setNegativeTopicItem(null)
                return
            }
            const fallbackJson = await fallbackRes.json()
            const topics = Array.isArray(fallbackJson?.topics) ? fallbackJson.topics : []
            if (!topics.length) {
                setNegativeTopicItem(null)
                return
            }

            const normSent = (s) => String(s || "").toLowerCase()
            const isNeg = (t) => normSent(t?.sentiment).includes("neg")
            const isNeu = (t) => normSent(t?.sentiment).includes("neu")
            const isPos = (t) => normSent(t?.sentiment).includes("pos")
            const hasNoSentiment = (t) => !normSent(t?.sentiment)
            const ratingOf = (t) => {
                const r = Number(t?.avgRating)
                return Number.isFinite(r) ? r : NaN
            }
            const freqOf = (t) => {
                const f = Number(t?.frequency)
                return Number.isFinite(f) ? f : 0
            }

            // Exclude positive topics; if any negative exist => use only negative, else only neutral.
            const negativeOnly = topics.filter(isNeg)
            const neutralOnly = topics.filter(isNeu)
            const noSentimentOnly = topics.filter(hasNoSentiment)
            const basePool = negativeOnly.length
                ? negativeOnly
                : (neutralOnly.length ? neutralOnly : (noSentimentOnly.length ? noSentimentOnly : topics.filter((t) => !isPos(t))))

            const withRating = basePool.filter((t) => Number.isFinite(ratingOf(t)))
            const ratingPool = withRating.length ? withRating : basePool

            // Relationship/impact: high frequency + low rating => more critical
            const impactOf = (t) => {
                const f = Math.max(0, freqOf(t))
                const r = ratingOf(t)
                if (!Number.isFinite(r)) return 0
                return f * Math.max(0, 5 - r)
            }

            const chosen = ratingPool.reduce((best, cur) => {
                const bi = impactOf(best)
                const ci = impactOf(cur)
                if (ci > bi) return cur
                if (ci < bi) return best
                // tie-breaker: lower rating, then higher frequency
                const br = ratingOf(best)
                const cr = ratingOf(cur)
                if (Number.isFinite(br) && Number.isFinite(cr)) {
                    if (cr < br) return cur
                    if (cr > br) return best
                }
                return freqOf(cur) > freqOf(best) ? cur : best
            }, ratingPool[0])

            // Normalize shape for dashboard + modal
            setNegativeTopicItem({
                ...chosen,
                title: "Negative Topic",
                topic_label: chosen?.topic,
                categories: chosen?.topic ? [chosen.topic] : chosen?.categories,
            })
        } catch (error) {
            console.error('Error fetching negative topic:', error)
            setNegativeTopicItem(null)
        }
    }

    const getNegativeTopicName = (t) => {
        if (!t) return "-"
        if (t.topic_label) return String(t.topic_label)
        if (t.topic_text) return String(t.topic_text)
        if (t.topic) return String(t.topic)
        if (Array.isArray(t.topic_words) && t.topic_words.length) return String(t.topic_words[0])
        if (Array.isArray(t.top_words) && t.top_words.length) {
            const w = t.top_words[0]
            if (typeof w === "string") return w
            if (w && typeof w === "object" && w.word) return String(w.word)
        }
        if (Array.isArray(t.categories) && t.categories.length) return String(t.categories[0])
        if (Array.isArray(t.affected_categories) && t.affected_categories.length) return String(t.affected_categories[0])
        return "-"
    }

    // PDF Export Handler
    const handleExportPDF = async () => {
        if (!selectedCompanyName) {
            setError("Bitte wählen Sie zuerst eine Firma aus, um den Export zu starten.");
            setSidebarOpen(true);
            return;
        }

        try {
            setExportingPDF(true);
            setError(null);
            
            console.log('📊 Starte PDF-Export-Prozess...');
            
            // Schritt 1: Prüfe ob alle Dashboard-Komponenten fertig geladen sind
            const checkIfReady = () => {
                const states = loadingStatesRef.current
                return !states.timelineChart && 
                       !states.topicRatingChart && 
                       !states.topicOverview && 
                       !states.kpiCards
            }
            
            if (!checkIfReady()) {
                console.log('⏳ Warte auf Dashboard-Laden...', loadingStatesRef.current);
                
                // Warte bis alle Komponenten geladen sind (max 45 Sekunden)
                const maxWaitTime = 45000; // 45 Sekunden
                const checkInterval = 300; // Alle 300ms prüfen
                const startTime = Date.now();
                
                await new Promise((resolve, reject) => {
                    const checkLoading = setInterval(() => {
                        const elapsed = Date.now() - startTime;
                        
                        // Timeout check
                        if (elapsed > maxWaitTime) {
                            clearInterval(checkLoading);
                            reject(new Error('Timeout: Dashboard konnte nicht vollständig geladen werden'));
                            return;
                        }
                        
                        // Prüfe aktuellen Loading-Status mit Ref
                        if (checkIfReady()) {
                            clearInterval(checkLoading);
                            console.log('✅ Dashboard vollständig geladen nach', elapsed, 'ms');
                            resolve();
                        }
                    }, checkInterval);
                });
            } else {
                console.log('✅ Dashboard bereits vollständig geladen');
            }
            
            // Schritt 2: Warte auf vollständiges Chart-Rendering mit Validierung
            console.log('⏳ Warte auf Chart-Rendering und -Validierung...');
            
            const chartIds = ['timeline-chart-export', 'topic-rating-chart-export'];
            const chartResults = await waitForMultipleCharts(chartIds, 15000);
            
            if (!chartResults.allReady) {
                // Zeige welche Charts problematisch sind
                const failedCharts = chartResults.results
                    .filter(r => !r.success)
                    .map(r => r.element?.id || 'unknown')
                    .join(', ');
                    
                console.warn('⚠️ Einige Charts sind nicht vollständig bereit:', failedCharts);
                
                // Versuche trotzdem fortzufahren, aber mit Warnung
                console.log('⏳ Versuche dennoch mit zusätzlicher Wartezeit...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
                console.log('✅ Alle Charts validiert und bereit');
            }
            
            // Schritt 3: Finde und validiere Chart-Elemente nochmal
            console.log('🔍 Finale Chart-Validierung...');
            const timelineChartElement = document.getElementById('timeline-chart-export');
            const topicRatingChartElement = document.getElementById('topic-rating-chart-export');
            
            // Detaillierte Validierung mit Fehlerausgabe
            const timelineValidation = validateChart(timelineChartElement, 'Timeline-Chart');
            const topicRatingValidation = validateChart(topicRatingChartElement, 'Topic-Rating-Chart');
            
            console.log('Timeline Validierung:', timelineValidation);
            console.log('Topic Rating Validierung:', topicRatingValidation);
            
            if (!timelineValidation.isValid || !topicRatingValidation.isValid) {
                const errors = [];
                if (!timelineValidation.isValid) errors.push(timelineValidation.message);
                if (!topicRatingValidation.isValid) errors.push(topicRatingValidation.message);
                
                throw new Error('Charts nicht vollständig geladen:\n' + errors.join('\n'));
            }
            
            // Schritt 4: Warte auf alle Bilder in den Charts
            console.log('🖼️ Warte auf Bilder in den Charts...');
            await waitForImagesInElement(timelineChartElement, 3000);
            await waitForImagesInElement(topicRatingChartElement, 3000);
            
            // Schritt 5: Finale Wartezeit für Browser-Rendering und Animations
            console.log('⏳ Finale Wartezeit für Browser-Rendering (1.5 Sekunden)...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Schritt 6: Sammle alle Daten für PDF
            console.log('📦 Sammle Daten für PDF...');
            const kpiData = {
                companyName: selectedCompanyName,
                avgScore: data?.avg_overall || '-',
                trend: trendData,
                mostCritical: mostCriticalData,
                negativeTopic: getNegativeTopicName(negativeTopicItem),
                timelineChartElement: timelineChartElement,
                timelineFilters: timelineFilters,
                topicRatingChartElement: topicRatingChartElement,
                topicRatingFilters: topicRatingFilters,
                topicOverviewData: topicOverviewData
            };

            // Schritt 7: Generiere PDF
            console.log('📄 Generiere PDF...');
            await exportKPIsAsPDF(kpiData);
            
            // Erfolgs-Feedback
            console.log('✅ PDF erfolgreich erstellt und heruntergeladen!');
            
        } catch (error) {
            console.error('❌ Fehler beim PDF-Export:', error);
            setError(`PDF-Export fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`);
        } finally {
            setExportingPDF(false);
        }
    };
    
    // Handler für Timeline Filter Updates (mit useCallback für stabile Referenz)
    const handleTimelineFiltersChange = useCallback((filters) => {
        setTimelineFilters(filters);
    }, []);
    
    // Handler für Timeline Loading State
    const handleTimelineLoadingChange = useCallback((isLoading) => {
        setDashboardLoadingStates(prev => ({
            ...prev,
            timelineChart: isLoading
        }));
    }, []);
    
    // Handler für Topic Rating Filter Updates
    const handleTopicRatingFiltersChange = useCallback((filters) => {
        setTopicRatingFilters(filters);
    }, []);
    
    // Handler für Topic Rating Loading State
    const handleTopicRatingLoadingChange = useCallback((isLoading) => {
        setDashboardLoadingStates(prev => ({
            ...prev,
            topicRatingChart: isLoading
        }));
    }, []);
    
    // Handler für Topic Overview Data Updates
    const handleTopicOverviewDataChange = useCallback((data) => {
        setTopicOverviewData(data);
    }, []);
    
    // Handler für Topic Overview Loading State
    const handleTopicOverviewLoadingChange = useCallback((isLoading) => {
        setDashboardLoadingStates(prev => ({
            ...prev,
            topicOverview: isLoading
        }));
    }, []);


    return (
        <div className="min-h-screen bg-slate-50">
            <div className="flex">
                {/* Sidebar - Fixed Overlay */}
                <aside className={`fixed left-0 top-0 bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 min-h-screen z-50 ${sidebarOpen ? 'w-[400px]' : 'w-[92px]'}`}>
                    <div className="h-16 flex items-center justify-center">
                        <button 
                            onClick={handleSidebarToggle}
                            className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>

                    {sidebarOpen && (
                        <div className="px-6 py-4">
                            {/* Greeting Section */}
                            <div className="mb-6 pb-4 border-b border-slate-700">
                                <h1 className="text-2xl font-bold mb-2">AGB-Analysis</h1>
                                <p className="text-sm text-slate-300">
                                    Wählen Sie eine Firma aus, um die Analyse zu starten.
                                </p>
                            </div>
                            
                            <h2 className="text-xl font-bold mb-4">Firma auswählen</h2>
                            
                            {!needsUpload ? (
                                <>
                                    {/* Company Input with Searchable Dropdown */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium">
                                            Firmenname
                                        </label>
                                        <CompanySearchSelect
                                            value={companyQuery}
                                            onValueChange={setCompanyQuery}
                                            onCompanySelect={handleCompanySelectFromDropdown}
                                            onCreateNew={handleCreateNewCompany}
                                            variant="dark"
                                        />
                                        
                                        <Button
                                            onClick={handleCompanyCheck}
                                            disabled={checking || !companyQuery.trim()}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            {checking ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    Prüfe...
                                                </>
                                            ) : (
                                                "Firma auswählen"
                                            )}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Upload Section */}
                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-300">
                                            Firma "<strong>{companyQuery}</strong>" wurde nicht gefunden.
                                        </p>
                                        
                                        {/* File Input */}
                                        <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                                            <input
                                                type="file"
                                                id="file-upload-dashboard"
                                                accept=".xlsx,.xls"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="file-upload-dashboard"
                                                className="cursor-pointer flex flex-col items-center gap-3"
                                            >
                                                <div className="h-12 w-12 rounded-full bg-blue-900 flex items-center justify-center">
                                                    <FileSpreadsheet className="h-6 w-6 text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">
                                                        {file ? file.name : "Excel-Datei auswählen"}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        .xlsx oder .xls
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                        
                                        {file && !error && (
                                            <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 flex items-center gap-2">
                                                <FileSpreadsheet className="h-4 w-4 text-green-400" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-green-300">{file.name}</p>
                                                    <p className="text-xs text-green-400">
                                                        {(file.size / 1024).toFixed(2)} KB
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <Button
                                            onClick={handleUpload}
                                            disabled={!file || uploading}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    Wird hochgeladen...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Hochladen
                                                </>
                                            )}
                                        </Button>
                                        
                                        <Button
                                            onClick={() => {
                                                setNeedsUpload(false)
                                                setFile(null)
                                                setError("")
                                            }}
                                            variant="outline"
                                            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                                        >
                                            Zurück
                                        </Button>
                                    </div>
                                </>
                            )}
                            
                            {/* Error Message */}
                            {error && (
                                <div className="mt-4 bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-4">
                        <button
                            onClick={() => navigate("/welcome")}
                            className="group relative h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 flex items-center justify-center border border-blue-400 hover:border-blue-300 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-105"
                            title="Zur Startseite"
                        >
                            <Home className="h-7 w-7 text-white group-hover:animate-bounce" />
                        </button>
                        <button
                            onClick={() => {
                                const companies = []
                                if (selectedCompanyId && selectedCompanyName) {
                                    companies.push({ id: selectedCompanyId, name: selectedCompanyName })
                                }
                                navigate("/compare", { state: { companies } })
                            }}
                            className="group relative h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 flex items-center justify-center border border-purple-400 hover:border-purple-300 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-105"
                            title="Firmenvergleich"
                        >
                            <GitCompareArrows className="h-7 w-7 text-white group-hover:animate-bounce" />
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={exportingPDF}
                            className={`group relative h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-200 shadow-lg cursor-pointer ${
                                exportingPDF 
                                    ? 'bg-gray-400 border-gray-300 cursor-not-allowed' 
                                    : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-blue-400 hover:border-blue-300 hover:shadow-xl transform hover:scale-105'
                            }`}
                            title={exportingPDF ? "PDF wird erstellt..." : "KPIs als PDF exportieren"}
                        >
                            {exportingPDF ? (
                                <Loader2 className="h-7 w-7 text-white animate-spin" />
                            ) : (
                                <>
                                    <Download className="h-7 w-7 text-white group-hover:animate-bounce" />
                                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </aside>

                {/* Main - mit left padding wenn sidebar geschlossen */}
                <main className={`flex-1 px-8 py-6 transition-all duration-300 ${sidebarOpen ? '' : 'ml-[92px]'}`}>
                    {/* Top header */}
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            {selectedCompanyName && (
                                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                                    {selectedCompanyName}
                                </h1>
                            )}
                        </div>

                        {/* <div className="w-[300px] max-w-full">
                            <div className="relative">
                                <Popover open={openCompany} onOpenChange={setOpenCompany}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className="w-[300px] justify-between"
                                        >
                                            {selectedCompany
                                                ? companies.find((company) => company.id === selectedCompany)?.name
                                                : "Search company"}
                                            <ChevronsUpDown className="opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search company..." className="h-9 w-[300px]" />
                                            <CommandList>
                                                <CommandEmpty>No company found.</CommandEmpty>
                                                <CommandGroup>
                                                    {companies.map((company) => (
                                                        <CommandItem
                                                            key={company.id}
                                                            value={company.name}
                                                            onSelect={(currentValue) => {
                                                                const company = companies.find(c => c.name === currentValue);
                                                                const id = company ? company.id : "";
                                                                setSelectedCompany(id === selectedCompany ? "" : id)
                                                                getCompanyData(id)
                                                                setOpenCompany(false)

                                                            }}
                                                        >
                                                            {company.name}
                                                            <Check
                                                                className={cn(
                                                                    "ml-auto",
                                                                    selectedCompany == company.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div> */}
                    </div>

                    {/* KPI cards */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="rounded-3xl shadow-sm" onClick={() => setOpen(true)}>

                            <CardHeader className="pb-1 pt-4">
                                <CardTitle className="text-base font-bold text-slate-800">
                                    Ø Score
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 pb-4">
                                <div className="text-xl font-extrabold text-center">
                                    {data && <span className={data.avg_overall > 3 ? 'text-green-500' : data.avg_overall >= 2 ? 'text-slate-800' : 'text-red-500'}>{data.avg_overall}</span>}
                                </div>
                            </CardContent>

                        </Card>
                        <SorceModal
                            open={open}
                            onOpenChange={setOpen}
                            title="Ø Score"
                            description="Average company score"
                            companyId={selectedCompany}

                        >
                            <div className="text-3xl font-bold">3.1</div>
                        </SorceModal>

                        <Card className="rounded-3xl shadow-sm" onClick={() => setOpenTrend(true)}>
                            <CardHeader className="pb-1 pt-4">
                                <CardTitle className="text-base font-bold text-slate-800">
                                    Trend
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 pb-4 flex flex-col items-center gap-0.5">
                                {trendData?.avgDelta ? (
                                    <>
                                        <div
                                            className={
                                                trendData.sign === 'up'
                                                    ? 'text-green-600 text-2xl font-extrabold leading-none'
                                                    : trendData.sign === 'down'
                                                      ? 'text-red-600 text-2xl font-extrabold leading-none'
                                                      : 'text-slate-500 text-2xl font-extrabold leading-none'
                                            }
                                        >
                                            {trendData.sign === 'up' ? '↑' : trendData.sign === 'down' ? '↓' : '—'}
                                        </div>
                                        <div
                                            className={
                                                parseFloat(trendData.avgDelta) > 0
                                                    ? 'text-green-600 text-lg font-extrabold'
                                                    : parseFloat(trendData.avgDelta) < 0
                                                      ? 'text-red-600 text-lg font-extrabold'
                                                      : 'text-slate-700 text-lg font-extrabold'
                                            }
                                        >
                                            {parseFloat(trendData.avgDelta) > 0 ? '+' : ''}
                                            {trendData.avgDelta}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-slate-400 text-base font-bold">—</div>
                                )}
                            </CardContent>
                        </Card>
                        <TrendModal
                            open={openTrend}
                            onOpenChange={setOpenTrend}
                            title="Trend"
                            description="Company trend"
                            companyId={effectiveCompanyId}
                        >
                            <div className="text-3xl font-bold">-0.3</div>
                        </TrendModal>

                        <Card
                            className="rounded-3xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => {
                                if (!effectiveCompanyId) {
                                    setError("Bitte wählen Sie zuerst eine Firma aus, um die Analyse zu starten.")
                                    setSidebarOpen(true)
                                    return
                                }
                                setOpenMostCritical(true)
                            }}
                        >
                            <CardHeader className="pb-1 pt-4">
                                <CardTitle className="text-sm font-bold text-slate-800">
                                    Most Critical
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 pb-4 text-center">
                                <div className="text-xl font-bold text-red-600">
                                    {mostCriticalData ? mostCriticalData.topicName : "-"}
                                </div>
                                <div className="text-base font-bold text-red-600 mt-0.5">
                                    {mostCriticalData ? mostCriticalData.score : "-"}
                                </div>
                            </CardContent>
                        </Card>
                        <MostCriticalModal
                            open={openMostCritical}
                            onOpenChange={setOpenMostCritical}
                            companyId={effectiveCompanyId}
                        />

                        <Card className="rounded-3xl shadow-smon" onClick={() => setOpenNegative(true)}>
                            <CardHeader className="pb-1 pt-4">
                                <CardTitle className="text-base font-bold text-slate-800">
                                    Negative Topic
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 pb-4">
                                <div className="text-lg font-extrabold text-orange-400">
                                    {getNegativeTopicName(negativeTopicItem)}
                                </div>
                            </CardContent>
                        </Card>
                        <NegativTopicModal
                            open={openNegative}
                            onOpenChange={setOpenNegative}
                            companyId={effectiveCompanyId}
                            topic={negativeTopicItem}
                        />



                    </div>

                    {/* Charts row */}
                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <TimelineCard 
                            companyId={selectedCompany || selectedCompanyId} 
                            onFiltersChange={handleTimelineFiltersChange}
                            onLoadingChange={handleTimelineLoadingChange}
                        />
                        <TopicRatingCard 
                            companyId={selectedCompany || selectedCompanyId}
                            onFiltersChange={handleTopicRatingFiltersChange}
                            onLoadingChange={handleTopicRatingLoadingChange}
                        />
                    </div>

                    {/* Topic Overview */}
                    <div className="mt-4">
                        <TopicOverviewCard 
                            companyId={selectedCompany || selectedCompanyId} 
                            onDataChange={handleTopicOverviewDataChange}
                            onLoadingChange={handleTopicOverviewLoadingChange}
                        />
                    </div>

                    {/* Tables row */}
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* <DominantTopicsCard /> */}
                        {/* <IndividualReviewsCard /> */}
                    </div>
                </main>
            </div>
        </div>
    )
}