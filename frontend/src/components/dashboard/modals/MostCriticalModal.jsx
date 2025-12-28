import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
export default function NegativTopicModal({ open, onOpenChange }) {
    const modal = {
        title: "",
        topic: "",
        negativeShare: "",
        kritikpunkte: [
            "",
            "",
            "",
        ],
        categories: ["", ""],
    };
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>

            <DialogContent className="min-w-4xl">


                <DialogHeader className="text-center">
                    <DialogTitle className="text-[52px] font-extrabold text-slate-800 leading-tight">
                        {modal.title}
                    </DialogTitle>

                    <div className="mt-2 text-[34px] font-extrabold text-orange-400">
                        {modal.topic}
                    </div>
                </DialogHeader>

                {/* Body */}
                <div className="mt-12">

                    <div className="flex items-center justify-between">
                        <div className="text-[28px] font-extrabold text-black">
                            Anteil negativer Reviews:

                        </div>
                        <div className="text-[28px] font-extrabold text-black">
                            {modal.negativeShare}
                        </div>
                    </div>


                    <div className="flex items-center justify-between">
                        <div className="text-[28px] font-extrabold text-black">
                            Impact-Indikator

                        </div>
                        <div className="text-[28px] font-extrabold text-black">
                            {modal.negativeShare}
                        </div>
                    </div>

                        
                    </div>


                    <div className="mt-14 text-center">
                        <div className="text-[30px] font-extrabold text-black">
                            Betroffene Kategorien:

                        </div>

                        <div className="mt-6 space-y-4">
                            {modal.categories.map((c) => (
                                <div
                                    key={c}
                                    className="text-[34px] font-extrabold text-black leading-tight"
                                >
                                    {c}
                                </div>
                            ))}
                        </div>
                    </div>
                



                <DialogFooter className="mt-10">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}