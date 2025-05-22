import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  DollarSign,
  LineChart,
  PieChart,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export default function PortfolioCard({ data }) {
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    securities: false,
    allocation: false,
    metrics: false,
    privateEquity: false,
    jurisdictions: false,
  });
console.log(data, "data");
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // const data = {
  //   fullName: "Parshv Patel",
  //   entityName: "ERP Holdings LLC",
  //   geographicResidency: "United States",
  //   jurisdictions: ["Delaware", "New York", "Singapore", "United Kingdom"],
  //   preferredAssetClasses: ["equities", "realEstate", "privateCredit", "cash"],
  //   esgPreferences: [
  //     "environmental",
  //     "governance",
  //     "diversityInLeadership",
  //     "humanRights",
  //   ],
  //   liquidityHorizon: "long-term",
  //   riskTolerance: "moderate-aggressive",
  //   securities: [
  //     { ticker: "AAPL", quantity: 1200, id: 1747805010868 },
  //     { ticker: "MSFT", quantity: 950, id: 1747805013323 },
  //     { ticker: "VTI", quantity: 3000, id: 1747805015707 },
  //     { ticker: "TSLA", quantity: 300, id: 1747805016732 },
  //   ],
  //   positionmetrics: {
  //     unrealizedGains: 425000,
  //     beta: 1.08,
  //     sharpeRatio: 1.42,
  //     sortinoRatio: 2.05,
  //   },
  //   portfolioMetrics: {
  //     var: 15.7,
  //     cvar: 23.4,
  //     maxDrawdown: 19.2,
  //     esgWeightedBeta: 0.92,
  //   },
  //   transactions: [
  //     {
  //       ticker: "NVDA",
  //       type: "buy",
  //       amount: 150,
  //       price: 950.75,
  //       date: "2025-05-13",
  //       id: 1747805038283,
  //     },
  //   ],
  //   strategicAllocation: {
  //     equities: 55,
  //     fixedIncome: 15,
  //     realEstate: 12,
  //     privateCredit: 8,
  //     cash: 10,
  //   },
  //   actualAllocation: {
  //     equities: 63,
  //     fixedIncome: 11,
  //     realEstate: 9,
  //     privateCredit: 5,
  //     cash: 12,
  //   },
  //   privateEquityCommitments: [
  //     {
  //       fund: "Blackstone PE Fund XV",
  //       commitmentAmount: 2500000,
  //       calledAmount: 750000,
  //       distributionAmount: 95000,
  //       vintage: 2024,
  //       id: 1747805049379,
  //     },
  //   ],
  //   jurisdictionalExposure: [
  //     { jurisdiction: "US", exposurePercentage: 68, id: 1747805057203 },
  //     { jurisdiction: "EU", exposurePercentage: 17, id: 1747805057204 },
  //     { jurisdiction: "APAC", exposurePercentage: 15, id: 1747805057205 },
  //   ],
  // };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div className="flex items-center justify-center w-full">
      <Card className="w-[100%] overflow-hidden bg-black border-[#1a2547] text-white shadow-xl">
        <CardContent className="p-0">
          <div className="p-4 border-b border-[#1a2547] bg-[#0a0f24]">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {data.fullname}
                </h2>
                <p className="text-sm text-blue-300">{data.entityname}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-blue-900 text-blue-100 border border-blue-800">
                  {data.risktolerance} Risk Tole.
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-900 text-blue-100 border border-blue-800">
                  {data.liquidityhorizon} LH
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(60vh-120px)] custom-scrollbar">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="p-4 space-y-4"
            >
              {/* Portfolio Overview Section */}
              <motion.div variants={itemVariants} className="space-y-3">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection("overview")}
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-400" />
                    Portfolio Overview
                  </h3>
                  {expandedSections.overview ? (
                    <ChevronUp className="h-4 w-4 text-blue-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-blue-400" />
                  )}
                </div>

                {expandedSections.overview && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#0a1128] rounded-lg p-3 border border-[#1a2547]"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-blue-300">
                          Unrealized Gains
                        </p>
                        <p className="text-lg font-bold">
                          $
                          {data.positionmetrics.unrealizedGains.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-blue-300">
                          Latest Transaction
                        </p>
                        <p className="text-sm">
                          <span className="text-green-400">BUY</span>{" "}
                          {data.transactions[0]?.amount}{" "}
                          {data.transactions[0]?.ticker} @ $
                          {data.transactions[0]?.price}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Securities Section */}
              <motion.div variants={itemVariants} className="space-y-3">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection("securities")}
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-blue-400" />
                    Securities
                  </h3>
                  {expandedSections.securities ? (
                    <ChevronUp className="h-4 w-4 text-blue-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-blue-400" />
                  )}
                </div>

                {expandedSections.securities && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#0a1128] rounded-lg p-3 border border-[#1a2547]"
                  >
                    <div className="space-y-2">
                      {data.securities.map((security) => (
                        <div
                          key={security.id}
                          className="flex justify-between items-center p-2 hover:bg-blue-900 rounded-md transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-xs font-bold">
                              {security.ticker.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium">{security.ticker}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {security.quantity.toLocaleString()}
                            </p>
                            <p className="text-xs text-blue-300">shares</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Asset Allocation Section */}
              <motion.div variants={itemVariants} className="space-y-3">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection("allocation")}
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-blue-400" />
                    Asset Allocation
                  </h3>
                  {expandedSections.allocation ? (
                    <ChevronUp className="h-4 w-4 text-blue-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-blue-400" />
                  )}
                </div>

                {expandedSections.allocation && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#0a1128] rounded-lg p-3 border border-[#1a2547]"
                  >
                    <Tabs defaultValue="actual" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-[#0a1128]">
                        <TabsTrigger value="actual">Actual</TabsTrigger>
                        <TabsTrigger value="strategic">Strategic</TabsTrigger>
                      </TabsList>
                      <TabsContent value="actual" className="space-y-3 pt-3">
                        {Object.entries(data.actualallocation).map(
                          ([key, value]) => (
                            <div key={key} className="space-y-1">
                              <div className="flex justify-between items-center text-sm">
                                <span className="capitalize">{key}</span>
                                <span className="font-medium">{value}%</span>
                              </div>
                              <Progress
                                value={value}
                                className="h-1.5"
                                style={{
                                  background: "#1e3a8a",
                                  "--progress-background": "#3b82f6",
                                }}
                              />
                            </div>
                          )
                        )}
                      </TabsContent>
                      <TabsContent value="strategic" className="space-y-3 pt-3">
                        {Object.entries(data.strategicallocation).map(
                          ([key, value]) => (
                            <div key={key} className="space-y-1">
                              <div className="flex justify-between items-center text-sm">
                                <span className="capitalize">{key}</span>
                                <span className="font-medium">{value}%</span>
                              </div>
                              <Progress
                                value={value}
                                className="h-1.5"
                                style={{
                                  background: "#1e3a8a",
                                  "--progress-background": "#3b82f6",
                                }}
                              />
                            </div>
                          )
                        )}
                      </TabsContent>
                    </Tabs>
                  </motion.div>
                )}
              </motion.div>

              {/* Portfolio Metrics Section */}
              <motion.div variants={itemVariants} className="space-y-3">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection("metrics")}
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    Portfolio Metrics
                  </h3>
                  {expandedSections.metrics ? (
                    <ChevronUp className="h-4 w-4 text-blue-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-blue-400" />
                  )}
                </div>

                {expandedSections.metrics && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#0a1128] rounded-lg p-3 border border-[#1a2547]"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <h4 className="text-sm text-blue-300">
                          Position Metrics
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(data.positionmetrics).map(
                            ([key, value], index) => (
                              <div
                                key={index}
                                className="p-2 bg-blue-900 rounded-md"
                              >
                                <p className="text-xs text-blue-300 capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </p>
                                <p className="font-medium">
                                  {typeof value === "number" &&
                                  key.includes("unrealized")
                                    ? `$${value.toLocaleString()}`
                                    : value}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm text-blue-300">Risk Metrics</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(data.portfoliometrics).map(
                            ([key, value], index) => (
                              <div
                                key={index}
                                className="p-2 bg-blue-900 rounded-md"
                              >
                                <p className="text-xs text-blue-300 capitalize">
                                  {key === "var"
                                    ? "VaR"
                                    : key === "cvar"
                                    ? "CVaR"
                                    : key.replace(/([A-Z])/g, " $1").trim()}
                                </p>
                                <p className="font-medium">{value}</p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Private Equity Section */}
              <motion.div variants={itemVariants} className="space-y-3">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection("privateEquity")}
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-blue-400" />
                    Private Equity
                  </h3>
                  {expandedSections.privateEquity ? (
                    <ChevronUp className="h-4 w-4 text-blue-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-blue-400" />
                  )}
                </div>

                {expandedSections.privateEquity && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#0a1128] rounded-lg p-3 border border-[#1a2547]"
                  >
                    {data.privateequitycommitments.map((commitment) => (
                      <div key={commitment.id} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{commitment.fund}</h4>
                            <p className="text-xs text-blue-300">
                              Vintage: {commitment.vintage}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              ${commitment.commitmentAmount.toLocaleString()}
                            </p>
                            <p className="text-xs text-blue-300">Commitment</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Called Capital</span>
                            <span>
                              ${commitment.calledAmount.toLocaleString()} (
                              {(
                                (commitment.calledAmount /
                                  commitment.commitmentAmount) *
                                100
                              ).toFixed(1)}
                              %)
                            </span>
                          </div>
                          <Progress
                            value={
                              (commitment.calledAmount /
                                commitment.commitmentAmount) *
                              100
                            }
                            className="h-1.5"
                            style={{
                              background: "#1e3a8a",
                              "--progress-background": "#3b82f6",
                            }}
                          />
                        </div>

                        <div className="flex justify-between text-xs">
                          <span>Distributions</span>
                          <span>
                            ${commitment.distributionAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>

              {/* Jurisdictional Exposure Section */}
              <motion.div variants={itemVariants} className="space-y-3">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection("jurisdictions")}
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-400" />
                    Jurisdictional Exposure
                  </h3>
                  {expandedSections.jurisdictions ? (
                    <ChevronUp className="h-4 w-4 text-blue-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-blue-400" />
                  )}
                </div>

                {expandedSections.jurisdictions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#0a1128] rounded-lg p-3 border border-[#1a2547]"
                  >
                    <div className="space-y-3">
                      {data.jurisdictionalexposure.map((exposure) => (
                        <div key={exposure.id} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span>{exposure.jurisdiction}</span>
                            <span className="font-medium">
                              {exposure.exposurePercentage}%
                            </span>
                          </div>
                          <Progress
                            value={exposure.exposurePercentage}
                            className="h-1.5"
                            style={{
                              background: "#1e3a8a",
                              "--progress-background":
                                exposure.jurisdiction === "US"
                                  ? "#3b82f6"
                                  : exposure.jurisdiction === "EU"
                                  ? "#60a5fa"
                                  : "#93c5fd",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}