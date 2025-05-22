import { AlertCircle, Atom, TriangleAlert } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { pollCurrLoadingPersona } from "../../../services/n8n-knowledge-apis/pollCurrLoadingPersona";
import PersonaSkeleton from "../components/editPersona/persona-skeleton";
import PersonaCard from "../components/editPersona/persona-card";
import { toast } from "../../../hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "../../../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  SuperPersonaProvider,
  useSuperPersona,
} from "../context/SuperPersonaContext";
import { SuperPersonaHeader } from "../components/editPersona/SuperPersonaHeader";
import { eachPersonaSchema } from "../../../Schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getKnowledgeBaseSourcesOfPersonas } from "../../../services/n8n-knowledge-apis/getKnowledgeBaseSources";

const descriptionLength = 200;

export default function EditSuperPersona() {
  const {
    title,
    setTitle,
    description,
    setDescription,
    maxPer,
    setMaxPer,
    expanded,
    toggleExpanded,
    personas,
    setPersonas,
    getSuperPersonaData,
    currSessionId,
    setCurrSessionId,
    resetAllStates,
    setIsSuperPersonaLoading,
    isSuperPersonaLoading,
  } = useSuperPersona();
  const [isPollingPersona, setIsPollingPersona] = useState(true);
  const location = useLocation();
  const { idx } = useParams();
  const pollingInterval = useRef(null);
  const [newPersonaAdded, setNewPersonaAdded] = useState(false);
  const [poll, setPoll] = useState(false);
  const [currSkeleton, setCurrSkeleton] = useState(4);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [isRefreshLoading, setIsRefreshLoading] = useState(false);
  // improvements
  const [isImprovements, setIsImprovements] = useState(false);
  const [improvements, setImprovements] = useState([]);
  const [personaCitations, setPersonaCitations] = useState([]);

  const navigate = useNavigate();
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setTitle(decodeURIComponent(queryParams.get("title") || ""));
    setDescription(decodeURIComponent(queryParams.get("description") || ""));
    setMaxPer(parseInt(queryParams.get("maxPer") || "0", 10));
    setCurrSkeleton(maxPer || 4);
    setPoll(queryParams.get("poll") && queryParams.get("poll") == "true");
    console.log(
      queryParams.get("poll"),
      queryParams.get("poll") == "true",
      "poll",
    );
    return () => {
      resetAllStates();
    };
  }, [location.search, setTitle, setDescription, setMaxPer]);

  const fetchData = async () => {
    if (!idx) return;

    try {
      const response = await pollCurrLoadingPersona(idx);
      if (response?.data?.length > 0) {
        setPersonas((prevPersonas) => {
          const newPersonas = response.data.filter(
            (persona) => !prevPersonas.find((p) => p.id === persona.id),
          );

          if (newPersonas.length > 0) {
            setNewPersonaAdded(true);
            setTimeout(() => false, 3000);
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
          setPersonas((prevPersonas) => {
            const newPersonas = response.data.filter(
              (persona) => !prevPersonas.find((p) => p.id === persona.id),
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
  const [pendingRequests, setPendingRequests] = useState(0);
  const maxPendingRequests = 2;
  useEffect(() => {
    if (idx) {
      setCurrSessionId(idx);
    }

    const fetchDataWithLimit = async () => {
      if (pendingRequests < maxPendingRequests) {
        setPendingRequests((prev) => prev + 1);
        try {
          await fetchData();
        } finally {
          setPendingRequests((prev) => prev - 1);
        }
      } else {
        console.log("Max pending requests reached. Waiting...");
      }
    };

    if (isPollingPersona && poll) {
      fetchDataWithLimit();
      pollingInterval.current = setInterval(fetchDataWithLimit, 10000);
    } else {
      fetchData();
    }

    console.log("loading 234234");
    return () => clearInterval(pollingInterval.current);
  }, [
    idx,
    maxPer,
    personas.length,
    isPollingPersona,
    setTitle,
    setDescription,
    setMaxPer,
    poll,
  ]);
  useEffect(() => {
    getSuperPersonaData();
  }, [idx, currSessionId]);

  useEffect(() => {
    setCurrSkeleton(
      maxPer - personas.length >= 0 ? maxPer - personas.length : 0,
    );
  }, [personas, maxPer]);

  // improvement checked algorithm
  useEffect(() => {
    if (personas.length > 0) {
      let newImprovements = [];

      personas.forEach((data) => {
        const result = eachPersonaSchema.safeParse(data);
        console.log(result, "result");
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            newImprovements.push({
              id: data.id,
              improvement: issue.message,
              field: issue.path,
            });
          });
        }
      });

      setImprovements(newImprovements);
    }
    console.log(personas, "personas");
  }, [currSkeleton, personas]);

  useEffect(() => {
    console.log(
      improvements,
      improvements.map((i) => {
        console.log(
          personas.find((a) => {
            console.log(a.id, i.id, a.id === i.id, a, i);
            return a.id === i.id;
          }),
          i,
        );
        return i;
      }),
      "improvements",
    );
  }, [improvements]);

  const handleRefresh = async () => {
    if (idx) {
      setIsRefreshLoading(true);
      try {
        await fetchData();
        toast({
          title: "Refreshed!",
          description: "Persona data has been updated.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to refresh persona data.",
        });
      } finally {
        setIsRefreshLoading(false);
      }
    }
  };

  const handleAutoRefresh = () => {
    setIsAutoRefreshing(!isAutoRefreshing);
  };

  // get the already existing knowledge base sources of the personas
  useEffect(() => {
    async function getKnowledgeOfPersona() {
      const data = await getKnowledgeBaseSourcesOfPersonas(idx);
      if (data.success) {
        setPersonaCitations(data.data);
        toast({
          title: "Success",
          description: "Knowledge Base Sources Fetched",
        });
      }
    }

    if (!poll && idx) {
      getKnowledgeOfPersona();
    }
  }, [poll, idx]);

  return (
    <>
      <div className="space-y-6">
        {!poll && (
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Note </AlertTitle>
            <AlertDescription className="capitalize">
              You Can Check the Details but can't Edit the Super Persona after
              knowledge base is Created
            </AlertDescription>
          </Alert>
        )}
        <SuperPersonaHeader
          title={title}
          description={description}
          descriptionLength={descriptionLength}
          expanded={expanded}
          toggleExpanded={toggleExpanded}
          maxPer={maxPer}
          loading={isSuperPersonaLoading}
        />
        <Alert variant="default" className="w-fit">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Note </AlertTitle>
          <AlertDescription className="capitalize">
            Only First Persona Usually Takes More Time To Appear
          </AlertDescription>
        </Alert>
        <Separator className="border border-gray-600 my-5" />
        {/* Loading Status */}

        <div className="grid grid-cols-3 gap-4">
          {personas.map((persona, index) => (
            <PersonaCard
              isEditable={poll}
              key={persona.id}
              persona={persona}
              sources={
                personaCitations.find((p) => p.personaId === persona.id)
                  ?.citations || []
              }
              setPersona={(value) =>
                setPersonas((prev) => [
                  ...prev.slice(0, index),
                  value,
                  ...prev.slice(index + 1),
                ])
              }
              className={newPersonaAdded ? "new-persona" : ""}
              isMemoried={
                personaCitations.find((p) => p.personaId === persona.id)
                  ?.isMemorized || false
              }
            />
          ))}
          {[...Array(currSkeleton)].map((_, index) => (
            <PersonaSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center w-screen p-5 gap-4">
        <AlertDialog>
          <AlertDialogTrigger>
            <div className="bg-gray-800 bg-opacity-30 backdrop-blur-md rounded-full p-2  border-2 border-blue-500 shadow-lg">
              <Button className="rounded-full w-full bg-blue-500 hover:bg-blue-700 text-white">
                Continue To Knowledge Base Scraper
              </Button>
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-800 text-slate-300">
            <AlertDialogHeader>
              <AlertDialogTitle>
                After Going Ahead, You Can't Edit Personas
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-300">
                <ul className="list-disc list-inside">
                  <li>You can't edit the Super Persona after this</li>
                  <li>If you want to edit a persona, do that right now</li>
                  <li>
                    You can always view the existing personas through the
                    dashboard
                  </li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-gray-400">
                Back to Edit
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-blue-500 text-white hover:bg-blue-700"
                onClick={() =>
                  navigate(`/generatingKnowledge/${idx}/?isNew=true`)
                }
              >
                Continue To Knowledge Base Scraper
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {currSkeleton !== 0 && (
          <div className="bg-gray-800 bg-opacity-30 backdrop-blur-md rounded-full p-2 w-[30%] border-2 shadow-lg">
            <Button className="rounded-full w-full bg-gray-600 text-white">
              Please Wait While All Personas Are Loaded
            </Button>
          </div>
        )}
        {!isImprovements && poll && (
          <div className="bg-yellow-500 bg-opacity-30 backdrop-blur-md rounded-full p-2 w-[10%] border-2 border-gray-500 shadow-lg">
            <Button
              className="rounded-full w-full text-black bg-yellow-500 hover:bg-yellow-600"
              onClick={handleAutoRefresh}
            >
              <TriangleAlert />
              <p>{improvements.length} Improvements</p>
            </Button>
          </div>
        )}
        <div className="bg-gray-800 bg-opacity-30 backdrop-blur-md rounded-full p-2 w-[10%] border-2 border-gray-500 shadow-lg">
          <Button
            className="rounded-full w-full bg-gray-500 hover:bg-gray-700 text-white"
            onClick={handleRefresh}
            disabled={isRefreshLoading}
          >
            {isRefreshLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>
    </>
  );
}
