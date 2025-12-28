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
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function TrendModal({ open, onOpenChange }) {

    const trends = [
        {
            title: "Arbeitsatmospehare:",
            sign: "up",
            score: "8.5",

        },
        {
            title: "Image:",
            sign: "up",
            score: "7.0",
        },
        {
            title: "work-life-balance:",
            sign: "up",
            score: "6.5",
        },
        {
            title: "karriere/weiterbildung:",
            sign: "down",
            score: "5.0",
        },
        {
            title: "Gehalt/Sozialleistungen:",
            sign: "",
            score: "7.5",
        },
        {
            title: "kollegezusammenhalt:",
            sign: "up",
            score: "8.0",
        },
        {
            title: "umwelt-/sozialbewusstsein:",
            sign: "down",
            score: "6.0",
        },


    ]
    function renderTrend(sign) {
        if (sign === "up") {
            return <span className="text-green-600 text-lg">▲</span>;
        }

        if (sign === "down") {
            return <span className="text-red-600 text-lg">▼</span>;
        }

        return <span className="text-muted-foreground text-lg">—</span>;
    }




    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-4xl">
                <DialogHeader>
                    <DialogTitle>Trend</DialogTitle>


                </DialogHeader>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kategorie</TableHead>
                            <TableHead>Trend</TableHead>
                            <TableHead>Score</TableHead>

                        </TableRow>
                    </TableHeader>


                    <TableBody>
                        {trends.map((trend) => (


                            <TableRow key={trend.title}>
                                <TableCell className="font-medium">
                                    {trend.title}
                                </TableCell>

                                <TableCell>
                                    {renderTrend(trend.sign)}
                                </TableCell>

                                <TableCell className="text-black-500">
                                    {trend.score}
                                </TableCell>
                            </TableRow>



                        ))}

                    </TableBody>

                </Table>


                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
