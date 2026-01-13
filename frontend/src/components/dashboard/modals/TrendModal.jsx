import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API_URL = "http://localhost:8000/api";


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

// Mapping für 1Y | 3Y | All
// 1Y/3Y nutzen eine stabile Monatslogik (volle Monate):
//   - current = letzte N volle Monate
//   - previous = N volle Monate davor
const RANGE_TO_STABLE_MONTHS = {
    "1Y": 12,
    "3Y": 36,
};

const RANGE_TO_DAYS_FALLBACK = {
    "All": 730, // legacy fallback (unused if stable_all works)
};

export default function TrendModal({ open, onOpenChange, companyId }) {
    const [range, setRange] = useState("1Y"); // Start mit kürzerem Zeitraum
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open || !companyId) return;

        const stableMonths = RANGE_TO_STABLE_MONTHS[range];
        const daysFallback = RANGE_TO_DAYS_FALLBACK[range];

        const controller = new AbortController();
        setLoading(true);
        setError("");

                const url = stableMonths
                        ? `${API_URL}/companies/${companyId}/ratings/trend?mode=stable_months&months=${stableMonths}`
                        : range === "All"
                            ? `${API_URL}/companies/${companyId}/ratings/trend?mode=stable_all&months=12`
                            : `${API_URL}/companies/${companyId}/ratings/trend?days=${daysFallback ?? 30}`;

        fetch(url, {
            signal: controller.signal,
        })
            .then((r) => {
                if (!r.ok) throw new Error("API error");
                return r.json();
            })
            .then((json) => {
                console.log('TrendModal data:', json);
                setData(json);
            })
            .catch((e) => {
                if (e.name !== "AbortError") setError(e.message || "Failed to fetch");
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [open, companyId, range]);

    const rows = useMemo(() => {
        if (!data) return [];

        // ✅ falls Backend später { metrics: {...} } liefert
        const metrics = data.metrics ?? data;

        return Object.entries(metrics)
            .map(([key, obj]) => ({
                key,
                title: LABELS[key] ?? key,
                score: Number(obj?.score),
                delta: obj?.delta === null || obj?.delta === undefined ? null : Number(obj.delta),
                sign: obj?.sign ?? "flat",
            }))
            .filter((x) => Number.isFinite(x.score));
    }, [data]);

    const fmtDelta = (d, sign) => {
        if (sign === "new") return "neu";
        if (d === null || !Number.isFinite(d)) return "—";
        const v = Math.abs(Math.round(d * 10) / 10);
        return v > 0 ? `${v}` : `${v}`;
    };

    const trendColor = (sign) => {
        if (sign === "up") return "text-green-600";
        if (sign === "down") return "text-red-600";
        if (sign === "new") return "text-blue-600";
        return "text-gray-600";
    };

    const arrow = (sign) =>
        sign === "up" ? "↑" : sign === "down" ? "↓" : "—";


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl rounded-3xl px-10 py-8">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-4xl font-bold text-slate-800">
                        Trend
                    </DialogTitle>

                    <div className="flex justify-center gap-4 mt-4 text-base">
                        {["1Y", "3Y", "All"].map((r) => (
                            <button
                                key={r}
                                type="button"
                                className={range === r ? "text-blue-600 font-bold underline" : "text-gray-500 font-semibold"}
                                onClick={() => setRange(r)}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </DialogHeader>

                {loading && <div className="text-center text-lg mt-6">Loading...</div>}
                {error && <div className="text-center text-red-600 text-lg mt-6">{error}</div>}
                {!companyId && <div className="text-center text-gray-500 mt-6">Bitte zuerst eine Firma auswählen.</div>}

                {!loading && !error && companyId && (
                    <div className="mt-6 space-y-3">
                        {rows.length === 0 && (
                            <div className="text-center text-gray-500 mt-6">
                                Keine Trend-Daten für diesen Zeitraum vorhanden.
                            </div>
                        )}
                        {rows.map((row) => (
                            <div key={row.key} className="flex items-center justify-between py-2 border-b border-gray-200">
                                <div className="text-lg font-semibold text-black flex-1">
                                    {row.title}:
                                </div>
                                <div className={`flex items-center gap-2 font-bold text-xl w-24 justify-end ${trendColor(row.sign)}`}>
                                    <span>{arrow(row.sign)}</span>
                                    <span>
                                        {row.sign === "flat" ? "0" : fmtDelta(row.delta, row.sign)}
                                    </span>
                                </div>
                                <div className="text-lg font-semibold text-orange-600 w-24 text-right">
                                    {row.score.toFixed(1)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}