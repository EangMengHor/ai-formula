import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { useSuperPersona } from "../context/SuperPersonaContext";
import { SuperPersonaHeader } from "../components/editPersona/SuperPersonaHeader";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import PersonaCard from "../components/editPersona/persona-card";
import { Button } from "../../../components/ui/button";


export default function GenerateKnowledgeBase() {
    const { title, setTitle, description, setDescription, maxPer, setMaxPer, expanded, toggleExpanded, personas, setPersonas, getSuperPersonaData, currSessionId, setCurrSessionId, isSuperPersonaLoading } = useSuperPersona();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const isNew = queryParams.get("isNew"); // "true"
    const [currLoadingSources, setCurrLoadingSources] = useState([]);

    const { idx } = useParams();


    useEffect(() => {
        if (idx) {
            setCurrSessionId(idx)
        }
        console.log(!title || !description || !maxPer, idx, "eitwieiru")
        if (!title || !description || !maxPer) {
            getSuperPersonaData()
        }
    }, [idx, currSessionId, title, description, maxPer])
    // update all 
    // 

    const startScapping = useCallback(
        async function () {

        },
        [isNew]
    )



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
                {isNew && <Button className="px-5 py-3">Start Scrapping</Button>}
                {!isNew && <Button>Refresh All Persona</Button>}

            </div>
            <Alert variant="destructive" className="bg-red-900 text-white">
                <Terminal className="h-4 w-4 text-white" />
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                    Dont Close this tab until process is completed • It will cause the process to stop
                </AlertDescription>
            </Alert>
            <p className="text-lg font-semibold text-white ">Knowledge Base Generation</p>


            <div>
                <div className="grid grid-cols-3 gap-4">
                    {
                        personas && personas.length > 0 && personas.map(item => {
                            return (
                                <PersonaCard persona={item} key={item.id} isKnowledgeCard={true} KnowledgeLoading={true} sources={[
                                    "https://responsiblestatecraft.org/best-foreign-policy-books/",
                                    "https://www.hansardsociety.org.uk/journal/the-evolution-of-election-campaigning",
                                    "https://sldinfo.com/books/assessing-global-change-strategic-perspectives-of-dr-harald-malmgren/",
                                    "https://www.brookings.edu/topics/campaigns-elections/",
                                    "https://fivebooks.com/category/politics-and-society/political-ideologies/",
                                    "https://securityconference.org/en/publications/analyses/ai-pocalypse-disinformation-super-election-year/",
                                    "https://fivebooks.com/category/politics-and-society/war/",
                                    "https://libguides.princeton.edu/elections/usother",
                                    "https://www.barnesandnoble.com/b/books/current-affairs-politics/_/N-1fZ29Z8q8Z16st",
                                    "https://academic.oup.com/poq/advance-article/doi/10.1093/poq/nfae053/8011623?searchresult=1",
                                    "https://www.cambridge.org/core/journals/british-journal-of-political-science/article/examining-voting-spillover-effects-of-text-message-reminders/339CB3EC8305288B50D1691CEC97CA0D",
                                    "https://www.psypost.org/study-people-show-verbal-hesitation-towards-left-wing-political-terms/",
                                    "https://arxiv.org/html/2502.11827v1",
                                    "https://www.tandfonline.com/doi/full/10.1080/15205436.2025.2461699?src=",
                                    "https://securityconference.org/en/publications/analyses/ai-pocalypse-disinformation-super-election-year/",
                                    "https://ozeanmedia.com/author/alex/",
                                    "https://jepson.richmond.edu/features/article/-/25720/speaking-his-mind.html",
                                    "https://www.tandfonline.com/doi/full/10.1080/2474736X.2025.2461777?src=exp-la",
                                    "https://eujournal.org/index.php/esj/article/view/19112/18851",
                                    "https://www.barnesandnoble.com/w/a-more-perfect-party-juanita-tolliver/1145683642?ean=9781538770221",
                                    "https://techpolicy.press/online-election-manipulation-is-a-challenge-for-democracy-its-about-to-get-a-whole-lot-worse",
                                    "https://responsiblestatecraft.org/best-foreign-policy-books/",
                                    "https://securityconference.org/en/publications/analyses/ai-pocalypse-disinformation-super-election-year/",
                                    "https://www.brookings.edu/people/elaine-kamarck/",
                                    "https://www.brookings.edu/topics/campaigns-elections/",
                                    "https://libguides.princeton.edu/elections/usother",
                                    "https://www.brennancenter.org/election-misinformation",
                                    "https://www.opensecrets.org/elections-overview/winning-vs-spending"
                                ]} />
                            )
                        })
                    }
                </div>
            </div>
        </div>
    )
}