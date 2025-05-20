"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Globe } from "lucide-react"

export default function ResidencyStep({ formData, setFormData }) {
  const handleChange = (e) => {
    setFormData({ ...formData, geographicResidency: e.target.value })
  }

  return [
    <div key="form" className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Where are you based?</h1>
        <p className="text-gray-400">
          Your geographic location helps us understand relevant tax and regulatory considerations.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <Label htmlFor="geographicResidency" className="text-gray-300 text-lg">
          Geographic Tax Residency
        </Label>
        <Input
          id="geographicResidency"
          name="geographicResidency"
          value={formData.geographicResidency}
          onChange={handleChange}
          placeholder="e.g., United States"
          className="bg-[#2a3042] border-gray-700 text-white text-lg py-6"
          autoFocus
        />
      </div>

      <div className="mt-8">
        <p className="text-blue-400 text-sm">
          "AI will use your location to identify jurisdiction-specific investment opportunities and tax optimization
          strategies."
        </p>
      </div>
    </div>,

    <div key="visual" className="flex flex-col items-center justify-center h-full">
      <div className="relative">
        <div className="w-64 h-64 bg-[#2a3042] rounded-lg flex items-center justify-center">
          {formData.geographicResidency ? (
            <div className="text-center">
              <Globe className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <div className="text-2xl font-bold text-white">{formData.geographicResidency}</div>
            </div>
          ) : (
            <Globe className="h-24 w-24 text-gray-500" />
          )}
        </div>
      </div>
      <p className="mt-6 text-gray-200 text-center max-w-xs">
        Location data helps AI recommend tax-efficient investment strategies specific to your jurisdiction
      </p>
    </div>,
  ]
}
