"use client"
import { Button } from "@/components/ui/button"

export function StepContent({ name, query, onViewPlan }) {
  return (
    <div className="p-4 bg-slate-900/50 rounded-lg m-4 border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-slate-200 font-medium">{name}</h4>
          <p className="text-sm text-slate-400 mt-1">Query: {query}</p>
        </div>
        <Button
          variant="outline"
          onClick={onViewPlan}
          className="ml-4 bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
        >
          View Agent Plan
        </Button>
      </div>
    </div>
  )
}

