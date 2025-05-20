"use client"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

export default function LiquidityStep({ formData, setFormData }) {
  const liquidityOptions = [
    { value: "short-term", label: "Short Term", description: "Less than 1 year" },
    { value: "medium-term", label: "Medium Term", description: "1-3 years" },
    { value: "long-term", label: "Long Term", description: "3+ years" },
    { value: "monthly", label: "Monthly Liquidity", description: "Regular access to funds" },
    { value: "quarterly", label: "Quarterly Liquidity", description: "Periodic access to funds" },
  ]

  const handleSelect = (value) => {
    setFormData({ ...formData, liquidityHorizon: value })
  }

  return [
    <div key="form" className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">When might you need your money?</h1>
        <p className="text-gray-400">Your investment time horizon helps determine appropriate strategies.</p>
      </div>

      <div className="mt-8 space-y-4">
        <Label className="text-gray-300 text-lg">Liquidity Horizon</Label>
        <div className="space-y-3 mt-2">
          {liquidityOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="outline"
              className={`w-full justify-start text-left py-4 ${
                formData.liquidityHorizon === option.value
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
                  : "bg-[#2a3042] border-gray-700 text-white hover:bg-[#343e56]"
              }`}
              onClick={() => handleSelect(option.value)}
            >
              <div>
                <div className="text-lg font-medium">{option.label}</div>
                <div className="text-sm opacity-80 mt-1">{option.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-blue-400 text-sm">
          "AI will factor in your liquidity needs to ensure your investments align with your time horizon, balancing
          growth with accessibility."
        </p>
      </div>
    </div>,

    <div key="visual" className="flex flex-col items-center justify-center h-full w-full">
      <div className="w-full max-w-md bg-[#2a3042] rounded-lg p-6">
        {formData.liquidityHorizon ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Clock className="h-16 w-16 text-blue-500 mb-4" />
            <div className="text-center">
              <div className="text-xl font-bold text-white mb-2">
                {formData.liquidityHorizon
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </div>

              {formData.liquidityHorizon === "short-term" && (
                <div className="w-full bg-gray-700 h-2 rounded-full mt-4">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "25%" }}></div>
                </div>
              )}

              {formData.liquidityHorizon === "medium-term" && (
                <div className="w-full bg-gray-700 h-2 rounded-full mt-4">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "50%" }}></div>
                </div>
              )}

              {formData.liquidityHorizon === "long-term" && (
                <div className="w-full bg-gray-700 h-2 rounded-full mt-4">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "100%" }}></div>
                </div>
              )}

              {(formData.liquidityHorizon === "monthly" || formData.liquidityHorizon === "quarterly") && (
                <div className="flex justify-between w-full mt-4">
                  {Array.from({ length: formData.liquidityHorizon === "monthly" ? 12 : 4 }).map((_, i) => (
                    <div key={i} className="h-8 w-1 bg-blue-500 rounded-full"></div>
                  ))}
                </div>
              )}

              <div className="mt-4 text-sm text-gray-400">
                {formData.liquidityHorizon === "short-term" && "Access within 1 year"}
                {formData.liquidityHorizon === "medium-term" && "Access in 1-3 years"}
                {formData.liquidityHorizon === "long-term" && "Access after 3+ years"}
                {formData.liquidityHorizon === "monthly" && "Monthly access to funds"}
                {formData.liquidityHorizon === "quarterly" && "Quarterly access to funds"}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center">
            <div className="text-lg font-medium">Select time horizon</div>
            <div className="text-sm mt-2">to see visualization</div>
          </div>
        )}
      </div>
      <p className="mt-6 text-gray-400 text-center max-w-xs">
        Your liquidity needs help AI balance growth potential with access to capital
      </p>
    </div>,
  ]
}
