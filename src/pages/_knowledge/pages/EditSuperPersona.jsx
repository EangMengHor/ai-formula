import { AlertCircle, Atom } from 'lucide-react';
import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { pollCurrLoadingPersona } from "../../../services/n8n-knowledge-apis/pollCurrLoadingPersona";
import PersonaSkeleton from '../components/editPersona/persona-skeleton';
import PersonaCard from '../components/editPersona/persona-card';
import getSuperPersona from '../../../services/n8n-knowledge-apis/getSuperPersona';
import { toast } from '../../../hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from '../../../components/ui/button';

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
    const [poll, setPoll] = useState(false);
    const [currSkeleton, setCurrSkeleton] = useState(4);

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
        setCurrSkeleton(maxPer || 4);
        setPoll(queryParams.get("poll") && queryParams.get("poll") === "true");
    }, [location.search]);

    useEffect(() => {

        const getSuperPersonaData = async () => {
            try {
                const response = await getSuperPersona(idx);
                console.log("data", response);
                setTitle(response.data.sup_per_name);
                setDescription(response.data.sup_per_description);
                setMaxPer(response.data.numberOfPersona);
            } catch (error) {
                toast({
                    title: 'Error',
                    description: error.message || 'Something went wrong',
                })

            }
        }
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
                                setTimeout(() => setNewPersonaAdded(false), 5000);
                                return [...prevPersonas, ...newPersonas];
                            }
                            return prevPersonas;
                        });
                    }
                }, 10000);
            }
        };

        if (isPollingPersona && poll) {
            fetchData();
            pollingInterval.current = setInterval(fetchData, 1500);
        }
        else {

            fetchData();
            getSuperPersonaData();
        }
        return () => clearInterval(pollingInterval.current);
    }, [idx, maxPer, personas.length, isPollingPersona]);


    useEffect(() => {
        setCurrSkeleton((maxPer - personas.length) >= 0 ? maxPer - personas.length : 0);
    }, [personas, maxPer])


    return (
        <>
            <div className="space-y-6">
                {
                    !poll && <Alert variant="default">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Note </AlertTitle>
                        <AlertDescription className="capitalize">
                            You Can Check the Details but can't Edit the Super Persona after knowledge base is Created
                        </AlertDescription>
                    </Alert>
                }
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
                <Alert variant="default" className="w-fit">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Note </AlertTitle>
                    <AlertDescription className="capitalize">
                        Only First Persona Usually Take More Time To Appear
                    </AlertDescription>
                </Alert>
                <Separator className="border border-white my-5" />
                {/* Loading Status */}

                <div className="grid grid-cols-3 gap-4">
                    {personas.map((persona, index) => (
                        <PersonaCard
                            // isEditable={poll}
                            isEditable={true}
                            key={persona.id}
                            persona={persona}
                            setPersona={(value) => setPersonas((prev) => [...prev.slice(0, index), value, ...prev.slice(index + 1)])}
                            className={newPersonaAdded ? 'new-persona' : ''}
                        />
                    ))}
                    {[...Array(currSkeleton)].map((_, index) => (
                        <PersonaSkeleton key={`skeleton-${index}`} />
                    ))}
                </div>

            </div>
            {
                poll && currSkeleton == 0 && <div className='fixed bottom-0 left-0 right-0 flex items-center justify-center w-full p-5 '>
                    <div className='bg-white bg-opacity-30 backdrop-blur-md rounded-full p-2  w-[30%] border-2 border-blue-500 shadow-lg'>
                        <Button className="rounded-full w-full bg-blue-500 hover:bg-blue-700 text-white">
                            Continue To Knowledge Base Scrapper
                        </Button>
                    </div>
                </div>
            }
            {
                currSkeleton == 0 && null
            }
        </>
    );
}