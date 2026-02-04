import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileSpreadsheet, ArrowRight, Building2, Upload as UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CompanySearchSelect } from "@/components/CompanySearchSelect"
import { API_URL } from "../config"


export default function Welcome() {
    const [mode, setMode] = useState(1) // 1, 2, or 3 companies
    
    // State for each company (array index = company index)
    const [companies, setCompanies] = useState([
        { companyQuery: "", companyId: null, selectedCompany: null, file1: null, file2: null },
        { companyQuery: "", companyId: null, selectedCompany: null, file1: null, file2: null },
        { companyQuery: "", companyId: null, selectedCompany: null, file1: null, file2: null }
    ])

    const [uploading, setUploading] = useState(false)
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

    const handleFileChange = (companyIndex, fileNumber, e) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            const validTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ]
            if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
                updateCompany(companyIndex, { [fileNumber]: selectedFile })
                setError("")
            } else {
                setError("Bitte wählen Sie eine Excel-Datei (.xlsx oder .xls)")
            }
        }
    }
    
    const handleDrag = (e, companyIndex, fileNumber) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(`${companyIndex}-${fileNumber}`)
        } else if (e.type === "dragleave") {
            setDragActive(null)
        }
    }
    
    const handleDrop = (e, companyIndex, fileNumber) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(null)
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0]
            const validTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ]
            if (validTypes.includes(droppedFile.type) || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
                updateCompany(companyIndex, { [fileNumber]: droppedFile })
                setError("")
            } else {
                setError("Bitte wählen Sie eine Excel-Datei (.xlsx oder .xls)")
            }
        }
    }

    const handleCompanySelect = (companyIndex, company) => {
        updateCompany(companyIndex, {
            selectedCompany: company,
            companyId: company ? company.id : null
        })
    }

    const handleUpload = async () => {
        // Validate that all active companies have at least company name and one file
        const activeCompanies = companies.slice(0, mode)
        
        for (let i = 0; i < activeCompanies.length; i++) {
            const company = activeCompanies[i]
            if (!company.companyQuery.trim()) {
                setError(`Bitte geben Sie einen Firmennamen für Firma ${i + 1} ein.`)
                return
            }
            if (!company.file1 && !company.file2) {
                setError(`Bitte wählen Sie mindestens eine Datei für Firma ${i + 1} aus.`)
                return
            }
        }

        setUploading(true)
        setError("")

        const createdCompanyIds = []

        try {
            // Process each company
            for (let i = 0; i < activeCompanies.length; i++) {
                const company = activeCompanies[i]
                let finalCompanyId = company.companyId
                
                // Create or find company
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
                
                // Upload file1 if exists
                if (company.file1) {
                    const formData1 = new FormData()
                    formData1.append("file", company.file1)
                    formData1.append("company_id", String(finalCompanyId))

                    const response1 = await fetch(`${API_URL}/upload-excel`, {
                        method: "POST",
                        body: formData1,
                    })

                    if (!response1.ok) {
                        const errorData = await response1.json().catch(() => ({}))
                        throw new Error(errorData.detail || `Upload fehlgeschlagen für Firma ${i + 1}, Datei 1`)
                    }
                }
                
                // Upload file2 if exists
                if (company.file2) {
                    const formData2 = new FormData()
                    formData2.append("file", company.file2)
                    formData2.append("company_id", String(finalCompanyId))

                    const response2 = await fetch(`${API_URL}/upload-excel`, {
                        method: "POST",
                        body: formData2,
                    })

                    if (!response2.ok) {
                        const errorData = await response2.json().catch(() => ({}))
                        throw new Error(errorData.detail || `Upload fehlgeschlagen für Firma ${i + 1}, Datei 2`)
                    }
                }
            }

            console.log("Alle Uploads erfolgreich")

            // Erfolgsmeldung anzeigen
            setError("") // Clear any previous errors
            alert(`✅ Upload erfolgreich!\n\n${mode} Firma(en) wurden erfolgreich hochgeladen und analysiert.`)

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
        <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-800 to-slate-700 flex items-center justify-center p-4 py-12">
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
                    <p className="text-center text-white mb-4 text-lg font-medium">
                        Wie viele Firmen möchten Sie analysieren?
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setMode(1)}
                            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 ${
                                mode === 1
                                    ? 'bg-white text-blue-600 shadow-xl'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                        >
                            <Building2 className="h-6 w-6 mx-auto mb-2" />
                            1 Firma
                        </button>
                        <button
                            onClick={() => setMode(2)}
                            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 ${
                                mode === 2
                                    ? 'bg-white text-blue-600 shadow-xl'
                                    : 'bg-white/20 text-white hover:bg-white/30'
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
                            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 ${
                                mode === 3
                                    ? 'bg-white text-blue-600 shadow-xl'
                                    : 'bg-white/20 text-white hover:bg-white/30'
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
                        <Card key={index} className="rounded-3xl shadow-xl border-2 border-slate-200">
                            <CardHeader className="text-center pb-4">
                                <CardTitle className="text-xl font-bold text-slate-800">
                                    Firma {index + 1}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    1-2 Excel-Dateien hochladen
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Company Name Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        Firmenname <span className="text-red-600">*</span>
                                    </label>
                                    <CompanySearchSelect
                                        value={company.companyQuery}
                                        onValueChange={(value) => updateCompany(index, { companyQuery: value })}
                                        onCompanySelect={(comp) => handleCompanySelect(index, comp)}
                                    />
                                </div>

                                {/* File 1 Upload */}
                                <div 
                                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                                        dragActive === `${index}-file1`
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-slate-300 hover:border-blue-400'
                                    }`}
                                    onDragEnter={(e) => handleDrag(e, index, 'file1')}
                                    onDragLeave={(e) => handleDrag(e, index, 'file1')}
                                    onDragOver={(e) => handleDrag(e, index, 'file1')}
                                    onDrop={(e) => handleDrop(e, index, 'file1')}
                                >
                                    <input
                                        type="file"
                                        id={`file-upload-${index}-1`}
                                        accept=".xlsx,.xls"
                                        onChange={(e) => handleFileChange(index, 'file1', e)}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor={`file-upload-${index}-1`}
                                        className="cursor-pointer flex flex-col items-center gap-2"
                                    >
                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {company.file1 ? company.file1.name : "Datei 1 auswählen"}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {company.file1 ? `${(company.file1.size / 1024).toFixed(2)} KB` : '.xlsx oder .xls'}
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                {/* File 2 Upload (Optional) */}
                                <div 
                                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                                        dragActive === `${index}-file2`
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-slate-300 hover:border-blue-400'
                                    }`}
                                    onDragEnter={(e) => handleDrag(e, index, 'file2')}
                                    onDragLeave={(e) => handleDrag(e, index, 'file2')}
                                    onDragOver={(e) => handleDrag(e, index, 'file2')}
                                    onDrop={(e) => handleDrop(e, index, 'file2')}
                                >
                                    <input
                                        type="file"
                                        id={`file-upload-${index}-2`}
                                        accept=".xlsx,.xls"
                                        onChange={(e) => handleFileChange(index, 'file2', e)}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor={`file-upload-${index}-2`}
                                        className="cursor-pointer flex flex-col items-center gap-2"
                                    >
                                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                            <FileSpreadsheet className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {company.file2 ? company.file2.name : "Datei 2 (optional)"}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {company.file2 ? `${(company.file2.size / 1024).toFixed(2)} KB` : '.xlsx oder .xls'}
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="max-w-2xl mx-auto mb-6 bg-red-100 border-2 border-red-300 rounded-2xl p-4 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Upload Button */}
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

                    {/* Skip Option */}
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
