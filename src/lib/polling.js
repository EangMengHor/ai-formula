export default function polling(fn, delay, maxPendingReq) {
  let pendingRequests = 0;
  let intervalId = null;
  let shouldPoll = true; // Add this flag

  return function (...args) {
    function poll() {
      if (!shouldPoll) return; // Check the flag

      if (pendingRequests >= maxPendingReq) {
        return;
      }

      pendingRequests++;
      fn(...args)
        .catch(() => {})
        .finally(() => {
          pendingRequests--;
        });
    }

    function startPolling() {
      if (!intervalId) {
        intervalId = setInterval(poll, delay);
      }
    }

    function stopPolling() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        shouldPoll = false; // Set the flag to false
      }
    }

    startPolling();

    return { startPolling, stopPolling };
  };
}
