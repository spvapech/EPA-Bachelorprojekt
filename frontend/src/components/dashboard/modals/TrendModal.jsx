import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDown, ArrowUp, Filter, Search, X } from "lucide-react";

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

    const [searchTerm, setSearchTerm] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [signFilter, setSignFilter] = useState("all"); // all | up | down | flat | new
    const [sortKey, setSortKey] = useState("delta"); // title | delta
    const [sortDir, setSortDir] = useState("desc"); // asc | desc

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
                console.log("TrendModal data:", json);
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
                delta: obj?.delta === null || obj?.delta === undefined ? null : Number(obj.delta),
                sign: obj?.sign ?? "flat",
            }))
            .filter((x) => Boolean(x.title));
    }, [data]);

    const filteredAndSortedRows = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        let next = rows;
        if (q) {
            next = next.filter((r) => r.title.toLowerCase().includes(q));
        }
        if (signFilter !== "all") {
            next = next.filter((r) => (r.sign ?? "flat") === signFilter);
        }

        const dir = sortDir === "desc" ? -1 : 1;
        const safeDelta = (r) => {
            if (r.sign === "new") return Number.POSITIVE_INFINITY;
            return r.delta === null || !Number.isFinite(r.delta) ? 0 : r.delta;
        };

        return [...next].sort((a, b) => {
            if (sortKey === "title") {
                return dir * a.title.localeCompare(b.title, "de", { sensitivity: "base" });
            }
            // delta
            return dir * (safeDelta(a) - safeDelta(b));
        });
    }, [rows, searchTerm, signFilter, sortKey, sortDir]);

    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
            return;
        }
        setSortKey(key);
        setSortDir(key === "title" ? "asc" : "desc");
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSignFilter("all");
        setSortKey("delta");
        setSortDir("desc");
    };

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
            <DialogContent className="w-[calc(100vw-2rem)] sm:w-auto sm:min-w-4xl sm:max-w-5xl max-h-[85vh] overflow-y-auto rounded-2xl px-5 py-8">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-3xl font-bold text-slate-800">
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
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        className="pl-9"
                                        placeholder="Suchen (z.B. Kommunikation)"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant={filtersOpen ? "default" : "outline"}
                                        onClick={() => setFiltersOpen((v) => !v)}
                                        className="gap-2"
                                    >
                                        <Filter className="h-4 w-4" />
                                        Filter
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={clearFilters}
                                        className="gap-2"
                                    >
                                        <X className="h-4 w-4" />
                                        Reset
                                    </Button>
                                </div>
                            </div>

                            {filtersOpen && (
                                <div className="rounded-xl border border-slate-200 p-2">
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <div>
                                            <div className="text-[11px] font-semibold text-slate-500 mb-0.5">Trend</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {[
                                                    { k: "all", label: "Alle" },
                                                    { k: "up", label: "Up" },
                                                    { k: "down", label: "Down" },
                                                    { k: "flat", label: "Flat" },
                                                    { k: "new", label: "Neu" },
                                                ].map((opt) => (
                                                    <Button
                                                        key={opt.k}
                                                        type="button"
                                                        size="sm"
                                                        variant={signFilter === opt.k ? "default" : "outline"}
                                                        onClick={() => setSignFilter(opt.k)}
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        {opt.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-semibold text-slate-500 mb-0.5">Sortierung</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={sortKey === "delta" ? "default" : "outline"}
                                                    onClick={() => toggleSort("delta")}
                                                    className="h-7 px-2 text-xs gap-1.5"
                                                >
                                                    Delta
                                                    {sortKey === "delta" ? (sortDir === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />) : null}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={sortKey === "title" ? "default" : "outline"}
                                                    onClick={() => toggleSort("title")}
                                                    className="h-7 px-2 text-xs gap-1.5"
                                                >
                                                    Kategorie
                                                    {sortKey === "title" ? (sortDir === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />) : null}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {filteredAndSortedRows.length === 0 && rows.length === 0 && (
                            <div className="text-center text-gray-500 mt-6">
                                Keine Trend-Daten für diesen Zeitraum vorhanden.
                            </div>
                        )}

                        {filteredAndSortedRows.length === 0 && rows.length > 0 && (
                            <div className="text-center text-gray-500 mt-6">
                                Keine Ergebnisse (Filter anpassen).
                            </div>
                        )}

                        {filteredAndSortedRows.map((row) => (
                            <div key={row.key} className="flex items-center justify-between py-2 border-b border-gray-200">
                                <div className="text-base font-semibold text-black flex-1">
                                    {row.title}:
                                </div>
                                <div className={`flex items-center gap-2 font-bold text-base w-28 justify-end ${trendColor(row.sign)}`}>
                                    <span>{arrow(row.sign)}</span>
                                    <span>
                                        {row.sign === "flat" ? "0" : fmtDelta(row.delta, row.sign)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}