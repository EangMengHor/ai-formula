"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react"

export default function TransactionStep({ formData, setFormData }) {
  const [newTransaction, setNewTransaction] = useState({
    ticker: "",
    type: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  })

  const handleTransactionChange = (e) => {
    const { name, value } = e.target
    setNewTransaction({ ...newTransaction, [name]: value })
  }

  const handleTypeChange = (value) => {
    setNewTransaction({ ...newTransaction, type: value })
  }

  const addTransaction = () => {
    if (newTransaction.ticker && newTransaction.type && newTransaction.amount) {
      setFormData({
        ...formData,
        transactions: [...formData.transactions, { ...newTransaction, id: Date.now() }],
      })
      setNewTransaction({
        ticker: "",
        type: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
      })
    }
  }

  const removeTransaction = (id) => {
    setFormData({
      ...formData,
      transactions: formData.transactions.filter((transaction) => transaction.id !== id),
    })
  }

  return [
    <div key="form" className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Recent investment activity?</h1>
        <p className="text-gray-400">
          Add any recent transactions to help us understand your investment behavior (optional).
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <Label className="text-gray-300 text-lg">Add Transaction</Label>
        <div className="grid grid-cols-4 gap-2">
          <Input
            placeholder="Ticker"
            name="ticker"
            value={newTransaction.ticker}
            onChange={handleTransactionChange}
            className="bg-[#2a3042] border-gray-700 text-white"
          />

          <Select value={newTransaction.type} onValueChange={handleTypeChange}>
            <SelectTrigger className="bg-[#2a3042] border-gray-700 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-[#2a3042] border-gray-700 text-white">
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
              <SelectItem value="dividend">Dividend</SelectItem>
              <SelectItem value="split">Split</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Amount"
            name="amount"
            type="number"
            value={newTransaction.amount}
            onChange={handleTransactionChange}
            className="bg-[#2a3042] border-gray-700 text-white"
          />

          <Button
            type="button"
            onClick={addTransaction}
            disabled={!newTransaction.ticker || !newTransaction.type || !newTransaction.amount}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {formData.transactions.length > 0 ? (
            <div className="space-y-2">
              {formData.transactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center bg-[#2a3042] p-3 rounded-md">
                  <div className="flex items-center">
                    {transaction.type === "buy" ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-2" />
                    ) : transaction.type === "sell" ? (
                      <ArrowDownRight className="h-4 w-4 text-red-500 mr-2" />
                    ) : (
                      <div className="h-4 w-4 mr-2" />
                    )}
                    <span className="font-medium text-white">{transaction.ticker}</span>
                    <span className="ml-2 text-gray-400">
                      {transaction.type === "buy" ? "Bought" : transaction.type === "sell" ? "Sold" : transaction.type}{" "}
                      {transaction.amount}
                    </span>
                    {transaction.date && <span className="ml-2 text-xs text-gray-500">{transaction.date}</span>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTransaction(transaction.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-transparent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-700 rounded-md text-gray-500">
              No transactions added yet
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-blue-400 text-sm">
          "AI will analyze your transaction patterns to understand your investment behavior and identify potential
          biases or opportunities."
        </p>
      </div>
    </div>,

    <div key="visual" className="flex flex-col items-center justify-center h-full">
      <div className="w-64 h-64 bg-[#2a3042] rounded-lg flex items-center justify-center p-6">
        {formData.transactions.length > 0 ? (
          <div className="w-full h-full">
            <div className="text-lg font-bold text-white mb-4 text-center">Transaction Activity</div>

            <div className="flex justify-between items-end h-32 mb-4">
              {["buy", "sell"].map((type) => {
                const count = formData.transactions.filter((t) => t.type === type).length
                const maxCount = Math.max(
                  formData.transactions.filter((t) => t.type === "buy").length,
                  formData.transactions.filter((t) => t.type === "sell").length,
                  1,
                )
                const height = count > 0 ? (count / maxCount) * 100 : 0

                return (
                  <div key={type} className="flex flex-col items-center">
                    <div
                      className={`w-16 ${type === "buy" ? "bg-green-500" : "bg-red-500"} rounded-t-sm`}
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="mt-2 text-sm text-gray-400">{type === "buy" ? "Buy" : "Sell"}</div>
                    <div className="text-white font-medium">{count}</div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center">
            <div className="text-lg font-medium">Add transactions</div>
            <div className="text-sm mt-2">to see activity</div>
          </div>
        )}
      </div>
      <p className="mt-6 text-gray-400 text-center max-w-xs">
        AI analyzes your transaction patterns to understand your investment behavior
      </p>
    </div>,
  ]
}
