import React, { useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { API_URL } from "../../../config";

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

        fetch(`${API_URL}/topics/company/${companyId}/most-critical`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => setItem(data?.most_critical || null))
            .catch((err) => {
                setError(err.message || "Fehler beim Laden");
                setItem(null);
            })
            .finally(() => setLoading(false));
    }, [open, companyId]);

    // ---- helpers: NIE OBJEKTE rendern, immer nur Strings ----
    const toWord = (x) => {
        if (x == null) return "";
        if (typeof x === "string") return x.trim();
        if (typeof x === "number") return String(x);
        if (typeof x === "object") return (x.word || x.term || x.label || "").trim();
        return String(x).trim();
    };

    const getTopicName = (m) => {
        if (!m) return "-";

        let topicName = "";

        // Backend gibt topic_words array zurück - nimm nur das ERSTE Wort
        if (Array.isArray(m.topic_words) && m.topic_words.length > 0) {
            topicName = toWord(m.topic_words[0]); // toWord extrahiert aus {word: "...", weight: ...}
        }
        // Fallback: topic_text string - nimm nur das erste Wort
        else if (m.topic_text && String(m.topic_text).trim()) {
            topicName = String(m.topic_text).split(",")[0].trim();
        }
        // Legacy fallbacks
        else if (m.topic_name) {
            topicName = String(m.topic_name).trim();
        }
        else if (m.topic_label) {
            topicName = String(m.topic_label).trim();
        }

        if (!topicName || topicName === "-") return "-";
        
        // Kapitalisiere ersten Buchstaben
        return topicName.charAt(0).toUpperCase() + topicName.slice(1);
    };

    const getScore = (m) => {
        if (!m) return "-";
        
        // Backend gibt correlation zurück
        const v = m.correlation ?? m.score ?? m.impact_score ?? null;
        if (v === null || v === undefined) return "-";
        
        const num = Number(v);
        return Number.isFinite(num) ? num.toFixed(2) : String(v);
    };

    const getTopicWords = (m) => {
        if (!m) return [];

        // Backend gibt topic_words array zurück
        if (Array.isArray(m.topic_words) && m.topic_words.length) {
            return m.topic_words.map(toWord).filter(Boolean);
        }

        // Fallback: topic_text string parsen
        if (typeof m.topic_text === "string" && m.topic_text.trim()) {
            return m.topic_text
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        }

        return [];
    };

    const negativeSharePercent = (m) => {
        if (!m) return null;

        // wenn Backend schon liefert
        if (m.negative_share_percent !== undefined && m.negative_share_percent !== null) {
            const p = Number(m.negative_share_percent);
            return Number.isFinite(p) ? Math.round(p) : null;
        }

        // fallback: selbst rechnen
        const s = m.sentiments || {};
        const neg = Number(s.negative || 0);
        const pos = Number(s.positive || 0);
        const neu = Number(s.neutral || 0);
        const total = neg + pos + neu || Number(m.mention_count || 0) || 0;
        if (!total) return null;
        return Math.round((neg / total) * 100);
    };

    const impactIndicator = (m) => {
        if (!m) return "-";

        // wenn Backend liefert
        if (m.impact_indicator) return String(m.impact_indicator);

        // sonst ableiten aus negativem Anteil
        const p = negativeSharePercent(m);
        if (p === null) return "-";
        if (p >= 60) return "Hoch";
        if (p >= 35) return "Mittel";
        return "Niedrig";
    };

    const affectedCategories = useMemo(() => {
        if (!item) return [];

        // wenn Backend categories liefert (Strings oder Objekte)
        if (Array.isArray(item.categories) && item.categories.length) {
            return item.categories.map(toWord).filter(Boolean);
        }

        // optional anderes Feld
        if (Array.isArray(item.affected_categories) && item.affected_categories.length) {
            return item.affected_categories.map(toWord).filter(Boolean);
        }

        // fallback: top_words als Kategorien anzeigen
        if (Array.isArray(item.top_words) && item.top_words.length) {
            return item.top_words.map(toWord).filter(Boolean);
        }

        // fallback: topic_words / topic_text
        const words = getTopicWords(item);
        return words.map(toWord).filter(Boolean);
    }, [item]);

    const topicName = getTopicName(item);
    const score = getScore(item);
    const negP = negativeSharePercent(item);
    const impact = impactIndicator(item);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl rounded-3xl px-10 py-8">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-3xl font-bold text-slate-800">
                        Most Critical
                    </DialogTitle>

                    {/* Topic (rot) */}
                    <div className="mt-3 text-4xl font-bold text-red-600">
                        {loading ? "…" : error ? "-" : topicName}
                    </div>

                    {/* Score (rot) */}
                    <div className="mt-1 text-2xl font-bold text-red-600">
                        {loading ? "…" : error ? "-" : score}
                    </div>
                </DialogHeader>

                <div className="mt-6 space-y-4">
                    {loading ? (
                        <div className="text-center text-lg">Lade Daten…</div>
                    ) : error ? (
                        <div className="text-center text-red-600 text-lg">Fehler: {error}</div>
                    ) : !item ? (
                        <div className="text-center text-lg">Kein kritischstes Topic gefunden.</div>
                    ) : (
                        <>
                            {/* Anteil negativer Reviews */}
                            <div className="flex items-center justify-between text-lg font-semibold">
                                <div className="text-black">
                                    Anteil negativer Reviews:
                                </div>
                                <div className="text-black">
                                    {negP === null ? "-" : `${negP} %`}
                                </div>
                            </div>

                            {/* Impact */}
                            <div className="flex items-center justify-between text-lg font-semibold">
                                <div className="text-black">
                                    Impact-Indikator:
                                </div>
                                <div className="text-red-600">{impact}</div>
                            </div>

                            {/* Betroffene Kategorien */}
                            <div className="mt-8 text-center">
                                <div className="text-xl font-bold text-black mb-4">
                                    Betroffene Kategorien:
                                </div>

                                <div className="space-y-2">
                                    {(affectedCategories.length ? affectedCategories : ["Allgemein"]).map((c, idx) => (
                                        <div key={`${c}-${idx}`} className="text-lg font-semibold text-black">
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
