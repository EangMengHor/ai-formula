"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Shield } from "lucide-react"

export default function ComplianceStep({ formData, setFormData }) {
    const [newExposure, setNewExposure] = useState({
        jurisdiction: "",
        exposurePercentage: "",
    })

    const handleExposureChange = (e) => {
        const { name, value } = e.target
        setNewExposure({ ...newExposure, [name]: value })
    }

    const addExposure = () => {
        if (newExposure.jurisdiction && newExposure.exposurePercentage) {
            setFormData({
                ...formData,
                jurisdictionalExposure: [...formData.jurisdictionalExposure, { ...newExposure, id: Date.now() }],
            })
            setNewExposure({
                jurisdiction: "",
                exposurePercentage: "",
            })
        }
    }

    const removeExposure = (id) => {
        setFormData({
            ...formData,
            jurisdictionalExposure: formData.jurisdictionalExposure.filter((exposure) => exposure.id !== id),
        })
    }

    return (
        <div className="flex">
            <div key="form" className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Jurisdictional Exposure</h1>
                    <p className="text-gray-400">
                        Enter your exposure to different jurisdictions for compliance purposes (optional).
                    </p>
                </div>

                <div className="mt-8 space-y-4">
                    <Label className="text-gray-300 text-lg">Add Jurisdictional Exposure</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <Input
                            placeholder="Jurisdiction"
                            name="jurisdiction"
                            value={newExposure.jurisdiction}
                            onChange={handleExposureChange}
                            className="bg-[#2a3042] border-gray-700 text-white"
                        />
                        <Input
                            placeholder="Exposure Percentage"
                            name="exposurePercentage"
                            type="number"
                            min="0"
                            max="100"
                            value={newExposure.exposurePercentage}
                            onChange={handleExposureChange}
                            className="bg-[#2a3042] border-gray-700 text-white"
                        />
                        <Button
                            type="button"
                            onClick={addExposure}
                            disabled={!newExposure.jurisdiction || !newExposure.exposurePercentage}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="mt-4 space-y-2">
                        {formData.jurisdictionalExposure.length > 0 ? (
                            <div className="space-y-2">
                                {formData.jurisdictionalExposure.map((exposure) => (
                                    <div key={exposure.id} className="flex justify-between items-center bg-[#2a3042] p-3 rounded-md">
                                        <div>
                                            <span className="font-medium text-white">{exposure.jurisdiction}</span>
                                            <span className="ml-2 text-gray-400">{exposure.exposurePercentage}%</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeExposure(exposure.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-transparent"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 border border-dashed border-gray-700 rounded-md text-gray-500">
                                No jurisdictional exposures added yet
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8">
                    <p className="text-blue-400 text-sm">
                        "AI will analyze your jurisdictional exposure to identify potential regulatory issues and tax optimization
                        opportunities across borders."
                    </p>
                </div>
            </div>

            <div key="visual" className="flex flex-col items-center w-1/2 justify-center h-full">
                <div className="w-64 h-64 bg-[#2a3042] rounded-lg flex items-center justify-center p-6">
                    {formData.jurisdictionalExposure.length > 0 ? (
                        <div className="w-full h-full">
                            <div className="text-lg font-bold text-white mb-4 text-center">Jurisdictional Exposure</div>

                            <div className="space-y-3 max-h-40 overflow-y-auto">
                                {formData.jurisdictionalExposure.map((exposure) => (
                                    <div key={exposure.id} className="flex items-center justify-between">
                                        <span className="text-white">{exposure.jurisdiction}</span>
                                        <div className="flex items-center">
                                            <div className="w-24 h-2 bg-gray-700 rounded-full mr-2">
                                                <div
                                                    className="h-2 bg-blue-500 rounded-full"
                                                    style={{ width: `${Math.min(exposure.exposurePercentage, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-300">{exposure.exposurePercentage}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Total Jurisdictions:</span>
                                    <span className="text-white font-medium">{formData.jurisdictionalExposure.length}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500 text-center">
                            <Shield className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                            <div className="text-lg font-medium">Add jurisdictional exposure</div>
                            <div className="text-sm mt-2">to analyze compliance requirements</div>
                        </div>
                    )}
                </div>
                <p className="mt-6 text-gray-400 text-center max-w-xs">
                    Jurisdictional exposure helps AI identify regulatory requirements and tax implications
                </p>
            </div>

        </div>
    )
}
