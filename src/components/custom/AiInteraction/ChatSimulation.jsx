import { useEffect, useState } from "react";
import { BrainCog, Building2, Flame, LoaderCircle } from "lucide-react";
import { useStackSidebar } from "../../../context/StackSidebarContext";
import { Separator } from "@/components/ui/separator"
import { Button } from "../../ui/button";
import PersonaOp from "./PersonaOp";
import PersonaDetails from "./PersonaDetails";
import { Skeleton } from "@/components/ui/skeleton"

export default function ChatSimulation({ personas, isLoading, effect = false }) {
    const { sidebarStack, setSidebarStack } = useStackSidebar();
    const [showAll, setShowAll] = useState(false);
    console.log(isLoading, "isLoading")
    const handleShowAll = () => {
        setShowAll(!showAll);
    };

    console.log(personas, "jsdfjas12903")

    function handleDigDeeper() {
        setSidebarStack([{
            header: "Agentic Simulation",
            component: <DigDeeper personas={personas} />
        }])
    }

    useEffect(() => {
        if (effect && sidebarStack.length > 0) {
            setSidebarStack([{
                header: "Agentic Simulation",
                component: <DigDeeper personas={[...personas].reverse()} />
            }])
        }
    }, [personas])


    function handleDirectClick(idx) {
        setSidebarStack(() => [{
            header: "Persona Details",
            component: <PersonaDetails
                output={personas[idx]?.content || "No content available"}
                title={personas[idx]?.title || "No title available"}
                goal={personas[idx]?.goal || "No goal available"}
                team={personas[idx]?.team || "No team available"} />
        }])
    }

    return (
        <div className="border w-fit md:min-w-[560px] cursor-pointer mt-5 mb-2 border-slate-700 px-4 py-2 rounded-md max-w-4xl bg-slate-800">
            <div className="flex w-full justify-between items-center">
                <div className="flex gap-2 font-semibold items-center text-slate-200">
                    <Building2 width={20} height={20} />
                    <p>Agentic Simulation</p>
                </div>
                {
                    isLoading && <div className="bg-slate-500 rounded-md flex gap-2 font-semibold px-2 py-1">
                        <LoaderCircle className="animate-spin p-1" />
                        Agents Are Interacting
                    </div>
                }

            </div>
            <Separator className="border border-slate-600 my-2" />
            <div className="flex gap-2 items-center text-slate-400 text-xs">
                <BrainCog width={16} height={16} />
                <p>Agents Used</p>
                <p className="text-slate-500">Click On Agents</p>
            </div>

            { }

            {personas && (personas.length == 0 && isLoading) ? (
                <div className="flex flex-wrap gap-2 w-full mt-2">
                    {
                        [1, 2, 3, 4, 5].map((item, index) => (
                            <Skeleton className="px-2 py-1 border border-slate-600 rounded-md bg-slate-700 text-slate-200 w-44 h-8" />
                        ))
                    }
                </div>
            ) : (
                <div className="flex flex-wrap gap-2 w-full mt-2">
                    {personas.slice(0, showAll ? personas.length : 5).map((persona, index) => (
                        <div
                            onClick={() => handleDirectClick(index)}
                            key={index} className="px-2 py-1 border border-slate-600 rounded-md bg-slate-700 text-slate-200">
                            {persona?.title || "No title"}
                        </div>
                    ))}


                    {personas.length > 5 && (
                        <button
                            onClick={handleShowAll}
                            className="mt-2 text-slate-400 hover:text-slate-200"
                        >
                            {showAll ? "Show Less" : "Show All"}
                        </button>
                    )}
                </div>
            )}

            <Separator className="border border-slate-600 my-2" />

            <Button
                onClick={handleDigDeeper}
                variant="default" className="flex gap-2">
                <Flame />
                Dig Deeper
            </Button>
        </div>
    );
}

function DigDeeper({ personas }) {
    return (
        <div className="p-4 bg-slate-800 rounded-md border border-slate-700">
            <h2 className="text-2xl font-bold text-slate-100 mb-4 border-b border-slate-600 pb-2">Explore Deeper Insights</h2>
            <div className="space-y-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {personas.map((persona, index) => (
                    <PersonaOp key={index} title={persona?.title || "No title"} goal={persona?.goal || "No goal"} team={persona?.team || "No team"} output={persona?.content || "No content"} />
                ))}
            </div>
        </div>
    );
}
