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


export default function NegativTopicModal({ open, onOpenChange, topic: propTopic = null, companyId = null }) {
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If a topic is passed in via props, use it. Otherwise try to fetch negative topics for the company and pick the first one.
    if (!open) return;

    if (propTopic) {
      setModal(propTopic);
      setError(null);
      setLoading(false);
      return;
    }

    if (companyId) {
      setLoading(true);
      setError(null);
      fetch(`${API_URL}/topics/company/${companyId}/negative-topics`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          const list = data?.negative_topics || [];
          if (list.length === 0) {
            setModal(null);
          } else {
            // pick first negative topic by default
            setModal(list[0]);
          }
        })
        .catch((err) => {
          setError(err.message || "Fehler beim Laden");
          setModal(null);
        })
        .finally(() => setLoading(false));
    } else {
      // no data available
      setModal(null);
      setLoading(false);
      setError(null);
    }

  }, [open, propTopic, companyId]);

  // Helper mapping
  const getTitle = (m) => m?.title || "Negative Topic";
  const getTopicLabel = (m) => {
    if (!m) return "-";

    // Prefer affected categories (what is impacted) over topic words
    if (Array.isArray(m.categories) && m.categories.length) {
      const c = String(m.categories[0] ?? "").trim();
      return c || "-";
    }
    if (Array.isArray(m.affected_categories) && m.affected_categories.length) {
      const c = String(m.affected_categories[0] ?? "").trim();
      return c || "-";
    }

    // Fallbacks
    if (m.topic_label) return String(m.topic_label);
    if (m.topic) return String(m.topic);
    if (m.top_words && Array.isArray(m.top_words) && m.top_words.length) return m.top_words.map((w) => w.word).slice(0, 1).join(", ");
    return "-";
  };

  const getNegativeShare = (m) => {
    if (!m) return "-";
    if (m.negative_share_percent !== undefined && m.negative_share_percent !== null) {
      const p = Number(m.negative_share_percent);
      return Number.isFinite(p) ? `${Math.round(p)} %` : "-";
    }
    const s = m.sentiments || {};
    const neg = s.negative || 0;
    const pos = s.positive || 0;
    const neu = s.neutral || 0;
    const total = neg + pos + neu || m.mention_count || 1;
    return `${Math.round((neg / total) * 100)} %`;
  };

  const getKritikpunkte = (m) => {
    if (!m) return ["Keine Daten"];
    if (m.kritikpunkte && m.kritikpunkte.length) return m.kritikpunkte;
    if (m.top_words && m.top_words.length) return m.top_words.map((w) => w.word).slice(0, 5);
    return ["Keine Kritikpunkte gefunden"];
  };

  const getCategories = (m) => {
    if (!m) return ["-"];
    if (m.categories && m.categories.length) return m.categories;
    // Attempt to derive categories from rating-related stats if available
    if (m.affected_categories && m.affected_categories.length) return m.affected_categories;
    return ["Allgemein"];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-3xl px-10 py-8">
        <DialogHeader className="text-center">
          <DialogTitle className="text-3xl font-extrabold text-slate-800 leading-tight">
            {loading ? "Lade…" : getTitle(modal)}
          </DialogTitle>

          <div className="mt-2 text-2xl font-extrabold text-orange-400">
            {loading ? "…" : getTopicLabel(modal)}
          </div>
        </DialogHeader>

        <div className="mt-12">
          {loading ? (
            <div className="text-center text-[24px]">Lade Daten…</div>
          ) : error ? (
            <div className="text-center text-red-600 text-[20px]">Fehler: {error}</div>
          ) : !modal ? (
            <div className="text-center text-[20px]">Keine negativen Topics vorhanden.</div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="text-[28px] font-extrabold text-black">Anteil negativer Reviews:</div>
                <div className="text-[28px] font-extrabold text-black">{getNegativeShare(modal)}</div>
              </div>

              <div className="mt-14 text-center">
                <div className="text-[30px] font-extrabold text-black">Häufige Kritikpunkte:</div>

                <div className="mt-6 flex justify-center">
                  <ul className="list-disc list-inside text-left space-y-2 text-[30px] font-extrabold text-black">
                    {getKritikpunkte(modal).map((k) => (
                      <li key={k}>{k}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-14 text-center">
                <div className="text-[30px] font-extrabold text-black">Betroffene Kategorien:</div>

                <div className="mt-6 space-y-4">
                  {getCategories(modal).map((c) => (
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
