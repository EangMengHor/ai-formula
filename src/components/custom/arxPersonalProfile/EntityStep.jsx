"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2 } from "lucide-react"

export default function EntityStep({ formData, setFormData }) {
  const handleChange = (e) => {
    setFormData({ ...formData, entityName: e.target.value })
  }

  return [
    <div key="form" className="space-y-6 ">
      <div>
        <h1 className="text-3xl font-bold mb-2">Do you represent an organization?</h1>
        <p className="text-gray-400">
          If you're investing on behalf of a company, family office, or other entity, let us know.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <Label htmlFor="entityName" className="text-gray-300 text-lg">
          Entity Name (optional)
        </Label>
        <Input
          id="entityName"
          name="entityName"
          value={formData.entityName}
          onChange={handleChange}
          placeholder="Company, Family Office, etc."
          className="bg-[#2a3042] border-gray-700 text-white text-lg py-6"
          autoFocus
        />
      </div>

      <div className="mt-8">
        <p className="text-blue-400 text-sm">
          "AI can analyze entity-specific investment patterns and regulatory requirements to optimize your portfolio
          strategy."
        </p>
      </div>
    </div>,

    <div key="visual" className="flex flex-col items-center justify-center h-full">
      <div className="relative">
        <div className="w-64 h-64 bg-[#2a3042] rounded-lg flex items-center justify-center">
          {formData.entityName ? (
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{formData.entityName}</div>
              <div className="text-gray-400">represented by</div>
              <div className="text-xl text-white mt-1">{formData.fullName}</div>
            </div>
          ) : (
            <Building2 className="h-24 w-24 text-gray-500" />
          )}
        </div>
      </div>
      <p className="mt-6 text-gray-200 text-center max-w-xs">
        Entity information helps AI tailor recommendations for organizational investment goals
      </p>
    </div>,
  ]
}
