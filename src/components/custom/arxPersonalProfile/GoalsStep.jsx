"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Plus, Trash2, Target } from "lucide-react";

export default function GoalsStep({ formData, setFormData }) {
  const [newGoal, setNewGoal] = useState("");

  const goalOptions = [
    {
      id: "alpha",
      label: "Alpha Generation",
      description: "Outperform the market",
    },
    {
      id: "taxEfficiency",
      label: "Tax Efficiency",
      description: "Minimize tax burden",
    },
    {
      id: "esgCompliance",
      label: "ESG Compliance",
      description: "Sustainable investing",
    },
    {
      id: "volatilityReduction",
      label: "Volatility Reduction",
      description: "Smoother returns",
    },
    {
      id: "incomeGeneration",
      label: "Income Generation",
      description: "Regular cash flow",
    },
    {
      id: "capitalPreservation",
      label: "Capital Preservation",
      description: "Protect principal",
    },
  ];

  const toggleGoal = (id) => {
    const currentGoals = [...formData.optimizationGoals];
    if (currentGoals.includes(id)) {
      setFormData({
        ...formData,
        optimizationGoals: currentGoals.filter((item) => item !== id),
      });
    } else {
      setFormData({
        ...formData,
        optimizationGoals: [...currentGoals, id],
      });
    }
  };

  const addCustomGoal = () => {
    if (newGoal.trim()) {
      setFormData({
        ...formData,
        optimizationGoals: [
          ...formData.optimizationGoals,
          `custom-${newGoal.trim()}`,
        ],
      });
      setNewGoal("");
    }
  };

  const removeGoal = (goal) => {
    setFormData({
      ...formData,
      optimizationGoals: formData.optimizationGoals.filter((g) => g !== goal),
    });
  };

  return (
    <div className="flex">
      <div key="form" className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            What are your investment goals?
          </h1>
          <p className="text-gray-400">
            Select the objectives you want to prioritize in your investment
            strategy.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Label className="text-gray-300 text-lg">Investment Goals</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {goalOptions.map((goal) => (
              <Button
                key={goal.id}
                type="button"
                variant={
                  formData.optimizationGoals.includes(goal.id)
                    ? "default"
                    : "outline"
                }
                className={`justify-start  text-left py-8 ${
                  formData.optimizationGoals.includes(goal.id)
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-[#2a3042] border-gray-700 text-white hover:bg-[#343e56]"
                }`}
                onClick={() => toggleGoal(goal.id)}
              >
                <div>
                  <div className="flex items-center">
                    {formData.optimizationGoals.includes(goal.id) && (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    <span className="font-medium">{goal.label}</span>
                  </div>
                  <div className="text-sm opacity-80 mt-1">
                    {goal.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>

          <div className="mt-4">
            <Label className="text-gray-300">Add Custom Goal</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                placeholder="Enter custom goal"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="bg-[#2a3042] border-gray-700 text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newGoal.trim()) {
                    e.preventDefault();
                    addCustomGoal();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addCustomGoal}
                disabled={!newGoal.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {formData.optimizationGoals
              .filter((goal) => goal.startsWith("custom-"))
              .map((goal) => (
                <div
                  key={goal}
                  className="flex items-center bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
                >
                  {goal.replace("custom-", "")}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGoal(goal)}
                    className="ml-1 h-4 w-4 p-0 text-white hover:bg-blue-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-blue-400 text-sm">
            "AI will prioritize your selected goals when building and optimizing
            your investment strategy, balancing competing objectives."
          </p>
        </div>
      </div>

      <div
        key="visual"
        className="flex flex-col w-1/2 items-center justify-center h-full"
      >
        <div className="w-64 h-64 bg-[#2a3042] rounded-lg flex items-center justify-center p-6">
          {formData.optimizationGoals.length > 0 ? (
            <div className="w-full h-full">
              <div className="text-lg font-bold text-white mb-4 text-center">
                Investment Goals
              </div>

              <div className="space-y-3 max-h-40 overflow-y-auto">
                {formData.optimizationGoals.map((goalId, index) => {
                  const isCustom = goalId.startsWith("custom-");
                  const label = isCustom
                    ? goalId.replace("custom-", "")
                    : goalOptions.find((g) => g.id === goalId)?.label || goalId;

                  return (
                    <div key={goalId} className="flex items-center">
                      <Target className="h-4 w-4 text-blue-500 mr-2" />
                      <div className="text-white">{label}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Priority Goals:</span>
                  <span className="text-white font-medium">
                    {formData.optimizationGoals.length}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center">
              <div className="text-lg font-medium">Select goals</div>
              <div className="text-sm mt-2">to prioritize</div>
            </div>
          )}
        </div>
        <p className="mt-6 text-gray-400 text-center max-w-xs">
          AI will balance your goals to create an optimized investment strategy
        </p>
      </div>
    </div>
  );
}
