"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

export function AgentPlanModal({ agentTask, onClose }) {
  const sections = agentTask.split(/\d+\.\s/).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="  backdrop-blur-sm p-4 z-50 overflow-y-auto"
    >
      <div className="min-h-full flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-slate-900 rounded-xl max-w-2xl w-full shadow-xl border border-slate-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <h2 className="text-xl font-semibold text-slate-200">
              Agent Plan Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {sections.map((section, index) => {
              const [title, ...content] = section.trim().split("\n");
              return (
                <div key={index} className="space-y-2">
                  <h3 className="text-lg font-medium text-slate-200">
                    {index + 1}. {title}
                  </h3>
                  <div className="text-slate-400 space-y-2">
                    {content.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
