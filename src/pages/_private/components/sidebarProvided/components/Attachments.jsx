import { FileInput, Grid3x3, Orbit, WorkflowIcon, Play } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { promptTemplate } from "@/lib/config";
import { useUser } from "@/context/UserContext";
import PromptTemplateDialog from "./PromptTemplateDialog";
const iconsStyle = "w-4 h-4 text-white";

const buttonGroups = [
  {
    id: 1,
    title: "Attach Prompt Template",
    icon: <FileInput className={iconsStyle} />,
  },
  {
    id: 2,
    title: "Attach Knowledge Block",
    icon: <Orbit className={iconsStyle} />,
  },
  {
    id: 3,
    title: "Attach Workflow",
    icon: <WorkflowIcon className={iconsStyle} />,
  },
];
const contentVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  }),
};

export default function Attachments({ onSubmit }) {
  const [selectedButton, setSelectedButton] = useState(1);
  const [direction, setDirection] = useState(0);
  const { setPromptTemplatePrompt } = useUser();

  const handleTabChange = (newIndex) => {
    setDirection(newIndex > selectedButton ? 1 : -1);
    setSelectedButton(newIndex);
  };

  return (
    <div className="mt-8">
      <div className="w-full flex flex-col items-center justify-center">
      

        <div className="w-full mt-4 p-0  rounded-xl min-h-[520px] relative overflow-hidden shadow-lg">
          <AnimatePresence custom={direction} mode="wait">
            {selectedButton === 1 && (
              <motion.div
                key="content-1"
                custom={direction}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute w-full h-full flex flex-col gap-0 overflow-auto overflow-x-hidden"
                style={{ maxHeight: "calc(100vh - 220px)" }}
              >
                <div className="flex-1 w-full p">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                    {promptTemplate.slice(0, 8).map((t, idx) => (
                      <PromptTemplateDialog
                        key={t.name + idx}
                        template={t}
                        onPromptSubmit={(val) => {
                          setPromptTemplatePrompt(val);
                          onSubmit(val);
                        }}
                      />
                    ))}
                  </div>
                  {promptTemplate.length === 0 && (
                    <div className="text-white opacity-60 mt-4">
                      No prompt templates available.
                    </div>
                  )}
                  {/* Template Library Button */}
                  <div className="flex justify-center mt-4">
                    <a
                      href="/template-library"
                      className="w-full h-[200px] px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold shadow transition text-base flex flex-col items-center justify-center"
                      style={{ minWidth: 180 }}
                    >
                      <Grid3x3 />
                      <div className="mt-5">
                        <span className="ml-2">Template Library</span>
                        <p className="text-xs opacity-70 mt-1">
                          Explore more templates
                        </p>
                      </div>
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
            {selectedButton === 2 && (
              <motion.div
                key="content-2"
                custom={direction}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute w-full h-full flex items-center justify-center"
              >
                <p className="text-white">Attach your knowledge block here.</p>
              </motion.div>
            )}
            {selectedButton === 3 && (
              <motion.div
                key="content-3"
                custom={direction}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute w-full h-full flex items-center justify-center"
              >
                <p className="text-white">Attach your workflow here.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
