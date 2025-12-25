import * as React from "react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import { Filter, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const timelineData = [
    { year: "2012", history: 3, forecast: 3 },
    { year: "2013", history: 4, forecast: 3 },
    { year: "2014", history: 5, forecast: 4 },
    { year: "2015", history: 11, forecast: 7 },
    { year: "2016", history: 12, forecast: 9 },
    { year: "2017", history: 12, forecast: 10 },
    { year: "2018", history: 15, forecast: 11 },
    { year: "2019", history: 17, forecast: 11 },
    { year: "2020", history: 18, forecast: 12 },
    { year: "2021", history: 20, forecast: 16 },
]

export function TimelineCard() {
    return (
        <Card className="rounded-3xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-800">
                    Timeline
                </CardTitle>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="rounded-full h-9 gap-2"
                            >
                                <Filter className="h-4 w-4" />
                                Ø Score
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ø Score</DropdownMenuItem>
                            <DropdownMenuItem>Rating</DropdownMenuItem>
                            <DropdownMenuItem>Count</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="rounded-full h-9 gap-2"
                            >
                                <Filter className="h-4 w-4" />
                                All
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>All</DropdownMenuItem>
                            <DropdownMenuItem>Positive</DropdownMenuItem>
                            <DropdownMenuItem>Negative</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="pb-6">
                <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timelineData} margin={{ left: 10, right: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="history" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="forecast" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-2 flex items-center justify-center gap-6 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-slate-400" />
                        History
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-slate-700" />
                        Forecast
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
