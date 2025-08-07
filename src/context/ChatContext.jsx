import { createContext, useContext, useState } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [conversation, setConversation] = useState([]);
  return (
    <ChatContext.Provider
      value={{
        conversation,
        setConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatCtx = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatCtx must be used within a ChatProvider");
  }
  return context;
};
