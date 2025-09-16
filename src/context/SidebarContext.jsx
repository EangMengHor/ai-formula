import React, { createContext, useState, useContext, useEffect } from "react";
import { useUser } from "./UserContext";
import { getChatSessionHistory } from "../services/n8n-apis/_core/getChatSessionHistory.api";
import { useLocation } from "react-router-dom";
import { authApi } from "@/services/authApi";
import { useToast } from "@/hooks/use-toast";
import { deleteChatThreadApi } from "@/services/sidebar/deleteChatThread";
import { updateChatThread } from "@/services/sidebar/updateChatThread";

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [chatHistory, setChatHistory] = useState({});
  const [currentActiveChat, setCurrentActiveChat] = useState("");
  const [isCurrentActiveChat, setIsCurrentActiveChat] = useState(false);
  const [isSidebarChatHistoryLoading, setIsSidebarChatHistoryLoading] =
    useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const { user } = useUser();
  const { pathname } = useLocation();
  const { toast } = useToast();
  const [isEditingLoading, setIsEditingLoading] = useState(false);
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (user.id && user.isAuthenticated) {
        setIsSidebarChatHistoryLoading(true);
        const res = await getChatSessionHistory(user.id);
        if (res.success) {
          setChatHistory((prevChatHistory) => {
            const newChatHistory = { ...prevChatHistory };
            for (const [key, value] of Object.entries(res.data)) {
              if (newChatHistory[key]) {
                newChatHistory[key] = [...newChatHistory[key], ...value];
              } else {
                newChatHistory[key] = value;
              }
            }
            return newChatHistory;
          });
        }
        setIsSidebarChatHistoryLoading(false);
      }
    };
    const allowedRoutes = ["dashboard", "chat", "workshop", "trigger", "email-outreach"];
    if (
      allowedRoutes.some((route) => pathname.includes(route)) &&
      Object.keys(chatHistory).length === 0
    ) {
      fetchChatHistory();
    }
  }, [user, user.isAuthenticated, pathname]);

  async function onDeleteChatThread(chatObj) {
    setIsDeleteLoading(true);
    console.log("actionableSession", chatObj);

    try {
      const res = await deleteChatThreadApi(chatObj.sessionid);
      if (res.success) {
        toast({
          title: "Chat thread deleted successfully.",
          description: res.message,
          variant: "success",
        });
        setChatHistory((prevChatHistory) => {
          const newChatHistory = prevChatHistory;
          Object.keys(newChatHistory).forEach((key) => {
            newChatHistory[key] = newChatHistory[key].filter(
              (item) => item.sessionid !== chatObj.sessionid,
            );
          });
          return newChatHistory;
        });
        return true;
      } else {
        toast({
          title: "Failed to delete chat thread",
          description:
            res.message || "An error occurred while deleting the chat thread.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Error deleting chat thread",
        description:
          error.message || "An error occurred while deleting the chat thread.",
        variant: "destructive",
      });
      console.error("Error deleting chat thread:", error);
      return false;
    } finally {
      setIsDeleteLoading(false);
    }
  }

  async function onEditChatThreadName(sessionId, newName) {
    setIsEditingLoading(true);
    try {
      const data = await updateChatThread(sessionId, newName);
      if (!data.success) {
        throw new Error(data.message || "Failed to update chat thread.");
      }
      toast({
        title: "Chat thread updated successfully.",
        description: data.message,
        variant: "success",
      });

      // For now, we will just log the new name
      console.log(`Updating chat thread ${sessionId} to new name: ${newName}`);
      // Update the chat history state with the new name
      setChatHistory((prevChatHistory) => {
        const newChatHistory = { ...prevChatHistory };
        Object.keys(newChatHistory).forEach((key) => {
          newChatHistory[key] = newChatHistory[key].map((item) => {
            if (item.sessionid === sessionId) {
              return { ...item, chatname: newName };
            }
            return item;
          });
        });
        return newChatHistory;
      });

      return true;
    } catch (error) {
      toast({
        title: "Error updating chat thread name",
        description:
          error.message ||
          "An error occurred while updating the chat thread name.",
        variant: "destructive",
      });
    } finally {
      setIsEditingLoading(false);
    }
  }

  function appendToChatHistory(item) {
    const isToday = Object.keys(chatHistory).includes("today");
    if (isToday) {
      setChatHistory((prevChatHistory) => {
        const newChatHistory = { ...prevChatHistory };
        newChatHistory.today = [item, ...newChatHistory.today];
        return newChatHistory;
      });
    } else {
      setChatHistory((prevChatHistory) => {
        const newChatHistory = { ...prevChatHistory };
        newChatHistory["today"] = [item];
        return newChatHistory;
      });
    }
  }

  function clearAllStates() {
    setChatHistory({});
    setCurrentActiveChat(null);
    setIsCurrentActiveChat(false);
    setIsSidebarChatHistoryLoading(false);
  }

  return (
    <SidebarContext.Provider
      value={{
        chatHistory,
        currentActiveChat,
        isCurrentActiveChat,
        isSidebarChatHistoryLoading,
        setChatHistory,
        setCurrentActiveChat,
        setIsCurrentActiveChat,
        setIsSidebarChatHistoryLoading,
        appendToChatHistory,
        clearAllStates,
        onEditChatThreadName,
        onDeleteChatThread,
        isDeleteLoading,
        setIsDeleteLoading,
        isEditingLoading,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const _useSidebar = () => {
  return useContext(SidebarContext);
};
