"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Globe, Plus, X } from "lucide-react"

export default function JurisdictionsStep({ formData, setFormData }) {
  const [newJurisdiction, setNewJurisdiction] = useState("")

  const addJurisdiction = () => {
    if (newJurisdiction.trim() && !formData.jurisdictions.includes(newJurisdiction.trim())) {
      setFormData({
        ...formData,
        jurisdictions: [...formData.jurisdictions, newJurisdiction.trim()],
      })
      setNewJurisdiction("")
    }
  }

  const removeJurisdiction = (jurisdiction) => {
    setFormData({
      ...formData,
      jurisdictions: formData.jurisdictions.filter((j) => j !== jurisdiction),
    })
  }

  return (
    <div className="flex ">
        <div key="form" className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">What jurisdictions are relevant to you?</h1>
        <p className="text-gray-400">
          Add any additional jurisdictions where you have tax obligations or investment interests.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <Label htmlFor="jurisdictions" className="text-gray-300 text-lg">
          Relevant Jurisdictions
        </Label>
        <div className="flex space-x-2">
          <Input
            id="jurisdictions"
            value={newJurisdiction}
            onChange={(e) => setNewJurisdiction(e.target.value)}
            placeholder="e.g., Switzerland, Singapore"
            className="bg-[#2a3042] border-gray-700 text-white"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addJurisdiction()
              }
            }}
          />
          <Button
            type="button"
            onClick={addJurisdiction}
            disabled={!newJurisdiction.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {formData.jurisdictions.map((jurisdiction, index) => (
            <div key={index} className="flex items-center bg-[#2a3042] text-white px-3 py-1 rounded-full text-sm">
              {jurisdiction}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeJurisdiction(jurisdiction)}
                className="ml-1 h-4 w-4 p-0 text-gray-400 hover:text-white hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {formData.jurisdictions.length === 0 && (
            <div className="text-center w-full py-4 border border-dashed border-gray-700 rounded-md text-gray-500">
              No jurisdictions added yet
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-blue-400 text-sm">
          "AI will consider multi-jurisdictional tax implications and regulatory requirements when optimizing your
          investment strategy."
        </p>
      </div>
    </div>

    <div key="visual" className="flex flex-col w-1/2 items-center justify-center h-full">
      <div className="w-64 h-64 bg-[#2a3042] rounded-lg flex items-center justify-center p-6">
        {formData.jurisdictions.length > 0 ? (
          <div className="w-full h-full">
            <div className="text-lg font-bold text-white mb-4 text-center">Jurisdictional Map</div>
            <div className="relative w-full h-32">
              <Globe className="h-32 w-32 text-blue-500/30 absolute top-0 left-1/2 transform -translate-x-1/2" />
              {formData.jurisdictions.map((jurisdiction, index) => {
                // Calculate position around the globe
                const angle = index * (360 / formData.jurisdictions.length) * (Math.PI / 180)
                const radius = 40
                const x = 50 + radius * Math.cos(angle)
                const y = 50 + radius * Math.sin(angle)

                return (
                  <div
                    key={jurisdiction}
                    className="absolute bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {jurisdiction}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Jurisdictions:</span>
                <span className="text-white font-medium">{formData.jurisdictions.length}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center">
            <Globe className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <div className="text-lg font-medium">Add jurisdictions</div>
            <div className="text-sm mt-2">to see your global exposure</div>
          </div>
        )}
      </div>
      <p className="mt-6 text-gray-400 text-center max-w-xs">
        Multi-jurisdictional considerations help AI optimize tax efficiency across borders
      </p>
    </div>

    </div>
  )
}
