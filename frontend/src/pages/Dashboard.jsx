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
import { useState } from "react"
import SorceModal from "../components/dashboard/modals/SorceModal"
import TrendModal from "../components/dashboard/modals/TrendModal"
import NegativTopicModal from "../components/dashboard/modals/NegativTopicModal"
import MostCriticalModal from "../components/dashboard/modals/MostCriticalModal"


export default function Dashboard() {
    const [open, setOpen] = useState(false)
    const [openTrend, setOpenTrend] = useState(false)
    const [openNegative, setOpenNegative] = useState(false);
    const [openMostCritical, setOpenMostCritical] = useState(false);

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
                                Company Name
                            </h1>
                        </div>

                        <div className="w-[520px] max-w-full">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    className="h-12 rounded-full pl-12 shadow-sm bg-white"
                                    placeholder="Search company"
                                />
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
                                <div className="text-5xl font-extrabold text-orange-400"></div>
                            </CardContent>

                        </Card>
                        <SorceModal
                            open={open}
                            onOpenChange={setOpen}
                            title="Ø Score"
                            description="Average company score"
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
                                
                                <div className="text-xl font-bold text-red-700"></div>
                            </CardContent>
                        </Card>
                        <TrendModal
                            open={openTrend}
                            onOpenChange={setOpenTrend}
                            title="Trend"
                            description="Company trend"
                        >
                            <div className="text-3xl font-bold">-0.3</div>
                        </TrendModal>

                        <Card className="rounded-3xl shadow-sm"onClick={() => setOpenMostCritical(true)}>
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
