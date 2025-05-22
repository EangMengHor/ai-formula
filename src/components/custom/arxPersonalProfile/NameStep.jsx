"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NameStep({ formData, setFormData }) {
  const handleChange = (e) => {
    setFormData({ ...formData, fullName: e.target.value });
  };

  return (
    <div className="flex gap-2 justify-between">
      <div key="form" className="space-y-6 flex flex-col justify-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">What's your name?</h1>
          <p className="text-gray-400">
            This is how we'll address you and personalize your investment
            profile.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Label htmlFor="fullName" className="text-gray-300 text-lg">
            Full Name
          </Label>
          <Input
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your name"
            className="bg-[#2a3042] border-gray-700 text-white text-lg py-6"
            autoFocus
          />
        </div>

        <div className="mt-8">
          <p className="text-blue-400 text-sm">
            "AI will use your name to personalize recommendations and create a
            tailored investment strategy just for you."
          </p>
        </div>
      </div>

      <div
        key="visual"
        className="flex flex-col h-full w-1/2 items-center justify-center"
      >
        <div className="relative">
          <div className="w-64 h-64 bg-[#2a3042] rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-white">
              {formData.fullName
                ? formData.fullName.charAt(0).toUpperCase()
                : "?"}
            </span>
          </div>
          <div className="absolute bottom-4 right-4 bg-blue-500 px-3 py-1 rounded text-white font-medium">
            {formData.fullName || "Your Name"}
          </div>
        </div>
        <p className="mt-6 text-gray-200 text-center max-w-xs">
          Your profile will help AI understand your investment preferences and
          goals
        </p>
      </div>
    </div>
  );
}
