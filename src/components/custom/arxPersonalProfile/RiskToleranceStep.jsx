"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function RiskToleranceStep({ formData, setFormData }) {
  const riskOptions = [
    {
      value: "conservative",
      label: "Conservative",
      description: "Prioritize capital preservation over growth",
    },
    {
      value: "moderate",
      label: "Moderate",
      description: "Balance between growth and stability",
    },
    {
      value: "aggressive",
      label: "Aggressive",
      description: "Maximize growth potential, accept higher volatility",
    },
  ];

  const handleSelect = (value) => {
    setFormData({ ...formData, riskTolerance: value });
  };

  return (
    <div className="flex">
      <div key="form" className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            What's your risk tolerance?
          </h1>
          <p className="text-gray-400">
            This helps us understand how much volatility you're comfortable
            with.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Label className="text-gray-300 text-lg">Risk Tolerance</Label>
          <div className="space-y-3 mt-2">
            {riskOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                className={`w-full justify-start text-left py-10 ${
                  formData.riskTolerance === option.value
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
                    : "bg-[#2a3042] border-gray-700 text-white hover:bg-[#343e56]"
                }`}
                onClick={() => handleSelect(option.value)}
              >
                <div>
                  <div className="text-lg font-medium">{option.label}</div>
                  <div className="text-sm opacity-80 mt-1">
                    {option.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-blue-400 text-sm">
            "AI will use your risk tolerance to balance potential returns with
            volatility, creating a portfolio that helps you sleep at night."
          </p>
        </div>
      </div>

      <div
        key="visual"
        className="flex flex-col w-1/2 items-center justify-center h-full"
      >
        <div className="w-64 h-64 bg-[#2a3042] rounded-lg flex items-center justify-center p-6">
          {formData.riskTolerance ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {formData.riskTolerance === "conservative" && (
                <>
                  <TrendingDown className="h-16 w-16 text-blue-500 mb-4" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-white mb-2">
                      Conservative
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
                      <div className="h-1 w-8 bg-gray-600 rounded-full"></div>
                      <div className="h-1 w-8 bg-gray-600 rounded-full"></div>
                    </div>
                    <div className="mt-4 text-sm text-gray-400">
                      Lower risk, stable returns
                    </div>
                  </div>
                </>
              )}

              {formData.riskTolerance === "moderate" && (
                <>
                  <div className="flex items-center mb-4">
                    <TrendingDown className="h-12 w-12 text-blue-500" />
                    <TrendingUp className="h-12 w-12 text-green-500 ml-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white mb-2">
                      Moderate
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
                      <div className="h-1 w-8 bg-green-500 rounded-full"></div>
                      <div className="h-1 w-8 bg-gray-600 rounded-full"></div>
                    </div>
                    <div className="mt-4 text-sm text-gray-400">
                      Balanced risk and return
                    </div>
                  </div>
                </>
              )}

              {formData.riskTolerance === "aggressive" && (
                <>
                  <TrendingUp className="h-16 w-16 text-green-500 mb-4" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-white mb-2">
                      Aggressive
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
                      <div className="h-1 w-8 bg-green-500 rounded-full"></div>
                      <div className="h-1 w-8 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="mt-4 text-sm text-gray-400">
                      Higher risk, growth potential
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center">
              <div className="text-lg font-medium">Select risk level</div>
              <div className="text-sm mt-2">to see visualization</div>
            </div>
          )}
        </div>
        <p className="mt-6 text-gray-400 text-center max-w-xs">
          Your risk tolerance helps AI balance potential returns with volatility
          in your portfolio
        </p>
      </div>
    </div>
  );
}
