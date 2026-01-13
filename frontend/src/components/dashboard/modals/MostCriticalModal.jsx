
    import React, { useEffect, useState } from "react";
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
                .then((data) => {
                    const m = data?.most_critical || null;
                    setItem(m);
                })
                .catch((err) => {
                    setError(err.message || "Fehler beim Laden");
                    setItem(null);
                })
                .finally(() => setLoading(false));

        }, [open, companyId]);

        const renderTopicLabel = (m) => {
            if (!m) return "-";
            if (m.topic) return m.topic;
            if (m.top_words && Array.isArray(m.top_words)) return m.top_words.map(w => w.word).slice(0,5).join(", ");
            return "-";
        };

        const negativeShare = (m) => {
            if (!m) return "-";
            const s = m.sentiments || {};
            const neg = s.negative || 0;
            const pos = s.positive || 0;
            const neu = s.neutral || 0;
            const total = neg + pos + neu || m.mention_count || 1;
            return `${Math.round((neg/total)*100)}%`;
        };

        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="min-w-3xl">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-3x1 font-extrabold text-slate-800 leading-tight">
                            {loading ? "Lade…" : (item ? `Most Critical: ${renderTopicLabel(item)}` : "Most Critical")}
                        </DialogTitle>

                        <div className="mt-2 text-[34px] font-extrabold text-orange-400">
                            {loading ? "…" : renderTopicLabel(item)}
                        </div>
                    </DialogHeader>

                    <div className="mt-12">
                        {loading ? (
                            <div className="text-center text-[24px]">Lade Daten…</div>
                        ) : error ? (
                            <div className="text-center text-red-600 text-[20px]">Fehler: {error}</div>
                        ) : !item ? (
                            <div className="text-center text-[20px]">Kein kritischstes Topic gefunden.</div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="text-[28px] font-extrabold text-black">Anteil negativer Reviews:</div>
                                    <div className="text-[28px] font-extrabold text-black">{negativeShare(item)}</div>
                                </div>

                                <div className="flex items-center justify-between mt-6">
                                    <div className="text-[28px] font-extrabold text-black">Impact-Indikator</div>
                                    <div className="text-[28px] font-extrabold text-black">
        
                                    </div>
                                </div>

                                <div className="mt-14 text-center">
                                    <div className="text-[30px] font-extrabold text-black">Betroffene Kategorien:</div>

                                    <div className="mt-6 space-y-4">
                                        {(item.categories && item.categories.length ? item.categories : (item.top_words ? item.top_words.map(w=>w.word) : ["Allgemein"]))
                                            .map((c) => (
                                                <div key={c} className="text-[34px] font-extrabold text-black leading-tight">{c}</div>
                                            ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="mt-10">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Schließen</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }