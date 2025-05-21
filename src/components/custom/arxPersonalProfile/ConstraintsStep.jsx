"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

export default function ConstraintsStep({ formData, setFormData }) {
    const [newConstraint, setNewConstraint] = useState("")

    const handleConstraintChange = (name, value) => {
        setFormData({
            ...formData,
            constraints: {
                ...formData.constraints,
                [name]: value[0],
            },
        })
    }

    const handleExposureLimitChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            constraints: {
                ...formData.constraints,
                exposureLimits: {
                    ...formData.constraints.exposureLimits,
                    [name]: value,
                },
            },
        })
    }

    const addConstraint = () => {
        if (newConstraint.trim()) {
            setFormData({
                ...formData,
                crossBorderConstraints: [...formData.crossBorderConstraints, { text: newConstraint.trim(), id: Date.now() }],
            })
            setNewConstraint("")
        }
    }

    const removeConstraint = (id) => {
        setFormData({
            ...formData,
            crossBorderConstraints: formData.crossBorderConstraints.filter((constraint) => constraint.id !== id),
        })
    }

    return (
        <div className="flex">
            <div key="form" className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Investment Constraints</h1>
                    <p className="text-gray-400">Define the constraints that should guide your investment strategy.</p>
                </div>

                <div className="mt-8 space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label className="text-gray-300">Liquidity Requirement (%)</Label>
                            <span className="text-sm font-medium text-gray-300">{formData.constraints.liquidity}%</span>
                        </div>
                        <div className="relative">
                            <Slider
                                value={[formData.constraints.liquidity]}
                                min={0}
                                max={100}
                                step={5}
                                onValueChange={(value) => handleConstraintChange("liquidity", value)}
                                className="[&>span]:bg-blue-600"
                            />
                            <div className="absolute inset-0 pointer-events-none">
                                <div
                                    className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-blue-600"
                                    style={{ left: `calc(${formData.constraints.liquidity}% - 8px)` }}
                                ></div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Percentage of portfolio that must be liquid</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label className="text-gray-300">Drawdown Ceiling (%)</Label>
                            <span className="text-sm font-medium text-gray-300">{formData.constraints.drawdownCeilings}%</span>
                        </div>
                        <div className="relative">
                            <Slider
                                value={[formData.constraints.drawdownCeilings]}
                                min={0}
                                max={50}
                                step={1}
                                onValueChange={(value) => handleConstraintChange("drawdownCeilings", value)}
                                className="[&>span]:bg-blue-600"
                            />
                            <div className="absolute inset-0 pointer-events-none">
                                <div
                                    className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-blue-600"
                                    style={{ left: `calc(${(formData.constraints.drawdownCeilings / 50) * 100}% - 8px)` }}
                                ></div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Maximum acceptable drawdown</p>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-gray-300">Exposure Limits</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="singleSecurity" className="text-gray-400 text-sm">
                                    Single Security (%)
                                </Label>
                                <Input
                                    id="singleSecurity"
                                    name="singleSecurity"
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="e.g., 5%"
                                    value={formData.constraints.exposureLimits.singleSecurity || ""}
                                    onChange={handleExposureLimitChange}
                                    className="bg-[#2a3042] border-gray-700 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="singleSector" className="text-gray-400 text-sm">
                                    Single Sector (%)
                                </Label>
                                <Input
                                    id="singleSector"
                                    name="singleSector"
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="e.g., 25%"
                                    value={formData.constraints.exposureLimits.singleSector || ""}
                                    onChange={handleExposureLimitChange}
                                    className="bg-[#2a3042] border-gray-700 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="internationalMarkets" className="text-gray-400 text-sm">
                                    International Markets (%)
                                </Label>
                                <Input
                                    id="internationalMarkets"
                                    name="internationalMarkets"
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="e.g., 30%"
                                    value={formData.constraints.exposureLimits.internationalMarkets || ""}
                                    onChange={handleExposureLimitChange}
                                    className="bg-[#2a3042] border-gray-700 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="alternativeInvestments" className="text-gray-400 text-sm">
                                    Alternative Investments (%)
                                </Label>
                                <Input
                                    id="alternativeInvestments"
                                    name="alternativeInvestments"
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="e.g., 20%"
                                    value={formData.constraints.exposureLimits.alternativeInvestments || ""}
                                    onChange={handleExposureLimitChange}
                                    className="bg-[#2a3042] border-gray-700 text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 space-y-4">
                    <Label className="text-gray-300 text-lg">Cross-Border Constraints</Label>
                    <div className="flex space-x-2">
                        <Input
                            placeholder="Enter cross-border constraint"
                            value={newConstraint}
                            onChange={(e) => setNewConstraint(e.target.value)}
                            className="bg-[#2a3042] border-gray-700 text-white"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    addConstraint()
                                }
                            }}
                        />
                        <Button
                            type="button"
                            onClick={addConstraint}
                            disabled={!newConstraint.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="mt-4 space-y-2">
                        {formData.crossBorderConstraints.length > 0 ? (
                            <div className="space-y-2">
                                {formData.crossBorderConstraints.map((constraint) => (
                                    <div key={constraint.id} className="flex justify-between items-center bg-[#2a3042] p-3 rounded-md">
                                        <span className="text-white">{constraint.text}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeConstraint(constraint.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-transparent"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 border border-dashed border-gray-700 rounded-md text-gray-500">
                                No cross-border constraints added yet
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8">
                    <p className="text-blue-400 text-sm">
                        "AI will respect these constraints when optimizing your portfolio to ensure compliance with your requirements
                        and risk tolerance."
                    </p>
                </div>
            </div>

            <div key="visual" className="flex flex-col items-center justify-center h-full w-full">
                <div className="w-full max-w-md bg-[#2a3042] rounded-lg p-6">
                    <div className="text-lg font-bold text-white mb-4 text-center">Constraint Profile</div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Liquidity</span>
                                <span className="text-white">{formData.constraints.liquidity}%</span>
                            </div>
                            <div className="w-full bg-gray-700 h-2 rounded-full">
                                <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${formData.constraints.liquidity}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Max Drawdown</span>
                                <span className="text-white">{formData.constraints.drawdownCeilings}%</span>
                            </div>
                            <div className="w-full bg-gray-700 h-2 rounded-full">
                                <div
                                    className="bg-red-500 h-2 rounded-full"
                                    style={{ width: `${(formData.constraints.drawdownCeilings / 50) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="mt-2">
                            <div className="text-sm text-gray-400 mb-2">Exposure Limits</div>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(formData.constraints.exposureLimits).map(
                                    ([key, value]) =>
                                        value && (
                                            <div key={key} className="bg-gray-700/50 rounded p-2 flex justify-between">
                                                <span className="text-gray-400 text-xs">
                                                    {key === "singleSecurity"
                                                        ? "single Security"
                                                        : key === "singleSector"
                                                            ? "single Sector"
                                                            : key === "internationalMarkets"
                                                                ? "international Markets"
                                                                : "alternative Investments"}
                                                </span>
                                                <span className="text-white text-xs">{value}%</span>
                                            </div>
                                        ),
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Cross-Border:</span>
                            <span className="text-white font-medium">{formData.crossBorderConstraints.length} constraints</span>
                        </div>
                    </div>
                </div>
                <p className="mt-6 text-gray-400 text-center max-w-xs">
                    Investment constraints help AI build a portfolio that meets your specific requirements
                </p>
            </div>

        </div>
    )


}
