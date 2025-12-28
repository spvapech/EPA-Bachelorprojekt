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

export default function SorceModal({ open, onOpenChange }) {

  const feedbacks = [
    {
      title: "Arbeitsatmospehare:",
      score: "8.5",

    },
    {
      title: "Image:",
      score: "7.0",
    },
    {
      title: "work-life-balance:",
      score: "6.5",
    },
    {
      title: "karriere/weiterbildung:",
      score: "5.0",
    },
    {
      title: "Gehalt/Sozialleistungen:",
      score: "7.5",
    },
    {
      title: "kollegezusammenhalt:",
      score: "8.0",
    },
    {
      title: "umwelt-/sozialbewusstsein:",
      score: "6.0",
    },


  ]
  function renderStars(score) {
    const stars = Math.round(Number(score) / 2);
    return "⭐".repeat(stars);
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-4xl">
        <DialogHeader>
          <DialogTitle>Ø Score</DialogTitle>


        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategorie</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Sterne</TableHead>
            </TableRow>
          </TableHeader>


          <TableBody>
            {feedbacks.map((feedback) => (
              
                
                <TableRow key={feedback.title}>
                  <TableCell className="font-medium">
                    {feedback.title}
                  </TableCell>

                  <TableCell>
                    {feedback.score}
                  </TableCell>

                  <TableCell className="text-yellow-500">
                    {renderStars(feedback.score)}
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
