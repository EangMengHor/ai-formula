import { useToast } from "@/hooks/use-toast";
import { generateFileName } from "@/services/genereteFileName";
import {
  FileDown,
  Loader2,
  Sparkle,
  Users,
  Link,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ArrowUpRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { sanitizeFileName } from "@/lib/utils";
import { useChatCtx } from "@/context/ChatContext";
import { handlePdfDownload } from "@/pages/_private/components/sidebarProvided/chat/PdfDownload";
import { motion, AnimatePresence } from "framer-motion";
export default function DownloadThreadWithUser({
  button,
  dialogHeader = "Download Chat Thread",
  content = null, // Optional markdown content
}) {
  const [isPdfDownloadLoading, setIsPdfDownloadLoading] = useState(false);
  const [isPdfAutonameLoading, setIsPdfAutonameLoading] = useState(false);
  const [pdfFileName, setPdfFileName] = useState(
    content ? "Document" : "Chat Thread",
  );
  const [fullContent, setFullContent] = useState("");
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [conversationPairs, setConversationPairs] = useState([]);
  const [showSequenceSelection, setShowSequenceSelection] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { conversation } = useChatCtx();

  useEffect(() => {
    if (content) {
      setFullContent(content);
      return;
    }

    if (!conversation || conversation.length === 0) {
      setFullContent("No conversation available");
      setConversationPairs([]);
      return;
    }

    // Process conversation into pairs for selection UI
    const pairs = [];
    for (let i = 0; i < conversation.length - 1; i += 2) {
      const humanMsg = conversation[i];
      const aiMsg = conversation[i + 1];

      if (humanMsg?.role === "human" && aiMsg?.role === "ai") {
        // Count agents and citations
        const agentCount =
          aiMsg?.message?.find((msg) => msg.type === "simulation")?.items
            ?.length || 0;
        const citationCount = aiMsg?.citations?.length || 0;

        // Get response preview
        const textContent =
          aiMsg.message
            ?.filter((msg) => msg.type === "text")
            ?.map((msg) => msg.content)
            ?.join(" ") || "No response";

        const preview =
          textContent.length > 100
            ? textContent.substring(0, 100) + "..."
            : textContent;

        pairs.push({
          id: i,
          prompt: humanMsg.message || "No prompt",
          response: textContent,
          preview: preview,
          agentCount,
          citationCount,
          humanItem: humanMsg,
          aiItem: aiMsg,
        });
      }
    }

    setConversationPairs(pairs);
    setSelectedConversations(pairs.map((p) => p.id)); // Select all by default

    // Generate content for selected conversations only if showing sequence selection
    if (showSequenceSelection) {
      generateSelectedContent(
        pairs,
        pairs.map((p) => p.id),
      );
    } else {
      // Generate full conversation content
      generateFullContent(pairs);
    }
  }, [conversation, content, showSequenceSelection]);

  const generateFullContent = (pairs) => {
    if (content) return;

    let chatContent = "# Chat Thread\n\n";

    pairs.forEach((pair) => {
      const { humanItem, aiItem } = pair;

      // Add user prompt
      chatContent += `# ${humanItem.message}\n\n`;

      // Process AI response
      const isSimulation = aiItem?.message?.some(
        (msg) => msg.type === "simulation",
      );
      let simulationData = "";

      if (isSimulation) {
        const allAgent = aiItem.message.find(
          (msg) => msg.type === "simulation",
        )?.items;

        if (Array.isArray(allAgent) && allAgent.length > 0) {
          allAgent.forEach((agent) => {
            simulationData += `

---

### Agent Name: **${agent?.title || "N/A"}**

- **Goal:** ${agent?.goal || "N/A"}
${agent?.team?.length ? `- **Collaborated With:** ${agent.team.join(", ")}` : ""}
- **Response:**

${agent?.content || "N/A"}

`;
          });

          simulationData = `# 🧪 Agentic Simulation\n\n${simulationData}\n\n---\n\n## Final Output:\n\n`;
        }
      }

      const textContent =
        aiItem.message
          ?.filter((msg) => msg.type === "text")
          ?.map((msg) => msg.content)
          ?.join("\n\n") || "Error";

      // Citations
      const citationsArray = aiItem?.citations;
      let citationsBlock = "";
      if (Array.isArray(citationsArray) && citationsArray.length > 0) {
        citationsBlock += `\n\n### Citations:\n`;
        citationsArray.forEach((citation, i) => {
          citationsBlock += `${citation?.url}\n`;
        });
      }

      chatContent += `---\n\n${simulationData}${textContent}${citationsBlock}\n\n`;
    });

    setFullContent(chatContent);
  };

  const generateSelectedContent = (pairs, selectedIds) => {
    if (content) return;

    let chatContent =
      pdfFileName !== "Chat Thread" ? `# ${pdfFileName}\n\n` : "\n";

    pairs.forEach((pair) => {
      if (!selectedIds.includes(pair.id)) return;

      const { humanItem, aiItem } = pair;

      // Add user prompt
      chatContent += ` ### Prompt : ${humanItem.message.replace(/\n/g, " ")}\n`;

      // Process AI response
      const isSimulation = aiItem?.message?.some(
        (msg) => msg.type === "simulation",
      );
      let simulationData = "";

      if (isSimulation) {
        const allAgent = aiItem.message.find(
          (msg) => msg.type === "simulation",
        )?.items;

        if (Array.isArray(allAgent) && allAgent.length > 0) {
          allAgent.forEach((agent) => {
            simulationData += `

---

### Agent Name: **${agent?.title || "N/A"}**

- **Goal:** ${agent?.goal || "N/A"}
${agent?.team?.length ? `- **Collaborated With:** ${agent.team.join(", ")}` : ""}
- **Response:**

${agent?.content || "N/A"}

`;
          });

          simulationData = `# 🧪 Agentic Simulation\n\n${simulationData}\n\n---\n\n## Final Output:\n\n`;
        }
      }

      const textContent =
        aiItem.message
          ?.filter((msg) => msg.type === "text")
          ?.map((msg) => msg.content)
          ?.join("\n\n") || "Error";

      // Citations
      const citationsArray = aiItem?.citations;
      let citationsBlock = "";
      if (Array.isArray(citationsArray) && citationsArray.length > 0) {
        citationsBlock += `\n\n### Citations:\n`;
        citationsArray.forEach((citation, i) => {
          citationsBlock += `${citation?.url}\n`;
        });
      }

      chatContent += `---\n\n${simulationData} \n\n Response : \n\n ${textContent}${citationsBlock}\n\n`;
    });

    setFullContent(chatContent);
  };

  // Handle conversation selection
  const handleConversationToggle = (id) => {
    const newSelected = selectedConversations.includes(id)
      ? selectedConversations.filter((sid) => sid !== id)
      : [...selectedConversations, id];

    setSelectedConversations(newSelected);
    generateSelectedContent(conversationPairs, newSelected);
  };

  // Handle expand/collapse for preview
  const toggleExpanded = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  async function fetchAutoFileName() {
    setIsPdfAutonameLoading(true);
    try {
      const res = await generateFileName(fullContent.slice(0, 1000));

      if (res.success) {
        setPdfFileName(res.fileName);
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to generate file name",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating file name:", error);
      toast({
        title: "Error",
        description: "Failed to generate file name",
        variant: "destructive",
      });
    } finally {
      setIsPdfAutonameLoading(false);
    }
  }

  const handleDownload = () => {
    handlePdfDownload({
      currContent: fullContent,
      pdfFileName: sanitizeFileName(
        pdfFileName || (content ? "Document" : "Chat Thread"),
      ),
      setIsPdfDownloadLoading,
      setPdfDialogOpen: setIsDialogOpen,
      toast,
    });
  };

  const handleDownloadWholeThread = () => {
    generateFullContent(conversationPairs);
    handleDownload();
  };

  const handleDownloadSelectedSequence = () => {
    generateSelectedContent(conversationPairs, selectedConversations);
    handleDownload();
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          // Reset states when dialog closes
          setShowSequenceSelection(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <div onClick={() => setIsDialogOpen(true)}>{button}</div>
      </DialogTrigger>

      <DialogContent className="max-w-4xl bg-slate-800 max-h-[85vh] overflow-hidden flex flex-col">
        <h1 className="font-semibold text-lg text-white mb-6">
          {dialogHeader}
        </h1>

        <AnimatePresence mode="wait">
          {!showSequenceSelection ? (
            /* Main Download Options */
            <motion.div
              key="main-options"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-4"
            >
              {/* File Name */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  File Name
                </label>
                <Textarea
                  className="w-full h-10 text-white bg-slate-700 border-slate-600"
                  placeholder={content ? "Document Name" : "Chat Thread Name"}
                  value={pdfFileName}
                  onChange={(e) => setPdfFileName(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={fetchAutoFileName}
                    className="bg-slate-600 hover:bg-slate-500 text-white h-11"
                    disabled={isPdfAutonameLoading}
                  >
                    {isPdfAutonameLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin w-4 h-4" />
                        Generating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkle className="w-4 h-4" />
                        Generate Name
                      </div>
                    )}
                  </Button>

                  {content ? (
                    <Button
                      className="bg-blue-600 hover:bg-blue-500 text-white h-11"
                      onClick={handleDownload}
                      disabled={isPdfDownloadLoading}
                    >
                      {isPdfDownloadLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin w-4 h-4" />
                          Downloading...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FileDown className="w-4 h-4" />
                          Download
                        </div>
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="bg-blue-600 hover:bg-blue-500 text-white h-11"
                      onClick={handleDownloadWholeThread}
                      disabled={isPdfDownloadLoading}
                    >
                      {isPdfDownloadLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin w-4 h-4" />
                          Downloading...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FileDown className="w-4 h-4" />
                          Download Thread
                        </div>
                      )}
                    </Button>
                  )}
                </div>

                {!content && (
                  <Button
                    className="w-full bg-slate-600 hover:bg-slate-500 text-white h-11 border border-slate-500"
                    onClick={() => setShowSequenceSelection(true)}
                  >
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4" />
                      Select Specific Conversations
                    </div>
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            /* Conversation Selection Mode */
            <motion.div
              key="conversation-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Back button and header */}
              <div className="flex justify-between items-center w-full gap-3 mb-4 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSequenceSelection(false)}
                  className="text-slate-300 hover:text-white hover:bg-slate-700 text-lg"
                >
                  <ChevronLeft className="w-h-6 h-6 mr-1" />
                  Back
                </Button>
                <div className="flex gap-2 items-center text-white">
                  <h2 className="text-white font-medium">
                    Select Conversations
                  </h2>
                  •
                  <p className="text-slate-400 text-sm">
                    {selectedConversations.length} of {conversationPairs.length}{" "}
                    selected
                  </p>
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-0">
                {conversationPairs.map((pair, index) => (
                  <motion.div
                    key={pair.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={`group rounded-lg border p-3 cursor-pointer transition-all duration-200 ${
                      selectedConversations.includes(pair.id)
                        ? "border-blue-400 bg-blue-500/10"
                        : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
                    }`}
                    onClick={() => handleConversationToggle(pair.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Selection indicator */}
                      <div
                        className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center mt-1 transition-all ${
                          selectedConversations.includes(pair.id)
                            ? "border-blue-400 bg-blue-500"
                            : "border-slate-400 group-hover:border-slate-300"
                        }`}
                      >
                        {selectedConversations.includes(pair.id) && (
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Conversation info */}
                        <div className="flex items-start gap-2 mb-2">
                          <span className="flex-shrink-0 w-5 h-5 bg-slate-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                            {index + 1}
                          </span>
                          <p className="text-slate-200 text-sm leading-snug">
                            {pair.prompt.length > 80
                              ? pair.prompt.substring(0, 80) + "..."
                              : pair.prompt}
                          </p>
                        </div>

                        {/* Badges */}
                        {(pair.agentCount > 0 || pair.citationCount > 0) && (
                          <div className="flex items-center gap-2 mb-2">
                            {pair.agentCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30">
                                <Users className="w-2.5 h-2.5" />
                                {pair.agentCount}
                              </span>
                            )}
                            {pair.citationCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30">
                                <Link className="w-2.5 h-2.5" />
                                {pair.citationCount}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Preview */}
                        <div className="space-y-1">
                          <p className="text-slate-400 text-xs leading-relaxed">
                            {expandedItems[pair.id]
                              ? pair.response
                              : pair.preview}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(pair.id);
                            }}
                            className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                          >
                            {expandedItems[pair.id] ? "Show less" : "Show more"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Download button */}
              <div className="flex-shrink-0">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11"
                  onClick={handleDownloadSelectedSequence}
                  disabled={
                    isPdfDownloadLoading || selectedConversations.length === 0
                  }
                >
                  {isPdfDownloadLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin w-4 h-4" />
                      Downloading...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileDown className="w-4 h-4" />
                      Download Selected ({selectedConversations.length})
                    </div>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
