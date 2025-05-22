"use client";

import { useState } from "react";
import {
  CheckCircle,
  Download,
  BarChart3,
  TrendingUp,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompletionStep({
  formData,
  getFormDataForApi,
  submitToApi,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitToApi();
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(
        "There was an error submitting your profile. Please try again.",
      );
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    const data = getFormDataForApi();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.fullName.replace(/\s+/g, "_")}_investor_profile.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return [
    <div key="form" className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Your investor profile is ready!
        </h1>
        <p className="text-gray-400">
          We've gathered all the information needed to create your personalized
          investment strategy.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <div className="bg-[#2a3042] rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-white">
                Profile Complete
              </h3>
              <p className="text-gray-400 mt-1">
                Your investor profile contains all the essential information for
                AI-powered analysis.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#2a3042] rounded-lg p-4">
          <div className="flex items-start">
            <BarChart3 className="h-5 w-5 text-blue-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-white">
                AI-Powered Insights
              </h3>
              <p className="text-gray-400 mt-1">
                Our AI will analyze your profile to identify opportunities,
                risks, and optimization strategies.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#2a3042] rounded-lg p-4">
          <div className="flex items-start">
            <TrendingUp className="h-5 w-5 text-purple-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-white">
                Personalized Strategy
              </h3>
              <p className="text-gray-400 mt-1">
                Get tailored investment recommendations based on your unique
                profile and goals.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#2a3042] rounded-lg p-4">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-white">
                Secure & Private
              </h3>
              <p className="text-gray-400 mt-1">
                Your data is securely stored and used only to provide
                personalized investment insights.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <Button
          onClick={handleDownload}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
        >
          <Download className="h-4 w-4 mr-2" /> Download Profile Data
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || submitSuccess}
          className={`w-full py-2 ${
            submitSuccess
              ? "bg-green-600 hover:bg-green-600 text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
        >
          {isSubmitting
            ? "Submitting..."
            : submitSuccess
              ? "Submitted Successfully!"
              : "Submit to API"}
        </Button>

        {submitError && (
          <div className="text-red-500 text-sm text-center">{submitError}</div>
        )}
      </div>

      <div className="mt-8">
        <p className="text-blue-400 text-sm">
          "AI will continuously monitor market conditions and update your
          strategy to keep you on track toward your financial goals."
        </p>
      </div>
    </div>,

    <div
      key="visual"
      className="flex flex-col items-center justify-center h-full"
    >
      <div className="w-64 h-64 bg-[#2a3042] rounded-lg flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Profile Complete
          </h3>
          <p className="text-gray-400 text-sm">
            Ready for AI-powered investment analysis
          </p>
          <button
            onClick={handleDownload}
            className="mt-4 flex items-center justify-center w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Profile
          </button>
        </div>
      </div>
      <p className="mt-6 text-gray-400 text-center max-w-xs">
        Your profile will help AI create a personalized investment strategy
        aligned with your goals
      </p>
    </div>,
  ];
}
