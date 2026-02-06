import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileSpreadsheet, ArrowRight, Building2, Upload as UploadIcon, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CompanySearchSelect } from "@/components/CompanySearchSelect"
import { API_URL } from "../config"


export default function Welcome() {
    const [mode, setMode] = useState(1) // 1, 2, or 3 companies
    
    // State for each company (array index = company index)
    const [companies, setCompanies] = useState([
        { companyQuery: "", companyId: null, selectedCompany: null, files: [], isChecked: false, existsInDB: false },
        { companyQuery: "", companyId: null, selectedCompany: null, files: [], isChecked: false, existsInDB: false },
        { companyQuery: "", companyId: null, selectedCompany: null, files: [], isChecked: false, existsInDB: false }
    ])

    const [uploading, setUploading] = useState(false)
    const [checking, setChecking] = useState(null) // Index of company being checked
    const [deletingData, setDeletingData] = useState(null) // Index of company whose data is being deleted
    const [error, setError] = useState("")
    const [dragActive, setDragActive] = useState(null) // Index of active drag zone
    const navigate = useNavigate()

    // Update company state helper
    const updateCompany = (index, updates) => {
        setCompanies(prev => {
            const newCompanies = [...prev]
            newCompanies[index] = { ...newCompanies[index], ...updates }
            return newCompanies
        })
    }

    const removeFile = (companyIndex, fileIndex) => {
        const company = companies[companyIndex]
        const updatedFiles = company.files.filter((_, idx) => idx !== fileIndex)
        updateCompany(companyIndex, { files: updatedFiles })
    }

    const handleCreateNewCompany = (companyIndex, companyName) => {
        // Direkt als neue Firma markieren und Upload-Bereich öffnen
        updateCompany(companyIndex, {
            companyQuery: companyName,
            existsInDB: false,
            isChecked: true,
            selectedCompany: null,
            companyId: null
        })
    }

    const handleFileChange = (companyIndex, e) => {
        const selectedFiles = Array.from(e.target.files || [])
        
        if (selectedFiles.length === 0) return
        
        const existingFiles = companies[companyIndex].files
        const combinedFiles = [...existingFiles, ...selectedFiles]
        
        // Max 2 files
        if (combinedFiles.length > 2) {
            setError("Maximal 2 Dateien pro Firma erlaubt")
            return
        }
        
        // Validate file types
        const validTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
        
        for (const file of selectedFiles) {
            if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                setError("Bitte wählen Sie nur Excel-Dateien (.xlsx oder .xls)")
                return
            }
        }
        
        updateCompany(companyIndex, { files: combinedFiles })
        setError("")
    }
    
    const handleDrag = (e, companyIndex) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(companyIndex)
        } else if (e.type === "dragleave") {
            setDragActive(null)
        }
    }
    
    const handleDrop = (e, companyIndex) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(null)
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files)
            const existingFiles = companies[companyIndex].files
            const combinedFiles = [...existingFiles, ...droppedFiles]
            
            // Max 2 files
            if (combinedFiles.length > 2) {
                setError("Maximal 2 Dateien pro Firma erlaubt")
                return
            }
            
            const validTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ]
            
            for (const file of droppedFiles) {
                if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                    setError("Bitte wählen Sie nur Excel-Dateien (.xlsx oder .xls)")
                    return
                }
            }
            
            updateCompany(companyIndex, { files: combinedFiles })
            setError("")
        }
    }

    const handleCompanySelect = (companyIndex, company) => {
        updateCompany(companyIndex, {
            selectedCompany: company,
            companyId: company ? company.id : null,
            existsInDB: company ? true : false,
            isChecked: company ? true : false
        })
    }

    // Check if company exists in database
    const handleCheckCompany = async (companyIndex) => {
        const company = companies[companyIndex]
        
        if (!company.companyQuery.trim()) {
            setError(`Bitte geben Sie einen Firmennamen für Firma ${companyIndex + 1} ein.`)
            return
        }

        setChecking(companyIndex)
        setError("")

        try {
            const response = await fetch(`${API_URL}/companies`)
            if (!response.ok) throw new Error("Fehler beim Laden der Firmen")
            
            const allCompanies = await response.json()
            const match = allCompanies.find(
                (c) => c.name.toLowerCase() === company.companyQuery.trim().toLowerCase()
            )

            if (match) {
                // Company exists in database
                updateCompany(companyIndex, {
                    companyId: match.id,
                    selectedCompany: match,
                    existsInDB: true,
                    isChecked: true
                })
            } else {
                // Company does not exist, needs upload
                updateCompany(companyIndex, {
                    existsInDB: false,
                    isChecked: true
                })
            }
        } catch (err) {
            setError(`Fehler bei der Überprüfung von Firma ${companyIndex + 1}`)
        } finally {
            setChecking(null)
        }
    }
    // Delete company data and allow re-upload
    const handleDeleteCompanyData = async (companyIndex) => {
        const company = companies[companyIndex]
        
        if (!company.companyId) {
            setError("Keine Firma-ID gefunden")
            return
        }

        const confirmed = window.confirm(
            `Möchten Sie wirklich alle Daten von "${company.companyQuery}" löschen?\n\nDie Daten werden permanent gelöscht und können nicht wiederhergestellt werden.`
        )

        if (!confirmed) return

        setDeletingData(companyIndex)
        setError("")

        try {
            const response = await fetch(`${API_URL}/companies/${company.companyId}/data`, {
                method: "DELETE"
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || "Fehler beim Löschen der Firmendaten")
            }

            const result = await response.json()
            console.log("Firmendaten gelöscht:", result)

            // Reset company state to allow new upload
            updateCompany(companyIndex, {
                existsInDB: false,
                files: []
            })
        } catch (err) {
            setError(err.message || "Fehler beim Löschen der Firmendaten")
        } finally {
            setDeletingData(null)
        }
    }
    const handleUpload = async () => {
        // Validate that all active companies are checked
        const activeCompanies = companies.slice(0, mode)
        
        for (let i = 0; i < activeCompanies.length; i++) {
            const company = activeCompanies[i]
            if (!company.isChecked) {
                setError(`Bitte prüfen Sie zuerst Firma ${i + 1}.`)
                return
            }
            // Only require files if company doesn't exist in DB
            if (!company.existsInDB && company.files.length < 2) {
                setError(`Bitte wählen Sie 2 Dateien für Firma ${i + 1} aus.`)
                return
            }
        }

        setUploading(true)
        setError("")

        const createdCompanyIds = []
        const existingCompanyIds = []

        try {
            // Process each company
            for (let i = 0; i < activeCompanies.length; i++) {
                const company = activeCompanies[i]
                let finalCompanyId = company.companyId
                
                // If company exists in DB, just track it
                if (company.existsInDB) {
                    existingCompanyIds.push({ id: finalCompanyId, name: company.companyQuery.trim() })
                    continue
                }
                
                // Create new company
                if (!finalCompanyId) {
                    const createRes = await fetch(`${API_URL}/companies/`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: company.companyQuery.trim() })
                    })
                    
                    if (!createRes.ok) {
                        const errorData = await createRes.json().catch(() => ({}))
                        throw new Error(errorData.detail || `Fehler beim Erstellen der Firma ${i + 1}`)
                    }
                    
                    const newCompany = await createRes.json()
                    finalCompanyId = newCompany.id
                    createdCompanyIds.push(finalCompanyId)
                }
                
                // Upload files for new companies
                for (let fileIndex = 0; fileIndex < company.files.length; fileIndex++) {
                    const file = company.files[fileIndex]
                    const formData = new FormData()
                    formData.append("file", file)
                    formData.append("company_id", String(finalCompanyId))

                    const response = await fetch(`${API_URL}/upload-excel`, {
                        method: "POST",
                        body: formData,
                    })

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}))
                        throw new Error(errorData.detail || `Upload fehlgeschlagen für Firma ${i + 1}, Datei ${fileIndex + 1}`)
                    }
                }
            }

            console.log("Alle Uploads erfolgreich")

            // Clear any previous errors
            setError("")

            // TODO: Später aktivieren wenn Multi-Firma Dashboard bereit ist
            // Navigate to dashboard with first company info
            // const firstCompany = activeCompanies[0]
            // navigate("/dashboard", { 
            //     state: { 
            //         companyId: firstCompany.companyId || createdCompanyIds[0], 
            //         companyName: firstCompany.companyQuery.trim() 
            //     } 
            // })
        } catch (err) {
            // Rollback: Delete all created companies
            for (const companyId of createdCompanyIds) {
                try {
                    await fetch(`${API_URL}/companies/${companyId}`, {
                        method: "DELETE",
                    })
                    console.log(`Rollback: Firma ${companyId} wurde gelöscht`)
                } catch (deleteErr) {
                    console.error("Fehler beim Rollback:", deleteErr)
                }
            }
            
            setError(err.message || "Fehler beim Hochladen der Dateien")
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 py-12" style={{backgroundColor: '#05223e'}}>
            <div className="w-full max-w-6xl">
                {/* Welcome Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-white mb-4">
                        Willkommen bei AGB-Analysis!
                    </h1>
                    {/* <p className="text-xl text-slate-200">
                        Laden Sie Ihre Excel-Dateien hoch, um mit der Analyse zu beginnen
                    </p> */}
                </div>

                {/* Mode Selection */}
                <div className="mb-8">
                    <p className="text-center mb-4 text-lg font-medium" style={{color: '#00aded'}}>
                        Wie viele Firmen möchten Sie analysieren?
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setMode(1)}
                            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 border-2 ${
                                mode === 1
                                    ? 'bg-white text-[#026fb6] shadow-xl border-[#026fb6]'
                                    : 'bg-white/20 text-white hover:bg-white/30 border-[#026fb6]'
                            }`}
                        >
                            <Building2 className="h-6 w-6 mx-auto mb-2" />
                            1 Firma
                        </button>
                        <button
                            onClick={() => setMode(2)}
                            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 border-2 ${
                                mode === 2
                                    ? 'bg-white text-[#026fb6] shadow-xl border-[#026fb6]'
                                    : 'bg-white/20 text-white hover:bg-white/30 border-[#026fb6]'
                            }`}
                        >
                            <div className="flex gap-1 justify-center mb-2">
                                <Building2 className="h-6 w-6" />
                                <Building2 className="h-6 w-6" />
                            </div>
                            2 Firmen
                        </button>
                        <button
                            onClick={() => setMode(3)}
                            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 border-2 ${
                                mode === 3
                                    ? 'bg-white text-[#026fb6] shadow-xl border-[#026fb6]'
                                    : 'bg-white/20 text-white hover:bg-white/30 border-[#026fb6]'
                            }`}
                        >
                            <div className="flex gap-1 justify-center mb-2">
                                <Building2 className="h-6 w-6" />
                                <Building2 className="h-6 w-6" />
                                <Building2 className="h-6 w-6" />
                            </div>
                            3 Firmen
                        </button>
                    </div>
                </div>

                {/* Company Upload Cards */}
                <div className={`grid gap-6 mb-6 ${mode === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : mode === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {companies.slice(0, mode).map((company, index) => (
                        <Card key={index} className="rounded-3xl shadow-xl border-2 bg-slate-800" style={{borderColor: '#026fb6'}}>
                            <CardHeader className="text-center pb-4">
                                <CardTitle className="text-xl font-bold text-white">
                                    Firma {index + 1}
                                </CardTitle>
                                
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Company Name Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">
                                        Firmenname <span className="text-red-400">*</span>
                                    </label>
                                    <CompanySearchSelect
                                        value={company.companyQuery}
                                        onValueChange={(value) => updateCompany(index, { companyQuery: value, isChecked: false })}
                                        onCompanySelect={(comp) => handleCompanySelect(index, comp)}
                                        onCreateNew={(companyName) => handleCreateNewCompany(index, companyName)}
                                        variant="dark"
                                    />
                                </div>

                                {/* Check Company Button */}
                                {!company.isChecked && (
                                    <Button
                                        onClick={() => handleCheckCompany(index)}
                                        disabled={checking === index || !company.companyQuery.trim()}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {checking === index ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Prüfe...
                                            </>
                                        ) : (
                                            "Firma prüfen"
                                        )}
                                    </Button>
                                )}

                                {/* Status after check */}
                                {company.isChecked && (
                                    <>
                                        <div className={`p-3 rounded-lg ${company.existsInDB ? 'bg-green-900/30 border border-green-700' : 'bg-blue-900/30 border border-blue-700'}`}>
                                            <p className={`text-sm font-medium ${company.existsInDB ? 'text-green-300' : 'text-blue-300'}`}>
                                                {company.existsInDB 
                                                    ? `✓ Firma "${company.companyQuery}" existiert bereits` 
                                                    : `Neue Firma "${company.companyQuery}" - Dateien hochladen`}    

                                            </p>
                                        </div>
                                        
                                        {/* Button to replace existing company data */}
                                        {company.existsInDB && (
                                            <Button
                                                onClick={() => handleDeleteCompanyData(index)}
                                                disabled={deletingData === index}
                                                className="
                                                    w-full
                                                    bg-transparent hover:bg-transparent
                                                    p-0 h-auto
                                                    cursor-default
                                                    active:scale-[0.99] transition-transform
                                                    disabled:opacity-60 disabled:cursor-not-allowed
                                                "
                                                >
                                                {deletingData === index ? (
                                                    <span className="inline-flex items-center cursor-default">
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    Lösche Daten...
                                                    </span>
                                                ) : (
                                                    <span
                                                    className="
                                                        text-blue-400 underline underline-offset-4
                                                        hover:text-blue-300
                                                        cursor-pointer
                                                        disabled:cursor-not-allowed
                                                    "
                                                    >
                                                    Neue Daten hochladen ?
                                                    </span>
                                                )}
                                                </Button>

                                            
                                        )}
                                    </>
                                )}

                                {/* File Uploads - only show if company doesn't exist in DB */}
                                {company.isChecked && !company.existsInDB && (
                                    <div 
                                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                                            dragActive === index
                                                ? 'border-blue-400 bg-blue-900/20' 
                                                : 'border-slate-600 hover:border-blue-500'
                                        }`}
                                        onDragEnter={(e) => handleDrag(e, index)}
                                        onDragLeave={(e) => handleDrag(e, index)}
                                        onDragOver={(e) => handleDrag(e, index)}
                                        onDrop={(e) => handleDrop(e, index)}
                                    >
                                        <input
                                            type="file"
                                            id={`file-upload-${index}`}
                                            accept=".xlsx,.xls"
                                            multiple
                                            onChange={(e) => handleFileChange(index, e)}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor={`file-upload-${index}`}
                                            className="cursor-pointer flex flex-col items-center gap-3"
                                        >
                                            <div className="h-16 w-16 rounded-full bg-blue-900 flex items-center justify-center">
                                                <FileSpreadsheet className="h-8 w-8 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-base font-semibold text-white mb-1">
                                                    {company.files.length > 0 
                                                        ? `${company.files.length} Datei(en) ausgewählt` 
                                                        : "Excel-Dateien auswählen"}
                                                </p>
                                                <p className="text-sm text-slate-300 font-medium">
                                                    Genau 2 Dateien erforderlich (.xlsx oder .xls)
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Oder per Drag & Drop hier ablegen
                                                </p>
                                                {company.files.length === 1 && (
                                                    <p className="text-xs text-orange-400 mt-2 font-medium">
                                                        ⚠️ Bitte wählen Sie noch eine 2. Datei aus
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                        
                                        {/* Show selected files */}
                                        {company.files.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {company.files.map((file, fileIdx) => (
                                                    <div key={fileIdx} className="bg-green-900/30 border border-green-700 rounded-lg p-3 flex items-center gap-2">
                                                        <FileSpreadsheet className="h-4 w-4 text-green-400 flex-shrink-0" />
                                                        <div className="flex-1 text-left">
                                                            <p className="text-sm font-semibold text-green-300 truncate">{file.name}</p>
                                                            <p className="text-xs text-green-400">
                                                                {(file.size / 1024).toFixed(2)} KB
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFile(index, fileIdx)}
                                                            className="p-1 hover:bg-red-900/30 rounded transition-colors group"
                                                            title="Datei entfernen"
                                                        >
                                                            <X className="h-4 w-4 text-green-400 group-hover:text-red-400" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="max-w-2xl mx-auto mb-6 bg-red-900/30 border-2 border-red-700 rounded-2xl p-4 text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Action Button - only show if all companies are checked */}
                {(() => {
                    const activeCompanies = companies.slice(0, mode)
                    const allChecked = activeCompanies.every(c => c.isChecked)
                    
                    if (!allChecked) return null
                    
                    const hasNewCompanies = activeCompanies.some(c => !c.existsInDB)
                    const allExisting = activeCompanies.every(c => c.existsInDB)
                    
                    if (allExisting) {
                        // All companies exist - show "Continue to Analysis" button
                        return (
                            <div className="max-w-2xl mx-auto">
                                <Button
                                    onClick={() => {
                                        // TODO: Navigate to analysis with multiple companies
                                        //alert(`✅ ${activeCompanies.length} bestehende Firma(en) ausgewählt!\n\nWeiterleitung zur Analyse wird später implementiert.`)

                                        navigate("/compare", { state: { companies: activeCompanies } })
                                    }}
                                    className="w-full h-14 rounded-full text-lg font-semibold cursor-pointer bg-green-600 hover:bg-green-700"
                                    size="lg"
                                >
                                    <>
                                        <ArrowRight className="h-5 w-5 mr-2" />
                                        Weiter zur Analyse
                                    </>
                                </Button>
                            </div>
                        )
                    }
                    
                    if (hasNewCompanies) {
                        // Has new companies - show "Upload & Continue" button
                        return (
                            <div className="max-w-2xl mx-auto">
                                <Button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="w-full h-14 rounded-full text-lg font-semibold cursor-pointer disabled:cursor-not-allowed"
                                    size="lg"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Wird hochgeladen...
                                        </>
                                    ) : (
                                        <>
                                            <UploadIcon className="h-5 w-5 mr-2" />
                                            Alle Dateien hochladen & Fortfahren
                                            <ArrowRight className="h-5 w-5 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        )
                    }
                    
                    return null
                })()}

                {/* Skip Option */}
                <div className="max-w-2xl mx-auto">
                    <div className="text-center pt-4">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="text-sm text-slate-300 hover:text-white underline"
                        >
                            Überspringen und Dashboard ansehen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
