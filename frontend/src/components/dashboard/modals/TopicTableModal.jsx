import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState } from "react"

export default function TopicTableModal({ open, onOpenChange, topics, onTopicSelect }) {
    const [searchTerm, setSearchTerm] = useState("")

    const getSentimentBadgeVariant = (sentiment) => {
        switch (sentiment) {
            case "Positiv":
                return "success"
            case "Neutral":
                return "warning"
            case "Negativ":
                return "destructive"
            default:
                return "outline"
        }
    }

    // Filter topics basierend auf Suchbegriff
    const filteredTopics = topics.filter(topic =>
        topic.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.example.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[92vw] !w-[92vw] !h-[85vh] !max-h-[85vh] flex flex-col p-8 !translate-x-[-50%] !translate-y-[-50%] !top-[50%] !left-[50%] rounded-2xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-bold">
                        Alle Topics
                    </DialogTitle>
                </DialogHeader>

                {/* Suchleiste */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Topic suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Tabelle */}
                <div className="flex-1 overflow-auto rounded-lg border min-h-0">
                    <Table>
                        <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                            <TableRow>
                                <TableHead className="font-semibold text-base">Topic</TableHead>
                                <TableHead className="font-semibold text-base text-center">Frequency</TableHead>
                                <TableHead className="font-semibold text-base text-center">Ø Rating</TableHead>
                                <TableHead className="font-semibold text-base text-center">Sentiment</TableHead>
                                <TableHead className="font-semibold text-base">Example</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTopics.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-500 text-lg">
                                        Keine Topics gefunden
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTopics.map((topic) => (
                                    <TableRow
                                        key={topic.id}
                                        className="cursor-pointer hover:bg-slate-50 transition-colors h-16"
                                        onClick={() => onTopicSelect(topic)}
                                    >
                                        <TableCell className="font-medium text-base">{topic.topic}</TableCell>
                                        <TableCell className="text-center text-base">{topic.frequency}</TableCell>
                                        <TableCell className="text-center font-semibold text-base">
                                            {topic.avgRating.toFixed(1)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={getSentimentBadgeVariant(topic.sentiment)} className="text-sm px-3 py-1">
                                                {topic.sentiment}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-base text-slate-600">
                                            <div className="line-clamp-2">
                                                {topic.example}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer Info */}
                <div className="text-sm text-slate-500 text-center pt-2 border-t">
                    {filteredTopics.length} von {topics.length} Topics angezeigt • 
                    Klicken Sie auf eine Zeile für Details
                </div>
            </DialogContent>
        </Dialog>
    )
}
