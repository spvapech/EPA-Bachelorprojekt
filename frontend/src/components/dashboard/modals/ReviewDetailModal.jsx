import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
    X, 
    Calendar, 
    User, 
    Star, 
    ThumbsUp, 
    ThumbsDown, 
    Lightbulb, 
    Briefcase, 
    FileText,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReviewDetailModal({ 
    open, 
    onOpenChange, 
    reviewDetail, 
    allReviewDetails = [], 
    currentIndex = 0,
    onNavigate 
}) {
    if (!reviewDetail || !reviewDetail.fullReview) return null

    const { fullReview } = reviewDetail
    const hasMultipleReviews = allReviewDetails.length > 1
    const canGoPrevious = currentIndex > 0
    const canGoNext = currentIndex < allReviewDetails.length - 1

    const handlePrevious = () => {
        if (canGoPrevious && onNavigate) {
            onNavigate(currentIndex - 1)
        }
    }

    const handleNext = () => {
        if (canGoNext && onNavigate) {
            onNavigate(currentIndex + 1)
        }
    }

    // Format text with line breaks
    const formatText = (text) => {
        if (!text) return null
        return text.split('\n').map((line, index) => (
            <span key={index}>
                {line}
                {index < text.split('\n').length - 1 && <br />}
            </span>
        ))
    }

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "Unbekannt"
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString("de-DE", {
                year: "numeric",
                month: "long",
                day: "numeric"
            })
        } catch {
            return "Unbekannt"
        }
    }

    // Get badge variant based on status
    const getStatusBadgeVariant = (status) => {
        const statusLower = status?.toLowerCase() || ""
        if (statusLower.includes("manager") || statusLower.includes("führungskraft")) {
            return "default"
        }
        if (statusLower.includes("employee") || statusLower.includes("angestellt")) {
            return "secondary"
        }
        if (statusLower.includes("student") || statusLower.includes("praktikant")) {
            return "outline"
        }
        return "outline"
    }

    // Render star rating - improved version with better visibility
    const renderStarRating = (rating, size = "md") => {
        if (rating === null || rating === undefined) {
            return <span className="text-slate-400 text-sm font-medium">Nicht bewertet</span>
        }
        
        const roundedRating = Math.round(rating * 2) / 2 // Round to nearest 0.5
        const fullStars = Math.floor(roundedRating)
        const hasHalfStar = roundedRating % 1 !== 0
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

        // Size configurations
        const sizeClasses = {
            sm: { star: "h-4 w-4", text: "text-sm", gap: "gap-0.5" },
            md: { star: "h-5 w-5", text: "text-base", gap: "gap-1" },
            lg: { star: "h-6 w-6", text: "text-lg", gap: "gap-1.5" }
        }
        const config = sizeClasses[size]

        return (
            <div className={`flex items-center ${config.gap}`}>
                {[...Array(fullStars)].map((_, i) => (
                    <Star 
                        key={`full-${i}`} 
                        className={`${config.star} fill-amber-400 text-amber-500 drop-shadow-sm`}
                        strokeWidth={1.5}
                    />
                ))}
                {hasHalfStar && (
                    <div className="relative inline-block">
                        <Star 
                            className={`${config.star} fill-slate-200 text-slate-300`}
                            strokeWidth={1.5}
                        />
                        <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                            <Star 
                                className={`${config.star} fill-amber-400 text-amber-500 drop-shadow-sm`}
                                strokeWidth={1.5}
                            />
                        </div>
                    </div>
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star 
                        key={`empty-${i}`} 
                        className={`${config.star} fill-slate-200 text-slate-300`}
                        strokeWidth={1.5}
                    />
                ))}
                <span className={`ml-2 ${config.text} font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded`}>
                    {rating.toFixed(1)}
                </span>
            </div>
        )
    }

    // Rating categories with German labels
    const ratingCategories = [
        { key: "arbeitsatmosphaere", label: "Arbeitsatmosphäre" },
        { key: "image", label: "Image" },
        { key: "work_life_balance", label: "Work-Life Balance" },
        { key: "karriere_weiterbildung", label: "Karriere/Weiterbildung" },
        { key: "gehalt_sozialleistungen", label: "Gehalt/Sozialleistungen" },
        { key: "kollegenzusammenhalt", label: "Kollegenzusammenhalt" },
        { key: "umwelt_sozialbewusstsein", label: "Umwelt-/Sozialbewusstsein" },
        { key: "vorgesetztenverhalten", label: "Vorgesetztenverhalten" },
        { key: "kommunikation", label: "Kommunikation" },
        { key: "interessante_aufgaben", label: "Interessante Aufgaben" },
        { key: "umgang_mit_aelteren_kollegen", label: "Umgang mit älteren Kollegen" },
        { key: "arbeitsbedingungen", label: "Arbeitsbedingungen" },
        { key: "gleichberechtigung", label: "Gleichberechtigung" }
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[75vw] !w-[75vw] !h-[85vh] !max-h-[85vh] flex flex-col p-0 !translate-x-[-50%] !translate-y-[-50%] !top-[50%] !left-[50%] rounded-2xl !shadow-none overflow-hidden border border-slate-200">
                {/* Sticky Header */}
                <DialogHeader className="sticky top-0 z-10 bg-white border-b border-slate-200 p-6 pb-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Navigation Buttons - Left */}
                        <div className="flex items-center gap-2">
                            {hasMultipleReviews && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handlePrevious}
                                        disabled={!canGoPrevious}
                                        className="h-9 w-9 rounded-full"
                                        title="Vorherige Review"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                    <span className="text-sm font-medium text-slate-600 min-w-[60px] text-center">
                                        {currentIndex + 1} / {allReviewDetails.length}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleNext}
                                        disabled={!canGoNext}
                                        className="h-9 w-9 rounded-full"
                                        title="Nächste Review"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Title and Info - Center */}
                        <div className="flex-1">
                            <DialogTitle className="text-2xl font-bold mb-2">
                                {fullReview.titel || "Review Details"}
                            </DialogTitle>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDate(fullReview.datum)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>{fullReview.sourceType || "Unbekannt"}</span>
                                    {fullReview.status && (
                                        <>
                                            <span className="text-slate-400">•</span>
                                            <Badge variant={getStatusBadgeVariant(fullReview.status)}>
                                                {fullReview.status}
                                            </Badge>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Close Button - Right */}
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
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="overflow-y-auto px-6 pb-6">
                    <div className="space-y-6 mt-4">
                        {/* Overall Rating */}
                        {fullReview.durchschnittsbewertung && (
                            <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
                                        Gesamtbewertung
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        {renderStarRating(fullReview.durchschnittsbewertung, "lg")}
                                        <div className="text-right">
                                            <div className="text-4xl font-bold text-amber-600">
                                                {fullReview.durchschnittsbewertung.toFixed(1)}
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium">von 5.0</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Review Texts */}
                        <div className="space-y-4">
                            {fullReview.gut_am_arbeitgeber && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg font-semibold text-green-700 flex items-center gap-2">
                                            <ThumbsUp className="h-5 w-5" />
                                            Gut am Arbeitgeber finde ich
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {formatText(fullReview.gut_am_arbeitgeber)}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {fullReview.schlecht_am_arbeitgeber && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg font-semibold text-red-700 flex items-center gap-2">
                                            <ThumbsDown className="h-5 w-5" />
                                            Schlecht am Arbeitgeber finde ich
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {formatText(fullReview.schlecht_am_arbeitgeber)}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {fullReview.verbesserungsvorschlaege && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg font-semibold text-blue-700 flex items-center gap-2">
                                            <Lightbulb className="h-5 w-5" />
                                            Verbesserungsvorschläge
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {formatText(fullReview.verbesserungsvorschlaege)}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {fullReview.stellenbeschreibung && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-slate-600" />
                                            Stellenbeschreibung
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {formatText(fullReview.stellenbeschreibung)}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {fullReview.jobbeschreibung && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                            <Briefcase className="h-5 w-5 text-slate-600" />
                                            Jobbeschreibung
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {formatText(fullReview.jobbeschreibung)}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Star Ratings Grid */}
                        {fullReview.ratings && Object.values(fullReview.ratings).some(r => r !== null && r !== undefined) && (
                            <Card className="border-slate-200">
                                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <div className="flex">
                                            <Star className="h-4 w-4 fill-amber-400 text-amber-500 -mr-1" />
                                            <Star className="h-4 w-4 fill-amber-400 text-amber-500 -mr-1" />
                                            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                                        </div>
                                        Detaillierte Sternebewertungen
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {ratingCategories.map(({ key, label }) => {
                                            const rating = fullReview.ratings[key]
                                            if (rating === null || rating === undefined) return null
                                            
                                            // Color based on rating
                                            const getBgColor = (r) => {
                                                if (r >= 4.0) return "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                                                if (r >= 3.0) return "bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200"
                                                if (r >= 2.0) return "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200"
                                                return "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
                                            }
                                            
                                            return (
                                                <div
                                                    key={key}
                                                    className={`flex flex-col gap-2 p-4 rounded-lg border ${getBgColor(rating)} transition-all hover:shadow-md`}
                                                >
                                                    <span className="text-sm font-semibold text-slate-800">
                                                        {label}
                                                    </span>
                                                    <div className="flex items-center justify-between">
                                                        {renderStarRating(rating, "sm")}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
