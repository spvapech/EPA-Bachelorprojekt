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

  const toArray = (v) => (Array.isArray(v) ? v : (v ? [v] : []));

  const deriveKritikpunkte = (m) => {
    if (!m) return [];

    const fromKritikpunkte = Array.isArray(m.kritikpunkte) ? m.kritikpunkte : [];
    if (fromKritikpunkte.length) return fromKritikpunkte;

    const fromTypical = Array.isArray(m.typicalStatements) ? m.typicalStatements : [];
    if (fromTypical.length) return fromTypical;

    const fromReviewDetails = Array.isArray(m.reviewDetails)
      ? m.reviewDetails.map((d) => d?.preview).filter(Boolean)
      : [];
    if (fromReviewDetails.length) return fromReviewDetails;

    const fromExample = typeof m.example === "string" && m.example.trim() ? [m.example] : [];
    if (fromExample.length) return fromExample;

    const fromWords = toArray(m.topic_words).length
      ? toArray(m.topic_words)
      : (typeof m.topic_text === "string" ? m.topic_text.split(",").map((x) => x.trim()).filter(Boolean) : []);
    return fromWords;
  };

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
      const pickByImpact = (items, ratingKey, volumeKey) => {
        const pool = Array.isArray(items) ? items : [];
        if (!pool.length) return null;

        const ratingOf = (t) => {
          const r = Number(t?.[ratingKey]);
          return Number.isFinite(r) ? r : NaN;
        };
        const volumeOf = (t) => {
          const v = Number(t?.[volumeKey]);
          return Number.isFinite(v) ? v : 0;
        };
        const impactOf = (t) => {
          const v = Math.max(0, volumeOf(t));
          const r = ratingOf(t);
          if (!Number.isFinite(r)) return 0;
          return v * Math.max(0, 5 - r);
        };

        return pool.reduce((best, cur) => {
          const bi = impactOf(best);
          const ci = impactOf(cur);
          if (ci > bi) return cur;
          if (ci < bi) return best;
          // tie-breaker: lower rating, then higher volume
          const br = ratingOf(best);
          const cr = ratingOf(cur);
          if (Number.isFinite(br) && Number.isFinite(cr)) {
            if (cr < br) return cur;
            if (cr > br) return best;
          }
          return volumeOf(cur) > volumeOf(best) ? cur : best;
        }, pool[0]);
      };

      // Prefer LDA-based negative topics (has negative_share_percent, kritikpunkte, categories)
      fetch(`${API_URL}/topics/company/${companyId}/negative-topics`)
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(async (data) => {
          const list = data?.negative_topics || [];
          if (!Array.isArray(list) || list.length === 0) {
            throw new Error("Keine negativen Topics vorhanden");
          }

          const most = pickByImpact(list, "avg_rating", "mention_count") || list[0];

          // If backend did not provide kritikpunkte, fill from topic-overview as a reliable fallback.
          let kritikpunkte = deriveKritikpunkte(most);
          if (!kritikpunkte.length) {
            try {
              const overviewRes = await fetch(`${API_URL}/analytics/company/${companyId}/topic-overview`);
              if (overviewRes.ok) {
                const overview = await overviewRes.json();
                const topics = Array.isArray(overview?.topics) ? overview.topics : [];
                const keys = [
                  ...(Array.isArray(most?.categories) ? most.categories : []),
                  most?.topic_label,
                  most?.topic,
                ]
                  .filter(Boolean)
                  .map((x) => String(x).toLowerCase());

                const match = topics.find((t) => keys.includes(String(t?.topic || "").toLowerCase()));
                if (match) {
                  kritikpunkte = deriveKritikpunkte(match);
                }
              }
            } catch {
              // ignore and keep empty
            }
          }

          setModal({
            ...most,
            title: "Negative Topic",
            kritikpunkte: kritikpunkte.slice(0, 3),
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

              const normSent = (s) => String(s || "").toLowerCase();
              const isNeg = (t) => normSent(t?.sentiment).includes("neg");
              const isNeu = (t) => normSent(t?.sentiment).includes("neu");
              const isPos = (t) => normSent(t?.sentiment).includes("pos");
              const hasNoSentiment = (t) => !normSent(t?.sentiment);

              const negativeOnly = topics.filter(isNeg);
              const neutralOnly = topics.filter(isNeu);
              const noSentimentOnly = topics.filter(hasNoSentiment);
              const basePool = negativeOnly.length
                ? negativeOnly
                : (neutralOnly.length ? neutralOnly : (noSentimentOnly.length ? noSentimentOnly : topics.filter((t) => !isPos(t))));

              const withRatings = basePool.filter((t) => Number.isFinite(Number(t?.avgRating)));
              const pool = withRatings.length ? withRatings : basePool;
              const most = pickByImpact(pool, "avgRating", "frequency") || pool[0];

              const kritikpunkte = deriveKritikpunkte(most);
              setModal({
                ...most,
                title: "Negative Topic",
                topic_label: most?.topic,
                categories: most?.topic ? [most.topic] : [],
                kritikpunkte: kritikpunkte.slice(0, 3),
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

    // If we have sentiment distribution, compute a real ratio.
    const s = m.sentiments || {};
    const neg = Number(s.negative) || 0;
    const pos = Number(s.positive) || 0;
    const neu = Number(s.neutral) || 0;
    const total = neg + pos + neu;
    if (total > 0) {
      return `${Math.round((neg / total) * 100)} %`;
    }

    // Topic-overview fallback: only provides a single sentiment label.
    // Use a consistent estimate for the UI.
    if (m.sentiment) {
      const label = String(m.sentiment).toLowerCase();
      if (label.includes("neg")) return "70 %";
      if (label.includes("neu")) return "45 %";
      if (label.includes("pos")) return "20 %";
    }

    // Last resort: derive from rating on a 0..5 scale.
    const r = m.avgRating !== undefined && m.avgRating !== null
      ? Number(m.avgRating)
      : (m.avg_rating !== undefined && m.avg_rating !== null ? Number(m.avg_rating) : NaN);
    if (Number.isFinite(r)) {
      const p = Math.max(0, Math.min(100, ((5 - r) / 5) * 100));
      return `${Math.round(p)} %`;
    }

    return "-";
  };

  const getPrimaryMetric = (m) => ({
    label: "Anteil negativer Reviews:",
    value: getNegativeShare(m),
  });

  const getKritikpunkte = (m) => {
    if (!m) return ["Keine Daten"];
    const raw = deriveKritikpunkte(m);

    const points = raw
      .map((k) => summarizeKritikpunkt(k, 45))
      .filter(Boolean)
      .slice(0, 3);

    if (points.length) return points;

    if (m.top_words && m.top_words.length) {
      const words = m.top_words
        .map((w) => summarizeKritikpunkt(w.word, 30))
        .filter(Boolean)
        .slice(0, 3);
      if (words.length) return words;
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
