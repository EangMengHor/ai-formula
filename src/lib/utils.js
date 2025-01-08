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