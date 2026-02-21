import React, { useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, BarChart3, Layers } from "lucide-react";
import { API_URL } from "../../../config";

// Labels für Kategorie-Keys aus dem Backend
const LABELS = {
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

export default function MostCriticalModal({ open, onOpenChange, companyId = null }) {
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open) return;

        if (!companyId) {
            setItem(null);
            setError("Keine Firma ausgewählt");
            return;
        }

        setLoading(true);
        setError(null);

        // Kein Topic-Analyse-Endpunkt: "Most Critical" = Kategorie mit kleinstem Ø-Score
        fetch(`${API_URL}/companies/${companyId}/ratings/avg`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => {
                if (!data || typeof data !== "object") {
                    setItem(null);
                    return;
                }

                const entries = Object.entries(data)
                    .map(([key, value]) => ({
                        key,
                        title: LABELS[key] ?? key,
                        score: Number(value),
                    }))
                    .filter((x) => Number.isFinite(x.score));

                if (!entries.length) {
                    setItem(null);
                    return;
                }

                const sorted = [...entries].sort((a, b) => a.score - b.score);
                const min = sorted[0];
                const affected = sorted.slice(0, 1).map((x) => x.title);

                // Aus Score grob "negativen Anteil" ableiten (0..5 -> 100..0)
                const negative_share_percent = Math.max(
                    0,
                    Math.min(100, Math.round(((5 - min.score) / 5) * 100))
                );

                setItem({
                    title: min.title,
                    score: min.score,
                    negative_share_percent,
                    affected_categories: affected,
                });
            })
            .catch((err) => {
                setError(err.message || "Fehler beim Laden");
                setItem(null);
            })
            .finally(() => setLoading(false));
    }, [open, companyId]);

    const categoryTitle = item?.title ?? "-";

    const negP = useMemo(() => {
        if (!item) return null;
        const p = Number(item.negative_share_percent);
        return Number.isFinite(p) ? Math.round(p) : null;
    }, [item]);

    const impact = useMemo(() => {
        if (negP === null) return "-";
        if (negP >= 60) return "Hoch";
        if (negP >= 35) return "Mittel";
        return "Niedrig";
    }, [negP]);

    const affectedCategories = useMemo(() => {
        if (!item) return [];
        if (Array.isArray(item.affected_categories) && item.affected_categories.length) {
            return item.affected_categories.filter(Boolean);
        }
        return [];
    }, [item]);

    const impactColor = useMemo(() => {
        if (impact === "Hoch") return "text-red-600 bg-red-50 border-red-200";
        if (impact === "Mittel") return "text-orange-600 bg-orange-50 border-orange-200";
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
    }, [impact]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-0 bg-white shadow-2xl">
                {/* Header mit rotem Gradient */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl px-6 py-6">
                    <DialogHeader className="text-left">
                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Most Critical
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-3 text-2xl font-extrabold text-white leading-tight">
                        {loading ? "…" : error ? "-" : categoryTitle}
                    </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {loading ? (
                        <div className="text-center text-base text-slate-500 py-8">Lade Daten…</div>
                    ) : error ? (
                        <div className="text-center text-red-600 text-base py-8">Fehler: {error}</div>
                    ) : !item ? (
                        <div className="text-center text-base text-slate-500 py-8">Keine kritischste Kategorie gefunden.</div>
                    ) : (
                        <>
                            {/* Anteil negativer Reviews */}
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                    Anteil negativer Reviews
                                </div>
                                <Badge variant="destructive" className="text-sm px-3 py-1 font-bold">
                                    {negP === null ? "-" : `${negP} %`}
                                </Badge>
                            </div>

                            {/* Impact-Indikator */}
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <BarChart3 className="h-4 w-4 text-orange-500" />
                                    Impact-Indikator
                                </div>
                                <span className={`text-sm font-bold px-3 py-1 rounded-full border ${impactColor}`}>
                                    {impact}
                                </span>
                            </div>

                            {/* Betroffene Kategorien */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <Layers className="h-4 w-4 text-slate-500" />
                                    Betroffene Kategorien
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(affectedCategories.length ? affectedCategories : ["Allgemein"]).map((c, idx) => (
                                        <Badge key={`${c}-${idx}`} variant="outline" className="text-sm font-semibold px-3 py-1">
                                            {c}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
