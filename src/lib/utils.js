import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { LAYOUT_CONFIG } from "./config";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}


export const tableStyles = {
    deepThink: {
        table: {
            borderCollapse: "collapse",
            width: "100%",
            borderColor: "#65AFFF",
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: "#000C1B",
            margin: "1rem 0",
        },
        th: {
            border: "1px solid #444",
            padding: "8px",
            backgroundColor: "#001A3B",
            textAlign: "left",
        },
        td: {
            border: "1px solid #444",
            padding: "8px",
            backgroundColor: "#0A1429",
        },
    },
    regular: {
        table: {
            borderCollapse: "collapse",
            width: "100%",
            borderRadius: "8px",
            overflow: "hidden",
            color: "#e0e0e0",
            margin: "1rem 0",
        },
        th: {
            border: "1px solid #444",
            padding: "8px",
            backgroundColor: "transparent",
            textAlign: "left",
        },
        td: {
            border: "1px solid #444",
            padding: "8px",
            backgroundColor: "#222",
            color: "#e0e0e0",
        },
    },
};

export const urlToCompanyNameExtractor = (url) => {
    // take the core part of the url to get the name of the company ex. www.yotube.com >yotube
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace(/^www\./, ""); // Remove 'www.' if present
        const parts = hostname.split(".");
        return parts.length > 1 ? parts[0] : hostname; // Return the first part as company name
    } catch (error) {
        console.error("Invalid URL:", url, error);
        return ""; // Return empty string if URL is invalid
    }
}

export const processAgenticCitations = (agenticCitations, agents) => {
    try {

        return agenticCitations.map(item => {
            const citationIdx = item.citation.replaceAll(/\[(\d+)\]/g, '$1')
            const citationAgentName = item.agentName;
            const agentDetails = agents.items.find(agent => agent.title == citationAgentName);

            return {
                citationIdx: citationIdx,
                citationAgentName: citationAgentName,
                citationAgentGoal: agentDetails.goal || "-",
                citationAgentInitialText: agentDetails.content.slice(0, 100) || "-",
                team: agentDetails.team || []
            }

        })
    } catch (error) {
        return [];

    }
}

// Helper function to extract content from blocks
export const extractContentFromBlocks = (blocks) => {
    return blocks
        .map((block) => {
            let gatheredBlock = "";
            if (block.type === "text") {
                gatheredBlock += block.content.replace("undefined", "");
            } else if (block.type === "visual") {
                gatheredBlock += `<visual>
<name>${block?.name || "No Name"}</name>
${block.content}
</visual>`;
            } else {
                gatheredBlock += block.content;
            }

            return gatheredBlock;
        })
        .join("\n");
};
export const stripHtml = (html = "") =>
    html
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/\s+/g, " ")
        .trim();

