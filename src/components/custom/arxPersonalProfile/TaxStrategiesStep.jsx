"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Receipt, Calculator } from "lucide-react";

export default function TaxStrategiesStep({ formData, setFormData }) {
  const taxStrategies = [
    { id: "taxLossHarvesting", label: "Tax-Loss Harvesting" },
    { id: "assetLocation", label: "Asset Location Optimization" },
    { id: "donorAdvisedFunds", label: "Donor-Advised Funds" },
    { id: "qualifiedDividends", label: "Qualified Dividend Strategies" },
    { id: "municipalBonds", label: "Tax-Exempt Municipal Bonds" },
    { id: "retirementAccounts", label: "Retirement Account Maximization" },
    { id: "estatePlanning", label: "Estate Planning Strategies" },
    { id: "opportunityZones", label: "Opportunity Zone Investments" },
  ];

  const handleTaxStrategyChange = (id) => {
    const currentStrategies = [...formData.taxOptimizationStrategies];
    if (currentStrategies.includes(id)) {
      setFormData({
        ...formData,
        taxOptimizationStrategies: currentStrategies.filter(
          (item) => item !== id,
        ),
      });
    } else {
      setFormData({
        ...formData,
        taxOptimizationStrategies: [...currentStrategies, id],
      });
    }
  };

  return [
    <div className="flex">
      <div key="form" className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Tax Optimization Strategies
          </h1>
          <p className="text-gray-400">
            Select the tax strategies you're currently using or interested in.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Label className="text-gray-300 text-lg">Tax Strategies</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {taxStrategies.map((strategy) => (
              <div key={strategy.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`strategy-${strategy.id}`}
                  checked={formData.taxOptimizationStrategies.includes(
                    strategy.id,
                  )}
                  onCheckedChange={() => handleTaxStrategyChange(strategy.id)}
                  className="border-gray-600 data-[state=checked]:bg-blue-600"
                />
                <label
                  htmlFor={`strategy-${strategy.id}`}
                  className="text-sm font-medium leading-none text-gray-300"
                >
                  {strategy.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-blue-400 text-sm">
            "AI will incorporate your tax strategies to optimize after-tax
            returns and suggest additional tax-efficient approaches based on
            your profile."
          </p>
        </div>
      </div>

      <div
        key="visual"
        className="flex flex-col w-1/2 items-center justify-center h-full"
      >
        <div className="w-md h-full max-h-full bg-[#2a3042] rounded-lg flex items-center justify-center p-6">
          {formData.taxOptimizationStrategies.length > 0 ? (
            <div className="w-full h-full">
              <div className="text-lg font-bold text-white mb-4 text-center">
                Tax Optimization
              </div>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {formData.taxOptimizationStrategies.map((strategyId) => {
                  const strategy = taxStrategies.find(
                    (s) => s.id === strategyId,
                  );
                  return (
                    <div
                      key={strategyId}
                      className="bg-blue-600/20 rounded-lg p-2 flex items-center"
                    >
                      <Calculator className="h-4 w-4 text-blue-400 mr-2" />
                      <span className="text-sm text-blue-300">
                        {strategy?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tax Efficiency:</span>
                  <span className="text-white font-medium">
                    {formData.taxOptimizationStrategies.length > 5
                      ? "High"
                      : formData.taxOptimizationStrategies.length > 2
                        ? "Medium"
                        : "Low"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center">
              <Receipt className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <div className="text-lg font-medium">Select tax strategies</div>
              <div className="text-sm mt-2">to optimize after-tax returns</div>
            </div>
          )}
        </div>
        <p className="mt-6 text-gray-400 text-center max-w-xs">
          Tax optimization strategies help AI maximize your after-tax returns
        </p>
      </div>
    </div>,
  ];
}
