"use client"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export default function AssetClassStep({ formData, setFormData }) {
  const assetClasses = [
    { id: "equities", label: "Equities", color: "#4F46E5" },
    { id: "bonds", label: "Bonds", color: "#10B981" },
    { id: "realEstate", label: "Real Estate", color: "#F59E0B" },
    { id: "commodities", label: "Commodities", color: "#EF4444" },
    { id: "alternatives", label: "Alternatives", color: "#8B5CF6" },
    { id: "cash", label: "Cash & Equivalents", color: "#6B7280" },
  ]

  const toggleAssetClass = (id) => {
    const currentAssetClasses = [...formData.preferredAssetClasses]
    if (currentAssetClasses.includes(id)) {
      setFormData({
        ...formData,
        preferredAssetClasses: currentAssetClasses.filter((item) => item !== id),
      })
    } else {
      setFormData({
        ...formData,
        preferredAssetClasses: [...currentAssetClasses, id],
      })
    }
  }

  return (
<div className="flex ">
        <div key="form" className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">What do you want to invest in?</h1>
        <p className="text-gray-400">Select the asset classes you're interested in for your portfolio.</p>
      </div>

      <div className="mt-8 space-y-4">
        <Label className="text-gray-300 text-lg">Preferred Asset Classes</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {assetClasses.map((asset) => (
            <Button
              key={asset.id}
              type="button"
              variant={formData.preferredAssetClasses.includes(asset.id) ? "default" : "outline"}
              className={`justify-start text-lg py-6 ${
                formData.preferredAssetClasses.includes(asset.id)
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-[#2a3042] border-gray-700 text-white hover:bg-[#343e56]"
              }`}
              onClick={() => toggleAssetClass(asset.id)}
            >
              {formData.preferredAssetClasses.includes(asset.id) && <Check className="h-5 w-5 mr-2" />}
              {asset.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-blue-400 text-sm">
          "AI will analyze your asset preferences to build a diversified portfolio that aligns with your risk tolerance
          and goals."
        </p>
      </div>
    </div>

    <div key="visual" className="flex flex-col w-1/2 items-center justify-center h-full">
      <div className="w-64 h-64 bg-[#2a3042] rounded-lg flex items-center justify-center">
        <div className="w-48 h-48 relative">
          {formData.preferredAssetClasses.length > 0 ? (
            <>
              {formData.preferredAssetClasses.map((assetId, index) => {
                const asset = assetClasses.find((a) => a.id === assetId)
                const segmentSize = 360 / formData.preferredAssetClasses.length
                const startAngle = index * segmentSize
                const endAngle = (index + 1) * segmentSize

                return (
                  <div
                    key={assetId}
                    className="absolute top-0 left-0 w-full h-full"
                    style={{
                      clipPath: `path('M 24 24 L 24 0 A 24 24 0 ${endAngle > 180 ? 1 : 0} 1 ${
                        24 + 24 * Math.cos((endAngle * Math.PI) / 180)
                      } ${24 + 24 * Math.sin((endAngle * Math.PI) / 180)} L 24 24')`,
                      transform: `rotate(${startAngle}deg)`,
                      backgroundColor: asset.color,
                    }}
                  ></div>
                )
              })}
              <div
                className="absolute inset-0 flex items-center justify-center bg-[#2a3042] rounded-full"
                style={{ width: "50%", height: "50%", margin: "25%" }}
              >
                <span className="text-white font-bold">{formData.preferredAssetClasses.length}</span>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-center">
              <div className="text-lg font-medium">Select assets</div>
              <div className="text-sm mt-2">to see allocation</div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-xs">
        {formData.preferredAssetClasses.map((assetId) => {
          const asset = assetClasses.find((a) => a.id === assetId)
          return (
            <div key={assetId} className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: asset.color }}></div>
              <span className="text-sm text-gray-300">{asset.label}</span>
            </div>
          )
        })}
      </div>
    </div>

</div>
  )
}
