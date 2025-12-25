import * as React from "react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import { Plus, Filter, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const categoryData = [
    { name: "Leadership", value: 1.9 },
    { name: "Communication", value: 2.4 },
    { name: "Appreciation", value: 2.9 },
    { name: "Timeliness", value: 2.3 },
    { name: "Professionalism", value: 3.6 },
]

export function CategoryRatingCard() {
    return (
        <Card className="rounded-3xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-800">
                    Average Rating by Category
                </CardTitle>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-full h-9 gap-2">
                        <Plus className="h-4 w-4" />
                        Add
                        <ChevronDown className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" className="rounded-full h-9 gap-2">
                        <Filter className="h-4 w-4" />
                        Year
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pb-6">
                <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={categoryData}
                            layout="vertical"
                            margin={{ left: 90, right: 20, top: 10, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 4]} />
                            <YAxis type="category" dataKey="name" />
                            <Tooltip />
                            <Bar dataKey="value" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-600">
                    <span className="h-3 w-3 rounded bg-slate-500" />
                    2025
                </div>
            </CardContent>
        </Card>
    )
}
