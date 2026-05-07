import React from "react"

/* ── WorkPulse Icon ──────────────────────────────────────────────────────
   Sprechblase mit Puls-Linie.
   Props:
     size   – Pixel-Breite des Icons (Höhe wird proportional: w×0.73)
   ──────────────────────────────────────────────────────────────────────── */
export function WorkPulseIcon({ size = 32 }) {
  const h = Math.round(size * 0.73)
  return (
    <svg
      width={size}
      height={h + Math.round(size * 0.27)}
      viewBox="0 0 44 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Bubble body */}
      <rect x="0" y="0" width="44" height="32" rx="8" fill="#085041" className="wp-bubble-bg" />
      <rect x="0" y="0" width="44" height="32" rx="8" fill="none" stroke="#5DCAA5" strokeWidth="2.5" />
      {/* Tail */}
      <path d="M10 30 L5 43 L17 30 Z" fill="#085041" className="wp-bubble-bg" />
      <path d="M10 30 L5 43 L17 30" fill="none" stroke="#5DCAA5" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Pulse line */}
      <polyline
        points="5,16 11,16 15,7 19,24 23,12 27,16 39,16"
        fill="none"
        stroke="#5DCAA5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle cx="39" cy="16" r="2.5" fill="#5DCAA5" />
    </svg>
  )
}

/* ── WorkPulse Full Logo (Icon + Name) ───────────────────────────────────
   Variants:
     "badge"    – Icon in einer brand-farbigen Badge-Box + Name (Sidebar)
     "sidebar"  – kompaktes Layout ohne Box (Icon 28px, Name 13px)
     "welcome"  – großes zentriertes Layout für die Startseite
     "topbar"   – horizontales Layout für Topbar-Elemente
   ──────────────────────────────────────────────────────────────────────── */
export function WorkPulseLogo({ variant = "sidebar" }) {
  if (variant === "badge") {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
        <WorkPulseIcon size={28} />
        <span style={{
          font: "600 13px/1 var(--font-sans)",
          letterSpacing: "-0.01em",
          color: "var(--color-fg)",
          paddingTop: 3,
        }}>
          WorkPulse
        </span>
      </div>
    )
  }

  if (variant === "sidebar") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <WorkPulseIcon size={28} />
        <span style={{
          font: "600 13px/1 var(--font-sans)",
          letterSpacing: "-0.01em",
          color: "var(--color-fg)",
        }}>
          WorkPulse
        </span>
      </div>
    )
  }

  if (variant === "welcome") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <WorkPulseIcon size={56} />
        <div style={{ textAlign: "center" }}>
          <div style={{
            font: "700 40px/1.1 var(--font-sans)",
            letterSpacing: "-0.025em",
            color: "#fff",
            margin: "0 0 6px",
          }}>
            WorkPulse
          </div>
          <div style={{
            font: "500 11px/1 var(--font-mono)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#5DCAA5",
          }}>
            Employer Review Intelligence
          </div>
        </div>
      </div>
    )
  }

  if (variant === "topbar") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <WorkPulseIcon size={24} />
        <span style={{
          font: "600 14px/1 var(--font-sans)",
          letterSpacing: "-0.01em",
          color: "var(--color-fg)",
        }}>
          WorkPulse
        </span>
      </div>
    )
  }

  return null
}
