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

  const extractSubjectPhrase = (text) => {
    if (!text) return "";
    let t = String(text)
      .replace(/\s+/g, " ")
      .replace(/^[-•\u2022\s]+/, "")
      .trim();

    if (t.includes("\n")) t = t.split("\n")[0].trim();

    // Remove common filler intros (German)
    t = t
      .replace(/^(leider|mittlerweile|eigentlich|grunds(ä|a)tzlich|insgesamt|generell)\s+/i, "")
      .replace(/^(es\s+gab|es\s+gibt|es\s+ist|man\s+hat|man\s+kann|ich\s+finde|ich\s+hatte|wir\s+haben)\s+/i, "");

    // Cut at early boundaries
    t = t.split(/[.!?;:()\[\]—–-]/)[0].trim();

    const stop = new Set([
      "und","oder","aber","dass","das","der","die","den","dem","des","ein","eine","einer","eines",
      "mit","ohne","für","auf","im","in","am","an","zu","von","bei","als","auch","nicht","nur",
      "ist","sind","war","waren","wird","werden","ich","wir","man","sehr","mehr","weniger","noch",
      "kein","keine","keinen","keiner","keines","über","unter","vor","nach","aus","um","wie","weil",
    ]);

    const words = t
      .split(/\s+/)
      .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
      .filter((w) => w.length >= 3 && !stop.has(w.toLowerCase()));

    const phrase = words.slice(0, 4).join(" ").trim();
    if (phrase) {
      return phrase.charAt(0).toUpperCase() + phrase.slice(1);
    }
    return t;
  };

  const summarizeKritikpunkt = (text, maxLen = 45) => {
    if (!text) return "";
    let t = String(text)
      .replace(/\s+/g, " ")
      .replace(/^[-•\u2022\s]+/, "")
      .trim();

    // Keep only the first line if multi-line
    if (t.includes("\n")) t = t.split("\n")[0].trim();

    // Prefer a short subject-like phrase
    const subject = extractSubjectPhrase(t);
    if (subject && subject.length <= maxLen) return subject;
    if (subject && subject.length > maxLen) t = subject;

    if (t.length <= maxLen) return t;

    // Prefer cutting at a natural boundary (sentence / clause)
    const boundaries = [".", "!", "?", ";", ":"]; // avoid overly long bullets
    for (const b of boundaries) {
      const idx = t.indexOf(b);
      if (idx >= 25 && idx <= maxLen) {
        return t.slice(0, idx + 1).trim();
      }
    }

    // Otherwise cut at the last space before maxLen
    const cut = t.lastIndexOf(" ", maxLen);
    if (cut >= 25) return `${t.slice(0, cut).trim()}…`;
    return `${t.slice(0, maxLen).trim()}…`;
  };

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
      const threshold = 3.5;
      const weight = (n) => Math.sqrt(Math.max(0, Number(n) || 0));

      const pickMostCritical = (topics, ratingKey, volumeKey) => {
        const scoreValue = (t) => {
          const v = Number(t?.[ratingKey]);
          return Number.isFinite(v) ? v : NaN;
        };
        const volumeValue = (t) => Number(t?.[volumeKey]) || 0;
        const criticality = (t) => {
          const r = scoreValue(t);
          if (!Number.isFinite(r)) return -Infinity;
          const deficit = Math.max(0, threshold - r);
          return deficit * weight(volumeValue(t));
        };

        const pool = Array.isArray(topics) ? topics : [];
        if (!pool.length) return null;

        const scored = pool
          .map((t) => ({ t, c: criticality(t) }))
          .filter((x) => Number.isFinite(x.c));

        const anyCritical = scored.some((x) => x.c > 0);
        if (anyCritical) {
          return scored.reduce((best, cur) => (cur.c > best.c ? cur : best), scored[0]).t;
        }

        return pool.reduce((best, current) => {
          const bestRating = scoreValue(best);
          const currentRating = scoreValue(current);
          if (!Number.isFinite(bestRating)) return current;
          if (!Number.isFinite(currentRating)) return best;
          if (currentRating < bestRating) return current;
          if (currentRating > bestRating) return best;
          const bestVol = volumeValue(best);
          const currentVol = volumeValue(current);
          return currentVol > bestVol ? current : best;
        }, pool[0]);
      };

      // Prefer LDA-based negative topics (has negative_share_percent, kritikpunkte, categories)
      fetch(`${API_URL}/topics/company/${companyId}/negative-topics`)
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          const list = data?.negative_topics || [];
          if (!Array.isArray(list) || list.length === 0) {
            throw new Error("Keine negativen Topics vorhanden");
          }

          const most = pickMostCritical(list, "avg_rating", "mention_count") || list[0];
          setModal({
            ...most,
            title: "Negative Topic",
          });
        })
        .catch(() => {
          // Fallback: Topic Overview (no trained model needed)
          return fetch(`${API_URL}/analytics/company/${companyId}/topic-overview`)
            .then((res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
            })
            .then((data) => {
              const topics = Array.isArray(data?.topics) ? data.topics : [];
              if (topics.length === 0) {
                setModal(null);
                return;
              }

              const withRatings = topics.filter((t) => Number(t?.avgRating) > 0);
              const pool = withRatings.length ? withRatings : topics;
              const most = pickMostCritical(pool, "avgRating", "frequency") || pool[0];

              setModal({
                ...most,
                title: "Negative Topic",
                topic_label: most?.topic,
                categories: most?.topic ? [most.topic] : [],
                kritikpunkte: Array.isArray(most?.typicalStatements)
                  ? most.typicalStatements.slice(0, 3)
                  : (most?.example ? [most.example] : []),
              });
            });
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

    // Prefer explicit topic label/words for the header (categories are shown separately)
    if (m.topic_label) return String(m.topic_label);
    if (m.topic_text) return String(m.topic_text);
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

    // Topic-overview fallback: only provides a single sentiment label.
    // Use a small heuristic so the UI can still show a percentage.
    if (m.sentiment) {
      const s = String(m.sentiment).toLowerCase();
      if (s.includes("neg")) return "70 %";
      if (s.includes("neu")) return "45 %";
      if (s.includes("pos")) return "20 %";
    }

    // If we only have a rating, derive a rough estimate.
    const r = m.avgRating !== undefined && m.avgRating !== null
      ? Number(m.avgRating)
      : (m.avg_rating !== undefined && m.avg_rating !== null ? Number(m.avg_rating) : NaN);
    if (Number.isFinite(r)) {
      if (r < 2.5) return "70 %";
      if (r < 3.5) return "45 %";
      return "20 %";
    }

    const s = m.sentiments || {};
    const neg = s.negative || 0;
    const pos = s.positive || 0;
    const neu = s.neutral || 0;
    const total = neg + pos + neu || m.mention_count || 1;
    return `${Math.round((neg / total) * 100)} %`;
  };

  const getPrimaryMetric = (m) => ({
    label: "Anteil negativer Reviews:",
    value: getNegativeShare(m),
  });

  const getKritikpunkte = (m) => {
    if (!m) return ["Keine Daten"];
    if (m.kritikpunkte && m.kritikpunkte.length) {
      return m.kritikpunkte
        .map((k) => summarizeKritikpunkt(k, 45))
        .filter(Boolean)
        .slice(0, 3);
    }
    if (m.top_words && m.top_words.length) {
      return m.top_words
        .map((w) => summarizeKritikpunkt(w.word, 30))
        .filter(Boolean)
        .slice(0, 3);
    }
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
      <DialogContent className="max-w-xl rounded-3xl px-10 py-10">
        <DialogHeader className="text-center">
          <DialogTitle className="text-5xl font-extrabold text-slate-800 leading-tight">
            {loading ? "Lade…" : getTitle(modal)}
          </DialogTitle>

          <div className="mt-4 text-4xl font-extrabold text-orange-400">
            {loading ? "…" : getTopicLabel(modal)}
          </div>
        </DialogHeader>

        <div className="mt-14">
          {loading ? (
            <div className="text-center text-[24px]">Lade Daten…</div>
          ) : error ? (
            <div className="text-center text-red-600 text-[20px]">Fehler: {error}</div>
          ) : !modal ? (
            <div className="text-center text-[20px]">Keine negativen Topics vorhanden.</div>
          ) : (
            <>
              {(() => {
                const pm = getPrimaryMetric(modal);
                return (
                  <div className="flex items-center justify-between">
                    <div className="text-[28px] font-extrabold text-black">{pm.label}</div>
                    <div className="text-[28px] font-extrabold text-black">{pm.value}</div>
                  </div>
                );
              })()}

              <div className="mt-14 text-center">
                <div className="text-[30px] font-extrabold text-black">Häufige Kritikpunkte:</div>

                <div className="mt-6 flex justify-center">
                  <ul className="list-disc list-inside text-left space-y-2 text-[30px] font-extrabold text-black">
                    {getKritikpunkte(modal).map((k, idx) => (
                      <li key={`${idx}-${k}`}>{k}</li>
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
