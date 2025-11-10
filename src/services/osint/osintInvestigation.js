import axios from "axios";

// OSINT API endpoint
const OSINT_API_URL = import.meta.env.VITE_OSINT_API_URL || "http://localhost:8080/api/osint/osint";

/**
 * Perform OSINT investigation
 * @param {string} query - Search query (under 50 characters)
 * @param {string} type - Type of search: 'email', 'phone', 'name', 'username'
 * @returns {Promise<Object>} Investigation results
 */
export async function osintInvestigation({ query, type }) {
  try {
    if (!query || query.trim().length === 0) {
      throw new Error("Query cannot be empty");
    }

    if (query.length > 50) {
      throw new Error("Query must be less than 50 characters");
    }

    const validTypes = ["email", "phone", "name", "username"];
    if (!validTypes.includes(type)) {
      throw new Error(
        `Invalid type. Must be one of: ${validTypes.join(", ")}`
      );
    }

    const payload = {
      query: query.trim(),
      type: type.toLowerCase(),
    };

    const response = await axios.post(OSINT_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 120000, // 2 minutes timeout for long-running OSINT queries
    });

    if (response.status !== 200) {
      throw new Error(
        response.data?.message || "OSINT investigation failed"
      );
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("[osintInvestigation] Error:", error);

    // Handle specific error types
    let errorMessage = "OSINT investigation failed";

    if (error.response) {
      // Server responded with error status
      errorMessage =
        error.response.data?.message ||
        error.response.statusText ||
        errorMessage;
    } else if (error.request) {
      // Request made but no response
      errorMessage = "No response from OSINT API. Please try again.";
    } else {
      // Error in request setup
      errorMessage = error.message || errorMessage;
    }

    return {
      success: false,
      error: errorMessage,
      details: error,
    };
  }
}
