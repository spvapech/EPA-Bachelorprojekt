import React, { useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:w-full sm:max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 sm:p-10 bg-white shadow-2xl">
                <DialogHeader className="text-left">
                    <DialogTitle className="text-5xl font-extrabold text-slate-800 tracking-tight">
                        Most Critical
                    </DialogTitle>

                    {/* Topic (rot) */}
                    <div className="mt-8 text-[42px] font-extrabold text-red-700 leading-tight">
                        {loading ? "…" : error ? "-" : categoryTitle}
                    </div>
                </DialogHeader>

                <div className="mt-14 space-y-10">
                    {loading ? (
                        <div className="text-center text-lg">Lade Daten…</div>
                    ) : error ? (
                        <div className="text-center text-red-600 text-lg">Fehler: {error}</div>
                    ) : !item ? (
                        <div className="text-center text-lg">Keine kritischste Kategorie gefunden.</div>
                    ) : (
                        <>
                            {/* Anteil negativer Reviews */}
                            <div className="flex items-center justify-between">
                                <div className="text-[28px] font-extrabold text-black">Anteil negativer Reviews:</div>
                                <div className="text-[28px] font-extrabold text-black">{negP === null ? "-" : `${negP} %`}</div>
                            </div>

                            {/* Impact */}
                            <div className="flex items-center justify-between">
                                <div className="text-[28px] font-extrabold text-black">Impact-Indikator:</div>
                                <div className="text-[32px] font-extrabold text-red-600">{impact}</div>
                            </div>

                            {/* Betroffene Kategorien */}
                            <div className="mt-8 text-center">
                                <div className="text-[30px] font-extrabold text-black">Betroffene Kategorien:</div>
                                <div className="mt-10 space-y-6">
                                    {(affectedCategories.length ? affectedCategories : ["Allgemein"]).map((c, idx) => (
                                        <div key={`${c}-${idx}`} className="text-[36px] font-extrabold text-black leading-tight">
                                            {c}
                                        </div>
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
