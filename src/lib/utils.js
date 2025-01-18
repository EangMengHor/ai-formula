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
    .replace(/\\\n/g, '') // Remove all \n characters escaped with backslash
    .replace(/[\s\n]+/g, ' ') // Replace multiple spaces/newlines with a single space
    .trim(); // Remove leading and trailing spaces
}

export function parseContent(input) {
  if (!input.trim()) {
    throw new Error('Please enter some content to parse.');
  }

  const sections = [];
  const blockRegex = /```(latex|mermaid)([\s\S]*?)```/g; // Match latex/mermaid blocks
  const inlineMathRegex = /\$([\s\S]*?)\$/g; // Everything inside $...$ is math
  const inlineBracketRegex = /\[\s*\\([\s\S]+?)\\\s*\]/g; // Match [\ wrapped content \] or [ \ wrapped content \ ]

  let lastIndex = 0;
  let match;

  // First, split by block content (latex/mermaid)
  while ((match = blockRegex.exec(input)) !== null) {
    const [fullMatch, blockType, blockContent] = match;

    // Process text before the block
    if (match.index > lastIndex) {
      processTextWithMath(input.substring(lastIndex, match.index), sections, inlineMathRegex, inlineBracketRegex);
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

  // Process remaining text
  if (lastIndex < input.length) {
    processTextWithMath(input.substring(lastIndex), sections, inlineMathRegex, inlineBracketRegex);
  }

  return sections.filter(item => item.content.replaceAll('\\', '').trim() !== '');
}

function processTextWithMath(input, sections, inlineMathRegex, inlineBracketRegex) {
  const patterns = [
    {
      regex: /\$\$([\s\S]*?)\$\$/g, // Display math $$...$$
      type: 'math',
      wrapper: (content) => `$$${cleanLatex(content)}$$`
    },
    {
      regex: inlineMathRegex, // Inline math $...$
      type: 'math',
      wrapper: (content) => `$${cleanLatex(content)}$`
    },
    {
      regex: inlineBracketRegex, // Inline bracket [\ ... \]
      type: 'math',
      wrapper: (content) => `\\[${cleanLatex(content)}\\]`
    }
  ];

  let currentText = input;

  while (currentText) {
    let earliestMatch = null;
    let selectedPattern = null;

    // Find the earliest matching pattern
    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0; // Reset regex
      const match = pattern.regex.exec(currentText);
      if (match && (!earliestMatch || match.index < earliestMatch.index)) {
        earliestMatch = match;
        selectedPattern = pattern;
      }
    }

    if (!earliestMatch) {
      // No more patterns found, add remaining text if any
      const remainingText = currentText.trim();
      if (remainingText) {
        sections.push({ type: 'text', content: remainingText });
      }
      break;
    }

    // Add text before the match
    if (earliestMatch.index > 0) {
      const textBefore = currentText.substring(0, earliestMatch.index).trim();
      if (textBefore) {
        sections.push({ type: 'text', content: textBefore });
      }
    }

    // Add the matched content
    sections.push({
      type: selectedPattern.type,
      content: selectedPattern.wrapper(earliestMatch[1] || earliestMatch[0])
    });

    // Continue with remaining text
    currentText = currentText.substring(earliestMatch.index + earliestMatch[0].length);
  }
}
