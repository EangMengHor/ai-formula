"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, FileText, Database, Globe, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"

import '@xyflow/react/dist/style.css';
import PollInteraction from "../PollInteraction"
import { useLocation, useParams } from "react-router-dom"
export default function PollStatus({
    workflow = [
        "interaction",
        "generate"
    ],
    updated = [
        {
            "label": "Software Development Lifecycle",
            "data": "none",
            "other": [
                {
                    "group": [
                        {
                            "goal": "Gather initial requirements from stakeholders",
                            "input": [],
                            "execution": 1,
                            "personaId": "req1",
                            "name": "Requirements Analyst"
                        },
                        {
                            "goal": "Conduct market research and competitor analysis",
                            "input": [],
                            "execution": 1,
                            "personaId": "req2",
                            "name": "Market Researcher"
                        }
                    ]
                },
                {
                    "group": [
                        {
                            "goal": "Create detailed functional specifications",
                            "input": ["req1"],
                            "execution": 2,
                            "personaId": "spec1",
                            "name": "System Analyst"
                        },
                        {
                            "goal": "Design system architecture",
                            "input": ["req1", "req2"],
                            "execution": 2,
                            "personaId": "arch1",
                            "name": "Solution Architect"
                        },
                        {
                            "goal": "Define technical requirements",
                            "input": ["req2"],
                            "execution": 2,
                            "personaId": "tech1",
                            "name": "Technical Lead"
                        }
                    ]
                },
                {
                    "group": [
                        {
                            "goal": "Develop core features and functionality",
                            "input": ["spec1", "arch1"],
                            "execution": 3,
                            "personaId": "dev1",
                            "name": "Senior Developer"
                        },
                        {
                            "goal": "Implement user interface components",
                            "input": ["spec1"],
                            "execution": 3,
                            "personaId": "dev2",
                            "name": "Frontend Developer"
                        },
                        {
                            "goal": "Set up infrastructure and DevOps pipeline",
                            "input": ["arch1", "tech1"],
                            "execution": 3,
                            "personaId": "ops1",
                            "name": "DevOps Engineer"
                        }
                    ]
                },
                {
                    "group": [
                        {
                            "goal": "Perform unit and integration testing",
                            "input": ["dev1", "dev2"],
                            "execution": 4,
                            "personaId": "test1",
                            "name": "QA Engineer"
                        },
                        {
                            "goal": "Conduct security assessment",
                            "input": ["dev1", "ops1"],
                            "execution": 4,
                            "personaId": "sec1",
                            "name": "Security Specialist"
                        },
                        {
                            "goal": "Execute performance testing",
                            "input": ["dev2", "ops1"],
                            "execution": 4,
                            "personaId": "perf1",
                            "name": "Performance Engineer"
                        }
                    ]
                },
                {
                    "group": [
                        {
                            "goal": "Prepare deployment documentation",
                            "input": ["test1", "sec1"],
                            "execution": 5,
                            "personaId": "doc1",
                            "name": "Technical Writer"
                        },
                        {
                            "goal": "Conduct user acceptance testing",
                            "input": ["test1", "perf1"],
                            "execution": 5,
                            "personaId": "uat1",
                            "name": "UAT Coordinator"
                        }
                    ]
                },
                {
                    "group": [
                        {
                            "goal": "Deploy to production environment",
                            "input": ["doc1", "uat1"],
                            "execution": 6,
                            "personaId": "deploy1",
                            "name": "Release Manager"
                        },
                        {
                            "goal": "Monitor system performance",
                            "input": ["perf1", "deploy1"],
                            "execution": 6,
                            "personaId": "mon1",
                            "name": "System Monitor"
                        }
                    ]
                }
            ]
        }
    ],
    isActive = true,
    isCompleted = false,
    added = "",
    isOpen = false,
    sessionId = ""
}) {
    console.log(workflow, updated, isActive, isCompleted, added, "workflow")
    const [isExpanded, setIsExpanded] = useState(isOpen)
    const [currLoading, setCurrLoading] = useState(workflow)
    console.log(workflow, updated, isActive, isCompleted, added, "workflow")
    useEffect(() => {
        console.log(sessionId, "sessionId")
    }, [sessionId])
    useEffect(() => {
        if (updated.length === workflow.length) {
            const timer = setTimeout(() => {
                setIsExpanded(false)
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [updated, workflow])

    useEffect(() => {
        if (isCompleted && isOpen) {
            const timer = setTimeout(() => {
                setIsExpanded(false)
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [isCompleted, isOpen])

    const getIcon = (type) => {
        switch (type) {
            case "document lookup":
                return FileText
            case "vector base search":
                return Database
            case "search":
                return Globe
            case "generate":
                return Sparkles
            default:
                return FileText
        }
    }

    const getStatus = (type) => {
        const updatedItem = updated.find((item) => item.label === type)
        if (updatedItem) return "completed"
        return "loading" // All non-completed items should be in loading state
    }

    const getText = (type) => {
        const updatedItem = updated.find((item) => item.label === type);
        if (updatedItem) return updatedItem.data;
        if (currLoading.includes(type)) return "Loading...";
        return "Pending...";
    };
    const getOthers = (type) => {
        const updatedItem = updated.find((item) => item.label === type);
        if (updatedItem) return updatedItem;
        if (currLoading.includes(type)) return "Loading...";
        return "Pending...";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full  rounded-lg bg-slate-900 p-4 text-white shadow-lg max-w-4xl"
        >
            <button onClick={() => setIsExpanded(!isExpanded)} className="flex w-full items-center justify-between pb-2">
                <span className="text-lg font-semibold">Workflow</span>
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-5 w-5" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="relative mt-4 space-y-8 pl-8">
                            {/* Vertical line */}
                            <div className="absolute left-[11px] top-0 h-full w-[2px] bg-slate-700" />

                            {workflow.map((type, index) => {
                                const status = getStatus(type)
                                const Icon = getIcon(type)
                                const text = getText(type)
                                const other = getOthers(type)
                                { console.log(other, "dashboard") }
                                return (
                                    <motion.div
                                        key={type}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="relative"
                                    >
                                        {/* Status circle */}
                                        <div
                                            className={cn(
                                                "absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border-2",
                                                status === "completed" && (isCompleted && type === "generate")
                                                    ? "border-slate-400 bg-slate-400"
                                                    : status === "loading"
                                                        ? "border-blue-500 bg-blue-200"
                                                        : "border-slate-600 bg-slate-800",
                                            )}
                                        >
                                            {status === "loading" && !(isCompleted && type === "generate") && (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Number.POSITIVE_INFINITY,
                                                        ease: "linear",
                                                    }}
                                                    className="h-3 w-3 rounded-full border-2 border-slate-500 border-t-transparent"
                                                />
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-5 w-5" />
                                                <h3 className="font-medium capitalize">{type}</h3>
                                            </div>

                                            <p className={cn("text-sm", status === "completed" ? "text-slate-400" : "text-slate-500")}>
                                                {(type == "interaction") && Object.keys(other).length > 0 ? (
                                                    <div>
                                                        <PollInteraction
                                                            interactionData={Object.keys(other).length > 0 && other.hasOwnProperty("other") ? {
                                                                label: other.label,
                                                                data: other.data,
                                                                other: other.other.output
                                                            } : []}
                                                            sessionId={sessionId}
                                                        />
                                                    </div>
                                                ) : (isCompleted && type === "generate" ? "Responded" : text)}
                                            </p>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}