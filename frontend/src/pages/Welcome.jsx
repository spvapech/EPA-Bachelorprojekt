import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileSpreadsheet, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CompanySearchSelect } from "@/components/CompanySearchSelect"
import { API_URL } from "../config"


export default function Welcome() {
    const [companyQuery, setCompanyQuery] = useState("")
    const [companyId, setCompanyId] = useState(null)
    const [selectedCompany, setSelectedCompany] = useState(null)

    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState("")
    const [dragActive, setDragActive] = useState(false)
    const navigate = useNavigate()

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            // Check if it's an Excel file
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
    
    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }
    
    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0]
            const validTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ]
            if (validTypes.includes(droppedFile.type) || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
                setFile(droppedFile)
                setError("")
            } else {
                setError("Bitte wählen Sie eine Excel-Datei (.xlsx oder .xls)")
                setFile(null)
            }
        }
    }

    const handleCompanySelect = (company) => {
        setSelectedCompany(company)
        setCompanyId(company ? company.id : null)
    }

    const handleUpload = async () => {
        if (!file) {
            setError("Bitte wählen Sie zuerst eine Datei aus")
            return
        }
        if (!companyQuery.trim()) {
            setError("Bitte geben Sie einen Firmennamen ein.")
            return
        }

        setUploading(true)
        setError("")

        try {
            // Prüfe ob Firma existiert oder erstelle sie
            let finalCompanyId = companyId
            
            if (!finalCompanyId) {
                // Versuche Firma zu finden oder erstellen
                const createRes = await fetch(`${API_URL}/companies/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: companyQuery.trim() })
                })
                
                if (!createRes.ok) {
                    throw new Error("Fehler beim Erstellen/Finden der Firma")
                }
                
                const newCompany = await createRes.json()
                finalCompanyId = newCompany.id
            }
            
            const formData = new FormData()
            formData.append("file", file)
            formData.append("company_id", String(finalCompanyId))

            const response = await fetch(`${API_URL}/upload-excel`, {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                throw new Error("Upload fehlgeschlagen")
            }

            const result = await response.json()
            console.log("Upload erfolgreich:", result)

            // Navigate to dashboard after successful upload with company info
            navigate("/dashboard", { 
                state: { 
                    companyId: finalCompanyId, 
                    companyName: companyQuery.trim() 
                } 
            })
        } catch (err) {
            setError(err.message || "Fehler beim Hochladen der Datei")
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-800 to-slate-700 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Welcome Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-white mb-4">
                        Willkommen bei AGB-Analysis!
                    </h1>
                    <p className="text-xl text-slate-200">
                        Laden Sie Ihre Excel-Datei hoch, um mit der Analyse zu beginnen
                    </p>
                </div>

                {/* Upload Card */}
                <Card className="rounded-3xl shadow-xl border-2 border-slate-200">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl font-bold text-slate-800">
                            Daten hochladen
                        </CardTitle>
                        <CardDescription className="text-base">
                            Wählen Sie eine Excel-Datei mit Bewertungsdaten aus
                            <p>Unterstützte Formate: .xlsx, .xls</p>
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                            {/* Company Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Firmenname <span className="text-red-600">*</span>
                            </label>

                            <CompanySearchSelect
                                value={companyQuery}
                                onValueChange={setCompanyQuery}
                                onCompanySelect={handleCompanySelect}
                            />

                            <p className="text-xs text-slate-500">
                                Geben Sie einen neuen Firmennamen ein oder wählen Sie aus den Vorschlägen.
                            </p>
                        </div>

                        {/* File Input Area */}
                        <div 
                            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                                dragActive 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-slate-300 hover:border-blue-400'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                id="file-upload"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer flex flex-col items-center gap-4"
                            >
                                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                                    <FileSpreadsheet className="h-10 w-10 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-slate-700 mb-1">
                                        {file ? file.name : "Datei auswählen"}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        oder per Drag & Drop hier ablegen
                                    </p>
                                </div>
                                
                            </label>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {/* File Info */}
                        {file && !error && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                <div className="flex-1">
                                    <p className="font-semibold text-green-800">{file.name}</p>
                                    <p className="text-sm text-green-600">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Upload Button */}
                        <Button
                            onClick={handleUpload}
                            disabled={!file || uploading || !companyQuery.trim()}
                            className="w-full h-12 rounded-full text-lg font-semibold cursor-pointer disabled:cursor-not-allowed"
                            size="lg"
                        >
                            {uploading ? (
                                <>
                                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Wird hochgeladen...
                                </>
                            ) : (
                                <>
                                    Hochladen & Fortfahren
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                </>
                            )}
                        </Button>

                        {/* Skip Option */}
                        <div className="text-center pt-2">
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="text-sm text-slate-500 hover:text-slate-700 underline"
                            >
                                Überspringen und Dashboard ansehen
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Section */}
                {/* <div className="mt-8 text-center text-sm text-slate-500">
                    <p>Unterstützte Formate: .xlsx, .xls</p>
                    <p className="mt-1">Die Datei sollte Bewertungsdaten von Kandidaten oder Mitarbeitern enthalten</p>
                </div> */}
            </div>
        </div>
    )
}
