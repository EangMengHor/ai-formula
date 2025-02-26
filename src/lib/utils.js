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
  const blockRegex = /```(mermaid)([\s\S]*?)```/g; // Match mermaid blocks
  const agentRegex = /<\|agent\|([\s\S]*?)<\|end\|>/g; // Match agent blocks

  let lastIndex = 0;
  let match;

  // Combined regex to match both patterns
  const combinedRegex = /(```mermaid([\s\S]*?)```)|(<\|agent\|([\s\S]*?)<\|end\|>)/g;

  while ((match = combinedRegex.exec(input)) !== null) {
    // Process text before the block
    if (match.index > lastIndex) {
      sections.push({
        type: 'text',
        content: input.substring(lastIndex, match.index).trim(),
      });
    }

    // Determine if it's a mermaid block or agent block
    if (match[0].startsWith('```mermaid')) {
      // Handle mermaid block
      sections.push({
        type: 'mermaid',
        content: match[2].trim(),
      });
    } else {
      // Handle agent block
      sections.push({
        type: 'persona',
        content: match[4],
      });
    }

    lastIndex = combinedRegex.lastIndex;
  }

  // Process remaining text
  if (lastIndex < input.length) {
    sections.push({
      type: 'text',
      content: input.substring(lastIndex).trim(),
    });
  }

  return sections.filter(item => item.content.trim() !== '');
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