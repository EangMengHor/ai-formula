import React, { createContext, useState, useContext, useEffect } from 'react';
import { useUser } from './UserContext';
import { getChatSessionHistory } from '../services/n8n-apis/_core/getChatSessionHistory.api';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
    const [chatHistory, setChatHistory] = useState({});
    const [currentActiveChat, setCurrentActiveChat] = useState("");
    const [isCurrentActiveChat, setIsCurrentActiveChat] = useState(false);
    const [isSidebarChatHistoryLoading, setIsSidebarChatHistoryLoading] = useState(false);
    const { user } = useUser();

    useEffect(() => {
        const fetchChatHistory = async () => {
            if (user.id && user.isAuthenticated) {
                setIsSidebarChatHistoryLoading(true);
                const res = await getChatSessionHistory(user.id);
                console.log(res, 'res');
                if (res.success) {
                    setChatHistory(prevChatHistory => {
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

        fetchChatHistory();
    }, [user, user.isAuthenticated]);

    function appendToChatHistory(item) {
        const isToday = Object.keys(chatHistory).includes('today');
        console.log(chatHistory, "here", item, isToday);
        if (isToday) {
            setChatHistory(prevChatHistory => {
                const newChatHistory = { ...prevChatHistory };
                newChatHistory.today = [item, ...newChatHistory.today];
                return newChatHistory;
            });
        }
        else {
            setChatHistory(prevChatHistory => {
                const newChatHistory = { ...prevChatHistory };
                newChatHistory['today'] = [item];
                return newChatHistory;
            });
        }
    }

    useEffect(() => {   
        console.log(currentActiveChat, "chatHistory")
    }, [currentActiveChat])

    function clearAllStates() {
        setChatHistory({})
        setCurrentActiveChat(null)
        setIsCurrentActiveChat(false)
        setIsSidebarChatHistoryLoading(false)
    }


    return (
        <SidebarContext.Provider value={{
            chatHistory,
            currentActiveChat,
            isCurrentActiveChat,
            isSidebarChatHistoryLoading,
            setChatHistory,
            setCurrentActiveChat,
            setIsCurrentActiveChat,
            setIsSidebarChatHistoryLoading,
            appendToChatHistory,
            clearAllStates
        }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const _useSidebar = () => {
    return useContext(SidebarContext);
};