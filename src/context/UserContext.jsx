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
  // swarm
  const [isSwarmMode, setIsSwarmMode] = useState(false);
  const [isAutoSwarmContextState, setIsAutoSwarmContextState] = useState(false);
  const [selectedSuperiorPersona, setSelectedSuperiorPersona] = useState([]);
  const [isSuperiorPersonaAttached, setIsSuperiorPersonaAttached] =
    useState(false);
  const [isUserBanned, setIsUserBanned] = useState(false);
  const [promptTemplatePrompt, setPromptTemplatePrompt] = useState(""); // Add this line
  console.log(user, "user");
  useEffect(() => {
    console.log("Changs", isDeepThinkMode);
  }, [isDeepThinkMode]);
  useEffect(() => {
    setIsDocumentOn(false);
  }, [pathname]);

  const navigate = useNavigate();
  useEffect(() => {
    console.log(user, "user");
  }, [user]);

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
        console.log("Automatically refreshing access token");
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

  // Reset the timer whenever authToken changes
  useEffect(() => {
    if (user.isAuthenticated) {
      setupTokenRefresh();
    }
  }, [authToken, user.isAuthenticated]);

  async function refreshAccessToken() {
    try {
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
        console.log("Access token refreshed successfully");
      }
    } catch (error) {
      console.error("Failed to refresh token:", error);
      navigate("/login");
    }
  }

  useEffect(() => {
    console.log("Prompt Template Prompt Changed:", promptTemplatePrompt);
  }, [promptTemplatePrompt]);

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
        isUserBanned,
        setIsUserBanned,
        refreshAccessToken,
        authToken,
        setAuthToken,
        promptTemplatePrompt,
        setPromptTemplatePrompt,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};