export const copyToClipboard = async (content) => {
    try {
        // Extract plain text from markdown
        const plainText = content
            .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
            .replace(/\*(.*?)\*/g, "$1") // Italic
            .replace(/\[(.*?)\]\((.*?)\)/g, "$1: $2") // Links
            .replace(/#{1,6}\s(.*?)(\n|$)/g, "$1\n") // Headers
            .replace(/```[a-zA-Z]*\n([\s\S]*?)```/g, "$1") // Code blocks
            .replace(/`(.*?)`/g, "$1"); // Inline code

        await navigator.clipboard.writeText(plainText);

        setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
        console.error("Failed to copy: ", error);
        toast({
            title: "Error",
            description: "Failed to copy to clipboard",
            variant: "destructive",
        });
    }
};
export function response(success, message, data = null) {

    return {
        success,
        message,
        data,
    };
}

export function throttle(func, wait) {
    let timeout = null;
    let lastArgs = null;

    return function (...args) {
        if (!timeout) {
            func.apply(this, args);
            timeout = setTimeout(() => {
                if (lastArgs) {
                    func.apply(this, lastArgs);
                    lastArgs = null;
                }
                timeout = null;
            }, wait);
        } else {
            lastArgs = args;
        }
    };
}

export function sortByDateGroup(data) {
    const order = ["today", "yesterday"]; // Predefined order for today and yesterday
    const dayRegex = /^(\d+) days ago$/; // Match patterns like "2 days ago"
    const monthRegex = /^(\d+) months ago$/; // Match patterns like "7 months ago"
    const yearRegex = /^(\d+) years ago$/; // Match patterns like "2 years ago"

    const sortedData = {};

    // Sort "today" and "yesterday" explicitly
    order.forEach((key) => {
        if (data[key]) {
            sortedData[key] = data[key];
            delete data[key];
        }
    });

    // Separate and sort other keys
    const daysGroup = [];
    const monthsGroup = [];
    const yearsGroup = [];
    const others = [];

    for (const key in data) {
        if (dayRegex.test(key)) {
            daysGroup.push({ key, value: data[key] });
        } else if (monthRegex.test(key)) {
            monthsGroup.push({ key, value: data[key] });
        } else if (yearRegex.test(key)) {
            yearsGroup.push({ key, value: data[key] });
        } else {
            others.push({ key, value: data[key] }); // Handle unexpected keys
        }
    }

    // Sort numerically based on the time mentioned in the key
    const sortByNumber = (group, regex) => {
        return group.sort((a, b) => {
            const aNumber = parseInt(a.key.match(regex)[1], 10);
            const bNumber = parseInt(b.key.match(regex)[1], 10);
            return aNumber - bNumber; // Ascending order
        });
    };

    sortByNumber(daysGroup, dayRegex).forEach(({ key, value }) => {
        sortedData[key] = value;
    });
    sortByNumber(monthsGroup, monthRegex).forEach(({ key, value }) => {
        sortedData[key] = value;
    });
    sortByNumber(yearsGroup, yearRegex).forEach(({ key, value }) => {
        sortedData[key] = value;
    });

    // Add any remaining "other" keys to the end
    others.forEach(({ key, value }) => {
        sortedData[key] = value;
    });

    return sortedData;
}
export function parseContent(input) {
    if (input.length <= 0) {
        throw new Error("Please enter some content to parse.");
    }

    const sections = [];
    // Updated regex to include automationCard and showUniProt blocks
    const combinedRegex =
        /(```mermaid([\s\S]*?)```)|(<\|agent\|([\s\S]*?)<\|end\|>)|(<document>([\s\S]*?)<\/document>)|(<visual>([\s\S]*?)<\/visual>)|(<automationCard>([\s\S]*?)<\/automationCard>)|(<showUniProt>([\s\S]*?)<\/showUniProt>)/g;
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(input)) !== null) {
        // Process text before the block
        if (match.index > lastIndex) {
            sections.push({
                type: "text",
                content: input.substring(lastIndex, match.index).trim(),
                isComplete: true, // Text blocks are always complete
            });
        }

        // Check which type of block it is
        if (match[0].startsWith("<showUniProt>")) {
            const uniprotContent = match[11];
            // Extract name and UniProt ID
            const nameMatch = /<name>([\s\S]*?)<\/name>/i.exec(uniprotContent);
            let name = nameMatch ? nameMatch[1].trim() : "";
            let content = uniprotContent;

            // Remove name tag if present to get the UniProt ID
            if (nameMatch) {
                content = uniprotContent.replace(nameMatch[0], "").trim();
            }

            sections.push({
                type: "showUniProt",
                uniProt: content,
                name: name,
                isComplete: true,
            });
        } else if (match[0].startsWith("<automationCard>")) {
            const automationContent = match[9];
            // Extract fields using regex
            const nameMatch = /<name>([\s\S]*?)<\/name>/i.exec(automationContent);
            const taskMatch = /<task>([\s\S]*?)<\/task>/i.exec(automationContent);
            const timeMatch = /<time>([\s\S]*?)<\/time>/i.exec(automationContent);
            const outputFormatMatch =
                /<outputFormat>([\s\S]*?)<\/outputFormat>/i.exec(automationContent);

            sections.push({
                type: "automationDaily",
                name: nameMatch ? nameMatch[1].trim() : "",
                task: taskMatch ? taskMatch[1].trim() : "",
                time: timeMatch ? timeMatch[1].trim() : "",
                outputFormat: outputFormatMatch ? outputFormatMatch[1].trim() : "",
                isComplete: true,
            });
        } else if (match[0].startsWith("```mermaid")) {
            sections.push({
                type: "mermaid",
                content: match[2].trim(),
                isComplete: true, // Mermaid blocks are always complete
            });
        } else if (match[0].startsWith("<|agent|")) {
            // Parse the persona/agent block
            const agentContent = match[4];
            const parsedAgent = parseAgentBlock(agentContent);
            sections.push({
                type: "persona",
                isComplete: true, // Persona blocks are always complete
                ...parsedAgent,
            });
        } else if (match[0].startsWith("<document>")) {
            // Parse document block
            const docContent = match[6];
            const nameMatch = /<name>([\s\S]*?)<\/name>/g.exec(docContent);

            let name = nameMatch ? nameMatch[1].trim() : "Document";
            let content = docContent;

            // Remove name tag if present
            if (nameMatch) {
                content = docContent.replace(nameMatch[0], "").trim();
            }

            sections.push({
                type: "document",
                name: name,
                content: content,
                isComplete: true, // Mark document blocks as complete when parsing from history
            });
        } else if (match[0].startsWith("<visual>")) {
            // Parse visual block
            const visualContent = match[8];
            const nameMatch = /<name>([\s\S]*?)<\/name>/g.exec(visualContent);

            let name = nameMatch ? nameMatch[1].trim() : "Visualization";
            let content = visualContent;

            // Remove name tag if present
            if (nameMatch) {
                content = visualContent.replace(nameMatch[0], "").trim();
            }

            sections.push({
                type: "visual",
                name: name,
                content: content,
                isComplete: true, // Mark visual blocks as complete when parsing from history
            });
        }

        lastIndex = combinedRegex.lastIndex;
    }

    // Process any remaining text after the last match
    if (lastIndex < input.length) {
        sections.push({
            type: "text",
            content: input.substring(lastIndex).trim(),
            isComplete: true, // Text blocks are always complete
        });
    }

    // Remove sections with empty content
    const validSections = sections.filter(
        (item) => item.content?.trim() !== "" || item.type === "automationDaily",
    );

    // Build the final array:
    // - All persona sections are merged into a single simulation object.
    // - The simulation object is inserted in place of the first encountered persona block.
    const finalSections = [];
    let simulationInserted = false;
    const personaSections = validSections.filter(
        (item) => item.type === "persona",
    );

    // Only process personas if there are any
    if (personaSections.length > 0) {
        for (const section of validSections) {
            if (section.type === "persona") {
                if (!simulationInserted) {
                    finalSections.push({
                        type: "simulation",
                        items: personaSections,
                        isComplete: true, // Simulation blocks are always complete
                    });
                    simulationInserted = true;
                }
                // Skip adding individual persona sections
            } else {
                finalSections.push(section);
            }
        }
    } else {
        // No personas, just add all sections directly
        finalSections.push(...validSections);
    }

    return finalSections;
}
// Process content that isn't nested inside document blocks
function processNonNestedBlocks(text) {
    const sections = [];
    const blockRegex =
        /(```mermaid([\s\S]*?)```)|(<\|agent\|([\s\S]*?)<\|end\|>)|(<visual>([\s\S]*?)<\/visual>)/g;
    let match;
    let lastIndex = 0;

    while ((match = blockRegex.exec(text)) !== null) {
        // Add text before this block
        if (match.index > lastIndex) {
            const textBefore = text.substring(lastIndex, match.index).trim();
            if (textBefore) {
                sections.push({
                    type: "text",
                    content: textBefore,
                    isComplete: true,
                });
            }
        }

        // Process the block based on its type
        if (match[0].startsWith("```mermaid")) {
            sections.push({
                type: "mermaid",
                content: match[2].trim(),
                isComplete: true,
            });
        } else if (match[0].startsWith("<|agent|")) {
            const agentContent = match[4];
            const parsedAgent = parseAgentBlock(agentContent);
            sections.push({
                type: "persona",
                isComplete: true,
                ...parsedAgent,
            });
        } else if (match[0].startsWith("<visual>")) {
            const visualContent = match[6];
            const nameMatch = /<name>([\s\S]*?)<\/name>/.exec(visualContent);

            let name = nameMatch ? nameMatch[1].trim() : "Visualization";
            let content = visualContent;

            if (nameMatch) {
                content = visualContent.replace(nameMatch[0], "").trim();
            }

            sections.push({
                type: "visual",
                name: name,
                content: content,
                isComplete: true,
            });
        }

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        const remainingText = text.substring(lastIndex).trim();
        if (remainingText) {
            sections.push({
                type: "text",
                content: remainingText,
                isComplete: true,
            });
        }
    }

    return sections;
}
export function playSound(src = "/notify.mp3") {
    const audio = new Audio(src);
    audio.play().catch((error) => {
        console.error("🔇 Failed to play sound:", error);
    });
}
export const getFavicon = (urls) => {
    if (!Array.isArray(urls)) {
        console.error("Expected an array of URLs");
        return [];
    }

    return urls.map((url) => {
        try {
            const domain = new URL(url).hostname;
            const favImage = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
            return { link: url, favImage: favImage, root: domain };
        } catch (error) {
            return { link: url, favImage: "" };
        }
    });
};
export function convertUrlsToMarkdown(citations) {
    if (!Array.isArray(citations)) return "";

    return citations
        .map((item, index) => {
            const title = item.title?.trim() || `Source ${index + 1}`;
            const url = item.url?.trim();
            if (!url) return "";
            return `- [${title}](${url})`;
        })
        .filter(Boolean)
        .join("\n");
}

