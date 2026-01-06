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
const RANGE_TO_DAYS = {
    "1Y": 365,
    "3Y": 365 * 3,
    "All": 365 * 10, // oder z.B. 99999
};

export default function TrendModal({ open, onOpenChange, companyId }) {
    const [range, setRange] = useState("All"); // "1Y" | "3Y" | "All"
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open || !companyId) return;

        const days = RANGE_TO_DAYS[range];

        const controller = new AbortController();
        setLoading(true);
        setError("");

        fetch(`${API_URL}/companies/${companyId}/ratings/trend?days=${days}`, {
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
        const v = Math.round(d * 10) / 10;
        return v > 0 ? `+${v}` : `${v}`;
    };
    const trendColor = (sign) => {
        if (sign === "up") return "text-green-600";
        if (sign === "down") return "text-red-600";
        if (sign === "new") return "text-blue-600";
        return "text-orange-500";
    };

    const arrow = (sign) =>
        sign === "up" ? "↑" : sign === "down" ? "↓" : sign === "new" ;


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-4xl">
                <DialogHeader>
                    <DialogTitle>Trend</DialogTitle>

                    <div className="flex gap-2 text-sm">
                        {["1Y", "3Y", "All"].map((r) => (
                            <button
                                key={r}
                                type="button"
                                className={range === r ? "text-blue-600 font-semibold underline" : "text-muted-foreground"}
                                onClick={() => setRange(r)}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </DialogHeader>

                {loading && <div>Loading...</div>}
                {error && <div className="text-red-600">{error}</div>}
                {!companyId && <div className="text-muted-foreground">Bitte zuerst eine Firma auswählen.</div>}

                {!loading && !error && companyId && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kategorie</TableHead>
                                <TableHead>Trend</TableHead>
                                <TableHead>Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow key={row.key}>
                                    <TableCell className="font-medium">{row.title}</TableCell>
                                    <TableCell>
                                        <div className={`flex items-center gap-2 font-semibold ${trendColor(row.sign)}`}>
                                            <span className="text-lg">{arrow(row.sign)}</span>
                                            <span>{fmtDelta(row.delta)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{row.score.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}