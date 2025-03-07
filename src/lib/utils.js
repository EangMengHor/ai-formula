import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { LAYOUT_CONFIG } from "./config";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function response(success, message, data = null) {
  console.log({
    success,
    message,
    data,
  })
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
    throw new Error('Please enter some content to parse.');
  }

  const sections = [];
  const combinedRegex = /(```mermaid([\s\S]*?)```)|(<\|agent\|([\s\S]*?)<\|end\|>)/g;
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(input)) !== null) {
    // Process text before the block
    if (match.index > lastIndex) {
      sections.push({
        type: 'text',
        content: input.substring(lastIndex, match.index).trim(),
      });
    }

    // Check if it's a mermaid block or an agent block
    if (match[0].startsWith('```mermaid')) {
      sections.push({
        type: 'mermaid',
        content: match[2].trim(),
      });
    } else {
      // Parse the persona/agent block
      const agentContent = match[4];
      const parsedAgent = parseAgentBlock(agentContent);
      sections.push({
        type: 'persona',
        ...parsedAgent,
      });
    }

    lastIndex = combinedRegex.lastIndex;
  }

  // Process any remaining text after the last match
  if (lastIndex < input.length) {
    sections.push({
      type: 'text',
      content: input.substring(lastIndex).trim(),
    });
  }

  // Remove sections with empty content
  const validSections = sections.filter(item => item.content?.trim() !== '');

  // Build the final array:
  // - All persona sections are merged into a single simulation object.
  // - The simulation object is inserted in place of the first encountered persona block.
  const finalSections = [];
  let simulationInserted = false;
  const personaSections = validSections.filter(item => item.type === 'persona');

  for (const section of validSections) {
    if (section.type === 'persona') {
      if (!simulationInserted) {
        finalSections.unshift({
          type: "simulation",
          items: personaSections
        });
        simulationInserted = true;
      }
      // Skip adding individual persona sections
    } else {
      finalSections.push(section);
    }
  }
  console.log(finalSections,"sadjh392874")

  return finalSections;
}

function parseAgentBlock(agentContent) {
  const result = {
    content: agentContent
  };

  // Extract title
  const titleMatch = /<\|title\|([\s\S]*?)<\|title\|>/g.exec(agentContent);
  if (titleMatch) {
    let title = titleMatch[1].trim();
    if (title.startsWith('>')) {
      title = title.substring(1).trim();
    }
    result.title = title;
    result.content = result.content.replace(titleMatch[0], '');
  }

  // Extract goal
  const goalMatch = /<\|goal\|([\s\S]*?)<\|goal\|>/g.exec(agentContent);
  if (goalMatch) {
    let goal = goalMatch[1].trim();
    if (goal.startsWith('>')) {
      goal = goal.substring(1).trim();
    }
    result.goal = goal;
    result.content = result.content.replace(goalMatch[0], '');
  }

  // Extract all team entries
  result.team = [];
  const teamRegex = /<\|team\|([\s\S]*?)<\|team\|>/g;
  let teamMatch;
  
  while ((teamMatch = teamRegex.exec(agentContent)) !== null) {
    const teamContent = teamMatch[1].trim();
    
    if (teamContent.startsWith('"') && teamContent.endsWith('"')) {
      let member = teamContent.slice(1, -1).trim();
      if (member.startsWith('>')) {
        member = member.substring(1).trim();
      }
      result.team.push(member);
    } else {
      const members = teamContent.split(',').map(item => {
        let trimmed = item.trim();
        if (trimmed.startsWith('>')) {
          trimmed = trimmed.substring(1).trim();
        }
        return trimmed.startsWith('"') && trimmed.endsWith('"') 
          ? trimmed.slice(1, -1).trim() 
          : trimmed;
      });
      result.team.push(...members);
    }
    
    result.content = result.content.replace(teamMatch[0], '');
  }

  result.content = result.content.trim();
  if (result.content.startsWith('>')) {
    result.content = result.content.substring(1).trim();
  }
  return result;
}


export const getFavicon = (urls) => {
  if (!Array.isArray(urls)) {
    console.error("Expected an array of URLs");
    return [];
  }

  return urls.map(url => {
    try {
      const domain = new URL(url).hostname;
      const favImage = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      return { link: url, favImage: favImage, root: domain };
    } catch (error) {
      return { link: url, favImage: '' };
    }
  });
};



export class LayoutEngine {
  constructor(config) {
    this.config = config;
    this.nodeSize = {
      width: LAYOUT_CONFIG.NODE_WIDTH,
      height: LAYOUT_CONFIG.NODE_HEIGHT
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
        const distance = this.calculateNodeDistance(adjustedPosition, node.position);
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
        y: position.y + radius * Math.sin(angle)
      };

      attempts++;
    }

    return adjustedPosition;
  }

  calculateOptimalPosition(level, totalLevels, nodesInLevel, nodeIndexInLevel, totalNodes) {
    const padding = 200;
    const availableWidth = this.config.canvasWidth - (2 * padding);
    const availableHeight = this.config.canvasHeight - (2 * padding);

    // Calculate angle for circular distribution
    const angleStep = (2 * Math.PI) / totalNodes;
    const currentAngle = (level * angleStep * 3) + (nodeIndexInLevel * angleStep);

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
    nodes.forEach(node => {
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
          totalNodes
        );

        // Adjust position to avoid overlaps with already positioned nodes
        const adjustedPosition = this.adjustNodePosition(basePosition, positionedNodes);

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