export class LayoutEngine {
    constructor(config) {
        this.config = config;
        this.nodeSize = {
            width: LAYOUT_CONFIG.NODE_WIDTH,
            height: LAYOUT_CONFIG.NODE_HEIGHT,
        };
    }

    calculateNodeDistance(node1, node2) {
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    adjustNodePosition(position, nodes, minDistance = 350) {
        let adjustedPosition = { ...position };
        let attempts = 0;
        const maxAttempts = 50;
        const angleStep = (2 * Math.PI) / 8;

        while (attempts < maxAttempts) {
            let hasOverlap = false;

            for (const node of nodes) {
                const distance = this.calculateNodeDistance(
                    adjustedPosition,
                    node.position,
                );
                if (distance < minDistance) {
                    hasOverlap = true;
                    break;
                }
            }

            if (!hasOverlap) break;

            // Try positions in a spiral pattern
            const radius = (Math.floor(attempts / 8) + 1) * 100;
            const angle = (attempts % 8) * angleStep;
            adjustedPosition = {
                x: position.x + radius * Math.cos(angle),
                y: position.y + radius * Math.sin(angle),
            };

            attempts++;
        }

        return adjustedPosition;
    }

    calculateOptimalPosition(
        level,
        totalLevels,
        nodesInLevel,
        nodeIndexInLevel,
        totalNodes,
    ) {
        const padding = 200;
        const availableWidth = this.config.canvasWidth - 2 * padding;
        const availableHeight = this.config.canvasHeight - 2 * padding;

        // Calculate angle for circular distribution
        const angleStep = (2 * Math.PI) / totalNodes;
        const currentAngle = level * angleStep * 3 + nodeIndexInLevel * angleStep;

        // Use a spiral layout with increasing radius based on level
        const baseRadius = Math.min(availableWidth, availableHeight) * 0.35;
        const radiusIncrease = level * (baseRadius * 0.15);
        const radius = baseRadius + radiusIncrease;

        // Calculate position using parametric equations with some randomness
        const centerX = this.config.canvasWidth / 2;
        const centerY = this.config.canvasHeight / 2;

        let x = centerX + radius * Math.cos(currentAngle);
        let y = centerY + radius * Math.sin(currentAngle);

        // Add slight randomness to prevent perfect alignment
        const randomOffset = 50;
        x += (Math.random() - 0.5) * randomOffset;
        y += (Math.random() - 0.5) * randomOffset;

        // Ensure nodes stay within canvas bounds
        x = Math.max(padding, Math.min(this.config.canvasWidth - padding, x));
        y = Math.max(padding, Math.min(this.config.canvasHeight - padding, y));

        return { x, y };
    }

    calculateNodePositions(nodes, maxExecution) {
        const totalNodes = nodes.length;
        const nodesByLevel = new Map();
        const positionedNodes = [];

        // Group nodes by level
        nodes.forEach((node) => {
            const level = node.data.execution;
            if (!nodesByLevel.has(level)) {
                nodesByLevel.set(level, []);
            }
            nodesByLevel.get(level).push(node);
        });

        // Position nodes level by level
        for (let level = 1; level <= maxExecution; level++) {
            const levelNodes = nodesByLevel.get(level) || [];
            const nodesInLevel = levelNodes.length;

            levelNodes.forEach((node, index) => {
                const basePosition = this.calculateOptimalPosition(
                    level - 1,
                    maxExecution,
                    nodesInLevel,
                    index,
                    totalNodes,
                );

                // Adjust position to avoid overlaps with already positioned nodes
                const adjustedPosition = this.adjustNodePosition(
                    basePosition,
                    positionedNodes,
                );

                const positionedNode = {
                    ...node,
                    position: adjustedPosition,
                    style: {
                        ...node.style,
                        zIndex: maxExecution - level + 1,
                    },
                };

                positionedNodes.push(positionedNode);
            });
        }

        return positionedNodes;
    }
}

export function groupWorkflowData(flatData) {
    // Group nodes by execution level using a reducer.
    const groups = flatData.reduce((acc, item) => {
        // Initialize an array for the level if it doesn't exist
        const level = item.execution;
        if (!acc[level]) {
            acc[level] = [];
        }
        acc[level].push(item);
        return acc;
    }, {});

    // Convert the groups object into an array sorted by execution level.
    const sortedGroups = Object.keys(groups)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => groups[key]);

