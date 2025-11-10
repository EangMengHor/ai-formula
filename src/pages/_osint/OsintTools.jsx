import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { osintInvestigation } from "@/services/osint/osintInvestigation";

const QUERY_TYPES = [
  { value: "email", label: "Email Address" },
  { value: "phone", label: "Phone Number" },
  { value: "name", label: "Full Name" },
  { value: "username", label: "Username" },
];

export default function OsintTools() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setValidationError("");
    setError("");

    // Validation
    if (value.length > 50) {
      setValidationError("Query must be less than 50 characters");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setValidationError("");

    // Validation
    if (!query.trim()) {
      setValidationError("Please enter a query");
      return;
    }

    if (query.length > 50) {
      setValidationError("Query must be less than 50 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await osintInvestigation({
        query: query.trim(),
        type: selectedType,
      });

      if (result.success) {
        // Store result and navigate to findings page
        sessionStorage.setItem("osintResult", JSON.stringify(result.data.data));
        sessionStorage.setItem("osintQuery", query.trim());
        sessionStorage.setItem("osintType", selectedType);
        navigate("/osint-finding");
      } else {
        setError(result.error || "Investigation failed. Please try again.");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-2xl px-4 py-12 md:py-20">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-lg bg-slate-900 p-3">
              <Search className="h-8 w-8 text-slate-300" />
            </div>
          </div>
          <h1 className="mb-2 text-4xl font-bold text-white">
            OSINT Investigation
          </h1>
          <p className="text-slate-400">
            Discover publicly available information about emails, phone numbers,
            names, and usernames
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Query Type Selection */}
            <div>
              <label className="mb-3 block text-sm font-medium text-slate-300">
                Search Type
              </label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {QUERY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedType(type.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      selectedType === type.value
                        ? "border-blue-500 bg-blue-500/10 text-blue-300"
                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Query Input */}
            <div>
              <label
                htmlFor="query"
                className="mb-3 block text-sm font-medium text-slate-300"
              >
                Enter {QUERY_TYPES.find((t) => t.value === selectedType)?.label}
              </label>
              <div className="relative">
                <Input
                  id="query"
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder={`Enter ${selectedType} (max 50 characters)`}
                  disabled={loading}
                  className="border-slate-700 bg-slate-800 placeholder:text-slate-500"
                />
                {query && !validationError && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {query.length}/50 characters
                </span>
                {validationError && (
                  <span className="text-xs text-red-400">{validationError}</span>
                )}
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-900/30 bg-red-900/10 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-300">Error</p>
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !query.trim() || validationError}
              className="w-full gap-2 bg-blue-600 py-2 text-base font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Investigating... (this may take 30-60 seconds)
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Start Investigation
                </>
              )}
            </Button>
          </form>

          {/* Info Section */}
          <div className="mt-8 border-t border-slate-800 pt-6">
            <h3 className="mb-4 text-sm font-semibold text-slate-300">
              How it works
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Enter an email, phone number, name, or username</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Our OSINT tools search through multiple databases</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  Results include breach records, contact info, and digital
                  footprint
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Download results in table or list format</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
