import { Atom } from 'lucide-react';
import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { pollCurrLoadingPersona } from "../../../services/n8n-knowledge-apis/pollCurrLoadingPersona";
import PersonaSkeleton from '../components/editPersona/persona-skeleton';
import PersonaCard from '../components/editPersona/persona-card';

const descriptionLength = 200;

export default function EditSuperPersona() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [maxPer, setMaxPer] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const [personas, setPersonas] = useState([]);
    const [isPollingPersona, setIsPollingPersona] = useState(true);
    const location = useLocation();
    const { idx } = useParams();
    const pollingInterval = useRef(null);
    const [newPersonaAdded, setNewPersonaAdded] = useState(false);

    const toggleExpanded = () => {
        setExpanded(!expanded);
    };

    const truncatedDescription = description.length > descriptionLength
        ? description.substring(0, descriptionLength) + "..."
        : description;

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        setTitle(decodeURIComponent(queryParams.get("title") || ""));
        setDescription(decodeURIComponent(queryParams.get("description") || ""));
        setMaxPer(parseInt(queryParams.get("maxPer") || "0", 10));
    }, [location.search]);

    useEffect(() => {
        const fetchData = async () => {
            if (!idx) return;

            try {
                const response = await pollCurrLoadingPersona(idx);
                if (response?.data?.length > 0) {
                    setPersonas(prevPersonas => {
                        const newPersonas = response.data.filter(persona =>
                            !prevPersonas.find(p => p.id === persona.id)
                        );

                        if (newPersonas.length > 0) {
                            setNewPersonaAdded(true);
                            setTimeout(() => setNewPersonaAdded(false), 3000);
                            return [...prevPersonas, ...newPersonas];
                        }
                        return prevPersonas;
                    });
                }
            } catch (error) {
                console.error("Error fetching persona data:", error);
            }

            if (personas.length >= maxPer && maxPer !== 0) {
                setIsPollingPersona(false);
                clearInterval(pollingInterval.current);

                setTimeout(async () => {
                    const response = await pollCurrLoadingPersona(idx);
                    if (response?.data?.length > 0) {
                        setPersonas(prevPersonas => {
                            const newPersonas = response.data.filter(persona =>
                                !prevPersonas.find(p => p.id === persona.id)
                            );

                            if (newPersonas.length > 0) {
                                setNewPersonaAdded(true);
                                setTimeout(() => setNewPersonaAdded(false), 4000);
                                return [...prevPersonas, ...newPersonas];
                            }
                            return prevPersonas;
                        });
                    }
                }, 10000);
            }
        };

        if (isPollingPersona) {
            fetchData();
            pollingInterval.current = setInterval(fetchData, 1500);
        }

        return () => clearInterval(pollingInterval.current);
    }, [idx, maxPer, personas.length, isPollingPersona]);

    return (
        <div className="space-y-6">
            <div className="flex gap-4 items-center p-6 bg-slate-700 text-white rounded-lg shadow-md space-y-3">
                <Atom className="w-12 h-12 text-white" />
                <div>
                    <p className="text-xl font-semibold text-white">{title}</p>
                    <p className="text-slate-300">
                        {expanded ? description : truncatedDescription}
                        {description.length > descriptionLength && (
                            <button onClick={toggleExpanded} className="text-blue-500 ml-1">
                                {expanded ? "Read Less" : "Read More"}
                            </button>
                        )}
                    </p>
                    <p className="text-slate-400">{maxPer} Persona</p>
                </div>
            </div>
            <Separator className="border border-white my-5" />
            {isPollingPersona && personas.length === 0 ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, index) => (
                        <PersonaSkeleton key={index} />
                    ))}
                </div>
            ) : (
                <div className="space-y-4 grid grid-cols-3 gap-4">
                    {personas.map((persona) => (
                        <PersonaCard
                            key={persona.id}
                            persona={persona}
                            className={newPersonaAdded ? 'new-persona' : ''}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}



