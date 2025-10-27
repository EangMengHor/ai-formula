import React, { createContext, useEffect, useState, useRef } from "react";
import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { aiIntractions } from "../lib/config";
import { logoutApi } from "@/services/n8n-apis/_auth/logout.api";
import { refreshApi } from "@/services/n8n-apis/_auth/refresh.api";
import { useToast } from "../hooks/use-toast"; // Import toast for logout notification

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: null,
    email: "",
    isAuthenticated: false,
  });
  const { pathname } = useLocation();
  const [isSearchOn, setIsSearchOn] = useState(false);
  const [isDocumentOn, setIsDocumentOn] = useState(false);
  const [isVectorBaseOn, setIsVectorBaseOn] = useState(false);
  const [SupPerItems, setSupPerItems] = useState([]);
  const [currActiveIntraction, setCurrActiveIntraction] = useState(
    aiIntractions[0].value || "sequential",
  );
  const [authToken, setAuthToken] = useState({
    accessToken: "",
    refreshToken: "",
  });
  const { toast } = useToast(); // Add toast for logout notification
  const tokenRefreshTimerRef = useRef(null); // Reference to store the timer
  const [isDeepThinkMode, setIsDeepThinkMode] = useState(false); // Default to Quick Response
  const [isHeliosAgentMode, setIsHeliosAgentMode] = useState(true); // helios agent mode
  const [isAbliteratedMode, setIsAbliteratedMode] = useState(false);
  // swarm
  const [isSwarmMode, setIsSwarmMode] = useState(false);
  const [isAutoSwarmContextState, setIsAutoSwarmContextState] = useState(false);
  const [selectedSuperiorPersona, setSelectedSuperiorPersona] = useState([]);
  const [isSuperiorPersonaAttached, setIsSuperiorPersonaAttached] =
    useState(false);
  const [isUserBanned, setIsUserBanned] = useState(false);
  const [promptTemplatePrompt, setPromptTemplatePrompt] = useState(""); // Add this line
  const [selectedModel, setSelectedModel] = useState([]);
  //   logic to restore the selected model
  // restore selected model
  function restoredSavedModel(sessionId) {
    const storedModel = localStorage.getItem(`selectedModel:${sessionId}`);
    if (storedModel) {
      setSelectedModel(JSON.parse(storedModel));
    }
  }

  function updateSavedModel(sessionId, model, type = "add") {
    if (!sessionId || !model) return;

    const existing = localStorage.getItem(`selectedModel:${sessionId}`);
    let models = [];
    if (existing) {
      models = JSON.parse(existing);
    }
    if (type === "add") {
      if (!models.includes(model)) {
        models.push(model);
      }
    } else {
      models = models.filter((m) => m !== model);
    }
    localStorage.setItem(`selectedModel:${sessionId}`, JSON.stringify(models));
  }

  function selectIntentModel(model, sessionId) {
    setSelectedModel((prev) => [...prev, model]);
    updateSavedModel(sessionId, model);
  }
  function removeSelectedIntent(model, sessionId) {
    setSelectedModel((prev) => prev.filter((m) => m !== model));
    updateSavedModel(sessionId, model, "remove");
  }
  useEffect(() => {
    setIsDocumentOn(false);
  }, [pathname]);

  const navigate = useNavigate();

  async function logout() {
    localStorage.removeItem("id");
    localStorage.removeItem("email");

    setUser({
      id: null,
      email: "",
      isAuthenticated: false,
    });
    await logoutApi();
    navigate("/login");
    toast({
      title: "Success",
      description: "Logged out successfully",
      variant: "default",
    });
  }

  // Setup token refresh mechanism
  const setupTokenRefresh = () => {
    // Clear any existing timer
    if (tokenRefreshTimerRef.current) {
      clearInterval(tokenRefreshTimerRef.current);
    }

    // Set new refresh timer (10 minutes = 600000 milliseconds)
    tokenRefreshTimerRef.current = setInterval(
      () => {
        refreshAccessToken();
      },
      10 * 60 * 1000,
    );
  };

  // Start token refresh when component mounts
  useEffect(() => {
    setupTokenRefresh();

    // Cleanup on unmount
    return () => {
      if (tokenRefreshTimerRef.current) {
        clearInterval(tokenRefreshTimerRef.current);
      }
    };
  }, []);

  function getMode() {
    if (isSwarmMode) {
      return "swarm";
    } else if (isDeepThinkMode) {
      return "deep";
    } else if (isHeliosAgentMode) {
      return "helios";
    } else if (isAbliteratedMode) {
      return "abliterated";
    } else {
      return "quick";
    }
  }

  // Reset the timer whenever authToken changes
  useEffect(() => {
    if (user.isAuthenticated) {
      setupTokenRefresh();
    }
  }, [authToken, user.isAuthenticated]);

  async function refreshAccessToken() {
    try {
      console.log("Refreshing access token...");
      const data = await refreshApi();
      if (!data.success) {
        throw new Error(data.message || "Failed to refresh access token");
      }

      if (data.accessToken) {
        setAuthToken((prevState) => ({
          ...prevState,
          accessToken: data.accessToken,
        }));
        localStorage.setItem("accessToken", data.accessToken);
      }
    } catch (error) {
      console.error("Failed to refresh token:", error);
      navigate("/login");
    }
  }

  return (
    <UserContext.Provider
      value={{
        isSwarmMode,
        setIsSwarmMode,
        isAutoSwarmContextState,
        setIsAutoSwarmContextState,
        user,
        setUser,
        logout,
        isSearchOn,
        setIsSearchOn,
        isDocumentOn,
        setIsDocumentOn,
        isVectorBaseOn,
        setIsVectorBaseOn,
        isSuperiorPersonaAttached,
        setIsSuperiorPersonaAttached,
        selectedSuperiorPersona,
        setSelectedSuperiorPersona,
        SupPerItems,
        setSupPerItems,
        currActiveIntraction,
        setCurrActiveIntraction,
        isDeepThinkMode,
        setIsDeepThinkMode,
        isHeliosAgentMode,
        setIsHeliosAgentMode,
        isUserBanned,
        setIsUserBanned,
        refreshAccessToken,
        authToken,
        setAuthToken,
        promptTemplatePrompt,
        setPromptTemplatePrompt,
        selectedModel,
        getMode,
        setSelectedModel,
        selectIntentModel,
        removeSelectedIntent,
        restoredSavedModel,
        isAbliteratedMode,
        setIsAbliteratedMode,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};
