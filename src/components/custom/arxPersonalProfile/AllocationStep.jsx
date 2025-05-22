"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PieChart, Plus, Trash2 } from "lucide-react";

export default function AllocationStep({ formData, setFormData }) {
  const [newAllocation, setNewAllocation] = useState({
    category: "",
    strategic: "",
    actual: "",
  });

  const [newCommitment, setNewCommitment] = useState({
    fund: "",
    commitmentAmount: "",
    calledAmount: "",
    distributionAmount: "",
    vintage: "",
  });

  const handleAllocationChange = (e) => {
    const { name, value } = e.target;
    setNewAllocation({ ...newAllocation, [name]: value });
  };

  const handleCommitmentChange = (e) => {
    const { name, value } = e.target;
    setNewCommitment({ ...newCommitment, [name]: value });
  };

  const addAllocation = () => {
    if (
      newAllocation.category &&
      (newAllocation.strategic || newAllocation.actual)
    ) {
      const updatedStrategic = { ...formData.strategicAllocation };
      const updatedActual = { ...formData.actualAllocation };

      if (newAllocation.strategic) {
        updatedStrategic[newAllocation.category] = Number.parseFloat(
          newAllocation.strategic,
        );
      }

      if (newAllocation.actual) {
        updatedActual[newAllocation.category] = Number.parseFloat(
          newAllocation.actual,
        );
      }

      setFormData({
        ...formData,
        strategicAllocation: updatedStrategic,
        actualAllocation: updatedActual,
      });

      setNewAllocation({
        category: "",
        strategic: "",
        actual: "",
      });
    }
  };

  const removeAllocation = (category) => {
    const updatedStrategic = { ...formData.strategicAllocation };
    const updatedActual = { ...formData.actualAllocation };

    delete updatedStrategic[category];
    delete updatedActual[category];

    setFormData({
      ...formData,
      strategicAllocation: updatedStrategic,
      actualAllocation: updatedActual,
    });
  };

  const addCommitment = () => {
    if (newCommitment.fund && newCommitment.commitmentAmount) {
      setFormData({
        ...formData,
        privateEquityCommitments: [
          ...formData.privateEquityCommitments,
          { ...newCommitment, id: Date.now() },
        ],
      });
      setNewCommitment({
        fund: "",
        commitmentAmount: "",
        calledAmount: "",
        distributionAmount: "",
        vintage: "",
      });
    }
  };

  const removeCommitment = (id) => {
    setFormData({
      ...formData,
      privateEquityCommitments: formData.privateEquityCommitments.filter(
        (commitment) => commitment.id !== id,
      ),
    });
  };

  const getAllocationCategories = () => {
    const categories = new Set([
      ...Object.keys(formData.strategicAllocation),
      ...Object.keys(formData.actualAllocation),
    ]);
    return Array.from(categories);
  };

  return (
    <div className="flex">
      <div key="form" className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Asset Allocation</h1>
          <p className="text-gray-400">
            Enter your strategic (target) and actual asset allocations
            (optional).
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Label className="text-gray-300 text-lg">Add Asset Allocation</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="Category (e.g., Equities)"
              name="category"
              value={newAllocation.category}
              onChange={handleAllocationChange}
              className="bg-[#2a3042] border-gray-700 text-white"
            />
            <Input
              placeholder="Strategic % (target)"
              name="strategic"
              type="number"
              value={newAllocation.strategic}
              onChange={handleAllocationChange}
              className="bg-[#2a3042] border-gray-700 text-white"
            />
            <div className="flex space-x-2">
              <Input
                placeholder="Actual %"
                name="actual"
                type="number"
                value={newAllocation.actual}
                onChange={handleAllocationChange}
                className="bg-[#2a3042] border-gray-700 text-white"
              />
              <Button
                type="button"
                onClick={addAllocation}
                disabled={
                  !newAllocation.category ||
                  (!newAllocation.strategic && !newAllocation.actual)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {getAllocationCategories().length > 0 ? (
              <div className="bg-[#2a3042] rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700/30">
                    <tr>
                      <th className="text-left py-2 px-3 text-gray-300">
                        Category
                      </th>
                      <th className="text-right py-2 px-3 text-gray-300">
                        Strategic %
                      </th>
                      <th className="text-right py-2 px-3 text-gray-300">
                        Actual %
                      </th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {getAllocationCategories().map((category) => (
                      <tr key={category} className="border-t border-gray-700">
                        <td className="py-2 px-3 text-white">{category}</td>
                        <td className="py-2 px-3 text-right text-gray-300">
                          {formData.strategicAllocation[category] !== undefined
                            ? `${formData.strategicAllocation[category]}%`
                            : "-"}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-300">
                          {formData.actualAllocation[category] !== undefined
                            ? `${formData.actualAllocation[category]}%`
                            : "-"}
                        </td>
                        <td className="py-2 px-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAllocation(category)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-transparent"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-gray-700 rounded-md text-gray-500">
                No allocations added yet
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <Label className="text-gray-300 text-lg">
            Private Equity / VC Commitments
          </Label>
          <div className="grid grid-cols-5 gap-2">
            <Input
              placeholder="Fund Name"
              name="fund"
              value={newCommitment.fund}
              onChange={handleCommitmentChange}
              className="bg-[#2a3042] border-gray-700 text-white"
            />
            <Input
              placeholder="Commitment"
              name="commitmentAmount"
              type="number"
              value={newCommitment.commitmentAmount}
              onChange={handleCommitmentChange}
              className="bg-[#2a3042] border-gray-700 text-white"
            />
            <Input
              placeholder="Called"
              name="calledAmount"
              type="number"
              value={newCommitment.calledAmount}
              onChange={handleCommitmentChange}
              className="bg-[#2a3042] border-gray-700 text-white"
            />
            <Input
              placeholder="Vintage"
              name="vintage"
              type="number"
              value={newCommitment.vintage}
              onChange={handleCommitmentChange}
              className="bg-[#2a3042] border-gray-700 text-white"
            />
            <Button
              type="button"
              onClick={addCommitment}
              disabled={!newCommitment.fund || !newCommitment.commitmentAmount}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {formData.privateEquityCommitments.length > 0 ? (
              <div className="space-y-2">
                {formData.privateEquityCommitments.map((commitment) => (
                  <div
                    key={commitment.id}
                    className="flex justify-between items-center bg-[#2a3042] p-3 rounded-md"
                  >
                    <div>
                      <span className="font-medium text-white">
                        {commitment.fund}
                      </span>
                      <span className="ml-2 text-gray-400">
                        ${commitment.commitmentAmount} (
                        {commitment.vintage || "N/A"})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCommitment(commitment.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-transparent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-gray-700 rounded-md text-gray-500">
                No PE/VC commitments added yet
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-blue-400 text-sm">
            "AI will analyze the gap between your strategic and actual
            allocations to identify rebalancing opportunities and optimize your
            portfolio structure."
          </p>
        </div>
      </div>

      <div
        key="visual"
        className="flex flex-col items-center justify-center h-full w-1/2"
      >
        <div className="w-64 h-64 bg-[#2a3042] rounded-lg flex items-center justify-center p-6">
          {getAllocationCategories().length > 0 ? (
            <div className="w-full h-full">
              <div className="text-lg font-bold text-white mb-4 text-center">
                Asset Allocation
              </div>

              <div className="relative h-40">
                <div className="absolute inset-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {getAllocationCategories().map((category, index, array) => {
                      const strategicValue =
                        formData.strategicAllocation[category] || 0;
                      const actualValue =
                        formData.actualAllocation[category] || 0;

                      // Calculate positions for pie segments
                      const strategicTotal =
                        Object.values(formData.strategicAllocation).reduce(
                          (sum, val) => sum + val,
                          0,
                        ) || 100;
                      const actualTotal =
                        Object.values(formData.actualAllocation).reduce(
                          (sum, val) => sum + val,
                          0,
                        ) || 100;

                      const strategicStartAngle = array
                        .slice(0, index)
                        .reduce(
                          (sum, cat) =>
                            sum +
                            ((formData.strategicAllocation[cat] || 0) /
                              strategicTotal) *
                              360,
                          0,
                        );
                      const strategicEndAngle =
                        strategicStartAngle +
                        (strategicValue / strategicTotal) * 360;

                      const actualStartAngle = array
                        .slice(0, index)
                        .reduce(
                          (sum, cat) =>
                            sum +
                            ((formData.actualAllocation[cat] || 0) /
                              actualTotal) *
                              360,
                          0,
                        );
                      const actualEndAngle =
                        actualStartAngle + (actualValue / actualTotal) * 360;

                      // Colors based on index
                      const hue = (index * 137) % 360;
                      const strategicColor = `hsl(${hue}, 70%, 60%)`;
                      const actualColor = `hsl(${hue}, 70%, 40%)`;

                      // Only draw if there's a value
                      if (strategicValue > 0 || actualValue > 0) {
                        return (
                          <g key={category}>
                            {/* Strategic allocation (outer ring) */}
                            {strategicValue > 0 && (
                              <path
                                d={describeArc(
                                  50,
                                  50,
                                  40,
                                  strategicStartAngle,
                                  strategicEndAngle,
                                )}
                                fill={strategicColor}
                                stroke="#242938"
                                strokeWidth="1"
                              />
                            )}

                            {/* Actual allocation (inner ring) */}
                            {actualValue > 0 && (
                              <path
                                d={describeArc(
                                  50,
                                  50,
                                  30,
                                  actualStartAngle,
                                  actualEndAngle,
                                )}
                                fill={actualColor}
                                stroke="#242938"
                                strokeWidth="1"
                              />
                            )}
                          </g>
                        );
                      }
                      return null;
                    })}

                    {/* Center circle */}
                    <circle cx="50" cy="50" r="20" fill="#242938" />
                  </svg>
                </div>
              </div>

              <div className="mt-2 text-xs text-center">
                <div className="flex justify-center items-center">
                  <div className="w-3 h-3 rounded-full bg-opacity-70 bg-blue-500 mr-1"></div>
                  <span className="text-gray-300">Strategic (outer)</span>
                  <div className="w-3 h-3 rounded-full bg-opacity-70 bg-blue-700 ml-3 mr-1"></div>
                  <span className="text-gray-300">Actual (inner)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center">
              <PieChart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <div className="text-lg font-medium">Add allocations</div>
              <div className="text-sm mt-2">
                to see your portfolio breakdown
              </div>
            </div>
          )}
        </div>
        <p className="mt-6 text-gray-400 text-center max-w-xs">
          AI analyzes allocation gaps to identify rebalancing opportunities
        </p>
      </div>
    </div>
  );
}

// Helper function to create SVG arcs
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  // Create the arc path
  const d = [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "L",
    x,
    y,
    "Z",
  ].join(" ");

  return d;
}
