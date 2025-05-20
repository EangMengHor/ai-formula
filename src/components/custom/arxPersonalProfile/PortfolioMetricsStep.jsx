"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

export default function PortfolioMetricsStep({ formData, setFormData }) {
  const handlePortfolioMetricsChange = (name, value) => {
    setFormData({
      ...formData,
      portfolioMetrics: {
        ...formData.portfolioMetrics,
        [name]: value[0] || 0,
      },
    })
  }

  return [
    <div key="form" className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Portfolio-level Risk Metrics</h1>
        <p className="text-gray-400">
          Adjust these metrics to reflect your portfolio's risk characteristics (optional).
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-gray-300">Value-at-Risk (VaR)</Label>
            <span className="text-sm font-medium text-gray-300">{formData.portfolioMetrics.var}%</span>
          </div>
          <div className="relative">
            <Slider
              value={[formData.portfolioMetrics.var]}
              min={0}
              max={30}
              step={0.5}
              onValueChange={(value) => handlePortfolioMetricsChange("var", value)}
              className="[&>span]:bg-blue-600"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-blue-600"
                style={{ left: `calc(${(formData.portfolioMetrics.var / 30) * 100}% - 8px)` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Lower values indicate less risk</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-gray-300">Conditional VaR (CVaR)</Label>
            <span className="text-sm font-medium text-gray-300">{formData.portfolioMetrics.cvar}%</span>
          </div>
          <div className="relative">
            <Slider
              value={[formData.portfolioMetrics.cvar]}
              min={0}
              max={40}
              step={0.5}
              onValueChange={(value) => handlePortfolioMetricsChange("cvar", value)}
              className="[&>span]:bg-blue-600"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-blue-600"
                style={{ left: `calc(${(formData.portfolioMetrics.cvar / 40) * 100}% - 8px)` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Expected loss exceeding VaR</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-gray-300">Max Drawdown (MDD)</Label>
            <span className="text-sm font-medium text-gray-300">{formData.portfolioMetrics.maxDrawdown}%</span>
          </div>
          <div className="relative">
            <Slider
              value={[formData.portfolioMetrics.maxDrawdown]}
              min={0}
              max={50}
              step={1}
              onValueChange={(value) => handlePortfolioMetricsChange("maxDrawdown", value)}
              className="[&>span]:bg-blue-600"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-blue-600"
                style={{ left: `calc(${(formData.portfolioMetrics.maxDrawdown / 50) * 100}% - 8px)` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Maximum observed loss from peak to trough</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-gray-300">ESG-weighted Beta</Label>
            <span className="text-sm font-medium text-gray-300">{formData.portfolioMetrics.esgWeightedBeta}</span>
          </div>
          <div className="relative">
            <Slider
              value={[formData.portfolioMetrics.esgWeightedBeta]}
              min={0}
              max={2}
              step={0.05}
              onValueChange={(value) => handlePortfolioMetricsChange("esgWeightedBeta", value)}
              className="[&>span]:bg-blue-600"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-blue-600"
                style={{ left: `calc(${(formData.portfolioMetrics.esgWeightedBeta / 2) * 100}% - 8px)` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Market sensitivity adjusted for ESG factors</p>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-blue-400 text-sm">
          "AI will use these risk metrics to ensure your portfolio stays within your risk tolerance while maximizing
          returns."
        </p>
      </div>
    </div>,

    <div key="visual" className="flex flex-col items-center justify-center h-full w-full">
      <div className="w-full max-w-md bg-[#2a3042] rounded-lg p-6">
        <div className="text-lg font-bold text-white mb-4 text-center">Risk Profile</div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">VaR:</span>
              <span className="text-white">{formData.portfolioMetrics.var}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">CVaR:</span>
              <span className="text-white">{formData.portfolioMetrics.cvar}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">MDD:</span>
              <span className="text-white">{formData.portfolioMetrics.maxDrawdown}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">ESG Beta:</span>
              <span className="text-white">{formData.portfolioMetrics.esgWeightedBeta}</span>
            </div>
          </div>

          <div className="relative h-40 w-full mt-4">
            {/* Risk gauge */}
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <div className="relative w-32 h-32">
                {/* Gauge background */}
                <svg viewBox="0 0 100 50" className="w-full">
                  <path d="M 0,50 A 50,50 0 0,1 100,50" fill="none" stroke="#374151" strokeWidth="10" />

                  {/* Low risk segment */}
                  <path d="M 0,50 A 50,50 0 0,1 33,50" fill="none" stroke="#10B981" strokeWidth="10" />

                  {/* Medium risk segment */}
                  <path d="M 33,50 A 50,50 0 0,1 66,50" fill="none" stroke="#F59E0B" strokeWidth="10" />

                  {/* High risk segment */}
                  <path d="M 66,50 A 50,50 0 0,1 100,50" fill="none" stroke="#EF4444" strokeWidth="10" />
                </svg>

                {/* Gauge needle */}
                <div
                  className="absolute bottom-0 left-1/2 w-1 bg-white rounded-t-full origin-bottom transform -translate-x-1/2"
                  style={{
                    height: "40px",
                    transform: `translateX(-50%) rotate(${Math.min(
                      180 *
                        ((formData.portfolioMetrics.var / 30 +
                          formData.portfolioMetrics.maxDrawdown / 50 +
                          formData.portfolioMetrics.cvar / 40) /
                          3),
                      180,
                    )}deg)`,
                  }}
                ></div>

                {/* Gauge center */}
                <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-white rounded-full transform -translate-x-1/2"></div>
              </div>
            </div>

            {/* Risk level text */}
            <div className="absolute bottom-0 left-0 w-full text-center">
              {(() => {
                const riskScore =
                  (formData.portfolioMetrics.var / 30 +
                    formData.portfolioMetrics.maxDrawdown / 50 +
                    formData.portfolioMetrics.cvar / 40) /
                  3

                let riskLevel, riskColor

                if (riskScore < 0.33) {
                  riskLevel = "Low Risk"
                  riskColor = "text-green-500"
                } else if (riskScore < 0.66) {
                  riskLevel = "Medium Risk"
                  riskColor = "text-yellow-500"
                } else {
                  riskLevel = "High Risk"
                  riskColor = "text-red-500"
                }

                return (
                  <div className="text-lg font-bold">
                    <span className={riskColor}>{riskLevel}</span>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-6 text-gray-400 text-center max-w-xs">
        Risk metrics help AI balance potential returns with your risk tolerance
      </p>
    </div>,
  ]
}
