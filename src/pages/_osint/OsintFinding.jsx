import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, AlertCircle, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  IdentitySection,
  ContactsSection,
  ProfessionalSection,
  DigitalFootprintSection,
  LocationsSection,
  BreachDataSection,
  WebIntelligenceSection,
  OverviewStats,
} from "./components/OsintSections";
import { downloadOsintPDF } from "./components/generateOsintPDF";

export default function OsintFinding() {
  const navigate = useNavigate();
  const [osintData, setOsintData] = useState(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Retrieve data from session storage
    const storedResult = sessionStorage.getItem("osintResult");
    const storedQuery = sessionStorage.getItem("osintQuery");
    const storedType = sessionStorage.getItem("osintType");

    if (!storedResult || !storedQuery || !storedType) {
      // No data, redirect back to tools
      navigate("/osint-tools");
      return;
    }

    try {
      const parsedData = JSON.parse(storedResult);
      setOsintData(parsedData);
      setQuery(storedQuery);
      setType(storedType);
    } catch (error) {
      console.error("Error parsing OSINT data:", error);
      navigate("/osint-tools");
    }
  }, [navigate]);

  const handleDownload = async () => {
    if (!osintData) return;

    setDownloading(true);
    try {
      const result = await downloadOsintPDF(osintData, query, type);
      if (!result.success) {
        alert(`Failed to download: ${result.error}`);
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (!osintData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-blue-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading investigation results...</p>
        </div>
      </div>
    );
  }

  const data = osintData.data || {};
  // Check if osintData itself has success field (from API response wrapper)
  const hasError = osintData.success === false;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/osint-tools")}
              variant="outline"
              size="sm"
              className="border-slate-700 hover:bg-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Investigation Results
              </h1>
              <p className="text-sm text-slate-400">
                Search:{" "}
                <span className="font-mono text-slate-300">{query}</span> (
                {type})
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {hasError && (
          <div className="mb-6 rounded-lg border border-red-900/30 bg-red-900/10 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-300">Investigation Failed</h3>
              <p className="text-sm text-red-200">
                {data.message || "Unable to complete the investigation."}
              </p>
            </div>
          </div>
        )}

        {/* Success with metadata */}
        {!hasError && data.investigation_overview && (
          <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Investigation Time</span>
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-200">
                {(osintData.investigation_time_ms / 1000).toFixed(2)}s
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Zap className="h-4 w-4" />
                <span className="text-xs">Recursive Data Finding Depth</span>
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-200">
                {osintData.api_calls_made} Recursion Levels
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Download className="h-4 w-4" />
                <span className="text-xs">Download Report</span>
              </div>
              <Button
                onClick={() => handleDownload()}
                disabled={downloading}
                className="mt-2 w-full gap-2 bg-blue-600 hover:bg-blue-700 text-xs py-1"
              >
                {downloading ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-3 w-3" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Summary */}
        {data.summary && (
          <div className="mb-6 rounded-lg border border-blue-900/30 bg-blue-900/10 p-4">
            <p className="text-sm leading-relaxed text-blue-200">
              {data.summary}
            </p>
          </div>
        )}

        {/* Overview Statistics */}
        {data.investigation_overview && (
          <div className="mb-8">
            <OverviewStats data={data} />
          </div>
        )}

        {/* Content Sections */}
        {!hasError && (
          <div className="space-y-4">
            <IdentitySection data={data} />
            <ContactsSection data={data} />
            <ProfessionalSection data={data} />
            <DigitalFootprintSection data={data} />
            <LocationsSection data={data} />
            <BreachDataSection data={data} />
            <WebIntelligenceSection data={data} />
          </div>
        )}

        {/* Download Section at Bottom */}
        {!hasError && (
          <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900/30 p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-200">
              Download Full Report
            </h3>
            <p className="mb-4 text-sm text-slate-400">
              Export your OSINT investigation results as a comprehensive PDF
              report for further analysis or documentation.
            </p>
            <Button
              onClick={() => handleDownload()}
              disabled={downloading}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {downloading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download as PDF
                </>
              )}
            </Button>
          </div>
        )}

        {/* New Investigation Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => {
              sessionStorage.removeItem("osintResult");
              sessionStorage.removeItem("osintQuery");
              sessionStorage.removeItem("osintType");
              navigate("/osint-tools");
            }}
            className="gap-2"
          >
            Start New Investigation
          </Button>
        </div>
      </div>
    </div>
  );
}
