import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useSuperPersona } from "../context/SuperPersonaContext";
import { SuperPersonaHeader } from "../components/editPersona/SuperPersonaHeader";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import PersonaCard from "../components/editPersona/persona-card";
import { Button } from "../../../components/ui/button";
import { pollCurrLoadingPersona } from "../../../services/n8n-knowledge-apis/pollCurrLoadingPersona";
import { scrapeKnowledgeBase } from "../../../services/n8n-knowledge-apis/scapeKnowledgeBase";
import { pollScapingStatus } from "../../../services/n8n-knowledge-apis/pollScapingStatus";

export default function GenerateKnowledgeBase() {
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
    isSuperPersonaLoading,
  } = useSuperPersona();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isNew = queryParams.get("isNew"); // "true"
  const [scrapeDone, setScrapeDone] = useState({});
  const [currLoadingPersona, setCurrLoadingPersona] = useState(null);
  const [personaErrors, setPersonaErrors] = useState([]);

  const { idx } = useParams();

  useEffect(() => {
    async function fetchData() {
      if (!idx) return;
      try {
        const response = await pollCurrLoadingPersona(idx);
        console.log("data", response);
        if (response.success) {
          setPersonas(response.data);
        }
      } catch (error) {
        console.log(error);
      }
    }
    if (idx) {
      setCurrSessionId(idx);
    }
    console.log(!title || !description || !maxPer, idx, "eitwieiru");
    if (!title || !description || !maxPer) {
      getSuperPersonaData();
    }
    if (personas.length === 0) {
      fetchData();
    }
  }, [
    idx,
    currSessionId,
    title,
    description,
    maxPer,
    setPersonas,
    getSuperPersonaData,
  ]);
  // update all

  const startScapping = useCallback(
    async function () {
      console.log("called 1");
      if (personas.length <= 0) return;

      async function processPersonas() {
        for (let i = 0; i < personas.length; i++) {
          const persona = personas[i];
          setCurrLoadingPersona(persona.id);
          let retryCount = 0;
          const maxRetries = 3; // Maximum number of retries
          const retryDelay = 3 * 60 * 1000; // 3 minutes

          async function scrapeWithRetry() {
            try {
              const data = await scrapeKnowledgeBase(
                persona.knowledgeBaseSearch,
                persona.id,
              );
              console.log(data);

              // Create a promise that rejects after 5 minutes (300000 ms)
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                  reject(new Error("Timeout"));
                }, 300000);
              });

              try {
                await Promise.race([
                  new Promise((resolve) => {
                    let pendingRequests = 0;
                    const maxPendingRequests = 2;
                    const intervalId = setInterval(async () => {
                      if (pendingRequests >= maxPendingRequests) {
                        console.log(
                          `Too many pending requests (${pendingRequests}), waiting...`,
                        );
                        return;
                      }

                      pendingRequests++;
                      try {
                        const res = await pollScapingStatus(persona.id);
                        console.log(res);
                        if (
                          Object.keys(res.data).length > 0 &&
                          res.data.citations
                        ) {
                          console.log("called 5");
                          setScrapeDone((prev) => ({
                            ...prev,
                            [persona.id]: {
                              citations: res.data.citations,
                              isMemoried: res.data.isMemoried,
                            },
                          }));
                        }
                        if (res?.data?.isMemoried) {
                          if (personas[personas.length - 1].id === persona.id) {
                            setCurrLoadingPersona(null);
                          }
                          clearInterval(intervalId);
                          resolve();
                        }
                      } finally {
                        pendingRequests--;
                      }
                    }, 8000);
                  }),
                  timeoutPromise,
                ]);
              } catch (error) {
                console.log(`Timeout for persona ${persona.id}`);
                setPersonaErrors((prev) => [...prev, persona.id]);
              }
            } catch (error) {
              console.error(`Error processing persona ${persona.id}:`, error);
              setPersonaErrors((prev) => [...prev, persona.id]);
              // Retry logic
              if (retryCount < maxRetries) {
                retryCount++;
                console.log(
                  `Retrying persona ${persona.id} (attempt ${retryCount}/${
                    maxRetries
                  }) in ${retryDelay / 1000} seconds`,
                );
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
                await scrapeWithRetry(); // Recursive call for retry
              } else {
                console.error(`Max retries reached for persona ${persona.id}`);
                setPersonaErrors((prev) => [...prev, persona.id]);
              }
            }
          }

          await scrapeWithRetry(); // Initial call to scrapeWithRetry
        }
      }

      processPersonas();
    },
    [isNew, personas, setCurrLoadingPersona, setScrapeDone, setPersonaErrors],
  );

  useEffect(() => {
    console.log(scrapeDone, "scrape done");

    return () => clearInterval();
  }, [scrapeDone]);

  return (
    <div className="flex gap-2 flex-col">
      <SuperPersonaHeader
        title={title}
        description={description}
        descriptionLength={300}
        expanded={expanded}
        toggleExpanded={toggleExpanded}
        maxPer={maxPer}
        loading={isSuperPersonaLoading}
      />
      {/* button */}
      <div>
        {/* {isNew && <Button className="p-4" onClick={startScapping}>Start Scrapping</Button>} */}
        {true && (
          <Button className="p-4" onClick={startScapping}>
            Start Scrapping
          </Button>
        )}
        {!isNew && <Button>Refresh All Persona</Button>}
      </div>
      <Alert variant="destructive" className="bg-red-900 text-white">
        <Terminal className="h-4 w-4 text-white" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          Dont Close this tab until process is completed • It will cause the
          process to stop
        </AlertDescription>
      </Alert>
      <p className="text-lg font-semibold text-white ">
        Knowledge Base Generation
      </p>

      <div>
        <div className="grid grid-cols-3 gap-4">
          {personas && personas.length > 0 ? (
            personas.map((item) => {
              return (
                <PersonaCard
                  persona={item}
                  key={item.id}
                  isKnowledgeCard={true}
                  KnowledgeLoading={item.id == currLoadingPersona}
                  sources={
                    (scrapeDone[item.id] && scrapeDone[item.id].citations) || []
                  }
                  isMemoried={
                    scrapeDone[item.id] &&
                    (scrapeDone[item.id].isMemoried || false)
                  }
                />
              );
            })
          ) : (
            <p>No Personas available</p>
          )}
        </div>
      </div>
    </div>
  );
}
