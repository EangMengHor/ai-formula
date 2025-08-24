import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useToast } from "../hooks/use-toast";
import { getUserPersonalKnowledgeCollection } from "@/services/user-setting-apis/getUserPersonalKnowledgeCollection";
import { useUser } from "./UserContext";
const CollectionContext = createContext();

export const CollectionProvider = ({ children }) => {
  const [collectionList, setCollectionList] = useState([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState([]);
  const { user } = useUser();
  const { toast } = useToast();
  useEffect(() => {
    let isMounted = true;
    async function fetchUserCollections() {
      if (!user?.id) return;
      try {
        const data = await getUserPersonalKnowledgeCollection(user.id);
        if (isMounted) {
          setCollectionList(data);
        }
      } catch (error) {
        console.error("Error fetching user collections:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to fetch user collections",
            variant: "destructive",
          });
        }
      }
    }
    fetchUserCollections();
    return () => {
      isMounted = false;
    };
  }, [user?.id, toast]);

  const fetchStoredCollections = (sessionId) => {
    console.log(sessionId, "fetching prev");
    const storedCollections = localStorage.getItem("selectedCollections");
    if (storedCollections) {
      const parsedCollections = JSON.parse(storedCollections);
      if (parsedCollections[sessionId]) {
        setSelectedCollectionIds(parsedCollections[sessionId]);
      } else {
        setSelectedCollectionIds([]);
      }
    }
  };

  const saveInLocalStorage = (collectionId, sessionId, type = "add") => {
    console.log(collectionId, "asdasdasdased34123", sessionId, type);
    const existing = localStorage.getItem("selectedCollections");
    let selectedCollections = existing ? JSON.parse(existing) : {};
    if (type === "add") {
      selectedCollections[sessionId] = [
        ...(selectedCollections[sessionId] || []),
        collectionId,
      ];
    } else if (type === "remove") {
      if (selectedCollections[sessionId]) {
        console.log("removing", collectionId, "asdasdasdased34123");
        selectedCollections[sessionId] = selectedCollections[sessionId].filter(
          (id) => id !== collectionId,
        );
        if (selectedCollections[sessionId].length === 0) {
          delete selectedCollections[sessionId];
        }
      }
    }
    localStorage.setItem(
      "selectedCollections",
      JSON.stringify(selectedCollections),
    );
  };

  const toggleCollectionSelection = useCallback(
    (collectionId, sessionId = "") => {
      console.log(collectionId, "toggling", sessionId);
      setSelectedCollectionIds((prevSelected) => {
        const isSelected = prevSelected.includes(collectionId);
        if (isSelected) {
          saveInLocalStorage(collectionId, sessionId, "remove");
          return prevSelected.filter((id) => id !== collectionId);
        } else {
          if (prevSelected.length < 5) {
            saveInLocalStorage(collectionId, sessionId, "add");
            return [...prevSelected, collectionId];
          } else {
            toast({
              title: "Selection Limit Reached",
              description: "You can select up to 5 collections.",
              variant: "destructive",
            });
            return prevSelected;
          }
        }
      });
    },
    [toast],
  );

  const getSelectedCollections = useMemo(
    () => () =>
      collectionList.filter((c) => selectedCollectionIds.includes(c.id)),
    [collectionList, selectedCollectionIds],
  );

  const contextValue = useMemo(
    () => ({
      collectionList,
      setCollectionList,
      selectedCollectionIds,
      setSelectedCollectionIds,
      toggleCollectionSelection,
      getSelectedCollections,
      fetchStoredCollections,
    }),
    [
      collectionList,
      selectedCollectionIds,
      toggleCollectionSelection,
      getSelectedCollections,
      fetchStoredCollections,
    ],
  );

  return (
    <CollectionContext.Provider value={contextValue}>
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error("useCollection must be used within a CollectionProvider");
  }
  return context;
};
