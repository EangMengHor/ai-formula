"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, Brain, Users, Play, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function AgenticAutomationDetail({
    name = "Untitled Automation",
    task = "No task specified",
    interval = "daily",
    nextRun = "Not scheduled",
    lastRun = "Never",
    superiorPersonas = [],
    onRunNow = () => { },
}) {
    const [expanded, setExpanded] = useState(false)
    const [detailsExpanded, setDetailsExpanded] = useState(true)
    const [showRunDialog, setShowRunDialog] = useState(false)
    const [hasInteracted, setHasInteracted] = useState(false)
    const timerRef = useRef(null)
    const componentRef = useRef(null)

    // Format date for display
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

    // Handle run now action
    const handleRunNow = () => {
        onRunNow()
        setShowRunDialog(false)
        setHasInteracted(true)
    }

    // Handle user interaction
    const handleInteraction = () => {
        setHasInteracted(true)
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }

    // Set up auto-collapse timer
    useEffect(() => {
        // Start with expanded details
        setDetailsExpanded(true)

        // Set timer to auto-collapse after 2 seconds if no interaction
        timerRef.current = setTimeout(() => {
            if (!hasInteracted) {
                setDetailsExpanded(false)
            }
        }, 2000)

        // Add event listeners to detect interaction
        const handleMouseMove = () => handleInteraction()
        const handleClick = () => handleInteraction()

        const componentElement = componentRef.current
        if (componentElement) {
            componentElement.addEventListener("mousemove", handleMouseMove)
            componentElement.addEventListener("click", handleClick)
        }

        // Clean up
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
            if (componentElement) {
                componentElement.removeEventListener("mousemove", handleMouseMove)
                componentElement.removeEventListener("click", handleClick)
            }
        }
    }, [hasInteracted])

    return (
        <motion.div
            ref={componentRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full bg-slate-900 my-2 border border-slate-500 rounded-lg text-slate-100"
        >
            {/* Header Section - Always Visible */}
            <div className="border-b border-slate-800/60">
                <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-medium text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">{name}</h2>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border px-2 py-0.5">
                            {interval}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 text-slate-400 hover:text-white hover:bg-slate-700"
                            onClick={() => {
                                setDetailsExpanded(!detailsExpanded)
                                setHasInteracted(true)
                            }}
                        >
                            {detailsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span className="ml-1 hidden sm:inline">{detailsExpanded ? "Collapse" : "Expand"}</span>
                        </Button>
                    </div>
                    {/* <Button
                        onClick={() => {
                            setShowRunDialog(true)
                            setHasInteracted(true)
                        }}
                        variant="outline"
                        size="sm"
                        className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                    >
                        <Play className="h-4 w-4 mr-2" />
                        Run Now
                    </Button> */}
                </div>
            </div>

            {/* Collapsed View - Task Description */}
            {!detailsExpanded && (
                <div className="max-w-[1400px] mx-auto px-6 py-3">
                    <p className="text-slate-400 text-sm truncate">{task}</p>
                </div>
            )}

            {/* Expanded Details */}
            <AnimatePresence>
                {detailsExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="max-w-[1400px] mx-auto px-6 py-6">
                            {/* Title Section */}
                            <div className="mb-6">
                                <p className="text-slate-400 text-base">{task}</p>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8 mb-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        <p className="text-sm text-slate-400">Next Run</p>
                                    </div>
                                    <p className="text-white">
                                        {formatDate(nextRun).split(",")[0]}
                                        <span className="text-slate-400">, {formatDate(nextRun).split(",")[1]}</span>
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <p className="text-sm text-slate-400">Last Run</p>
                                    </div>
                                    <p className="text-white">
                                        {formatDate(lastRun).split(",")[0]}
                                        <span className="text-slate-400">, {formatDate(lastRun).split(",")[1]}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Superior Personas Section */}
                            {superiorPersonas.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Brain className="h-5 w-5 text-slate-400" />
                                        <h3 className="text-lg text-white">Superior Personas</h3>
                                        <Badge variant="outline" className="ml-1 bg-transparent text-slate-400 border-slate-700">
                                            {superiorPersonas.length}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <AnimatePresence initial={false}>
                                            {superiorPersonas.slice(0, expanded ? superiorPersonas.length : 3).map((persona, index) => (
                                                <motion.div
                                                    key={`persona-${index}`}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <div className="group flex items-center gap-2 bg-slate-800/30 hover:bg-slate-800/50 transition-colors rounded-lg px-4 py-2 border border-slate-800">
                                                        <Brain className="h-4 w-4 text-purple-400" />
                                                        <span className="text-slate-300 truncate max-w-[150px] sm:max-w-[200px] md:max-w-[250px]">
                                                            {persona.name}
                                                        </span>
                                                        <div className="flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
                                                            <Users className="h-3 w-3" />
                                                            <span className="text-xs">{persona.personaCount}</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}

                                            {!expanded && superiorPersonas.length > 3 && (
                                                <motion.button
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center gap-2 bg-slate-800/30 hover:bg-slate-800/50 transition-colors rounded-lg px-4 py-2 border border-slate-800 text-slate-400"
                                                    onClick={() => {
                                                        setExpanded(true)
                                                        setHasInteracted(true)
                                                    }}
                                                >
                                                    +{superiorPersonas.length - 3} more
                                                </motion.button>
                                            )}

                                            {expanded && superiorPersonas.length > 3 && (
                                                <motion.button
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex items-center gap-2 bg-slate-800/30 hover:bg-slate-800/50 transition-colors rounded-lg px-4 py-2 border border-slate-800 text-slate-400"
                                                    onClick={() => {
                                                        setExpanded(false)
                                                        setHasInteracted(true)
                                                    }}
                                                >
                                                    Show less
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Run Now Dialog */}
            <Dialog
                open={showRunDialog}
                onOpenChange={(open) => {
                    setShowRunDialog(open)
                    setHasInteracted(true)
                }}
            >
                <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-400" />
                            Run Workflow Now
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 pt-2">
                            Running this workflow now will not change the next scheduled run time as it's already queued.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="flex items-start gap-2">
                            <div className="h-5 w-5 flex-shrink-0 mt-0.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div>
                            </div>
                            <p className="text-sm text-slate-300">The last run time will be updated to the current time.</p>
                        </div>

                        <div className="flex items-start gap-2">
                            <div className="h-5 w-5 flex-shrink-0 mt-0.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div>
                            </div>
                            <p className="text-sm text-slate-300">
                                Logs and changes will appear in your dashboard after approximately 5 minutes.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:justify-end">
                        <Button
                            variant="secondary"
                            onClick={() => setShowRunDialog(false)}
                            className="bg-slate-800 text-slate-200 hover:bg-slate-700 border-none"
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleRunNow} className="bg-slate-700 hover:bg-slate-600 text-white">
                            Run Now
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}

