export default function polling(fn, delay, maxPendingReq) {
  let pendingRequests = 0;
  let intervalId = null;
  let shouldPoll = true; // Add this flag

  return function (...args) {
    function poll() {
      console.log(shouldPoll, "hello", intervalId, "is processing polling...");
      if (!shouldPoll) return; // Check the flag

      if (pendingRequests >= maxPendingReq) {
        console.log("Pausing polling due to too many pending requests");
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
        console.log("Polling started", intervalId);
      }
    }

    function stopPolling() {
      if (intervalId) {
        console.log("Polling stopped 1 ", intervalId, shouldPoll);
        clearInterval(intervalId);
        console.log("Polling stopped 1 ", intervalId, shouldPoll);
        intervalId = null;
        shouldPoll = false; // Set the flag to false
      }
    }

    startPolling();

    return { startPolling, stopPolling };
  };
}
