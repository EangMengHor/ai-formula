import React, { createContext, useState, useContext, useEffect } from 'react';
import { useUser } from './UserContext';
import { getChatSessionHistory } from '../services/n8n-apis/_core/getChatSessionHistory.api';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
    const [chatHistory, setChatHistory] = useState({});
    const [currentActiveChat, setCurrentActiveChat] = useState(null);
    const [isCurrentActiveChat, setIsCurrentActiveChat] = useState(false);
    const [isSidebarChatHistoryLoading, setIsSidebarChatHistoryLoading] = useState(false);
    const [pagination, setPagination] = useState(1);
    const [isMore, setIsMore] = useState(true);
    const { user } = useUser();

    useEffect(() => {
        const fetchChatHistory = async () => {
            if (user.id && isMore && user.isAuthenticated) {
                setIsSidebarChatHistoryLoading(true);
                const res = await getChatSessionHistory(user.id, pagination);
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
                    // setPagination(prevPagination => prevPagination + 1);
                    // if (Object.values(res.data).flat().length < 20) {
                    //     setIsMore(false);
                    // }
                }
                setIsSidebarChatHistoryLoading(false);
            }
        };

        fetchChatHistory();
    }, [user, pagination, isMore, user.isAuthenticated]);

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

    function clearAllStates(){
        setChatHistory({})
        setCurrentActiveChat(null)
        setIsCurrentActiveChat(false)
        setIsSidebarChatHistoryLoading(false)
        setPagination(1)
        setIsMore(true)
    }


    return (
        <SidebarContext.Provider value={{
            chatHistory,
            currentActiveChat,
            isCurrentActiveChat,
            isSidebarChatHistoryLoading,
            pagination,
            isMore,
            setChatHistory,
            setCurrentActiveChat,
            setIsCurrentActiveChat,
            setIsSidebarChatHistoryLoading,
            setPagination,
            setIsMore,
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