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

  return function(...args) {
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

