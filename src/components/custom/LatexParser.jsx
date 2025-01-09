import { ExternalLink, PenLine, PenTool, Sigma } from "lucide-react";
import { useState } from "react";
import Latex from "react-latex-next";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LatexParser({ content }) {
    return (
        <div className="px-2 py-3 border-y-2 my-4">
            <div className="flex justify-end items-center w-full">
                <p className="mx-2">Shift + Scroll Or Drag To Scroll Formula</p>
                <Dialog>
                    <DialogTrigger>
                        <div className="flex gap-2 w-fit bg-gray-500 hover:bg-slate-500 px-2 py-1 rounded-md cursor-pointer items-center">
                            <ExternalLink className="w-5 h-5" />
                            <p>Open Latex Text</p>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="flex justify-center items-center  w-fit bg-slate-300 border-0 ">
                        <div>
                            <h4 className="font-bold text-lg mb-4">Latex Text Of The formula</h4>
                            <p className="max-w-5xl text-center font-semibold ">{content}</p>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="overflow-auto max-h-96 relative">
                <Latex className="text-white text-left border-2 border-slate-500">
                    {content}
                </Latex>
            </div>
        </div>
    )
}