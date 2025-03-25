import { createContext, useState, useContext, useEffect } from 'react';
import getSuperPersona from '../../../services/n8n-knowledge-apis/getSuperPersona';
import { useParams } from 'react-router-dom';
import { useToast } from '../../../hooks/use-toast';

const SuperPersonaContext = createContext();

export const useSuperPersona = () => useContext(SuperPersonaContext);

export const SuperPersonaProvider = ({ children }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [maxPer, setMaxPer] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const [personas, setPersonas] = useState([]);
    const { idx } = useParams()
    const [isSuperPersonaLoading, setIsSuperPersonaLoading] = useState(false);
    const [currSessionId, setCurrSessionId] = useState(null);
    const toggleExpanded = () => {
        setExpanded(!expanded);
    };
    const { toast } = useToast();
    const getSuperPersonaData = async () => {
        setIsSuperPersonaLoading(true);
        if (!currSessionId) return;
        try {
            const response = await getSuperPersona(currSessionId);
            console.log("data", response);
            setTitle(response.data.sup_per_name);
            setDescription(response.data.sup_per_description);
            setMaxPer(response.data.numberOfPersona);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Something went wrong',
            })

        } finally {
            setIsSuperPersonaLoading(false);
        }
    }

    useEffect(() => {
        resetAllStates()
    }, [idx])

    function resetAllStates() {
        setTitle("");
        setDescription("");
        setMaxPer(0);
        setPersonas([]);
        setCurrSessionId(null);
    }
    const values = {
        title,
        setTitle,
        description,
        setDescription,
        maxPer,
        setMaxPer,
        expanded,
        setExpanded,
        toggleExpanded,
        personas,
        setPersonas,
        getSuperPersonaData,
        currSessionId,
        setCurrSessionId,
        resetAllStates,
        isSuperPersonaLoading,
        setIsSuperPersonaLoading
    };

    return (
        <SuperPersonaContext.Provider value={values}>
            {children}
        </SuperPersonaContext.Provider>
    );
};