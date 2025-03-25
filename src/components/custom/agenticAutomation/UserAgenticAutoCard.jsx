"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, Brain } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Button } from "../../ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Workflow } from "./workflow/workflow"
import { userAgenticAutomationJobs } from "../../../namespace/client"
import { useNavigate } from "react-router-dom"

export default function UserAgenticAutoCard({
    name = "Untitled Automation",
    task = "No task specified",
    interval = "daily",
    nextRun = "Not scheduled",
    lastRun = "Never",
    superiorPersonas = [],
    taskAgents = [],
    id=""
}) {
    const navigate = useNavigate()
    const [expanded, setExpanded] = useState(false)

    const formatDate = (dateString) => {
        if (!dateString) return "Not set"
        try {
            const date = new Date(dateString)
            return new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            }).format(date)
        } catch (e) {
            return dateString
        }
    }

    const getIntervalColor = (interval) => {
        const colors = {
            hourly: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            daily: "bg-green-500/20 text-green-400 border-green-500/30",
            weekly: "bg-purple-500/20 text-purple-400 border-purple-500/30",
            monthly: "bg-amber-500/20 text-amber-400 border-amber-500/30",
            yearly: "bg-red-500/20 text-red-400 border-red-500/30",
        }
        return colors[interval?.toLowerCase()] || "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }

    // Calculate how many personas to show in collapsed state
    const visiblePersonasCount = 2
    const hiddenPersonasCount = superiorPersonas.length - visiblePersonasCount

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="relative overflow-hidden bg-slate-900/95 text-slate-100 border-slate-800 backdrop-blur-sm">
                <CardContent className="p-5">
                    {/* Header Section */}
                    <div className="flex justify-between items-start gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white truncate mb-1">{name}</h3>
                            <p className="text-slate-400 text-sm line-clamp-2">{task}</p>
                        </div>
                        <Badge className={cn("px-2.5 py-1 text-xs font-medium border", getIntervalColor(interval))}>
                            {interval}
                        </Badge>
                    </div>

                    {/* Superior Personas Section */}
                    {superiorPersonas.length > 0 && (
                        <div className="mb-4 bg-slate-800/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-slate-300 mb-2">
                                <Brain className="h-4 w-4 text-purple-400" />
                                <span className="text-sm font-medium">Superior Personas</span>
                                <Badge variant="outline" className="ml-auto bg-slate-800 text-slate-300">
                                    {superiorPersonas.length}
                                </Badge>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                <AnimatePresence initial={false}>
                                    {/* Always show first two personas */}
                                    {superiorPersonas.slice(0, visiblePersonasCount).map((persona, index) => (
                                        <motion.div
                                            key={`visible-${index}`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Badge
                                                variant="outline"
                                                className="bg-slate-800/80 text-slate-300 border-slate-700 whitespace-nowrap rounded-md"
                                            >
                                                <span className="truncate max-w-[150px] inline-block">{persona.name}</span>
                                                <span className="ml-1.5 bg-slate-700 px-1.5 py-0.5 rounded-sm text-xs">
                                                    {persona.personaCount} Personas
                                                </span>
                                            </Badge>
                                        </motion.div>
                                    ))}

                                    {/* Show "+n more" badge when collapsed and there are more personas */}
                                    {!expanded && hiddenPersonasCount > 0 && (
                                        <motion.div
                                            key="more-badge"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Badge
                                                variant="outline"
                                                className="bg-slate-700 text-slate-300 border-slate-600 cursor-pointer hover:bg-slate-600 transition-colors"
                                                onClick={() => setExpanded(true)}
                                            >
                                                +{hiddenPersonasCount} more
                                            </Badge>
                                        </motion.div>
                                    )}

                                    {/* Show all remaining personas when expanded */}
                                    {expanded &&
                                        superiorPersonas.slice(visiblePersonasCount).map((persona, index) => (
                                            <motion.div
                                                key={`hidden-${index}`}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                            >
                                                <Badge
                                                    variant="outline"
                                                    className="bg-slate-800/80 text-slate-300 border-slate-700 whitespace-nowrap"
                                                >
                                                    <span className="truncate max-w-[150px] inline-block">{persona.name}</span>
                                                    <span className="ml-1.5 bg-slate-700 px-1.5 py-0.5 rounded-sm text-xs">
                                                        {persona.personaCount} Personas
                                                    </span>
                                                </Badge>
                                            </motion.div>
                                        ))}

                                    {/* Show collapse button when expanded */}
                                    {expanded && (
                                        <motion.div
                                            key="collapse-badge"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Badge
                                                variant="outline"
                                                className="bg-slate-700 text-slate-300 border-slate-600 cursor-pointer hover:bg-slate-600 transition-colors"
                                                onClick={() => setExpanded(false)}
                                            >
                                                Show less
                                            </Badge>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {/* Timing Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Clock className="h-4 w-4" />
                                <span className="text-xs">Next Run</span>
                            </div>
                            <p className="text-sm text-slate-200">{formatDate(nextRun)}</p>
                        </div>
                        <div className="bg-slate-800/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Calendar className="h-4 w-4" />
                                <span className="text-xs">Last Run</span>
                            </div>
                            <p className="text-sm text-slate-200">{formatDate(lastRun)}</p>
                        </div>
                    </div>
                    <div className="my-2">
                        <Button
                            onClick={()=>navigate(`${userAgenticAutomationJobs}/${id}`)}
                        >View Jobs</Button>

                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

