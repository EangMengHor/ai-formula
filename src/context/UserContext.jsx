import React, { createContext, useEffect, useState } from "react";
import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { aiIntractions } from "../lib/config";
import { logoutApi } from "@/services/n8n-apis/_auth/logout.api";
import { refreshApi } from "@/services/n8n-apis/_auth/refresh.api";

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
  const [isDeepThinkMode, setIsDeepThinkMode] = useState(false); // Default to Quick Response
  // swarm
  const [isSwarmMode, setIsSwarmMode] = useState(false);
  const [isAutoSwarmContextState, setIsAutoSwarmContextState] = useState(false);
  const [selectedSuperiorPersona, setSelectedSuperiorPersona] = useState([]);
  const [isSuperiorPersonaAttached, setIsSuperiorPersonaAttached] =
    useState(false);
  const [isUserBanned, setIsUserBanned] = useState(false);
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

  async function refreshAccessToken() {
    try {
      const data = await refreshApi();
      if (!data.success) {
        throw new Error(data.message || "Failed to refresh access token");
      }
    } catch (error) {
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
        isUserBanned,
        setIsUserBanned,
        refreshAccessToken,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};
