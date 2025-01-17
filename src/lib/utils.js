import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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



export function cleanLatex(latexString) {
  return latexString
    .replace(/\\\n/g, '') // Remove all \n characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .trim(); // Remove leading and trailing spaces
}

export function parseContent(input) {
  if (!input.trim()) {
    throw new Error('Please enter some content to parse.');
  }

  const sections = [];
  const blockRegex = /```(latex|mermaid)([\s\S]*?)```/g; // Match latex/mermaid blocks
  const inlineMathRegex = /\[\s*\\text\{([^}]+)\}\s*]/g; // Match [\text{...}] inline blocks
  let lastIndex = 0;
  let match;

  // Process block content (latex/mermaid)
  while ((match = blockRegex.exec(input)) !== null) {
    const [fullMatch, blockType, blockContent] = match;

    // Process text before the block, including inline math
    if (match.index > lastIndex) {
      processInlineText(input.substring(lastIndex, match.index), sections);
    }

    // Add the block content
    if (blockContent.trim()) {
      sections.push({
        type: blockType,
        content: blockType === 'latex'
          ? `$$${cleanLatex(blockContent)}$$`
          : blockContent.trim(),
      });
    }

    lastIndex = blockRegex.lastIndex;
  }

  // Process remaining text after the last block
  if (lastIndex < input.length) {
    processInlineText(input.substring(lastIndex), sections);
  }

  return sections;
}

function processInlineText(input, sections) {
  const inlineMathRegex = /\[\s*\\text\{([^}]+)\}\s*]/g;
  let lastIndex = 0;
  let match;

  while ((match = inlineMathRegex.exec(input)) !== null) {
    const [fullMatch, mathContent] = match;

    // Add text before the math block
    if (match.index > lastIndex) {
      const textContent = input.substring(lastIndex, match.index).trim();
      if (textContent) {
        sections.push({ type: 'text', content: textContent });
      }
    }

    // Add the math block with $...$
    if (mathContent.trim()) {
      sections.push({ type: 'math', content: `$${mathContent.trim()}$` });
    }

    lastIndex = inlineMathRegex.lastIndex;
  }

  // Add remaining text
  const remainingText = input.substring(lastIndex).trim();
  if (remainingText) {
    sections.push({ type: 'text', content: remainingText });
  }
}