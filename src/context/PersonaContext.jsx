import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "../hooks/use-toast";

const PersonaContext = createContext();

export const PersonaProvider = ({ children }) => {
  const [selectedPersonaId, setSelectedPersonaId] = useState(null);
  const [personaList, setPersonaList] = useState([
    {
      id: 1,
      name: "Tax Optimization Agent",
      description:
        "Assists with identifying legal strategies to minimize tax liabilities.",
    },
    {
      id: 2,
      name: "Investment Planner",
      description:
        "Helps users plan and simulate long-term investment strategies.",
    },
  ]);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const savedPersonaId = localStorage.getItem("selectedPersonaId");
    if (savedPersonaId) {
      setSelectedPersonaId(parseInt(savedPersonaId));
    }
  }, []);

  useEffect(() => {
    if (selectedPersonaId === null) {
      localStorage.removeItem("selectedPersonaId");
    } else {
      localStorage.setItem("selectedPersonaId", selectedPersonaId.toString());
    }
  }, [selectedPersonaId]);

  const selectPersona = (personaId) => {
    setSelectedPersonaId(personaId);
    setPersonaModalOpen(false);

    if (personaId === null) {
      toast({
        title: "Persona removed",
        description: "No persona selected for this conversation",
      });
    } else {
      const persona = personaList.find((p) => p.id === personaId);
      if (persona) {
        toast({
          title: "Persona selected",
          description: `${persona.name} has been selected for this conversation`,
        });
      }
    }
  };


  const loadPersonas = async () => {
    try {
      // TODO: Load personas from API
    } catch (error) {
      console.error("Failed to load personas:", error);
    }
  };

  return (
    <PersonaContext.Provider
      value={{
        personaList,
        setPersonaList,
        selectedPersonaId,
        setSelectedPersonaId,
        personaModalOpen,
        setPersonaModalOpen,
        selectPersona,
        loadPersonas,
        getSelectedPersona: () =>
          personaList.find((p) => p.id === selectedPersonaId),
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return context;
};
