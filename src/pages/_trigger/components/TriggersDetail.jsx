import ChatSimulation from "@/components/custom/AiInteraction/ChatSimulation";
import DownloadThreadWithUser from "@/components/custom/downloadThread/DownloadThreadWithUser";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import MarkdownRenderer from "@/pages/_private/components/sidebarProvided/components/AnimatedMarkdown";
import AnimatedMarkdown from "@/pages/_private/components/sidebarProvided/components/AnimatedMarkdown";
import { getJobDetails } from "@/services/trigger/getJobDetails";
import { File, Loader2, Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SourcesIndicator from "@/components/custom/CitationSources";
const buttonWrapperClass =
  "px-3  bg-transparent bg-slate-900 hover:bg-slate-700 rounded-xl flex items-center justify-center";

// Utility function to format date to relative time
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

// Utility function to format date to normal format
const formatNormalDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
};
export default function TriggersDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [triggerDetails, setTriggerDetails] = useState(null);
  const [normalDetails, setNormalDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullDownloadContent, setFullDownloadContent] = useState("");
  const processItem = (item) => {
    if (!item) return;

    console.log("item in RenderActionButtons useEffect", item);

    const isSimulation = item?.message?.some(
      (msg) => msg.type === "simulation",
    );
    console.log("isSimulation:", isSimulation, "messages:", item?.message);

    let simualtionData = "";

    if (isSimulation) {
      const allAgent = item.message.find(
        (msg) => msg.type === "simulation",
      )?.items;
      console.log("allAgent:", allAgent);

      if (Array.isArray(allAgent) && allAgent.length > 0) {
        allAgent.forEach((agent) => {
          simualtionData += `

---

### Agent Name: **${agent?.title || "N/A"}**

- **Goal:** ${agent?.goal || "N/A"}
${agent?.team?.length ? `- **Collaborated With:** ${agent.team.join(", ")}` : ""}
- **Response:**

${agent?.content || "N/A"}

`;
        });

        simualtionData = `# 🧪 Agentic Simulation\n\n${simualtionData}\n\n---\n\n## Final Output:\n\n`;
      }
    }

    const textContent =
      item.message
        ?.filter((msg) => msg.type === "text")
        ?.map((msg) => msg.content)
        ?.join("\n\n") || "Error";

    const citationsArray = item?.citations;
    let citationsBlock = "";
    console.log("Citations Array:", citationsArray, item);
    console.log(citationsArray, "citationsArray");
    if (Array.isArray(citationsArray) && citationsArray.length > 0) {
      citationsBlock += `\n\n### Citations:\n\n`;
      citationsArray.forEach((citation, i) => {
        citationsBlock += `${i + 1}. [${citation?.url}](${citation?.url})\n`;
      });
      console.log(citationsBlock, "citationsBlock");
    }
    console.log(
      `Full Download Content: ${simualtionData}${textContent}${citationsBlock}`,
    );
    setFullDownloadContent(`${simualtionData}${textContent}${citationsBlock}`);
  };

  useEffect(() => {
    async function fetchTriggerDetails() {
      try {
        setLoading(true);

        const data = await getJobDetails(id);
        const processedMessages = processStreamingContent(data.output);

        console.log(processedMessages, data, "askjdhlkjasdf");

        // Pass correct structure
        processItem({
          message: processedMessages,
          citations: data.citations || [], // if available
        });
        setNormalDetails(data);
        setTriggerDetails(processedMessages);
      } catch (error) {
        console.error("Error fetching trigger details:", error);
        toast({
          title: "Error",
          description: "Failed to fetch trigger details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchTriggerDetails();
    }
  }, [id]);

  // persers.
  function parseAgentBlock(agentContent) {
    const result = {
      content: agentContent,
    };

    // Extract title
    const titleMatch = /<\|title\|([\s\S]*?)<\|title\|>/g.exec(agentContent);
    if (titleMatch) {
      let title = titleMatch[1].trim();
      if (title.startsWith(">")) {
        title = title.substring(1).trim();
      }
      result.title = title;
      result.content = result.content.replace(titleMatch[0], "");
    }

    // Extract goal
    const goalMatch = /<\|goal\|([\s\S]*?)<\|goal\|>/g.exec(agentContent);
    if (goalMatch) {
      let goal = goalMatch[1].trim();
      if (goal.startsWith(">")) {
        goal = goal.substring(1).trim();
      }
      result.goal = goal;
      result.content = result.content.replace(goalMatch[0], "");
    }

    // Extract all team entries
    result.team = [];
    const teamRegex = /<\|team\|([\s\S]*?)<\|team\|>/g;
    let teamMatch;

    while ((teamMatch = teamRegex.exec(agentContent)) !== null) {
      const teamContent = teamMatch[1].trim();

      if (teamContent.startsWith('"') && teamContent.endsWith('"')) {
        let member = teamContent.slice(1, -1).trim();
        if (member.startsWith(">")) {
          member = member.substring(1).trim();
        }
        result.team.push(member);
      } else {
        const members = teamContent.split(",").map((item) => {
          let trimmed = item.trim();
          if (trimmed.startsWith(">")) {
            trimmed = trimmed.substring(1).trim();
          }
          return trimmed.startsWith('"') && trimmed.endsWith('"')
            ? trimmed.slice(1, -1).trim()
            : trimmed;
        });
        result.team.push(...members);
      }

      result.content = result.content.replace(teamMatch[0], "");
    }

    result.content = result.content.trim();
    if (result.content.startsWith(">")) {
      result.content = result.content.substring(1).trim();
    }
    return result;
  }

  const processStreamingContent = (input, forceComplete = false) => {
    if (!input) return [];

    /** helper to push a text block if non-empty */
    const pushText = (arr, txt) => {
      const t = txt.trim();
      if (t) arr.push({ type: "text", content: t, isComplete: true });
    };

    // --- 1. Extract balanced <document> blocks ---
    const documentBlocks = [];
    const docRegex = /<document>/gi;
    let match;
    while ((match = docRegex.exec(input)) !== null) {
      const start = match.index;
      let depth = 1;
      let pos = start + match[0].length;
      while (depth > 0 && pos < input.length) {
        const nextOpen = input.indexOf("<document>", pos);
        const nextClose = input.indexOf("</document>", pos);
        if (nextClose === -1) break;
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          pos = nextOpen + 10;
        } else {
          depth--;
          pos = nextClose + 11;
        }
      }
      if (depth === 0) {
        const end = pos;
        let inner = input.slice(start + 10, end - 11).trim();
        let name = "Document";
        const nm = /<name>([\s\S]*?)<\/name>/i.exec(inner);
        if (nm) {
          name = nm[1].trim();
          inner = inner.replace(nm[0], "").trim();
        }
        documentBlocks.push({
          type: "document",
          name,
          content: inner,
          isComplete: true,
          start,
          end,
        });
        docRegex.lastIndex = end;
      }
    }

    // --- 2. Mask document spans to avoid nested matches ---
    let masked = input;
    documentBlocks.forEach(({ start, end }) => {
      masked =
        masked.slice(0, start) + " ".repeat(end - start) + masked.slice(end);
    });

    // --- 3. Define other block patterns ---
    const blockDefs = [
      {
        type: "visual",
        regex: /<visual>([\s\S]*?)<\/visual>/gi,
        handler: (m, start, end) => {
          let inner = m[1].trim();
          let name = "Visualization";
          const nm = /<name>([\s\S]*?)<\/name>/i.exec(inner);
          if (nm) {
            name = nm[1].trim();
            inner = inner.replace(nm[0], "").trim();
          }
          return {
            type: "visual",
            name,
            content: inner,
            isComplete: true,
            start,
            end,
          };
        },
      },
      {
        type: "mermaid",
        regex: /```mermaid([\s\S]*?)```/gi,
        handler: (m, start, end) => ({
          type: "mermaid",
          content: m[1].trim(),
          isComplete: true,
          start,
          end,
        }),
      },
      {
        type: "automationDaily",
        regex: /<automationCard>([\s\S]*?)<\/automationCard>/gi,
        handler: (m, start, end) => {
          const inner = m[1];
          const tag = (t) =>
            new RegExp(`<${t}>([\\s\\S]*?)<\/${t}>`, "i")
              .exec(inner)?.[1]
              ?.trim() || "";
          return {
            type: "automationDaily",
            name: tag("name"),
            task: tag("task"),
            time: tag("time"),
            outputFormat: tag("outputFormat"),
            isComplete: true,
            start,
            end,
          };
        },
      },
      {
        type: "showUniProt",
        regex: /<showUniProt>([\s\S]*?)<\/showUniProt>/gi,
        handler: (m, start, end) => {
          let inner = m[1].trim();
          let name = "";
          const nm = /<name>([\s\S]*?)<\/name>/i.exec(inner);
          if (nm) {
            name = nm[1].trim();
            inner = inner.replace(nm[0], "").trim();
          }
          return {
            type: "showUniProt",
            name,
            uniProt: inner,
            isComplete: true,
            start,
            end,
          };
        },
      },
      {
        type: "chart",
        regex: /<dataChart>([\s\S]*?)<\/dataChart>/gi,
        handler: (m, start, end) => {
          let inner = m[1].trim();

          const extractTag = (tag, source) => {
            const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
            const match = regex.exec(source);
            return match ? match[1].trim() : null;
          };

          const chartType = extractTag("chartType", inner);
          const dataId = extractTag("dataId", inner);
          const dataName = extractTag("dataName", inner);
          const dataLabel = extractTag("dataLabel", inner);

          return {
            type: "chart",
            chartType,
            dataId,
            dataName,
            dataLabel,
            isComplete: true,
            start,
            end,
          };
        },
      },

      {
        type: "persona",
        regex: /<\|agent\|([\s\S]*?)<\|end\|>/gi,
        handler: (m, start, end) => {
          const rawContent = m[1].trim();

          // Important: Don't use m[1] directly for parsing — use rawContent + manually remove tail
          const parsed = parseAgentBlock(
            rawContent.replaceAll("<visual>", "").replaceAll("</visual>", ""),
          );
          return {
            type: "persona",
            ...parsed,
            isComplete: true,
            start,
            end,
          };
        },
      },
      {
        type: "realtime",
        regex: /<realtime>([\s\S]*?)<\/realtime>/gi,
        handler: (m, start, end) => {
          const inner = m[1].trim();

          const extractTag = (tag, source) => {
            const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
            const match = regex.exec(source);
            return match ? match[1].trim() : null;
          };

          return {
            type: "realtime",
            ticker: extractTag("ticker", inner),
            assetType: extractTag("type", inner),
            generalName: extractTag("generalName", inner),
            isComplete: true,
            start,
            end,
          };
        },
      },

      {
        type: "vectorStoreJob",
        regex: /<newVectorStoreJob>([\s\S]*?)<\/newVectorStoreJob>/gi,
        handler: (m, start, end) => {
          const rawContent = m[1].trim();

          // Extract values from XML-style tags manually
          const vsIdMatch = rawContent.match(/<vsId>([\s\S]*?)<\/vsId>/i);
          const taskMatch = rawContent.match(/<task>([\s\S]*?)<\/task>/i);
          const nameMatch = rawContent.match(/<name>([\s\S]*?)<\/name>/i);

          return {
            type: "vectorStoreJob",
            vsId: vsIdMatch?.[1]?.trim() || null,
            task: taskMatch?.[1]?.trim() || null,
            name: nameMatch?.[1]?.trim() || "Vector Store Scrapper",
            isComplete: true,
            start,
            end,
          };
        },
      },
      {
        type: "urlScraper",
        regex: /<urlScraper>([\s\S]*?)<\/urlScraper>/gi,
        handler: (m, start, end) => {
          const inner = m[1].trim();

          const extractTag = (tag, source) => {
            const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
            const match = regex.exec(source);
            return match ? match[1].trim() : null;
          };

          return {
            type: "urlScraper",
            jobId: extractTag("jobid", inner),
            name: extractTag("name", inner),
            numOfUrls: extractTag("numOfUrls", inner),
            isComplete: true,
            start,
            end,
          };
        },
      },
      {
        type: "osintInstance",
        regex: /<newOsintInstance>([\s\S]*?)<\/newOsintInstance>/gi,
        handler: (m, start, end) => {
          const inner = m[1].trim();

          const extractTag = (tag, source) => {
            const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
            const match = regex.exec(source);
            return match ? match[1].trim() : null;
          };

          return {
            type: "osintInstance",
            name: extractTag("name", inner) || "OSINT Instance",
            osintWorkflowId: extractTag("osintWorkflowId", inner),
            isComplete: true,
            start,
            end,
          };
        },
      },
      // ── Omni-Resilience block ──────────────────────────────────────────────────────
      {
        type: "omni",
        regex: /<Omni>([\s\S]*?)<\/Omni>/gi,
        handler: (m, start, end) => {
          const inner = m[1].trim();

          // Helper to extract any tag
          const extractTag = (tag, source = inner) => {
            const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
            const match = re.exec(source);
            return match ? match[1].trim() : null;
          };

          // Parse <shortTerm> or <longTerm> sections
          const parseHorizon = (horizonTag) => {
            const section = extractTag(horizonTag);
            if (!section) return null;

            const metrics = {};
            const tagRe = /<(\w+)>([\s\S]*?)<\/\1>/g;
            let match;
            while ((match = tagRe.exec(section))) {
              metrics[match[1]] = match[2].trim();
            }
            return metrics;
          };

          return {
            type: "omni",
            ticker: extractTag("ticker"),
            assetType: extractTag("type"),
            shortTerm: parseHorizon("shortTerm"),
            longTerm: parseHorizon("longTerm"),
            summary: extractTag("summary"),
            isComplete: true,
            start,
            end,
          };
        },
      },
      {
        type: "genDoc",
        regex: /<genDoc>([\s\S]*?)<\/genDoc>/gi,
        handler: (m, start, end) => {
          const inner = m[1].trim();

          const extractTag = (tag, source) => {
            const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
            const match = regex.exec(source);
            return match ? match[1].trim() : null;
          };

          return {
            type: "genDoc",
            name: extractTag("name", inner) || "Generated Document",
            genId: extractTag("genId", inner),
            pages: parseInt(extractTag("pages", inner), 10) || 1,
            isComplete: true,
            start,
            end,
          };
        },
      },
    ];

    // --- 4. Find other blocks in masked content ---
    const found = [];
    blockDefs.forEach((def) => {
      let rx = def.regex;
      let m;
      while ((m = rx.exec(masked)) !== null) {
        found.push(def.handler(m, m.index, rx.lastIndex));
      }
    });

    // Combine and sort all blocks
    const allBlocks = [...documentBlocks, ...found].sort(
      (a, b) => a.start - b.start,
    );

    // --- 5. Walk through content and build result ---
    const result = [];
    let cursor = 0;

    allBlocks.forEach((block) => {
      if (block.start > cursor) {
        pushText(result, input.slice(cursor, block.start));
      }
      block.isComplete =
        forceComplete || Boolean(block.content && block.content.length > 0);
      result.push(block);
      cursor = block.end;
    });

    if (cursor < input.length) pushText(result, input.slice(cursor));

    if (result.length === 0) {
      result.push({ type: "text", content: input.trim(), isComplete: true });
    }

    // --- 6. Merge persona blocks into a simulation at original position ---
    const personas = result.filter((b) => b.type === "persona");
    if (personas.length) {
      const idx = result.findIndex((b) => b.type === "persona");
      const simulation = {
        type: "simulation",
        items: personas,
        isComplete: true,
      };
      const filtered = result.filter((b) => b.type !== "persona");
      filtered.splice(idx, 0, simulation);
      return filtered;
    }

    return result;
  };

  return (
    <div className="w-full h-full flex items-start  mb-64 justify-center">
      <div className="max-w-4xl w-full mt-5">
        {loading && (
          <div className="flex h-screen items-center gap-2 justify-center">
            <Loader2 className="animate-spin" />
            <p>Loading Details</p>
          </div>
        )}
        {triggerDetails && normalDetails && (
          <div>
            {/* Header Section with Title, Dates, and Images */}
            <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border">
              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {normalDetails.title}
              </h1>

              {/* Date Information */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {formatRelativeTime(normalDetails.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {formatNormalDate(normalDetails.createdAt)}
                  </span>
                </div>
              </div>

              {/* Images Grid */}
              {normalDetails.images && normalDetails.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {normalDetails.images.slice(0, 4).map((imageUrl, index) => (
                    <div
                      key={index}
                      className="aspect-square overflow-hidden rounded-lg border bg-gray-200 dark:bg-gray-800"
                    >
                      <img
                        src={imageUrl}
                        alt={`Trigger image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBMMTMwIDEwMEgxMTBWMTMwSDkwVjEwMEg3MEwxMDAgNzBaIiBmaWxsPSIjOUNBM0FGIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LXNpemU9IjEyIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPgo=";
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Original Content */}
            {triggerDetails.find((item) => item.type === "simulation")
              ?.items && (
              <ChatSimulation
                key={`simulation-1`}
                personas={
                  triggerDetails.find((item) => item.type === "simulation")
                    ?.items || []
                }
                isLoading={false}
              />
            )}
            <MarkdownRenderer
              content={triggerDetails
                .filter((item) => item.type !== "simulation")
                .map((item) => item.content)
                .join("")}
            />
            <div className="flex gap-2 mt-3">
              <DownloadThreadWithUser
                button={
                  <Button className={buttonWrapperClass}>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger className="flex gap-2 items-center">
                          <File className="w-4 h-4" />
                          <p>Download</p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Download Content</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Button>
                }
                dialogHeader="Download Response"
                content={fullDownloadContent || "No content available"}
              />
             {
                normalDetails.citations && normalDetails.citations.length > 0 && (
                  <SourcesIndicator
                    citations={normalDetails.citations.map((citation) => ({
                      url: citation,
                    }))}
                  />
                )
             }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
