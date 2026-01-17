import * as React from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Filter, ChevronDown, Maximize2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useMemo, useState } from "react"
import { API_URL } from "@/config"

const SOURCE_LABEL = {
  employee: "Mitarbeiter",
  candidates: "Bewerber",
}

const GRANULARITY_LABEL = {
  overall: "ges. Zeitraum",
  year: "Jahr",
}

function parseYear(period) {
  if (!period) return null
  const y = Number(String(period).slice(0, 4))
  return Number.isFinite(y) ? y : null
}

function formatMonthLabel(period) {
  if (!period) return ""
  const [y, m] = String(period).split("-").map(Number)
  if (!y || !m) return period
  const date = new Date(Date.UTC(y, m - 1, 1))
  return date.toLocaleDateString("de-DE", { month: "short", year: "numeric" })
}

function prettifyTopicKey(key) {
  if (!key) return ""
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function TopicRatingCard({ companyId }) {
  // Defaults
  const [source, setSource] = useState("employee")
  const [granularity, setGranularity] = useState("overall")

  const [topics, setTopics] = useState([])
  const [rawData, setRawData] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)

  // Jahr-View (Monatsdaten) braucht selectedYear
  const [selectedYear, setSelectedYear] = useState(null)
  // Jahre aus DB (separat laden, nicht aus rawData ableiten!)
  const [years, setYears] = useState([])


  // Topics ein/ausblenden
  const [hiddenTopics, setHiddenTopics] = useState(() => new Set())

  // Farbpalette
  const palette = [
    "#3b82f6",
    "#f97316",
    "#10b981",
    "#a855f7",
    "#ef4444",
    "#14b8a6",
    "#eab308",
    "#6366f1",
    "#f43f5e",
    "#0ea5e9",
    "#84cc16",
    "#d946ef",
  ]
  const topicColor = (idx) => palette[idx % palette.length]

  useEffect(() => {
    if (!companyId) return

    const fetchYears = async () => {
      try {
        // Jahre immer aus der DB über API holen:
        const url =
          `${API_URL}/analytics/company/${companyId}/topic-ratings-timeseries` +
          `?source=${source}&granularity=year`

        const res = await fetch(url)
        if (!res.ok) throw new Error(`API Error (years): ${res.status}`)
        const json = await res.json()

        const ys = (json.data || [])
          .map((d) => parseYear(d.period))
          .filter((y) => y !== null)

        const uniq = Array.from(new Set(ys)).sort((a, b) => a - b)
        setYears(uniq)

        if (granularity === "year") {
          const newest = uniq.length ? uniq[uniq.length - 1] : null
          setSelectedYear((prev) => {
            if (prev == null) return newest
            if (uniq.includes(prev)) return prev
            return newest
          })
        }

      } catch (e) {
        console.error("Error fetching years:", e)
        setYears([])
        // selectedYear nicht hart nullen, nur wenn du willst
      }
    }

    fetchYears()
  }, [companyId, source, granularity])


  // Fetch
  useEffect(() => {
    if (!companyId) return

    const fetchData = async () => {
      const isFirst = rawData.length === 0
      isFirst ? setLoading(true) : setRefreshing(true)

      try {
        setError(null)

        // UI granularity -> API granularity mapping
        const apiGranularity = granularity === "overall" ? "year" : "month"

        let url =
          `${API_URL}/analytics/company/${companyId}/topic-ratings-timeseries` +
          `?source=${source}&granularity=${apiGranularity}`

        // Wenn "Jahr"-Modus: Monate innerhalb selectedYear anzeigen
        if (granularity === "year") {
          if (selectedYear) {
            const start = `${selectedYear}-01-01`
            const end = `${selectedYear}-12-31`
            url += `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
          } else {
            // Falls selectedYear noch nicht da ist: wir warten lieber auf den years-effect
            // und fetchen nicht "alle Monate aller Jahre" (sonst flackert die UI)
            setTopics([])
            setRawData([])
            setLoading(false)
            setRefreshing(false)
            return
          }
        }


        const res = await fetch(url)
        if (!res.ok) throw new Error(`API Error: ${res.status}`)
        const json = await res.json()

        setTopics(json.topics || [])
        setRawData(json.data || [])



        // Reset: standardmäßig nur Top 5 sichtbar
        const allTopics = json.topics || []
        const top5 = [...allTopics]
          .sort((a, b) => {
            const countA = (json.data || []).filter(row => row?.[a] != null).length
            const countB = (json.data || []).filter(row => row?.[b] != null).length
            return countB - countA
          })
          .slice(0, 5)
        const toHide = allTopics.filter(t => !top5.includes(t))
        setHiddenTopics(new Set(toHide))
      } catch (e) {
        console.error("Error fetching topic ratings:", e)
        setError(e.message)
        setTopics([])
        setRawData([])
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, source, granularity, selectedYear])

  // Top-5 Topics nach Häufigkeit (wie oft Werte vorhanden)
  const topicCounts = useMemo(() => {
    const counts = {}
    for (const t of topics || []) counts[t] = 0

    for (const row of rawData || []) {
      for (const t of topics || []) {
        if (row?.[t] !== null && row?.[t] !== undefined) counts[t] += 1
      }
    }
    return counts
  }, [topics, rawData])

  const top5Topics = useMemo(() => {
    return [...(topics || [])]
      .sort((a, b) => (topicCounts[b] || 0) - (topicCounts[a] || 0))
      .slice(0, 5)
  }, [topics, topicCounts])

  // baseTopics ist immer Top 5 für die Standard-Anzeige
  const baseTopics = useMemo(() => {
    return top5Topics
  }, [top5Topics])

  // visibleTopics: alle nicht-hidden Topics (kann mehr als Top 5 sein, wenn User manuell auswählt)
  const visibleTopics = useMemo(() => {
    return (topics || []).filter((t) => !hiddenTopics.has(t))
  }, [topics, hiddenTopics])

  // Chart Daten: nur periodLabel setzen (kein Slider)
  const chartData = useMemo(() => {
    return (rawData || []).map((row) => ({
      ...row,
    periodLabel: granularity === "year" ? formatMonthLabel(row.period) : row.period,
    }))
  }, [rawData, granularity])

  // Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null

    const items = payload
      .filter((p) => p.value !== null && p.value !== undefined)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 max-w-[300px]">
        <p className="font-semibold text-slate-800 mb-2">{label}</p>
        <div className="space-y-1">
          {items.map((p) => (
            <div key={p.dataKey} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: p.stroke }}
                />
                <span className="text-xs text-slate-700 truncate">
                  {prettifyTopicKey(p.dataKey)}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-900">
                {Number(p.value).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Filter UI
  const FilterDropdowns = () => (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      {/* Source Toggle Switch */}
      <button
        onClick={() => setSource(source === "employee" ? "candidates" : "employee")}
        className="relative inline-flex items-center bg-slate-100 rounded-full p-1 h-9 cursor-pointer hover:bg-slate-150 transition-colors border border-slate-200 shadow-sm hover:shadow-md"
      >
        <div className="flex items-center">
          <span
            className={`relative z-10 px-4 py-1 text-sm font-medium transition-colors duration-300 ${
              source === "employee" ? "text-white" : "text-slate-600"
            }`}
          >
            Mitarbeiter
          </span>
          <span
            className={`relative z-10 px-4 py-1 text-sm font-medium transition-colors duration-300 ${
              source === "candidates" ? "text-white" : "text-slate-600"
            }`}
          >
            Bewerber
          </span>
        </div>
        {/* Sliding background */}
        <div
          className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ${
            source === "employee" ? "bg-blue-500" : "bg-green-500"
          }`}
          style={{
            left: source === "employee" ? "4px" : "50%",
            right: source === "employee" ? "50%" : "4px",
          }}
        />
      </button>

      {/* Granularity */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="rounded-full h-9 gap-2">
            <Filter className="h-4 w-4" />
            {GRANULARITY_LABEL[granularity]}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { 
            setGranularity("overall")
            setSelectedYear(null) }}> ges. Zeitraum
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            setGranularity("year")
              // selectedYear wird im years-effect automatisch auf "neuestes" gesetzt, falls null
            }}> Jahr
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Year selector only for month-view */}
      {granularity === "year" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-full h-9 gap-2">
              <Filter className="h-4 w-4" />
              {selectedYear ? `Jahr ${selectedYear}` : "Jahr wählen"}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {years.length === 0 ? (
              <DropdownMenuItem disabled>Keine Jahre</DropdownMenuItem>
            ) : (
              years.map((y) => (
                <DropdownMenuItem key={y} onClick={() => setSelectedYear(y)}>
                  {y}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Topic Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="rounded-full h-9 gap-2">
            <Filter className="h-4 w-4" />
            Topics ({visibleTopics.length}/{(topics || []).length})
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-h-[400px] overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center justify-between mb-2 pb-2 border-b">
              <span className="text-xs font-semibold text-slate-700">Topics auswählen</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (hiddenTopics.size === 0) {
                    setHiddenTopics(new Set(topics || []))
                  } else {
                    setHiddenTopics(new Set())
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {hiddenTopics.size === 0 ? 'Alle abwählen' : 'Alle auswählen'}
              </button>
            </div>
            <div className="space-y-1">
              {(topics || []).map((t, idx) => {
                const hidden = hiddenTopics.has(t)
                return (
                  <button
                    key={t}
                    onClick={(e) => {
                      e.stopPropagation()
                      setHiddenTopics((prev) => {
                        const next = new Set(prev)
                        if (next.has(t)) next.delete(t)
                        else next.add(t)
                        return next
                      })
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 transition"
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        hidden ? 'bg-white border-slate-300' : 'bg-blue-500 border-blue-500'
                      }`}
                    >
                      {!hidden && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: topicColor(idx) }}
                    />
                    <span className="text-xs text-slate-700 text-left flex-1">
                      {prettifyTopicKey(t)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  const TopicChart = ({ height = 280 }) => (
    <ResponsiveContainer width="100%" height={height === "100%" ? "100%" : height}>
      <LineChart data={chartData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="periodLabel"
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 5]}
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => Number(v).toFixed(1)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#64748b" }}
          formatter={(value) => prettifyTopicKey(value)}
        />

        {visibleTopics.map((topic) => {
          const colorIdx = (topics || []).indexOf(topic) // stabiler Index aus "topics"
          return (
            <Line
              key={topic}
              type="monotone"
              dataKey={topic}
              stroke={topicColor(Math.max(colorIdx, 0))}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
              name={prettifyTopicKey(topic)}
            />
          )
        })}

      </LineChart>
    </ResponsiveContainer>
  )



  // Loading State
  if (loading) {
    return (
      <Card className="rounded-3xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Topic Rating</CardTitle>
            <p className="text-sm text-slate-500 mt-1">Bewertungsanalyse nach Themen</p>
          </div>
          <FilterDropdowns />
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              {/* <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div> */}
              {/* <p className="text-slate-500">Inhalt wird geladen...</p> */}
              <p className="text-slate-500">Kein Firma ausgewählt</p>

            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error/empty
  if (error || !chartData.length || !topics.length) {
    return (
      <Card className="rounded-3xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Topic Sternbewertungen</CardTitle>
            <p className="text-sm text-slate-500 mt-1">Durchschnittliche Sternbewertungen nach Themen</p>
          </div>
          <FilterDropdowns />
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-slate-500">{error ? `Fehler: ${error}` : "Keine Daten verfügbar"}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Card */}
      <Card
        className="rounded-3xl shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 group"
        onClick={() => setModalOpen(true)}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Topic Rating
              <Maximize2 className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">Bewertungsanalyse nach Themen</p>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <FilterDropdowns />
          </div>
        </CardHeader>

        <CardContent className="pb-6">
          <div className="relative h-[280px] w-full">
            <TopicChart height={280} />

            {refreshing && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <p className="text-slate-600 text-sm">Daten werden geladen...</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 text-center mt-3">Klicken zum Vergrößern</p>
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="overflow-hidden flex flex-col"
          style={{ width: "90vw", maxWidth: "90vw", height: "85vh", maxHeight: "85vh" }}
        >
          <DialogHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-slate-800">Topic Rating – Detailansicht</DialogTitle>
            <div onClick={(e) => e.stopPropagation()}>
              <FilterDropdowns />
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="relative flex-1 min-h-0">
              <TopicChart height="100%" />

              {refreshing && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500"></div>
                    <p className="text-slate-700 text-sm font-medium">Daten werden geladen...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => {
                  // Setze auf Top 5 zurück: alle außer Top 5 werden hidden
                  const toHide = (topics || []).filter(t => !top5Topics.includes(t))
                  setHiddenTopics(new Set(toHide))
                }}
                className="text-xs text-slate-600 hover:text-slate-900 underline"
              >
                Top 5 anzeigen
              </button>

              <p className="text-xs text-slate-400">
                {SOURCE_LABEL[source]} · {GRANULARITY_LABEL[granularity]}
                {granularity === "year" && selectedYear ? ` · ${selectedYear}` : ""}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
