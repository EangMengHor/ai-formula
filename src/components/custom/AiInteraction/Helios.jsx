import { useState } from "react";
import {
  ArrowDownNarrowWide,
  BarChart3,
  Blend,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Cog,
  FileCheck,
  Flag,
  Globe,
  Lightbulb,
  ListFilter,
  Loader2,
  Search,
  ShieldCheck,
  Sparkle,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ChatSimulation from "./ChatSimulation";

export default function Helios({ heliosObject = {}, isLoading }) {
  const loadingObject = [
    {
      phase: "metadata",
      message: "Generating Classifications",
      isOptional: false,
    },
    {
      phase: "internet",
      message: "Checking Internet Requirement",
      isOptional: true,
    },

    {
      phase: "executing",
      message: "Executing Tasks",
      isOptional: false,
    },
    {
      phase: "auditPlan",
      message: "Generating Audit Plan",
      isOptional: false,
    },
    {
      phase: "auditing",
      message: "Auditing Results",
      isOptional: false,
    },
  ];

  const phaseKeys = {
    metadata: "metadata",
    internet: "internetSearchMetadata",
    executing: "executionPlan",
    auditPlan: "auditPlan",
    auditing: "agents",
  };

  let currentLoadingPhase = null;
  for (let i = 0; i < loadingObject.length; i++) {
    const phase = loadingObject[i];
    const key = phaseKeys[phase.phase];
    if (!heliosObject[key]) {
      if (
        phase.isOptional &&
        i + 1 < loadingObject.length &&
        heliosObject[phaseKeys[loadingObject[i + 1].phase]]
      ) {
        // skip optional if next is present
        continue;
      } else {
        currentLoadingPhase = phase;
        break;
      }
    }
  }

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    warnings: false,
    improvements: false,
    longTerm: false,
    contradictions: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  console.log("Helios Object:", heliosObject);
  return (
    <div className="mt-5 mb-2 bg-gradient-to-r from-g2/70 to-g1/70 w-full px-4 py-4 rounded-2xl max-w-4xl ">
      <div
        className={`flex justify-between items-center cursor-pointer
                                        ${
                                          !isCollapsed
                                            ? "rounded-t-2xl mb-4 "
                                            : "transition-all rounded-2xl"
                                        }`}
        onClick={() => setIsCollapsed((prev) => !prev)}
      >
        <div className="flex gap-2 font-semibold items-center text-slate-200">
          <Blend width={18} height={18} />
          <p>Agentic Helios</p>
        </div>
        <button className="text-slate-400 hover:text-slate-100 transition-colors duration-200 flex items-center gap-1">
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          <span className="text-sm">{isCollapsed ? "Expand" : "Collapse"}</span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.12, ease: "easeInOut" }}
            className="space-y-3 mt-2 "
          >
            {heliosObject?.metadata && (
              <div className="bg-blue-900/40 p-3 rounded-xl w-full space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2 border-b border-blue-700/50 pb-1">
                  <BarChart3 size={18} className="text-blue-300" />
                  <p className="text-slate-200 font-medium">Classification</p>
                </div>

                {/* Content */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300 ml-1">
                  {/* Complexity */}
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-slate-400">
                      Complexity:
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                        heliosObject?.metadata?.complexity === "high"
                          ? "bg-red-500/20 text-red-400"
                          : heliosObject?.metadata?.complexity === "mid"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {heliosObject?.metadata?.complexity || "N/A"}
                    </span>
                  </div>

                  {/* Domain */}
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-slate-400">Domain:</span>
                    <span>{heliosObject?.metadata?.domain || "N/A"}</span>
                  </div>

                  {/* Compliance Flags */}
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-slate-400">
                      Compliance Flags:
                    </span>
                    {heliosObject?.metadata?.complianceFlags?.length ? (
                      <div className="flex gap-1 flex-wrap">
                        {heliosObject.metadata.complianceFlags.map(
                          (flag, idx) => (
                            <span
                              key={idx}
                              className="bg-blue-700/30 text-blue-300 px-2 py-0.5 rounded-lg text-xs"
                            >
                              {flag}
                            </span>
                          ),
                        )}
                      </div>
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {heliosObject?.internetSearchMetadata &&
              heliosObject.internetSearchMetadata.queries?.length > 0 && (
                <div className="bg-blue-900/40 p-3 rounded-xl w-full space-y-3">
                  <div className="flex items-center gap-2 border-b border-blue-700/50 pb-1">
                    <Globe size={18} className="text-blue-300" />
                    <p className="text-slate-200 font-medium">
                      Internet Search
                    </p>
                  </div>
                  <div className="space-y-3">
                    {heliosObject.internetSearchMetadata.queries?.map(
                      (query, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50"
                        >
                          <div className="flex items-start gap-3">
                            <Search
                              size={18}
                              className="text-blue-400 mt-0.5 flex-shrink-0"
                            />
                            <div className="flex-1">
                              <p className="text-slate-200 font-medium text-sm leading-relaxed">
                                {query.query}
                              </p>
                              <div className="mt-2 pt-2 border-t border-slate-600/50">
                                <p className="text-slate-300 text-sm leading-relaxed">
                                  {query.answer}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            {heliosObject?.executionPlan &&
              heliosObject.executionPlan.length > 0 && (
                <div className="bg-blue-900/40 px-3 py-2 rounded-xl w-full">
                  <div className="flex items-center gap-2 border-b border-blue-700/50 pb-1 pt-2">
                    <Cog size={18} className="text-blue-300" />
                    <p className="text-slate-200 font-medium">Execution Plan</p>
                  </div>
                  <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                    {heliosObject.executionPlan.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

            {heliosObject?.finalAnswer && heliosObject.finalAnswer.trim() && (
              <div className="bg-blue-900/40 p-3 rounded-xl w-full space-y-3">
                <div className="flex items-center gap-2 border-b border-blue-700/50 pb-1">
                  <Flag size={18} className="text-blue-300" />
                  <p className="text-slate-200 font-medium">Final Answer</p>
                </div>
                <p className="text-sm text-slate-300">
                  {heliosObject.finalAnswer}
                </p>
              </div>
            )}

            {heliosObject?.agents?.analysisAgent &&
              heliosObject.agents.analysisAgent.length > 0 && (
                <div className="bg-blue-900/40 px-2 my-2 rounded-xl w-full ">
                  <div className="flex gap-2 pt-2 items-center">
                    <Users size={18} className="text-blue-300" />
                    <p>Executor Agent</p>
                  </div>
                  <ChatSimulation
                    personas={heliosObject?.agents?.analysisAgent.map((i) => {
                      let obj = i;

                      if (!i.goal && i.goals) {
                        obj.goal = i.goals[0];
                      }
                      if (!i?.team) {
                        obj.team = [];
                      }
                      return obj;
                    })}
                    wrapper={false}
                  />
                </div>
              )}

            {heliosObject?.agents?.auditAgent &&
              heliosObject?.agents?.auditAgent.length > 0 && (
                <div className="bg-blue-900/40 px-2 my-2 rounded-xl w-full ">
                  <div className="flex gap-2 pt-2 items-center">
                    <ShieldCheck size={18} className="text-blue-300" />
                    <p>Audit Agent</p>
                  </div>
                  <ChatSimulation
                    personas={heliosObject?.agents?.auditAgent.map((i) => {
                      let obj = i;

                      if (!i.goal && i.goals) {
                        obj.goal = i.goals[0];
                      }
                      if (!i?.team) {
                        obj.team = [];
                      }
                      return obj;
                    })}
                    wrapper={false}
                  />
                </div>
              )}

            {heliosObject?.auditPlan && heliosObject?.auditPlan?.length > 0 && (
              <div className="bg-blue-900/40 p-3 rounded-xl w-full space-y-3">
                <div className="flex items-center gap-2 border-b border-blue-700/50 pb-1">
                  <FileCheck size={18} className="text-blue-300" />
                  <p className="text-slate-200 font-medium">Audit Plan</p>
                </div>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                  {heliosObject.auditPlan.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {heliosObject?.audit && (
              <div className="bg-blue-900/40 p-3 rounded-xl w-full space-y-3">
                <div className="flex items-center gap-2 border-b border-blue-700/50 pb-1">
                  <CheckCircle size={18} className="text-blue-300" />
                  <p className="text-slate-200 font-medium">Audit Results</p>
                </div>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Quality:</span>
                    <span className="text-green-400 font-semibold">
                      {heliosObject.audit.quality}%
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Citations:</span>{" "}
                    {heliosObject.audit.citationStats.total} (
                    {heliosObject.audit.citationStats.topTier.join(", ")})
                  </div>
                  {heliosObject.audit.warnings.length > 0 && (
                    <div>
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:text-slate-100 transition-colors"
                        onClick={() => toggleSection("warnings")}
                      >
                        {expandedSections.warnings ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                        <span className="font-medium">
                          Warnings ({heliosObject.audit.warnings.length})
                        </span>
                      </div>
                      {expandedSections.warnings && (
                        <ul className="list-disc list-inside mt-1 ml-6 space-y-1">
                          {heliosObject.audit.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {heliosObject.audit.longTermImprovements.length > 0 && (
                    <div>
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:text-slate-100 transition-colors"
                        onClick={() => toggleSection("longTerm")}
                      >
                        {expandedSections.longTerm ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                        <span className="font-medium">
                          Long-term (
                          {heliosObject.audit.longTermImprovements.length})
                        </span>
                      </div>
                      {expandedSections.longTerm && (
                        <ul className="list-disc list-inside mt-1 ml-6 space-y-1">
                          {heliosObject.audit.longTermImprovements.map(
                            (improvement, idx) => (
                              <li key={idx}>{improvement}</li>
                            ),
                          )}
                        </ul>
                      )}
                    </div>
                  )}
                  {heliosObject.audit.contradictions.length > 0 && (
                    <div>
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:text-slate-100 transition-colors"
                        onClick={() => toggleSection("contradictions")}
                      >
                        {expandedSections.contradictions ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                        <span className="font-medium">
                          Contradictions (
                          {heliosObject.audit.contradictions.length})
                        </span>
                      </div>
                      {expandedSections.contradictions && (
                        <ul className="list-disc list-inside mt-1 ml-6 space-y-1">
                          {heliosObject.audit.contradictions.map(
                            (contradiction, idx) => (
                              <li key={idx}>{contradiction}</li>
                            ),
                          )}
                        </ul>
                      )}
                    </div>
                  )}

                  {heliosObject.audit.improvements.length > 0 && (
                    <div>
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:text-slate-100 transition-colors"
                        onClick={() => toggleSection("improvements")}
                      >
                        {expandedSections.improvements ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                        <span className="font-medium">
                          Improvements ({heliosObject.audit.improvements.length}
                          )
                        </span>
                      </div>
                      {expandedSections.improvements && (
                        <ul className="list-disc list-inside mt-1 ml-6 space-y-1">
                          {heliosObject.audit.improvements.map(
                            (improvement, idx) => (
                              <li key={idx}>{improvement}</li>
                            ),
                          )}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {heliosObject?.selfImprovement &&
              heliosObject.selfImprovement.trim() && (
                <div className="bg-blue-900/40 p-3 rounded-xl w-full space-y-3">
                  <div className="flex items-center gap-2 border-b border-blue-700/50 pb-1">
                    <Lightbulb size={18} className="text-blue-300" />
                    <p className="text-slate-200 font-medium">
                      Self Improvement
                    </p>
                  </div>
                  <p className="text-sm text-slate-300">
                    {heliosObject.selfImprovement}
                  </p>
                  {heliosObject.selfImprovementDataRetrieved && (
                    <p className="text-sm text-slate-400">
                      {heliosObject.selfImprovementDataRetrieved}
                    </p>
                  )}
                </div>
              )}
            {isLoading && currentLoadingPhase && (
              <div className="bg-blue-900/40 p-3 rounded-xl w-full space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin text-blue-300" />
                  <p className="text-slate-200 font-medium">
                    {currentLoadingPhase.message}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
