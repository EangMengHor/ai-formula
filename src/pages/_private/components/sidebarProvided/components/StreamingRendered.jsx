"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import PropTypes from "prop-types";
import { Mermaid } from "@/components/custom/Mermaid";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";

export function StreamingResponse({ content }) {
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

    const result = [];
    const blocksMap = new Map();

    let currentType = "text";
    let currentContent = "";
    let currentName = "";
    let isCollecting = false;
    let isCollectingName = false;
    let blockStartIndex = 0;
    let blockId = "";

    // Process character by character
    let i = 0;
    while (i < text.length) {
      const remainingText = text.substring(i);

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
          content: "",
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

    // Sort blocks by their position in the original text
    result.sort((a, b) => {
      const indexA = Number.parseInt(a.id.split("-")[1] || "0");
      const indexB = Number.parseInt(b.id.split("-")[1] || "0");
      return indexA - indexB;
    });

    return result;
  };

  const openDialog = (block) => {
    if (block.type === "text" || !block.isComplete) return;

    setDialogType(block.type);
    setDialogContent(block.content);
    setDialogTitle(
      block.name || (block.type === "visual" ? "Visualization" : "Document"),
    );
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
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
                    (click to expand)
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
};
