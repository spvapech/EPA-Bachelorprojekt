import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API_URL = "http://localhost:8000/api";

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

  // Backend liefert Werte ~0..5 -> Sterne direkt 1..5
  function renderStars(score) {
    const stars = Math.max(0, Math.min(5, Math.round(score)));
    return "⭐".repeat(stars);
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategorie</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Sterne</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((row) => (
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
