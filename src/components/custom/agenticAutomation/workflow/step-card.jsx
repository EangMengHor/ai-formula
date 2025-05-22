"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export function StepCard({
  title,
  icon: Icon,
  number,
  isExpanded,
  onClick,
  children,
}) {
  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 shadow-lg">
      <div className="flex items-center p-4 cursor-pointer" onClick={onClick}>
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-900 mr-4">
          <Icon className="w-6 h-6 text-slate-400" />
          <span className="absolute -right-1 -bottom-1 px-2 w-fit h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs font-medium text-slate-300">
            Step {number}
          </span>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-medium text-slate-200 text-ellipsis line-clamp-2">
            {title}
          </h3>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </motion.div>
      </div>

      {children}
    </div>
  );
}
