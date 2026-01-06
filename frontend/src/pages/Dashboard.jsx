import * as React from "react"
import {
    Plus,
    ArrowDown,
    Search,
    Home,
    SquarePlus,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TimelineCard } from "@/components/dashboard/TimelineCard"
import { CategoryRatingCard } from "@/components/dashboard/CategoryRatingCard"
import { DominantTopicsCard } from "@/components/dashboard/DominantTopicsCard"
import { IndividualReviewsCard } from "@/components/dashboard/IndividualReviewsCard"
import { TopicOverviewCard } from "@/components/dashboard/TopicOverviewCard"
import { useState, useEffect } from "react"
import SorceModal from "../components/dashboard/modals/SorceModal"
import TrendModal from "../components/dashboard/modals/TrendModal"
import NegativTopicModal from "../components/dashboard/modals/NegativTopicModal"
import MostCriticalModal from "../components/dashboard/modals/MostCriticalModal"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { API_URL } from "../config"






export default function Dashboard() {
    const [open, setOpen] = useState(false)
    const [openTrend, setOpenTrend] = useState(false)
    const [openNegative, setOpenNegative] = useState(false);
    const [openMostCritical, setOpenMostCritical] = useState(false);
    const [openCompany, setOpenCompany] = React.useState(false)
    const [selectedCompany, setSelectedCompany] = React.useState("")
    const [data, setData] = useState()
    const [trendData, setTrendData] = useState(null)
    const [companies, setCompanies] = useState([])
    async function getCompanies() {


        try {
            const res = await fetch(`${API_URL}/companies/`)
            if (!res.ok) return
            const data = await res.json()
            setCompanies(Array.isArray(data) ? data : [])
        } catch {
            // optional: ignorieren


        }


    }
    useEffect(() => {
        getCompanies()


    }, [])

    function getCompanyData(id) {
        console.log(id);

    }

    useEffect(() => {
        getAvg()
        getTrend()

    }, [selectedCompany])
    async function getAvg() {
        try {
            const res = await fetch(`${API_URL}/companies/${selectedCompany}/ratings`)
            if (!res.ok) return
            setData(await res.json())

        } catch {
            // optional: ignorieren


        }

    }

    async function getTrend() {
        if (!selectedCompany) {
            setTrendData(null);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/companies/${selectedCompany}/ratings/trend?days=30`);
            if (!res.ok) return;

            const json = await res.json();
            console.log('Trend response:', json);
            const avgDelta = json.overall?.avgDelta?.toString() ?? "0.0";

            setTrendData({ avgDelta });
        } catch {
            // optional ignorieren
        }
    }


    return (
        <div className="min-h-screen bg-slate-50">
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-[92px] shrink-0 bg-gradient-to-b from-slate-900 to-slate-800 text-white relative">
                    <div className="h-16 flex items-center justify-center">
                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <Plus className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                            <Home className="h-7 w-7" />
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                            <SquarePlus className="h-7 w-7" />
                        </div>
                    </div>
                </aside>

                {/* Main */}
                <main className="flex-1 px-8 py-6">
                    {/* Top header */}
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                                {companies.find((company) => company.id === selectedCompany)?.name}
                            </h1>
                        </div>

                        <div className="w-[300px] max-w-full">
                            <div className="relative">
                                <Popover open={openCompany} onOpenChange={setOpenCompany}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className="w-[300px] justify-between"
                                        >
                                            {selectedCompany
                                                ? companies.find((company) => company.id === selectedCompany)?.name
                                                : "Search company"}
                                            <ChevronsUpDown className="opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search company..." className="h-9 w-[300px]" />
                                            <CommandList>
                                                <CommandEmpty>No company found.</CommandEmpty>
                                                <CommandGroup>
                                                    {companies.map((company) => (
                                                        <CommandItem
                                                            key={company.id}
                                                            value={company.name}
                                                            onSelect={(currentValue) => {
                                                                const company = companies.find(c => c.name === currentValue);
                                                                const id = company ? company.id : "";
                                                                setSelectedCompany(id === selectedCompany ? "" : id)
                                                                getCompanyData(id)
                                                                setOpenCompany(false)

                                                            }}
                                                        >
                                                            {company.name}
                                                            <Check
                                                                className={cn(
                                                                    "ml-auto",
                                                                    selectedCompany == company.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>

                    {/* KPI cards */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="rounded-3xl shadow-sm" onClick={() => setOpen(true)}>

                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl font-bold text-slate-800">
                                    Ø Score
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="text-3xl font-extrabold text-center">
                                    {data && <span className={data.avg_overall > 3 ? 'text-green-500' : data.avg_overall >= 2 ? 'text-slate-800' : 'text-red-500'}>{data.avg_overall}</span>}
                                </div>
                            </CardContent>

                        </Card>
                        <SorceModal
                            open={open}
                            onOpenChange={setOpen}
                            title="Ø Score"
                            description="Average company score"
                            companyId={selectedCompany}

                        >
                            <div className="text-3xl font-bold">3.1</div>
                        </SorceModal>

                        <Card className="rounded-3xl shadow-sm" onClick={() => setOpenTrend(true)}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl font-bold text-slate-800">
                                    Trend
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 flex flex-col items-center gap-2">

                                <div className="text-xl font-bold">
                                    {trendData?.avgDelta && <span className={parseFloat(trendData.avgDelta) > 0 ? 'text-green-500' : parseFloat(trendData.avgDelta) < 0 ? 'text-red-500' : 'text-orange-500'}>{parseFloat(trendData.avgDelta) > 0 ? '+' : ''}{trendData.avgDelta}</span>}
                                </div>
                            </CardContent>
                        </Card>
                        <TrendModal
                            open={openTrend}
                            onOpenChange={setOpenTrend}
                            title="Trend"
                            description="Company trend"
                            companyId={selectedCompany}
                        >
                            <div className="text-3xl font-bold">-0.3</div>
                        </TrendModal>

                        <Card className="rounded-3xl shadow-sm" onClick={() => setOpenMostCritical(true)}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl font-bold text-slate-800">
                                    Most Critical
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="text-2xl font-extrabold text-red-700">

                                </div>
                                <div className="text-lg font-bold text-red-700"></div>
                            </CardContent>
                        </Card>
                        <MostCriticalModal
                            open={openMostCritical}
                            onOpenChange={setOpenMostCritical}
                        />

                        <Card className="rounded-3xl shadow-smon" onClick={() => setOpenNegative(true)}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl font-bold text-slate-800">
                                    Negative Topic
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="text-2xl font-extrabold text-orange-400">

                                </div>
                            </CardContent>
                        </Card>
                        <NegativTopicModal
                            open={openNegative}
                            onOpenChange={setOpenNegative}
                        />



                    </div>

                    {/* Charts row */}
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* <TimelineCard /> */}
                        {/* <CategoryRatingCard /> */}
                    </div>

                    {/* Topic Overview */}
                    <div className="mt-6">
                        <TopicOverviewCard companyId={selectedCompany || 1} />
                    </div>

                    {/* Tables row */}
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* <DominantTopicsCard /> */}
                        {/* <IndividualReviewsCard /> */}
                    </div>
                </main>
            </div>
        </div>
    )
}
