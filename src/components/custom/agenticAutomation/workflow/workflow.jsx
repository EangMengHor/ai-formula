"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Layers, Database, ChevronDown, ChevronUp } from "lucide-react"
import { StepCard } from "./step-card"
import { StepContent } from "./step-content"
import { AgentPlanModal } from "./agent-plan-modal"
import { Dialog, DialogContent } from "../../../ui/dialog"
import { Button } from "../../../ui/button"

export function Workflow({ data }) {
  const [expandedStep, setExpandedStep] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showAllSteps, setShowAllSteps] = useState(false)

  // Determine which steps to show
  const visibleSteps = showAllSteps ? data : data.slice(0, 2)
  const remainingSteps = data.length - 2

  return (
    <div className="mx-auto mt-4 space-y-6">
      <div className="">
        {visibleSteps.map((step, index) => (
          <div key={index} className="relative">
            <StepCard
              title={step["name"]}
              icon={index === 0 ? Layers : Database}
              number={index + 1}
              isExpanded={expandedStep === index}
              onClick={() => setExpandedStep(expandedStep === index ? null : index)}
            >
              <AnimatePresence>
                {expandedStep === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {step.steps.map((subStep, subIndex) => (
                      <StepContent key={subIndex} {...subStep} onViewPlan={() => setSelectedPlan(subStep.agentTask)} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </StepCard>

            {/* Connector Line */}
            {index < visibleSteps.length - 1 && <div className="h-6 w-px bg-slate-700 mx-auto" />}
          </div>
        ))}

        {/* Show More Button */}
        {!showAllSteps && remainingSteps > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
            <Button variant="outline" className="flex items-center gap-2 my-2" onClick={() => setShowAllSteps(true)}>
              Show {remainingSteps} Next {remainingSteps === 1 ? "Step" : "Steps"}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {showAllSteps && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
            <Button variant="outline" className="flex items-center gap-2 my-2" onClick={() => setShowAllSteps(false)}>
              Collapse
              <ChevronUp className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        <Dialog open={selectedPlan !== null} onOpenChange={() => setSelectedPlan(null)}>
          <DialogContent className="bg-transparent border-none [&>button]:hidden">
            {selectedPlan && <AgentPlanModal agentTask={selectedPlan} onClose={() => setSelectedPlan(null)} />}
          </DialogContent>
        </Dialog>
      </AnimatePresence>
    </div>
  )
}

