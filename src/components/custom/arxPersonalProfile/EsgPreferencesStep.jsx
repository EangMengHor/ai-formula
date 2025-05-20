"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Leaf, Ban, Users, Building } from "lucide-react"

export default function EsgPreferencesStep({ formData, setFormData }) {
  const esgPreferences = [
    { id: "environmental", label: "Environmental Impact", icon: <Leaf className="h-4 w-4 mr-2" /> },
    { id: "social", label: "Social Responsibility", icon: <Users className="h-4 w-4 mr-2" /> },
    { id: "governance", label: "Corporate Governance", icon: <Building className="h-4 w-4 mr-2" /> },
    { id: "climateAction", label: "Climate Action", icon: <Leaf className="h-4 w-4 mr-2" /> },
    { id: "diversity", label: "Diversity & Inclusion", icon: <Users className="h-4 w-4 mr-2" /> },
    { id: "humanRights", label: "Human Rights", icon: <Users className="h-4 w-4 mr-2" /> },
    { id: "exclusions", label: "Ethical Exclusions", icon: <Ban className="h-4 w-4 mr-2" /> },
  ]

  const handleEsgChange = (id) => {
    const currentEsg = [...formData.esgPreferences]
    if (currentEsg.includes(id)) {
      setFormData({
        ...formData,
        esgPreferences: currentEsg.filter((item) => item !== id),
      })
    } else {
      setFormData({
        ...formData,
        esgPreferences: [...currentEsg, id],
      })
    }
  }

  return [
    <div key="form" className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">What are your ESG preferences?</h1>
        <p className="text-gray-400">Select any environmental, social, or governance factors important to you.</p>
      </div>

      <div className="mt-8 space-y-4">
        <Label className="text-gray-300 text-lg">ESG Preferences</Label>
        <div className="space-y-3">
          {esgPreferences.map((pref) => (
            <div key={pref.id} className="flex items-center space-x-2">
              <Checkbox
                id={`esg-${pref.id}`}
                checked={formData.esgPreferences.includes(pref.id)}
                onCheckedChange={() => handleEsgChange(pref.id)}
                className="border-gray-600 data-[state=checked]:bg-blue-600"
              />
              <label
                htmlFor={`esg-${pref.id}`}
                className="text-sm font-medium leading-none text-gray-300 flex items-center cursor-pointer"
              >
                {pref.icon}
                {pref.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-blue-400 text-sm">
          "AI will incorporate your ESG preferences to align your investments with your values while maintaining
          performance objectives."
        </p>
      </div>
    </div>,

    <div key="visual" className="flex flex-col items-center justify-center h-full">
      <div className="w-64 h-64 bg-[#2a3042] rounded-lg flex items-center justify-center p-6">
        {formData.esgPreferences.length > 0 ? (
          <div className="w-full h-full">
            <div className="text-lg font-bold text-white mb-4 text-center">ESG Focus Areas</div>
            <div className="grid grid-cols-2 gap-3">
              {formData.esgPreferences.map((prefId) => {
                const pref = esgPreferences.find((p) => p.id === prefId)
                return (
                  <div key={prefId} className="bg-blue-600/20 rounded-lg p-3 flex items-center">
                    {pref?.icon}
                    <span className="text-sm text-blue-300">{pref?.label}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">ESG Impact:</span>
                <span className="text-white font-medium">
                  {formData.esgPreferences.length > 4 ? "High" : formData.esgPreferences.length > 2 ? "Medium" : "Low"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center">
            <Leaf className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <div className="text-lg font-medium">Select ESG preferences</div>
            <div className="text-sm mt-2">to align with your values</div>
          </div>
        )}
      </div>
      <p className="mt-6 text-gray-400 text-center max-w-xs">
        Your ESG preferences help AI find investments that align with your values
      </p>
    </div>,
  ]
}