    // Return an object matching the expected structure for the component.
    return { other: sortedGroups };
}

export const getStatusColor = (status) => {
    const colors = {
        running: " bg-blue-500/20 text-blue-400 border-blue-500/30",
        failed: "bg-red-500/20 text-red-400 border-red-500/30",
        completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };
    return (
        colors[status?.toLowerCase()] ||
        "bg-slate-500/20 text-slate-400 border-slate-500/30"
    );
};

export const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
        }).format(date);
    } catch (e) {
        return dateString;
    }
};

export function sanitizeFileName(input) {
    return input
        .normalize("NFKD") // Normalize accents/special unicode
        .replace(/[\u2013\u2014]/g, "-") // Replace en dash and em dash with hyphen
        .replace(/[\u2000-\u200B\u202F\u205F\u3000]/g, " ") // Replace weird spaces with normal space
        .replace(/[^\w\s.-]/g, "") // Remove anything that's not a letter, number, space, . or -
        .replace(/[\s_-]+/g, " ") // Collapse multiple underscores, hyphens, or spaces into one space
        .trim() // Trim whitespace
        .replace(/\s+/g, "-") // Convert spaces to hyphens
        .replace(/^[-.]+|[-.]+$/g, "") // Remove leading/trailing hyphens/dots
        .slice(0, 255); // Ensure it's not too long
}

