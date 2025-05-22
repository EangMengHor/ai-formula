"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

// Form Steps
import NameStep from "./NameStep";
import EntityStep from "./EntityStep";
import ResidencyStep from "./ResidencyStep";
import JurisdictionsStep from "./JurisdictionsStep";
import AssetClassStep from "./AssetClassStep";
import EsgPreferencesStep from "./EsgPreferencesStep";
import RiskToleranceStep from "./RiskToleranceStep";
import LiquidityStep from "./LiquidityStep";
import SecurityStep from "./SecurityStep";
import PositionMetricsStep from "./PositionMetricsStep";
import PortfolioMetricsStep from "./PortfolioMetricsStep";
import TransactionStep from "./TransactionStep";
import AllocationStep from "./AllocationStep";
import ComplianceStep from "./ComplianceStep";
import TaxStrategiesStep from "./TaxStrategiesStep";
import ConstraintsStep from "./ConstraintsStep";
import GoalsStep from "./GoalsStep";
import CompletionStep from "./CompletionStep";
import JamesLogo from "@/pages/_private/components/sidebarProvided/components/JamesLogo";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_SOCKET_URL;

export default function PersonalProfileForm() {
  const { user } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    userId: user.id,
    fullName: "",
    entityName: "",
    geographicResidency: "",
    jurisdictions: [],
    preferredAssetClasses: [],
    esgPreferences: [],
    liquidityHorizon: "",
    riskTolerance: "",
    securities: [],
    positionMetrics: {
      unrealizedGains: 0,
      beta: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
    },
    portfolioMetrics: {
      var: 0,
      cvar: 0,
      maxDrawdown: 0,
      esgWeightedBeta: 0,
    },
    transactions: [],
    strategicAllocation: {},
    actualAllocation: {},
    privateEquityCommitments: [],
    jurisdictionalExposure: [],
    taxOptimizationStrategies: [],
    crossBorderConstraints: [],
    optimizationGoals: [],
    constraints: {
      liquidity: 0,
      exposureLimits: {
        singleSecurity: "",
        singleSector: "",
        internationalMarkets: "",
        alternativeInvestments: "",
      },
      drawdownCeilings: 0,
    },
  });

  const getFormDataForApi = useCallback(() => {
    const apiData = JSON.parse(JSON.stringify(formData));
    return apiData;
  }, [formData]);

  const submitToApi = useCallback(async () => {
    const apiData = getFormDataForApi();
    try {
      const response = await fetch(BASE_URL + "/api/personalProfile/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });
      if (response.ok) {
        toast({
          title: "Profile submitted successfully",
          description: "Your profile has been submitted successfully",
          duration: 3000,
          position: "top-right",
        });
        navigate("/addToPersonalKnowledgeBase", {
          replace: true,
          state: { isFirstTime: true },
        });
      } else {
        toast({
          title: "Profile submission failed",
          description: "Please try again",
          duration: 3000,
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      throw error;
    }
  }, [getFormDataForApi, navigate]);

  const steps = [
    {
      component: [
        <NameStep
          key="nameStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="nameVisualization">Name Visualization</div>,
      ],
      canProceed: formData.fullName.trim() !== "",
    },
    {
      component: [
        <EntityStep
          key="entityStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="entityVisualization">Entity Visualization</div>,
      ],
      canProceed: true,
    },
    {
      component: [
        <ResidencyStep
          key="residencyStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="residencyVisualization">Residency Visualization</div>,
      ],
      canProceed: formData.geographicResidency.trim() !== "",
    },
    {
      component: [
        <JurisdictionsStep
          key="jurisdictionsStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="jurisdictionsVisualization">Jurisdictions Visualization</div>,
      ],
      canProceed: true,
    },
    {
      component: [
        <AssetClassStep
          key="assetClassStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="assetClassVisualization">Asset Class Visualization</div>,
      ],
      canProceed: formData.preferredAssetClasses.length > 0,
    },
    {
      component: [
        <EsgPreferencesStep
          key="esgPreferencesStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="esgPreferencesVisualization">
          ESG Preferences Visualization
        </div>,
      ],
      canProceed: true,
    },
    {
      component: [
        <RiskToleranceStep
          key="riskToleranceStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="riskToleranceVisualization">
          Risk Tolerance Visualization
        </div>,
      ],
      canProceed: formData.riskTolerance !== "",
    },
    {
      component: [
        <LiquidityStep
          key="liquidityStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="liquidityVisualization">Liquidity Visualization</div>,
      ],
      canProceed: formData.liquidityHorizon !== "",
    },
    {
      component: [
        <SecurityStep
          key="securityStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="securityVisualization">Security Visualization</div>,
      ],
      canProceed: true,
    },
    {
      component: [
        <PositionMetricsStep
          key="positionMetricsStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="positionMetricsVisualization">
          Position Metrics Visualization
        </div>,
      ],
      canProceed: true,
    },
    {
      component: [
        <PortfolioMetricsStep
          key="portfolioMetricsStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="portfolioMetricsVisualization">
          Portfolio Metrics Visualization
        </div>,
      ],
      canProceed: true,
    },
    {
      component: [
        <TransactionStep
          key="transactionStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="transactionVisualization">Transaction Visualization</div>,
      ],
      canProceed: true,
    },
    {
      component: [
        <AllocationStep
          key="allocationStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="allocationVisualization">Allocation Visualization</div>,
      ],
      canProceed: true,
    },
    {
      component: [
        <ComplianceStep
          key="complianceStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="complianceVisualization">Compliance Visualization</div>,
      ],
      canProceed: true,
    },
    {
      component: [
        <TaxStrategiesStep
          key="taxStrategiesStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="taxStrategiesVisualization">
          Tax Strategies Visualization
        </div>,
      ],
      canProceed: true,
    },
    {
      component: [
        <ConstraintsStep
          key="constraintsStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="constraintsVisualization">Constraints Visualization</div>,
      ],
      canProceed: true,
    },
    {
      component: [
        <GoalsStep
          key="goalsStep"
          formData={formData}
          setFormData={setFormData}
        />,
        <div key="goalsVisualization">Goals Visualization</div>,
      ],
      canProceed: true,
    },
    {
      component: [
        <CompletionStep
          key="completionStep"
          formData={formData}
          getFormDataForApi={getFormDataForApi}
          submitToApi={submitToApi}
        />,
        <div key="completionVisualization">Completion Visualization</div>,
      ],
      canProceed: true,
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1 && steps[currentStep].canProceed) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const calculateProgress = () => {
    return Math.round(((currentStep + 1) / steps.length) * 100);
  };

  return (
    <div className="min-h-screen bg-[#1a1f2c] text-white flex flex-col">
      <div className="w-full px-4 py-2">
        <Progress
          value={calculateProgress()}
          className="h-1 bg-gray-700"
          indicatorClassName="bg-blue-500"
        />
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Form section */}
        <div className="w-full p-6 md:p-12 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <div className="w-fit h-fit">
              <JamesLogo />
            </div>
            <motion.div
              key={`form-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              {Array.isArray(steps[currentStep].component)
                ? steps[currentStep].component[0]
                : steps[currentStep].component}
            </motion.div>
          </AnimatePresence>

          <div className="flex md:w-1/2 justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!steps[currentStep].canProceed}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={submitToApi}
              >
                Submit Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
