"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BarChart3 } from "lucide-react"

export default function PositionMetricsStep({ formData, setFormData }) {
  const handlePositionMetricsChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      positionMetrics: {
        ...formData.positionMetrics,
        [name]: Number.parseFloat(value) || 0,
      },
    })
  }

  return [
    <div key="form" className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Position-level Metrics</h1>
        <p className="text-gray-400">
          Enter metrics that describe the performance characteristics of your positions (optional).
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="unrealizedGains" className="text-gray-300">
            Unrealized Gains/Losses (%)
          </Label>
          <Input
            id="unrealizedGains"
            name="unrealizedGains"
            type="number"
            value={formData.positionMetrics.unrealizedGains}
            onChange={handlePositionMetricsChange}
            placeholder="e.g., 12.5"
            className="bg-[#2a3042] border-gray-700 text-white"
          />
          <p className="text-xs text-gray-500">The percentage gain or loss on investments that haven't been sold yet</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="beta" className="text-gray-300">
            Beta
          </Label>
          <Input
            id="beta"
            name="beta"
            type="number"
            step="0.01"
            value={formData.positionMetrics.beta}
            onChange={handlePositionMetricsChange}
            placeholder="e.g., 1.2"
            className="bg-[#2a3042] border-gray-700 text-white"
          />
          <p className="text-xs text-gray-500">
            Measures volatility relative to the market (1.0 = same as market, &gt;1 = more volatile)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sharpeRatio" className="text-gray-300">
            Sharpe Ratio
          </Label>
          <Input
            id="sharpeRatio"
            name="sharpeRatio"
            type="number"
            step="0.01"
            value={formData.positionMetrics.sharpeRatio}
            onChange={handlePositionMetricsChange}
            placeholder="e.g., 0.8"
            className="bg-[#2a3042] border-gray-700 text-white"
          />
          <p className="text-xs text-gray-500">
            Risk-adjusted return metric (higher is better, &gt;1 is good, &gt;2 is excellent)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortinoRatio" className="text-gray-300">
            Sortino Ratio
          </Label>
          <Input
            id="sortinoRatio"
            name="sortinoRatio"
            type="number"
            step="0.01"
            value={formData.positionMetrics.sortinoRatio}
            onChange={handlePositionMetricsChange}
            placeholder="e.g., 1.1"
            className="bg-[#2a3042] border-gray-700 text-white"
          />
          <p className="text-xs text-gray-500">
            Similar to Sharpe but only penalizes downside volatility (higher is better)
          </p>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-blue-400 text-sm">
          "AI will use these metrics to evaluate the risk-adjusted performance of your positions and identify
          opportunities for optimization."
        </p>
      </div>
    </div>,

    <div key="visual" className="flex flex-col items-center justify-center h-full w-full">
      <div className="w-full max-w-md bg-[#2a3042] rounded-lg p-6">
        <div className="text-lg font-bold text-white mb-4 text-center">Position Metrics</div>

        {formData.positionMetrics.sharpeRatio > 0 ||
        formData.positionMetrics.beta > 0 ||
        formData.positionMetrics.unrealizedGains !== 0 ||
        formData.positionMetrics.sortinoRatio > 0 ? (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Unrealized Gains/Losses</span>
                <span
                  className={`${formData.positionMetrics.unrealizedGains >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {formData.positionMetrics.unrealizedGains}%
                </span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full">
                <div
                  className={`h-2 rounded-full ${formData.positionMetrics.unrealizedGains >= 0 ? "bg-green-500" : "bg-red-500"}`}
                  style={{
                    width: `${Math.min(Math.abs(formData.positionMetrics.unrealizedGains) * 2, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Beta</span>
                <span className="text-white">{formData.positionMetrics.beta.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full">
                <div
                  className={`h-2 rounded-full ${formData.positionMetrics.beta > 1 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(formData.positionMetrics.beta * 50, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Sharpe Ratio</span>
                <span className="text-white">{formData.positionMetrics.sharpeRatio.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min(formData.positionMetrics.sharpeRatio * 33, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Sortino Ratio</span>
                <span className="text-white">{formData.positionMetrics.sortinoRatio.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${Math.min(formData.positionMetrics.sortinoRatio * 33, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            <BarChart3 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <div className="text-lg font-medium">Enter metrics</div>
            <div className="text-sm mt-2">to see performance visualization</div>
          </div>
        )}
      </div>
      <p className="mt-6 text-gray-400 text-center max-w-xs">
        Position metrics help AI evaluate risk-adjusted performance of your investments
      </p>
    </div>,
  ]
}
