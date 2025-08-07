import { useToast } from "@/hooks/use-toast";
import { generateFileName } from "@/services/genereteFileName";
import { FileDown, Loader2, Sparkle } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeFileName } from "@/lib/utils";
import { useChatCtx } from "@/context/ChatContext";
import { handlePdfDownload } from "@/pages/_private/components/sidebarProvided/chat/PdfDownload";

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
  const { toast } = useToast();
  const { conversation } = useChatCtx();

  useEffect(() => {
    // If content prop is provided, use it directly
    if (content) {
      setFullContent(content);
      return;
    }

    // Otherwise, fetch from conversation context
    if (!conversation || conversation.length === 0) {
      setFullContent("No conversation available");
      return;
    }

    let chatContent =
      pdfFileName !== "Chat Thread" ? `# ${pdfFileName}\n\n` : "";

    conversation.forEach((item, index) => {
      if (!item) return;

      // Handle user messages
      if (item.role === "human") {
        chatContent += `# ${item.message}\n\n`; // No "User:" label, make text large
        return;
      }

      // Handle AI messages (including simulation logic)
      if (item.role === "ai") {
        const isSimulation = item?.message?.some(
          (msg) => msg.type === "simulation",
        );

        let simulationData = "";

        if (isSimulation) {
          const allAgent = item.message.find(
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
          item.message
            ?.filter((msg) => msg.type === "text")
            ?.map((msg) => msg.content)
            ?.join("\n\n") || "Error";

        // Add a line separator between user prompt and AI response
        chatContent += `---\n\n${simulationData}${textContent}\n\n`;
      }
    });

    setFullContent(chatContent);
  }, [conversation, content]);

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
      setPdfDialogOpen: () => {},
      toast,
    });
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          // Dialog closed
        }
      }}
    >
      <DialogTrigger asChild>
        <div>{button}</div>
      </DialogTrigger>

      <DialogContent className="max-w-4xl bg-slate-800">
        <h1 className="font-semibold text-lg text-white mb-3">
          {dialogHeader}
        </h1>
        <p className="text-white -mb-2">File Name</p>
        <Textarea
          className="w-full h-10 text-white"
          placeholder={content ? "Document Name" : "Chat Thread Name"}
          value={pdfFileName}
          onChange={(e) => setPdfFileName(e.target.value)}
        />
        <div className="w-full flex gap-2">
          <Button
            onClick={fetchAutoFileName}
            className="bg-slate-600 w-1/2 hover:bg-slate-500 text-white mt-4"
            disabled={isPdfAutonameLoading}
          >
            {isPdfAutonameLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" />
                Generating Name...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkle /> Generate Name
              </div>
            )}
          </Button>
          <Button
            className="bg-slate-600 w-1/2 hover:bg-slate-500 text-white mt-4"
            onClick={handleDownload}
            disabled={isPdfDownloadLoading}
          >
            {isPdfDownloadLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" />
                Downloading...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileDown /> Download
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
