import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, Search, Star, X } from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";

// Labels für deine Keys (damit es schön aussieht)
const LABELS = {
  avg_arbeitsatmosphaere: "Arbeitsatmosphäre",
  avg_image: "Image",
  avg_work_life_balance: "Work-Life-Balance",
  avg_karriere_weiterbildung: "Karriere/Weiterbildung",
  avg_gehalt_sozialleistungen: "Gehalt/Sozialleistungen",
  avg_kollegenzusammenhalt: "Kollegenzusammenhalt",
  avg_umwelt_sozialbewusstsein: "Umwelt-/Sozialbewusstsein",
  avg_vorgesetztenverhalten: "Vorgesetztenverhalten",
  avg_interessante_aufgaben: "Interessante Aufgaben",
  avg_umgang_aelteren_kollegen: "Umgang mit älteren Kollegen",
  avg_arbeitsbedingungen: "Arbeitsbedingungen",
  avg_gleichberechtigung: "Gleichberechtigung",
  avg_kommunikation:"Kommunikation"
};

export default function SorceModal({ open, onOpenChange, companyId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [sortKey, setSortKey] = useState("score"); // 'score' | 'title'
  const [sortDir, setSortDir] = useState("asc"); // 'asc' | 'desc'

  useEffect(() => {
    if (!open) return; // nur laden wenn Modal offen ist

    setLoading(true);
    setError("");

    fetch(`${API_URL}/companies/${companyId}/ratings/avg`)
      .then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then((json) => setData(json))
      .catch((e) => setError(e.message || "Error"))
      .finally(() => setLoading(false));
  }, [open, companyId]);

  const rows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data)
      .map(([key, value]) => ({
        key,
        title: LABELS[key] ?? key,
        score: Number(value),
      }))
      .filter((x) => Number.isFinite(x.score));
  }, [data]);

  const filteredAndSortedRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const min = minScore === "" ? null : Number(minScore);
    const max = maxScore === "" ? null : Number(maxScore);

    let list = rows;

    if (q) {
      list = list.filter((r) => r.title.toLowerCase().includes(q));
    }

    if (min !== null && Number.isFinite(min)) {
      list = list.filter((r) => r.score >= min);
    }
    if (max !== null && Number.isFinite(max)) {
      list = list.filter((r) => r.score <= max);
    }

    const dir = sortDir === "desc" ? -1 : 1;
    const sorted = [...list].sort((a, b) => {
      if (sortKey === "title") {
        return a.title.localeCompare(b.title) * dir;
      }
      // score
      return (a.score - b.score) * dir;
    });

    return sorted;
  }, [rows, searchTerm, minScore, maxScore, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    // sensible default: score asc (low first), title asc
    setSortDir("asc");
  };

  const resetFilters = () => {
    setSearchTerm("");
    setMinScore("");
    setMaxScore("");
    setSortKey("score");
    setSortDir("asc");
  };

  // Backend liefert Werte ~0..5 -> Sterne direkt 1..5
  function renderStars(score) {
    const filled = Math.max(0, Math.min(5, Math.round(score)));
    const empty = 5 - filled;
    return (
      <div className="flex items-center gap-2">
        <div className="flex">
          {Array.from({ length: filled }, (_, i) => (
            <Star key={`f-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          ))}
          {Array.from({ length: empty }, (_, i) => (
            <Star key={`e-${i}`} className="h-5 w-5 text-gray-300" />
          ))}
        </div>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-700">
          {score.toFixed(1)}
        </span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-4xl">
        <DialogHeader>
          <DialogTitle>Ø Score</DialogTitle>
        </DialogHeader>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {!loading && !error && (
          <>
            {/* Filter + Sort */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Kategorie filtern…"
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFiltersOpen((v) => !v)}
                  title="Filter"
                  className="rounded-full"
                >
                  <Filter className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  title="Sortieren"
                  className="rounded-full"
                >
                  <ArrowUpDown className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {filtersOpen && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="text-xs font-semibold text-slate-600">Min Score</div>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={minScore}
                      onChange={(e) => setMinScore(e.target.value)}
                      className="w-28"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-xs font-semibold text-slate-600">Max Score</div>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={maxScore}
                      onChange={(e) => setMaxScore(e.target.value)}
                      className="w-28"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-xs font-semibold text-slate-600">Sortieren nach</div>
                    <div className="flex gap-2">
                      <Button
                        variant={sortKey === "score" ? "default" : "outline"}
                        onClick={() => toggleSort("score")}
                        className="h-9"
                      >
                        Score
                        {sortKey === "score" ? (
                          sortDir === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                        ) : null}
                      </Button>
                      <Button
                        variant={sortKey === "title" ? "default" : "outline"}
                        onClick={() => toggleSort("title")}
                        className="h-9"
                      >
                        Kategorie
                        {sortKey === "title" ? (
                          sortDir === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                        ) : null}
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1" />
                  <Button variant="outline" onClick={resetFilters} className="h-9">
                    <X className="mr-2 h-4 w-4" />
                    Zurücksetzen
                  </Button>
                </div>
              </div>
            )}

            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("title")}
                  title="Nach Kategorie sortieren"
                >
                  Kategorie
                  {sortKey === "title" ? (
                    sortDir === "asc" ? <ArrowUp className="ml-2 inline h-4 w-4" /> : <ArrowDown className="ml-2 inline h-4 w-4" />
                  ) : null}
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("score")}
                  title="Nach Score sortieren"
                >
                  Score
                  {sortKey === "score" ? (
                    sortDir === "asc" ? <ArrowUp className="ml-2 inline h-4 w-4" /> : <ArrowDown className="ml-2 inline h-4 w-4" />
                  ) : null}
                </TableHead>
                <TableHead>Sterne</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredAndSortedRows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell>{row.score.toFixed(2)}</TableCell>
                  <TableCell className="text-yellow-500">
                    {renderStars(row.score)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </>
        )}


      </DialogContent>
    </Dialog>
  );
}
