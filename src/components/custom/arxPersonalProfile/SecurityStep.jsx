"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export default function SecurityStep({ formData, setFormData }) {
  const [newSecurity, setNewSecurity] = useState({
    ticker: "",
    quantity: "",
  });

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setNewSecurity({ ...newSecurity, [name]: value });
  };

  const addSecurity = () => {
    if (newSecurity.ticker && newSecurity.quantity) {
      setFormData({
        ...formData,
        securities: [
          ...formData.securities,
          { ...newSecurity, id: Date.now() },
        ],
      });
      setNewSecurity({
        ticker: "",
        quantity: "",
      });
    }
  };

  const removeSecurity = (id) => {
    setFormData({
      ...formData,
      securities: formData.securities.filter((security) => security.id !== id),
    });
  };

  return (
    <div className="flex">
      <div key="form" className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            What's already in your portfolio?
          </h1>
          <p className="text-gray-400">
            Add any existing securities you hold (optional).
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Label className="text-gray-300 text-lg">Add Securities</Label>
          <div className="flex space-x-2">
            <Input
              placeholder="Ticker (e.g., AAPL)"
              name="ticker"
              value={newSecurity.ticker}
              onChange={handleSecurityChange}
              className="bg-[#2a3042] border-gray-700 text-white"
            />
            <Input
              placeholder="Quantity"
              name="quantity"
              type="number"
              value={newSecurity.quantity}
              onChange={handleSecurityChange}
              className="bg-[#2a3042] border-gray-700 text-white"
            />
            <Button
              type="button"
              onClick={addSecurity}
              disabled={!newSecurity.ticker || !newSecurity.quantity}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {formData.securities.map((security) => (
              <div
                key={security.id}
                className="flex justify-between items-center bg-[#2a3042] p-3 rounded-md"
              >
                <div>
                  <span className="font-medium text-white">
                    {security.ticker}
                  </span>
                  <span className="ml-2 text-gray-400">
                    {security.quantity} shares
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSecurity(security.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {formData.securities.length === 0 && (
              <div className="text-center py-8 border border-dashed border-gray-700 rounded-md text-gray-500">
                No securities added yet
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-blue-400 text-sm">
            "AI will analyze your existing holdings to identify gaps, overlaps,
            and opportunities for diversification."
          </p>
        </div>
      </div>

      <div
        key="visual"
        className="flex flex-col w-1/2 items-center justify-center h-full"
      >
        <div className="w-64 h-64 bg-[#2a3042] rounded-lg flex items-center justify-center p-6">
          {formData.securities.length > 0 ? (
            <div className="w-full h-full">
              <div className="text-lg font-bold text-white mb-4 text-center">
                Your Portfolio
              </div>
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                {formData.securities.map((security, index) => (
                  <div key={security.id} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{
                        backgroundColor: `hsl(${(index * 137) % 360}, 70%, 60%)`,
                      }}
                    ></div>
                    <div className="flex-1 flex justify-between">
                      <span className="font-medium text-white">
                        {security.ticker}
                      </span>
                      <span className="text-gray-400">{security.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Securities:</span>
                  <span className="text-white font-medium">
                    {formData.securities.length}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center">
              <div className="text-lg font-medium">Add securities</div>
              <div className="text-sm mt-2">to see your portfolio</div>
            </div>
          )}
        </div>
        <p className="mt-6 text-gray-400 text-center max-w-xs">
          AI will analyze your existing holdings to recommend complementary
          investments
        </p>
      </div>
    </div>
  );
}
