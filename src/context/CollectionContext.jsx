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

  const toggleCollectionSelection = useCallback(
    (collectionId) => {
      setSelectedCollectionIds((prevSelected) => {
        const isSelected = prevSelected.includes(collectionId);

        if (isSelected) {
          return prevSelected.filter((id) => id !== collectionId);
        } else {
          if (prevSelected.length < 5) {
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
    }),
    [
      collectionList,
      selectedCollectionIds,
      toggleCollectionSelection,
      getSelectedCollections,
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
