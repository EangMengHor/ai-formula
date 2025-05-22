import { ExternalLink, PenLine, PenTool, Sigma } from "lucide-react";
import { useState } from "react";
import Latex from "react-latex-next";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function LatexParser({ content }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="py-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered ? (
        <div className="flex justify-end items-center w-full">
          <Dialog>
            <DialogTrigger>
              <div className="flex gap-2 w-fit mb-2 bg-gray-900 hover:bg-slate-500 px-3 rounded-md cursor-pointer items-center">
                <ExternalLink className="w-3 h-3" />
                <p>Show Latex Text</p>
              </div>
            </DialogTrigger>
            <DialogContent className="flex justify-center items-center w-fit bg-slate-300 border-0">
              <div>
                <h4 className="font-bold text-lg mb-4">
                  Latex Text Of The formula
                </h4>
                <p className="max-w-5xl text-center font-semibold">{content}</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="flex justify-end mb-2 items-center w-full invisible">
          <div className="flex gap-2 w-fit bg-gray-900 hover:bg-slate-500 px-3 rounded-md cursor-pointer items-center justify-end ">
            <ExternalLink className="w-3 h-3" />
            <p>Show Latex Text</p>
          </div>
        </div>
      )}
      <div className="overflow-auto  relative  px-4 py-4 rounded-md">
        <Latex className="text-white text-left px-3">
          {"$" +
            content
              .replaceAll("$$", "")
              .replace("[ \\", "")
              .replace("\\]", "") +
            "$"}
        </Latex>
      </div>
    </div>
  );
}