// Special helper for parsing streaming content chunks
export function parseStreamingContent(chunk, previousState = {}) {
    // Initialize or use existing buffers from previous state
    const buffer = previousState.buffer || "";
    const completeBuffer = buffer + chunk;

    // Direct string detection for showUniProt pattern
    if (
        completeBuffer.includes("<showUniProt>") &&
        completeBuffer.includes("</showUniProt>")
    ) {
        // Extract the full showUniProt text - find start and end positions
        const startPos = completeBuffer.indexOf("<showUniProt>");
        const endPos = completeBuffer.indexOf("</showUniProt>") + 14; // 14 is length of closing tag

        if (startPos !== -1 && endPos !== -1 && endPos > startPos) {
            const sections = [];

            // Add any text before the showUniProt
            if (startPos > 0) {
                const textBefore = completeBuffer.substring(0, startPos).trim();
                if (textBefore) {
                    sections.push({
                        type: "text",
                        content: textBefore,
                        isComplete: true,
                    });
                }
            }

            // Extract the showUniProt content
            const uniprotText = completeBuffer.substring(startPos + 13, endPos - 14);

            // Extract name and UniProt ID
            const nameMatch = uniprotText.match(/<name>([\s\S]*?)<\/name>/i);
            let name = nameMatch ? nameMatch[1].trim() : "";
            let content = uniprotText;

            // Remove name tag if present to get the UniProt ID
            if (nameMatch) {
                content = uniprotText.replace(nameMatch[0], "").trim();
            }

            sections.push({
                type: "showUniProt",
                uniProt: content,
                name: name,
                isComplete: true,
            });

            // Add any text after the showUniProt
            if (endPos < completeBuffer.length) {
                const textAfter = completeBuffer.substring(endPos).trim();
                if (textAfter) {
                    sections.push({
                        type: "text",
                        content: textAfter,
                        isComplete: true,
                    });
                }
            }

            // Return the parsed sections
            return {
                sections,
                buffer: "", // Clear buffer since we've processed this showUniProt
                openDocTags: 0,
                closeDocTags: 0,
                insideDocument: false,
            };
        }
    }

    // Direct string detection for automation card pattern in the exact format seen
    if (
        completeBuffer.includes("<automationCard>") &&
        completeBuffer.includes("</automationCard>")
    ) {
        // Extract the full card text - find start and end positions
        const startPos = completeBuffer.indexOf("<automationCard>");
        const endPos = completeBuffer.indexOf("</automationCard>") + 17; // 17 is length of closing tag

        if (startPos !== -1 && endPos !== -1 && endPos > startPos) {
            const sections = [];

            // Add any text before the card
            if (startPos > 0) {
                const textBefore = completeBuffer.substring(0, startPos).trim();
                if (textBefore) {
                    sections.push({
                        type: "text",
                        content: textBefore,
                        isComplete: true,
                    });
                }
            }

            // Extract the card content
            const cardText = completeBuffer.substring(startPos + 15, endPos - 17);

            // Extract all required fields using simple string searches
            const nameMatch = cardText.match(/<name>([\s\S]*?)<\/name>/i);
            const taskMatch = cardText.match(/<task>([\s\S]*?)<\/task>/i);
            const timeMatch = cardText.match(/<time>([\s\S]*?)<\/time>/i);
            const outputFormatMatch = cardText.match(
                /<outputFormat>([\s\S]*?)<\/outputFormat>/i,
            );

            sections.push({
                type: "automationDaily",
                name: nameMatch ? nameMatch[1].trim() : "",
                task: taskMatch ? taskMatch[1].trim() : "",
                time: timeMatch ? timeMatch[1].trim() : "",
                outputFormat: outputFormatMatch ? outputFormatMatch[1].trim() : "",
                isComplete: true,
            });

            // Add any text after the card
            if (endPos < completeBuffer.length) {
                const textAfter = completeBuffer.substring(endPos).trim();
                if (textAfter) {
                    sections.push({
                        type: "text",
                        content: textAfter,
                        isComplete: true,
                    });
                }
            }

            // Return the parsed sections
            return {
                sections,
                buffer: "", // Clear buffer since we've processed this card
                openDocTags: 0,
                closeDocTags: 0,
                insideDocument: false,
            };
        }
    }

    // Continue with existing processing...
    const openDocTags =
        (previousState.openDocTags || 0) + countTags(chunk, "<document>");
    const closeDocTags =
        (previousState.closeDocTags || 0) + countTags(chunk, "</document>");

    // Count automation card tags to detect them as early as possible
    const openAutomationTags = countTags(completeBuffer, "<automationCard>");
    const closeAutomationTags = countTags(completeBuffer, "</automationCard>");
    const hasPartialAutomation =
        openAutomationTags > 0 && openAutomationTags === closeAutomationTags;

    // Check if we're inside a document block (more open tags than close tags)
    const insideDocument = openDocTags > closeDocTags;

    // If inside document block, just accumulate and wait for complete document
    if (insideDocument) {
        return {
            sections: [], // No complete sections while inside a document
            buffer: completeBuffer,
            openDocTags,
            closeDocTags,
            insideDocument,
        };
    }

    // Check if we have automation cards in a complete form - prioritize parsing them
    if (hasPartialAutomation) {
        const automationCardRegex = /<automationCard>([\s\S]*?)<\/automationCard>/g;
        let match;
        const sections = [];
        let lastIndex = 0;

        // Extract any complete automation cards
        while ((match = automationCardRegex.exec(completeBuffer)) !== null) {
            // Add text before if any
            if (match.index > lastIndex) {
                const textContent = completeBuffer
                    .substring(lastIndex, match.index)
                    .trim();
                if (textContent) {
                    sections.push({
                        type: "text",
                        content: textContent,
                        isComplete: true,
                    });
                }
            }

            const automationContent = match[1];
            const nameMatch = /<name>([\s\S]*?)<\/name>/i.exec(automationContent);
            const taskMatch = /<task>([\s\S]*?)<\/task>/i.exec(automationContent);
            const timeMatch = /<time>([\s\S]*?)<\/time>/i.exec(automationContent);
            const outputFormatMatch =
                /<outputFormat>([\s\S]*?)<\/outputFormat>/i.exec(automationContent);

            sections.push({
                type: "automationDaily",
                name: nameMatch ? nameMatch[1].trim() : "",
                task: taskMatch ? taskMatch[1].trim() : "",
                time: timeMatch ? timeMatch[1].trim() : "",
                outputFormat: outputFormatMatch ? outputFormatMatch[1].trim() : "",
                isComplete: true,
            });

            lastIndex = match.index + match[0].length;
        }

        // Return any sections we've found, with remaining buffer
        if (sections.length > 0) {
            const remainingBuffer = completeBuffer.substring(lastIndex);
            return {
                sections,
                buffer: remainingBuffer,
                openDocTags,
                closeDocTags,
                insideDocument: false,
            };
        }
    }

    // If we have a balanced number of tags or a complete chunk, try to parse it
    if (openDocTags === closeDocTags && openDocTags > 0) {
        // We have at least one complete document, use standard parser
        const parsedSections = parseContent(completeBuffer);

        // Reset buffer since we've processed everything
        return {
            sections: parsedSections,
            buffer: "",
            openDocTags: 0,
            closeDocTags: 0,
            insideDocument: false,
        };
    }

    // If no document tags, check for complete visual, mermaid, agent, automationCard, and showUniProt blocks
    if (openDocTags === 0 && closeDocTags === 0) {
        // Updated regex to include automationCard and showUniProt blocks
        const visualRegex = /<visual>([\s\S]*?)<\/visual>/g;
        const mermaidRegex = /```mermaid([\s\S]*?)```/g;
        const agentRegex = /<\|agent\|([\s\S]*?)<\|end\|>/g;
        const automationCardRegex = /<automationCard>([\s\S]*?)<\/automationCard>/g;
        const showUniProtRegex = /<showUniProt>([\s\S]*?)<\/showUniProt>/g;

        let lastIndex = 0;
        const sections = [];
        let match;

        // Check for complete showUniProt blocks
        while ((match = showUniProtRegex.exec(completeBuffer)) !== null) {
            // Add text before if any
            if (match.index > lastIndex) {
                const textContent = completeBuffer
                    .substring(lastIndex, match.index)
                    .trim();
                if (textContent) {
                    sections.push({
                        type: "text",
                        content: textContent,
                        isComplete: true,
                    });
                }
            }

            const uniprotContent = match[1];
            // Extract name and UniProt ID
            const nameMatch = /<name>([\s\S]*?)<\/name>/i.exec(uniprotContent);
            let name = nameMatch ? nameMatch[1].trim() : "";
            let content = uniprotContent;

            // Remove name tag if present to get the UniProt ID
            if (nameMatch) {
                content = uniprotContent.replace(nameMatch[0], "").trim();
            }

            sections.push({
                type: "showUniProt",
                uniProt: content,
                name: name,
                isComplete: true,
            });

            lastIndex = match.index + match[0].length;
        }

        // Check for complete automationCard blocks
        while ((match = automationCardRegex.exec(completeBuffer)) !== null) {
            // Add text before if any
            if (match.index > lastIndex) {
                const textContent = completeBuffer
                    .substring(lastIndex, match.index)
                    .trim();
                if (textContent) {
                    sections.push({
                        type: "text",
                        content: textContent,
                        isComplete: true,
                    });
                }
            }

            const automationContent = match[1];
            const nameMatch = /<name>([\s\S]*?)<\/name>/i.exec(automationContent);
            const taskMatch = /<task>([\s\S]*?)<\/task>/i.exec(automationContent);
            const timeMatch = /<time>([\s\S]*?)<\/time>/i.exec(automationContent);
            const outputFormatMatch =
                /<outputFormat>([\s\S]*?)<\/outputFormat>/i.exec(automationContent);

            sections.push({
                type: "automationDaily",
                name: nameMatch ? nameMatch[1].trim() : "",
                task: taskMatch ? taskMatch[1].trim() : "",
                time: timeMatch ? timeMatch[1].trim() : "",
                outputFormat: outputFormatMatch ? outputFormatMatch[1].trim() : "",
                isComplete: true,
            });

            lastIndex = match.index + match[0].length;
        }

        // Check for complete visual blocks
        while ((match = visualRegex.exec(completeBuffer)) !== null) {
            if (match.index > lastIndex) {
                const textContent = completeBuffer
                    .substring(lastIndex, match.index)
                    .trim();
                if (textContent) {
                    sections.push({
                        type: "text",
                        content: textContent,
                        isComplete: true,
                    });
                }
            }

            const visualContent = match[1];
            const nameMatch = /<name>([\s\S]*?)<\/name>/.exec(visualContent);

            let name = nameMatch ? nameMatch[1].trim() : "Visualization";
            let content = visualContent;

            if (nameMatch) {
                content = visualContent.replace(nameMatch[0], "").trim();
            }

            sections.push({
                type: "visual",
                name: name,
                content: content,
                isComplete: true,
            });

            lastIndex = match.index + match[0].length;
        }

        // Check for complete mermaid blocks
        while ((match = mermaidRegex.exec(completeBuffer)) !== null) {
            if (match.index > lastIndex) {
                const textContent = completeBuffer
                    .substring(lastIndex, match.index)
                    .trim();
                if (textContent) {
                    sections.push({
                        type: "text",
                        content: textContent,
                        isComplete: true,
                    });
                }
            }

            sections.push({
                type: "mermaid",
                content: match[1].trim(),
                isComplete: true,
            });

            lastIndex = match.index + match[0].length;
        }

        // Check for complete agent blocks
        while ((match = agentRegex.exec(completeBuffer)) !== null) {
            if (match.index > lastIndex) {
                const textContent = completeBuffer
                    .substring(lastIndex, match.index)
                    .trim();
                if (textContent) {
                    sections.push({
                        type: "text",
                        content: textContent,
                        isComplete: true,
                    });
                }
            }

            const agentContent = match[1];
            const parsedAgent = parseAgentBlock(agentContent);
            sections.push({
                type: "persona",
                isComplete: true,
                ...parsedAgent,
            });

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < completeBuffer.length) {
            const remainingText = completeBuffer.substring(lastIndex).trim();
            if (remainingText) {
                sections.push({
                    type: "text",
                    content: remainingText,
                    isComplete: true,
                });
            }
        }

        // Return what we've parsed and any remaining text as buffer
        return {
            sections,
            buffer: "", // Reset buffer if we've processed everything
            openDocTags: 0,
            closeDocTags: 0,
            insideDocument: false,
        };
    }

    // If we have unbalanced tags, or couldn't parse anything properly
    return {
        sections: [],
        buffer: completeBuffer, // Keep accumulating
        openDocTags,
        closeDocTags,
        insideDocument,
    };
}

// Helper function to count tag occurrences in a string
function countTags(str, tag) {
    const regex = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    const matches = str.match(regex);
    return matches ? matches.length : 0;
}

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

