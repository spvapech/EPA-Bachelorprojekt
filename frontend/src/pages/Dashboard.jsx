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
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TimelineCard } from "@/components/dashboard/TimelineCard"
import { CategoryRatingCard } from "@/components/dashboard/CategoryRatingCard"
import { DominantTopicsCard } from "@/components/dashboard/DominantTopicsCard"
import { IndividualReviewsCard } from "@/components/dashboard/IndividualReviewsCard"
import { TopicOverviewCard } from "@/components/dashboard/TopicOverviewCard"
import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
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






export default function Dashboard() {
    const location = useLocation()
    const companyFromWelcome = location.state?.companyId
    const companyNameFromWelcome = location.state?.companyName
    
    const [open, setOpen] = useState(false)
    const [openTrend, setOpenTrend] = useState(false)
    const [openNegative, setOpenNegative] = useState(false);
    const [openMostCritical, setOpenMostCritical] = useState(false);
    const [openCompany, setOpenCompany] = React.useState(false)
    const [selectedCompany, setSelectedCompany] = React.useState("")
    const [companies, setCompanies] = useState([])
    
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
    
    const fetchCompanySuggestions = async (q) => {
        const query = q.trim()
        if (!query) {
            setCompanySuggestions([])
            setHighlightedIndex(-1)
            return
        }
        try {
            const res = await fetch(`${API_URL}/companies/search?q=${encodeURIComponent(query)}`)
            if (!res.ok) return
            const data = await res.json()
            setCompanySuggestions(Array.isArray(data) ? data : [])
            setHighlightedIndex(-1)
        } catch {
            // optional: ignorieren
        }
    }
    
    const selectCompanyFromList = (company) => {
        setCompanyQuery(company.name)
        setSelectedCompanyId(company.id)
        setSelectedCompanyName(company.name)
        setCompanySuggestions([])
        setHighlightedIndex(-1)
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
                    throw new Error("Fehler beim Erstellen der Firma")
                }
                
                const newCompany = await createRes.json()
                companyId = newCompany.id
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
                throw new Error("Upload fehlgeschlagen")
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
    }, [])

    function getCompanyData (id){
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
                                <h1 className="text-2xl font-bold mb-2">Willkommen!</h1>
                                <p className="text-sm text-slate-300">
                                    Wählen Sie eine Firma aus, um die Analyse zu starten.
                                </p>
                            </div>
                            
                            <h2 className="text-xl font-bold mb-4">Firma auswählen</h2>
                            
                            {!needsUpload ? (
                                <>
                                    {/* Company Input with Autocomplete */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium">
                                            Firmenname
                                        </label>
                                        <input
                                            value={companyQuery}
                                            onChange={(e) => {
                                                const v = e.target.value
                                                setCompanyQuery(v)
                                                setSelectedCompanyId(null)
                                                fetchCompanySuggestions(v)
                                            }}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Firmenname eingeben..."
                                            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        />
                                        
                                        {companySuggestions.length > 0 && (
                                            <div className="bg-slate-800 rounded-lg border border-slate-600 max-h-40 overflow-y-auto">
                                                {companySuggestions.map((c, index) => (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => selectCompanyFromList(c)}
                                                        className={`px-4 py-2 cursor-pointer text-sm ${
                                                            index === highlightedIndex 
                                                                ? 'bg-blue-700 text-white' 
                                                                : 'hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        {c.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
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
                        <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                            <Home className="h-7 w-7" />
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                            <Download className="h-7 w-7" />
                        </div>
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

                        <div className="w-[300px] max-w-full">
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
                                                            value={company.id}
                                                            onSelect={(currentValue) => {
                                                                setSelectedCompany(currentValue === selectedCompany ? "" : currentValue)
                                                                getCompanyData(currentValue)
                                                                setOpen(false)
                                                            
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
                        </div>
                    </div>

                    {/* KPI cards */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="rounded-3xl shadow-sm" onClick={() => setOpen(true)}>

                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl font-bold text-slate-800">
                                    Ø Score
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="text-5xl font-extrabold text-orange-400"></div>
                            </CardContent>

                        </Card>
                        <SorceModal
                            open={open}
                            onOpenChange={setOpen}
                            title="Ø Score"
                            description="Average company score"
                        >
                            <div className="text-3xl font-bold">3.1</div>
                        </SorceModal>

                        <Card className="rounded-3xl shadow-sm" onClick={() => setOpenTrend(true)}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl font-bold text-slate-800">
                                    Trend
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 flex flex-col items-center gap-2">

                                <div className="text-xl font-bold text-red-700"></div>
                            </CardContent>
                        </Card>
                        <TrendModal
                            open={openTrend}
                            onOpenChange={setOpenTrend}
                            title="Trend"
                            description="Company trend"
                        >
                            <div className="text-3xl font-bold">-0.3</div>
                        </TrendModal>

                        <Card className="rounded-3xl shadow-sm" onClick={() => setOpenMostCritical(true)}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl font-bold text-slate-800">
                                    Most Critical
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="text-2xl font-extrabold text-red-700">

                                </div>
                                <div className="text-lg font-bold text-red-700"></div>
                            </CardContent>
                        </Card>
                        <MostCriticalModal
                            open={openMostCritical}
                            onOpenChange={setOpenMostCritical}
                        />

                        <Card className="rounded-3xl shadow-smon" onClick={() => setOpenNegative(true)}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl font-bold text-slate-800">
                                    Negative Topic
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="text-2xl font-extrabold text-orange-400">

                                </div>
                            </CardContent>
                        </Card>
                        <NegativTopicModal
                            open={openNegative}
                            onOpenChange={setOpenNegative}
                        />



                    </div>

                    {/* Charts row */}
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* <TimelineCard /> */}
                        {/* <CategoryRatingCard /> */}
                    </div>

                    {/* Topic Overview */}
                    <div className="mt-6">
                        <TopicOverviewCard companyId={selectedCompany || 1} />
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
