"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Book, CalendarCheck, Clock, Loader2 } from "lucide-react";
import PropTypes from "prop-types";
import { Mermaid } from "@/components/custom/Mermaid";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

export function StreamingResponse({ content, handleMaterialSidebar }) {
  const [blocks, setBlocks] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState("");
  const [dialogType, setDialogType] = useState("visual");
  const [dialogTitle, setDialogTitle] = useState("");

  // Use refs to track state without triggering re-renders
  const contentRef = useRef("");

  // Process content when it changes
  useEffect(() => {
    // Skip if content hasn't changed
    if (content === contentRef.current) return;

    // Update our content reference
    contentRef.current = content;

    // Process the content
    const processedBlocks = processContent(content);

    // Only update state if blocks have changed
    if (
      processedBlocks.length !== blocks.length ||
      JSON.stringify(processedBlocks) !== JSON.stringify(blocks)
    ) {
      setBlocks(processedBlocks);
    }
  }, [content, blocks]);

  // Process the content and return blocks
  const processContent = (text) => {
    if (!text) return [];

    // First check for complete showUniProt blocks (streaming-friendly)
    if (text.includes("<showUniProt>") && text.includes("</showUniProt>")) {
      const result = [];
      let lastIndex = 0;

      // Find all complete showUniProt blocks
      const showUniProtRegex = /<showUniProt>([\s\S]*?)<\/showUniProt>/g;
      let match;

      while ((match = showUniProtRegex.exec(text)) !== null) {
        // Add text before this block
        if (match.index > lastIndex) {
          const textBefore = text.substring(lastIndex, match.index).trim();
          if (textBefore) {
            result.push({
              id: `text-${lastIndex}`,
              type: "text",
              name: "",
              content: textBefore,
              isComplete: true,
            });
          }
        }

        // Process the showUniProt content
        const uniprotContent = match[1];
        const nameMatch = /<name>([\s\S]*?)<\/name>/i.exec(uniprotContent);
        let name = nameMatch ? nameMatch[1].trim() : "";
        let uniProtId = uniprotContent;

        // Remove name tag if present to get the UniProt ID
        if (nameMatch) {
          uniProtId = uniprotContent.replace(nameMatch[0], "").trim();
        }

        result.push({
          id: `uniprot-${match.index}`,
          type: "showUniProt",
          name,
          uniProt: uniProtId,
          isComplete: true,
        });

        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        const remainingText = text.substring(lastIndex).trim();
        if (remainingText) {
          result.push({
            id: `text-${lastIndex}`,
            type: "text",
            name: "",
            content: remainingText,
            isComplete: true,
          });
        }
      }

      return result;
    }

    // Process character by character
    const result = [];
    const blocksMap = new Map();

    let currentType = "text";
    let currentContent = "";
    let currentName = "";
    let isCollecting = false;
    let isCollectingName = false;
    let isCollectingTag = ""; // "name" | "task" | "time" | "outputFormat"
    const dataBuffer = { name: "", task: "", time: "", outputFormat: "" };
    let blockStartIndex = 0;
    let blockId = "";

    let i = 0;
    while (i < text.length) {
      const remainingText = text.substring(i);

      // --- showUniProt start ---
      if (remainingText.startsWith("<showUniProt>")) {
        if (currentContent && currentType === "text") {
          const textBlock = {
            id: `text-${blockStartIndex}`,
            type: "text",
            name: "",
            content: currentContent,
            isComplete: true,
          };
          blocksMap.set(textBlock.id, textBlock);
          currentContent = "";
        }

        currentType = "showUniProt";
        isCollecting = true;
        isCollectingName = true;
        blockStartIndex = i;
        blockId = `uniprot-${blockStartIndex}`;
        i += 13; // Length of "<showUniProt>"
        continue;
      }

      // Check for showUniProt block end
      if (remainingText.startsWith("</showUniProt>")) {
        if (blockId && blocksMap.has(blockId)) {
          const block = blocksMap.get(blockId);
          block.uniProt = currentContent;
          block.isComplete = true;
        }

        currentContent = "";
        currentName = "";
        currentType = "text";
        isCollecting = false;
        blockId = "";
        blockStartIndex = i + 14; // Length of "</showUniProt>"
        i += 14;
        continue;
      }

      // --- showUniProt full-block parse (fallback for complete blocks) ---
      if (remainingText.startsWith("<showUniProt>")) {
        // find closing tag
        const closeIdx = text.indexOf("</showUniProt>", i);
        if (closeIdx !== -1) {
          const raw = text.substring(i, closeIdx + 14); // 14 = length of "</showUniProt>"
          const inner = raw.slice(13, raw.length - 14); // strip tags
          const nameMatch = /<name>([\s\S]*?)<\/name>/i.exec(inner);
          let name = nameMatch ? nameMatch[1].trim() : "";
          let uniProtContent = inner;

          // Remove name tag if present to get the UniProt ID
          if (nameMatch) {
            uniProtContent = inner.replace(nameMatch[0], "").trim();
          }

          blocksMap.set(`uniprot-${i}`, {
            id: `uniprot-${i}`,
            type: "showUniProt",
            name,
            uniProt: uniProtContent,
            isComplete: true,
          });
          i = closeIdx + 14;
          continue;
        }
      }

      // --- automationCard start ---
      if (remainingText.startsWith("<automationCard>")) {
        currentType = "automationDaily";
        isCollecting = true;
        isCollectingTag = ""; // waiting for first tag
        blockStartIndex = i;
        blockId = `automation-${blockStartIndex}`;
        i += "<automationCard>".length;
        continue;
      }
      // name/task/time/outputFormat tags inside automationCard
      if (
        isCollecting &&
        !isCollectingTag &&
        remainingText.match(/^<(name|task|time|outputFormat)>/)
      ) {
        const tag = remainingText.match(/^<(name|task|time|outputFormat)>/)[1];
        isCollectingTag = tag;
        dataBuffer[tag] = "";
        i += tag.length + 2;
        continue;
      }
      if (
        isCollecting &&
        isCollectingTag &&
        remainingText.startsWith(`</${isCollectingTag}>`)
      ) {
        isCollectingTag = "";
        i += isCollectingTag.length + 3;
        continue;
      }
      // automationCard end
      if (remainingText.startsWith("</automationCard>")) {
        // push one block
        blocksMap.set(blockId, {
          id: blockId,
          type: "automationDaily",
          name: dataBuffer.name.trim(),
          task: dataBuffer.task.trim(),
          time: dataBuffer.time.trim(),
          outputFormat: dataBuffer.outputFormat.trim(),
          isComplete: true,
        });
        // reset
        currentType = "text";
        isCollecting = false;
        blockId = "";
        i += "</automationCard>".length;
        continue;
      }
      // collect inside tag
      if (isCollecting && isCollectingTag) {
        dataBuffer[isCollectingTag] += text[i];
        i++;
        continue;
      }

      // Check for visual block start
      if (remainingText.startsWith("<visual>")) {
        if (currentContent && currentType === "text") {
          const textBlock = {
            id: `text-${blockStartIndex}`,
            type: "text",
            name: "",
            content: currentContent,
            isComplete: true,
          };
          blocksMap.set(textBlock.id, textBlock);
          currentContent = "";
        }

        currentType = "visual";
        isCollecting = true;
        isCollectingName = true;
        blockStartIndex = i;
        blockId = `visual-${blockStartIndex}`;
        i += 8; // Changed from 10 to 8 to match "<visual>"
        continue;
      }

      // Check for document block start
      if (remainingText.startsWith("<document>")) {
        if (currentContent && currentType === "text") {
          const textBlock = {
            id: `text-${blockStartIndex}`,
            type: "text",
            name: "",
            content: currentContent,
            isComplete: true,
          };
          blocksMap.set(textBlock.id, textBlock);
          currentContent = "";
        }

        currentType = "document";
        isCollecting = true;
        isCollectingName = true;
        blockStartIndex = i;
        blockId = `document-${blockStartIndex}`;
        i += 10; // Changed from 12 to 10 to match "<document>"
        continue;
      }

      // Check for name start
      if (isCollectingName && remainingText.startsWith("<name>")) {
        currentName = "";
        i += 6; // Skip marker
        continue;
      }

      // Check for name end
      if (isCollectingName && remainingText.startsWith("</name>")) {
        isCollectingName = false;
        i += 7; // Skip marker

        // Create block with name
        const specialBlock = {
          id: blockId,
          type: currentType,
          name: currentName,
          content: currentType === "showUniProt" ? "" : "",
          uniProt: currentType === "showUniProt" ? "" : undefined,
          isComplete: false,
        };
        blocksMap.set(blockId, specialBlock);
        continue;
      }

      // Check for visual block end
      if (remainingText.startsWith("</visual>")) {
        if (blockId && blocksMap.has(blockId)) {
          const block = blocksMap.get(blockId);
          block.content = currentContent;
          block.isComplete = true;
        }

        currentContent = "";
        currentName = "";
        currentType = "text";
        isCollecting = false;
        blockId = "";
        blockStartIndex = i + 9; // Changed from 11 to 9 to match "</visual>"
        i += 9;
        continue;
      }

      // Check for document block end
      if (remainingText.startsWith("</document>")) {
        if (blockId && blocksMap.has(blockId)) {
          const block = blocksMap.get(blockId);
          block.content = currentContent;
          block.isComplete = true;
        }

        currentContent = "";
        currentName = "";
        currentType = "text";
        isCollecting = false;
        blockId = "";
        blockStartIndex = i + 11; // Changed from 13 to 11 to match "</document>"
        i += 11;
        continue;
      }

      // --- new: automationCard full‐block parse ---
      if (remainingText.startsWith("<automationCard>")) {
        // find closing tag
        const closeIdx = text.indexOf("</automationCard>", i);
        if (closeIdx !== -1) {
          const raw = text.substring(i, closeIdx + 17); // 17 = length of "</automationCard>"
          const inner = raw.slice(16, raw.length - 17); // strip tags
          const name =
            (/<name>([\s\S]*?)<\/name>/i.exec(inner) || [])[1]?.trim() || "";
          const task =
            (/<task>([\s\S]*?)<\/task>/i.exec(inner) || [])[1]?.trim() || "";
          const time =
            (/<time>([\s\S]*?)<\/time>/i.exec(inner) || [])[1]?.trim() || "";
          const outputFormat =
            (/<outputFormat>([\s\S]*?)<\/outputFormat>/i.exec(inner) ||
              [])[1]?.trim() || "";
          blocksMap.set(`automation-${i}`, {
            id: `automation-${i}`,
            type: "automationDaily",
            name,
            task,
            time,
            outputFormat,
            isComplete: true,
          });
          i = closeIdx + 17;
          continue;
        }
      }

      // --- end new logic ---

      // Collect characters
      if (isCollectingName) {
        currentName += text[i];
      } else if (isCollecting) {
        currentContent += text[i];
      } else {
        currentContent += text[i];
      }

      i++;
    }

    // Add final text block if needed
    if (currentContent && currentType === "text") {
      const textBlock = {
        id: `text-${blockStartIndex}`,
        type: "text",
        name: "",
        content: currentContent,
        isComplete: true,
      };
      blocksMap.set(textBlock.id, textBlock);
    }

    // Convert map to array and sort
    // Convert map to array, preserving order
    let lastIndex = -1;
    let currentId = "";

    // First add all blocks in order of appearance
    for (const [id, block] of blocksMap.entries()) {
      const match = id.match(/^(text|visual|document)-(\d+)$/);
      if (match) {
        const index = Number.parseInt(match[2]);
        if (index > lastIndex) {
          lastIndex = index;
          currentId = id;
        }
      }
      result.push(block);
    }
    result.sort((a, b) => {
      const indexA = Number.parseInt(a.id.split("-")[1] || "0");
      const indexB = Number.parseInt(b.id.split("-")[1] || "0");
      return indexA - indexB;
    });

    return result;
  };

  const openDialog = (block) => {
    if (block.type === "text" || !block.isComplete) return;

    if (block.type === "showUniProt") {
      // Handle UniProt block click by opening sidebar
      if (handleMaterialSidebar && block.uniProt) {
        handleMaterialSidebar(
          block.uniProt,
          block.name || "UniProt Protein Structure",
        );
      }
      return;
    }

    setDialogType(block.type);
    setDialogContent(block.content);
    setDialogTitle(
      block.name || (block.type === "visual" ? "Visualization" : "Document"),
    );
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {console.log("Rendering blocks:", blocks)}
      {blocks.map((block) => (
        <div key={block.id}>
          {block.type === "text" && (
            <div className="whitespace-pre-wrap">{block.content}</div>
          )}

          {block.type === "visual" && (
            <div
              className={`border rounded-md p-4 bg-white ${block.isComplete ? "cursor-pointer hover:bg-gray-50" : ""}`}
              onClick={() => block.isComplete && openDialog(block)}
            >
              <div className="text-sm font-medium text-gray-700 mb-2">
                {block.name || "Visualization"}
              </div>

              {!block.isComplete ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-500">
                    Loading visualization...
                  </span>
                </div>
              ) : (
                <>
                  <div className="text-xs text-gray-500 mb-2">
                    (click to expand)s
                  </div>
                  <Mermaid chart={block.content} />
                </>
              )}
            </div>
          )}

          {block.type === "document" && (
            <div
              className={`border rounded-md p-4 bg-white ${block.isComplete ? "cursor-pointer hover:bg-gray-50" : ""}`}
              onClick={() => block.isComplete && openDialog(block)}
            >
              <div className="text-sm font-medium text-gray-700 mb-2">
                {block.name || "Document"}
              </div>

              {!block.isComplete ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-500">
                    Loading document...
                  </span>
                </div>
              ) : (
                <>
                  <div className="text-xs text-gray-500 mb-2">
                    (click to expand)
                  </div>
                  <div className="line-clamp-3 text-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]} // Added remarkGfm for table support
                      rehypePlugins={[rehypeKatex]}
                    >
                      {block.content}
                    </ReactMarkdown>
                  </div>
                </>
              )}
            </div>
          )}
          {block.type === "automationDaily" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-gradient-to-r from-[#001B3F] to-[#0A1429] max-w-[80%] border-2 border-slate-800 px-3 py-4 rounded-lg shadow break-words whitespace-pre-wrap space-y-2"
            >
              <h2 className="text-lg font-semibold mb-2">{block.name}</h2>

              <div className="items-center flex gap-2">
                <CalendarCheck className="w-4 h-4" />
                <p>Task</p>
              </div>
              <p className="text-sm text-slate-400">{block.task}</p>

              <div className="items-center flex gap-2">
                <Clock className="w-4 h-4" />
                <p>Trigger Time</p>
              </div>
              <p className="text-sm text-slate-400 mt-2">{block.time}</p>

              <div className="items-center flex gap-2">
                <Book className="w-4 h-4" />
                <p>Output Format</p>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                {block.outputFormat}
              </p>
            </motion.div>
          )}
          {block.type === "showUniProt" && (
            <div
              onClick={() => {
                const uniProtId =
                  block.uniProt
                    .match(/<showUniProt>(.*?)<\/showUniProt>/s)?.[1]
                    ?.trim() || block.uniProt;
                console.log("passing uni prot", uniProtId, block.uniProt);
                handleMaterialSidebar(uniProtId, block.name);
              }}
              key={`visual-${blockIdx}`}
              className={`border-2 border-slate-800 bg-slate-900 flex justify-between items-center gap-2 relative rounded-lg p-1 ${
                block.isComplete
                  ? "cursor-pointer hover:bg-slate-800 text-white flex"
                  : ""
              }`}
            >
              <div
                className="text-md font-medium text-white truncate px-3 flex items-start justify-between flex-col"
                style={{ maxWidth: "80%" }}
              >
                {block.name || "Document"}
                <p className="text-slate-600 text-sm">Material (Click)</p>
              </div>
              <div className="flex-shrink-0 px-3 py-2">
                <img
                  src="/materialSvg.png"
                  className="w-16 h-14 -rotate-6 brightness-150 contrast-125 drop-shadow-lg"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>

          {dialogType === "visual" ? (
            <div className="p-4">
              <Mermaid chart={dialogContent} />
            </div>
          ) : (
            <div className="p-4 whitespace-pre-wrap">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]} // Added remarkGfm for table support
                rehypePlugins={[rehypeKatex]}
              >
                {dialogContent}
              </ReactMarkdown>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

StreamingResponse.propTypes = {
  content: PropTypes.string.isRequired,
  handleMaterialSidebar: PropTypes.func,
};
