"use client"
import { useState, useRef, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
    Sparkles,
    Upload,
    Clock,
    FileText,
    AlertCircle,
    Check,
    Loader2,
    Edit,
    File,
    X,
    RefreshCw,
    Trash2,
    ChevronDown,
    ChevronUp,
    PenSquare,
    BookHeart,
    Contact,
    CalendarCheck,
    LoaderCircle,
} from "lucide-react"
import { useToast } from "../../../hooks/use-toast"
import { breakDownTask } from "../../../services/n8n-agentic-auto/breakDownTask.api"
import { applyChangesToWorkflow } from "../../../services/n8n-agentic-auto/applyChangesToWorkflow.api"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import GroupSuperiorPersonaSection from "../../../components/custom/GroupSuperiorPersonaSection"
import { useUser } from "../../../context/UserContext"
import { formatDistanceToNow } from "date-fns"
import { createJob } from "../../../services/n8n-agentic-auto/createJob.api"
import { useNavigate } from "react-router-dom"

const a = [
    {
        "name": "Query Decomposition & Context Initialization (OmniSynth + V Framework)",
        "steps": [
            {
                "name": "Classifies incoming queries based on advanced Natural Language Processing (NLP)",
                "query": "NLP classification"
            },
            {
                "name": "Assigns the query to a domain",
                "query": "Domain categorization (Finance, Science, Technology, Health, etc.)"
            },
            {
                "name": "Uses Adaptive Bayesian Networks",
                "query": "Identify hidden variables"
            },
            {
                "name": "Computes a Latent Variable Discovery Index (LVDI)",
                "query": "LVDI computation"
            },
            {
                "name": "Analyzes query complexity using entropy modeling",
                "query": "Entropy modeling for complexity analysis"
            },
            {
                "name": "Computes an Influence Propagation Score (IPS)",
                "query": "IPS calculation"
            },
            {
                "name": "Determines Regulatory & Compliance Considerations",
                "query": "Compliance assessment with ARCS/ARCF"
            },
            {
                "name": "Creates a Structured Chain-of-Thought Pathway",
                "query": "Multi-step reasoning pathway"
            },
            {
                "name": "Calculates Decision Elasticity Ratio (DER)",
                "query": "DER calculation"
            }
        ]
    },
    {
        "name": "Multi-Layered Data Collection & Memory Persistence (ARCS + OmniSynth)",
        "steps": [
            {
                "name": "Retrieves real-time, historical, and predictive data",
                "query": "Data retrieval from multiple sources"
            },
            {
                "name": "Fetches data using high-weight probability filtering",
                "query": "High-weight probability filtering"
            },
            {
                "name": "Computes a Data Trust Score (DTS)",
                "query": "DTS computation"
            },
            {
                "name": "Runs OmniSynth Recursive Reinforcement Learning (RRL)",
                "query": "RRL for accuracy verification"
            },
            {
                "name": "Implements Multi-Agent System Intelligence (MASI)",
                "query": "Cross-domain intelligence integration"
            },
            {
                "name": "Uses Memory Persistence Algorithms",
                "query": "Determine data relevance duration"
            },
            {
                "name": "Applies Bayesian Data Fusion (BDF)",
                "query": "Combine multiple data sources"
            },
            {
                "name": "Checks for compliance risks",
                "query": "Compliance risk assessment"
            }
        ]
    },
    {
        "name": "Theoretical Model Integration & High-Level Quantitative Analysis (V Framework)",
        "steps": [
            {
                "name": "Determines the best theoretical framework based on domain",
                "query": "Theoretical framework selection"
            },
            {
                "name": "Applies quantum probability models",
                "query": "Quantum probability modeling"
            },
            {
                "name": "Uses Recursive Predictive Analysis (RPA)",
                "query": "RPA for theory-based predictions"
            },
            {
                "name": "Integrates Multi-Layered Risk Scoring",
                "query": "Risk projection algorithms"
            },
            {
                "name": "Uses Unified Temporal Knowledge Equation (UTKE)",
                "query": "High-dimensional forecasting"
            },
            {
                "name": "Maps causality pathways using Dynamic Causal Recalibration (DCR)",
                "query": "Causality pathway mapping"
            },
            {
                "name": "Applies Theoretical-Experimental Alignment Metrics (TEAM)",
                "query": "TEAM for precision verification"
            },
            {
                "name": "Evaluates Impact Scaling Factors (ISF)",
                "query": "Impact scaling evaluation"
            }
        ]
    },
    {
        "name": "Decision Tree Mapping, Risk Forecasting & Recursive Optimization (OmniSynth + ARCS)",
        "steps": [
            {
                "name": "Constructs a High-Resolution Decision Tree Graph (HRDTG)",
                "query": "HRDTG construction"
            },
            {
                "name": "Uses Gradient Boosting Machines (GBM)",
                "query": "GBM for decision ranking"
            },
            {
                "name": "Runs Deep Learning Decision Path Optimization (DLDPO)",
                "query": "DLDPO for time-sequencing"
            },
            {
                "name": "Applies Multi-Factor Scenario Testing (MFST)",
                "query": "Scenario testing"
            },
            {
                "name": "Computes Optimal Pathway Score (OPS)",
                "query": "OPS calculation"
            },
            {
                "name": "Runs a Quantum Risk Analysis Model (QRAM)",
                "query": "QRAM for high-stakes decision"
            },
            {
                "name": "Simulates Cross-Domain Ripple Effects",
                "query": "Predict unintended consequences"
            },
            {
                "name": "Uses Adaptive Bayesian Networks for Recursive Feedback Looping",
                "query": "Recursive feedback looping"
            },
            {
                "name": "Incorporates Stress-Testing Models",
                "query": "Stress-testing (Monte Carlo & Markov Chains)"
            }
        ]
    },
    {
        "name": "Execution, Real-Time Adaptation & AI Self-Learning (ARCF + OmniSynth)",
        "steps": [
            {
                "name": "Computes Execution Score (ES),",
                "query": "Execution feasibility evaluation"
            },
            {
                "name": "Applies Quantum Risk Adjustment (QRA)",
                "query": "QRA for unexpected conditions"
            },
            {
                "name": "Uses Multi-Agent Reinforcement Learning (MARL)",
                "query": "MARL for decision refinement"
            },
            {
                "name": "Continuously adjusts execution models",
                "query": "Real-world feedback adjustment"
            },
            {
                "name": "Applies Automated Constraint Solving (ACS)",
                "query": "Remove execution roadblocks"
            },
            {
                "name": "Computes Strategic Adaptability Index (SAI)",
                "query": "SAI for decision robustness"
            },
            {
                "name": "Implements OmniSynth Evolutionary Learning Models (ELM)",
                "query": "ELM for decision evolution"
            },
            {
                "name": "Uses Predictive Intelligence Adjustment (PIA)",
                "query": "Refine future decision accuracy"
            },
            {
                "name": "Incorporates Meta-Analysis Feedback Loop (MAFL)",
                "query": "Test previous decision successes"
            },
            {
                "name": "Runs Neural Network-Based Anomaly Detection (NNAD)",
                "query": "Spot unexpected deviations"
            },
            {
                "name": "Utilizes Fractal Recursive Optimization (FRO)",
                "query": "Continuous system refinement"
            }
        ]
    }
]
// Form validation schema
const formSchema = z.object({
    automationName: z.string().min(3, {
        message: "Automation name must be at least 3 characters.",
    }),
    interval: z.string({
        required_error: "Please select an execution interval.",
    }),
    taskDescription: z.string().min(10, {
        message: "Task description must be at least 10 characters.",
    }),
    taskMethod: z.enum(["document", "text"]),
    textInput: z.string().optional(),
    workflowChanges: z.string().optional(),
    usePreviousContext: z.boolean().default(false),
    contextCount: z.number().min(1).max(5).default(1),
})

const polishedApiData = z.object({
    name: z.string().min(3, { message: "Automation name must be at least 3 characters." }).max(50, { message: "Automation name must be at most 50 characters." }),
    task: z.string().min(10, { message: "Task description must be at least 10 characters." }).max(4000, { message: "Task description must be at most 4000 characters." }),
    interval: z.enum(["daily", "weekly", "monthly"], { message: "Please select an execution interval From the given options!" }),
    workflow: z.array(z.object({
        name: z.string(),
        steps: z.array(z.object({
            name: z.string(),
            query: z.string(),
        }))
    })),
    previousContextCount: z.number().min(1).max(5).default(1),
    isPreviousContext: z.boolean().default(false),
    superiorPersona: z.array(z.number()),
    userId: z.string()
})






export default function CreateAutomationForm() {
    const [isProcessing, setIsProcessing] = useState(false)
    const [isProcessed, setIsProcessed] = useState(false)
    const [workflowSteps, setWorkflowSteps] = useState([])
    const [selectedFile, setSelectedFile] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isApplyingChanges, setIsApplyingChanges] = useState(false)
    const [changesApplied, setChangesApplied] = useState(false)
    const [onFetchSuperiorPersona, setOnFetchSuperiorPersona] = useState(null)
    const [showChangesSection, setShowChangesSection] = useState(false)
    const [isFinalDialogOpen, setIsFinalDialogOpen] = useState(false)
    const [parsedWorkflow, setParsedWorkflow] = useState("")
    const fileInputRef = useRef(null)
    const navigate = useNavigate();
    const {
        selectedSuperiorPersona,
        user
    } = useUser();
    const { toast } = useToast()
    // Initialize form with react-hook-form and zod validation
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            automationName: "",
            interval: "",
            taskDescription: "",
            taskMethod: "document",
            textInput: "",
            workflowChanges: "",
            usePreviousContext: false,
            contextCount: 1,
        },
    })

    const activeTab = form.watch("taskMethod")
    const usePreviousContext = form.watch("usePreviousContext")
    const contextCount = form.watch("contextCount")
    const textInput = form.watch("textInput")
    const workflowChanges = form.watch("workflowChanges")
    const automationName = form.watch("automationName")
    const interval = form.watch("interval")
    const taskDescription = form.watch("taskDescription")

    const handleFileUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
        }
    }



    // this function is used to take text or document an break down the document into executable workflow
    const processWorkflow = async () => {
        setIsProcessing(true)
        setIsProcessed(false)
        setWorkflowSteps(null)
        setChangesApplied(false)
        setShowChangesSection(false)
        try {

            const data = await breakDownTask(activeTab, textInput, selectedFile);
            console.log(data, "is here", data.data.parsed)
            if (data.success) {
                setIsProcessing(false)
                setIsProcessed(true)
                setWorkflowSteps([...data.data.data])
                setParsedWorkflow(data.data.parsed)
                return;
            }
            toast({
                title: "Error",
                description: "Failed to process workflow. Please try again.",
                variant: "destructive",
                duration: 3000,
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to process workflow. Please try again.",
                variant: "destructive",
                duration: 3000,
            })

        } finally {
            setIsProcessing(false)

        }

    }



    const applyWorkflowChanges = async () => {
        if (!workflowSteps || !workflowChanges.trim()) return

        setIsApplyingChanges(true)

        try {
            const result = await applyChangesToWorkflow(workflowSteps, workflowChanges)

            if (result.success) {
                setWorkflowSteps(result.data)
                setChangesApplied(true)

                toast({
                    title: "Changes Applied",
                    description: "Your workflow changes have been applied successfully.",
                    duration: 3000,
                })
            }
            else {
                toast({
                    title: "Error",
                    description: result.message,
                    varient: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to apply workflow changes. Please try again.",
                variant: "destructive",
                duration: 3000,
            })
        } finally {
            setIsApplyingChanges(false)
        }
    }

    const deleteParentStep = (stepId) => {
        if (!workflowSteps) return

        const updatedSteps = workflowSteps.filter((step) => step.id !== stepId)

        // If we deleted all steps, reset the workflow
        if (updatedSteps.length === 0) {
            setIsProcessed(false)
            setWorkflowSteps(null)
            return
        }

        setWorkflowSteps(updatedSteps)

        toast({
            title: "Section Deleted",
            description: "The workflow section has been removed.",
            duration: 2000,
        })
    }

    const deleteChildStep = (parentId, childIndex) => {
        if (!workflowSteps) return

        const updatedSteps = workflowSteps.map((step) => {
            if (step.id === parentId) {
                // If this would be the last child step, keep at least one
                if (step.steps.length <= 1) {
                    toast({
                        title: "Cannot Delete",
                        description: "A section must have at least one step.",
                        variant: "destructive",
                        duration: 2000,
                    })
                    return step
                }

                // Filter out the child step at the specified index
                const updatedSubSteps = step.steps.filter((_, idx) => idx !== childIndex)
                return { ...step, steps: updatedSubSteps }
            }
            return step
        })

        setWorkflowSteps(updatedSteps)

        toast({
            title: "Step Deleted",
            description: "The workflow step has been removed.",
            duration: 2000,
        })
    }
    // Mock API function for creating automation
    const createAutomationAPI = async (data) => {
        try {

            const newApiData = {
                ...data,
                userId: user.id,
                parsed: parsedWorkflow || "not available"
            }
            console.log(newApiData, "is jdlfkjsdlafkjdlfakjsdl;fkjasldf")
            const isValid = polishedApiData.parse(newApiData)
            if (isValid) {
                const res = await createJob(newApiData);
                if (res.success) {
                    setIsFinalDialogOpen(true)
                }
            }
        } catch (error) {
            console.log(error.errors, "is the error")
            if (Array.isArray(error?.errors)) {
                error.errors.map(item => (toast({
                    title: "Error In Form Field",
                    message: (item?.path?.[0] || "") + " " + (item?.message || " "),
                    variant: "destructive"
                })))
            }
        }
    }
    const onSubmit = async (values) => {
        console.log(values, "is the value")
        try {
            if (selectedSuperiorPersona.length <= 0) {
                toast({
                    title: "Error",
                    description: "Please select Superior Persona",
                    variant: "destructive",
                })
                return;
            }
            setIsSubmitting(true)

            // Prepare data for API
            const submissionData = {
                name: values.automationName,
                task: values.taskDescription,
                interval: values.interval,
                workflow: workflowSteps,
                isPreviousContext: values.usePreviousContext,
                previousContextCount: values.contextCount,
                superiorPersona: selectedSuperiorPersona.map(item => item.id)
            }

            console.log("Submitting data:", submissionData)

            // Call mock API
            const result = await createAutomationAPI(submissionData)

            // // Show success message
            // toast({
            //     title: "Automation Created",
            //     description: `Your automation has been created successfully with ID: ${result.id || "null"}`,
            //     duration: 5000,
            // })

            // Reset form after submission
            form.reset()
            setIsProcessed(false)
            setWorkflowSteps(null)
            setSelectedFile(null)
            setChangesApplied(false)
            setShowChangesSection(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        } catch (error) {
            console.error("Submission error:", error)

            // Handle validation errors
            if (error.errors) {
                Object.entries(error.errors).forEach(([field, message]) => {
                    if (message) {
                        form.setError(field, {
                            type: "manual",
                            message: message,
                        })
                    }
                })
            }

            toast({
                title: "Error",
                description: error.message || "There was an error creating your automation. Please try again.",
                variant: "destructive",
                duration: 5000,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const isFormValid = () => {
        const isBasicInfoValid =
            automationName.trim().length >= 3 && interval.trim().length > 0 && taskDescription.trim().length >= 10
        return isBasicInfoValid && workflowSteps && workflowSteps.length > 0
    }

    const removeFile = () => {
        setSelectedFile(null)
        setIsProcessed(false)
        setWorkflowSteps(null)
        setChangesApplied(false)
        setShowChangesSection(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1,
            },
        },
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 24 },
        },
    }

    const fadeVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.4 },
        },
    }

    // Reset changes applied state when workflow changes
    useEffect(() => {
        if (workflowChanges) {
            setChangesApplied(false)
        }
    }, [workflowChanges])

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2 mb-3"
            >
                <Sparkles className="h-6 w-6 text-blue-400" />
                <h1 className="text-2xl font-bold text-white">Create Agentic Automation</h1>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-gray-400 mb-6"
            >
                Configure your automation with specific tasks and behaviors. Fill out the form below to create a new automation
                that will run according to your specifications.
            </motion.p>

            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5 }}
                className="border-t border-gray-800 my-6 origin-left"
            ></motion.div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                        <motion.div variants={itemVariants}>
                            <FormField
                                control={form.control}
                                name="automationName"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-gray-400" />
                                            <FormLabel className="text-lg font-medium text-white">Automation Name</FormLabel>
                                        </div>
                                        <FormDescription className="text-sm text-gray-400">
                                            Give your automation a unique and descriptive name.
                                        </FormDescription>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g., Daily Customer Data Sync"
                                                className="bg-gray-900 border-gray-700 text-white"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <FormField
                                control={form.control}
                                name="interval"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-gray-400" />
                                            <FormLabel className="text-lg font-medium text-white">Execution Interval</FormLabel>
                                        </div>
                                        <FormDescription className="text-sm text-gray-400">
                                            How often should this automation run?
                                        </FormDescription>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                                                    <SelectValue placeholder="Select interval" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-gray-800 border-gray-700">

                                                <SelectItem
                                                    value="daily"
                                                    className="text-white hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                                                >
                                                    Daily
                                                </SelectItem>
                                                <SelectItem
                                                    value="weekly"
                                                    className="text-white hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                                                >
                                                    Weekly
                                                </SelectItem>
                                                <SelectItem
                                                    value="monthly"
                                                    className="text-white hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                                                >
                                                    Monthly
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <FormField
                                control={form.control}
                                name="taskDescription"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-gray-400" />
                                            <FormLabel className="text-lg font-medium text-white">Task Description</FormLabel>
                                        </div>
                                        <FormDescription className="text-sm text-gray-400">
                                            Describe what this automation should accomplish and any specific requirements.
                                        </FormDescription>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe how your automation should behave and what tasks it should perform..."
                                                className="min-h-[120px] bg-gray-900 border-gray-700 text-white"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                        </motion.div>

                        {/* group superior Persona */}
                        <motion.div variants={itemVariants}>
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <FormLabel className="text-lg font-medium text-white">Select Superior Persona(s)</FormLabel>
                            </div>
                            <div>
                                <Dialog>
                                    <DialogTrigger>
                                        <Button
                                            type="button"
                                            onClick={() => onFetchSuperiorPersona()}
                                            className="my-2 flex gap-2">
                                            <BookHeart />
                                            Manage/Select Superior Persona
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-5xl h-[80%] bg-slate-700 p-0 border-2 border-slate-500 overflow-y-scroll">
                                        <GroupSuperiorPersonaSection onFetchSuperiorPersona={setOnFetchSuperiorPersona} isShowInteractionOptions={false} />
                                    </DialogContent>
                                </Dialog>

                            </div>
                            {
                                selectedSuperiorPersona && selectedSuperiorPersona.length > 0 && <p className="font-semibold text-md text-white mt-4 mb-2">Selected Superior Persona</p>

                            }
                            {
                                selectedSuperiorPersona && selectedSuperiorPersona.length > 0 && <div className="grid grid-cols-2 w-full gap-2">
                                    {
                                        selectedSuperiorPersona.map(item => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700  transition-all duration-200 cursor-pointer group"

                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <div className="bg-gray-700 p-2 rounded-md mt-1 transition-colors duration-200">
                                                            <FileText className="h-5 w-5 text-blue-400" />
                                                        </div>

                                                        <div className="flex flex-col">
                                                            <h3 className="text-white font-medium text-xs mb-1 leading-5 transition-colors duration-200">
                                                                {item.title}
                                                            </h3>

                                                            <div className="flex items-center text-gray-400 text-sm">
                                                                <Clock className="h-3.5 w-3.5 mr-1.5 inline-block" />
                                                                <span>Created {formatDistanceToNow(item.date)} ago</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </motion.div>
                                        ))
                                    }
                                </div>
                            }
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <FormField
                                control={form.control}
                                name="usePreviousContext"
                                render={({ field }) => (
                                    <FormItem className="space-y-2 bg-slate-600 px-2 py-3 rounded-md">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-gray-400" />
                                            <FormLabel className="text-lg font-medium text-white">Previous Workflow Context</FormLabel>
                                        </div>
                                        <FormDescription className="text-sm text-gray-400">
                                            if Turned on then workflow will have context of previously executed workflow
                                        </FormDescription>
                                        <div className="flex items-center space-x-2">
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="data-[state=checked]:bg-blue-600"
                                                />
                                            </FormControl>
                                            <span className="text-sm text-gray-400">
                                                {field.value ? "Using previous context" : "Not using previous context"}
                                            </span>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </motion.div>

                        <AnimatePresence>
                            {usePreviousContext && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <FormField
                                        control={form.control}
                                        name="contextCount"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-sm font-medium text-white">Number of Previous Workflows</FormLabel>
                                                <FormDescription className="text-sm text-gray-400">
                                                    Select how many previous workflow executions to include as context for new execution (1-5).
                                                </FormDescription>
                                                <div className="space-y-4">
                                                    <FormControl>
                                                        <Slider
                                                            min={1}
                                                            max={5}
                                                            step={1}
                                                            value={[field.value]}
                                                            onValueChange={(value) => field.onChange(value[0])}
                                                            className="w-full"
                                                        />
                                                    </FormControl>
                                                    <div className="flex justify-between">
                                                        {[1, 2, 3, 4, 5].map((num) => (
                                                            <span
                                                                key={num}
                                                                className={`text-xs ${contextCount >= num ? "text-blue-400" : "text-gray-500"}`}
                                                            >
                                                                {num}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div variants={itemVariants}>
                            <FormField
                                control={form.control}
                                name="taskMethod"
                                render={({ field }) => (
                                    <FormItem className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-gray-400" />
                                            <FormLabel className="text-lg font-medium text-white">Assing Workflow To Each Agent</FormLabel>
                                        </div>
                                        <FormDescription className="text-sm text-gray-400">
                                            Selected Workflow will be assigned to each agent for performing broken down service of your given task
                                        </FormDescription>
                                        <FormControl>
                                            <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                                                <TabsList className="bg-gray-800 text-gray-400">
                                                    <TabsTrigger
                                                        value="document"
                                                        className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                                                    >
                                                        Document Upload
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="text"
                                                        className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                                                    >
                                                        Text Input
                                                    </TabsTrigger>
                                                </TabsList>

                                                <TabsContent value="document" className="mt-4">
                                                    <Card className="bg-gray-900 border-gray-700">
                                                        <CardContent className="pt-6">
                                                            <div className="flex flex-col">
                                                                {!selectedFile ? (
                                                                    <motion.div
                                                                        variants={fadeVariants}
                                                                        initial="hidden"
                                                                        animate="visible"
                                                                        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg p-6 text-center mb-4"
                                                                    >
                                                                        <Upload className="h-10 w-10 text-gray-500 mb-4" />
                                                                        <p className="text-gray-400 mb-2">Upload your workflow document</p>
                                                                        <p className="text-xs text-gray-500 mb-4">Supported formats: PDF, DOCX, JSON</p>

                                                                        <input
                                                                            ref={fileInputRef}
                                                                            type="file"
                                                                            accept=".pdf,.docx,.json"
                                                                            onChange={handleFileUpload}
                                                                            className="hidden"
                                                                            id="workflow-upload"
                                                                        />

                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            onClick={() => fileInputRef.current?.click()}
                                                                            className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                                                                            disabled={isProcessing}
                                                                        >
                                                                            Select File
                                                                        </Button>
                                                                    </motion.div>
                                                                ) : (
                                                                    <motion.div
                                                                        variants={fadeVariants}
                                                                        initial="hidden"
                                                                        animate="visible"
                                                                        className="flex items-center justify-between bg-gray-800 p-3 rounded-lg mb-4"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <File className="h-5 w-5 text-blue-400" />
                                                                            <span className="text-white font-medium truncate max-w-[250px]">
                                                                                {selectedFile.name}
                                                                            </span>
                                                                            <span className="text-gray-400 text-xs">
                                                                                ({(selectedFile.size / 1024).toFixed(1)} KB)
                                                                            </span>
                                                                        </div>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={removeFile}
                                                                            className="text-gray-400 hover:text-white hover:bg-gray-700"
                                                                            disabled={isProcessing}
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </motion.div>
                                                                )}

                                                                <Button
                                                                    type="button"
                                                                    variant="default"
                                                                    onClick={processWorkflow}
                                                                    className="bg-blue-600 hover:bg-blue-700 text-white self-end"
                                                                    disabled={isProcessing || !selectedFile}
                                                                >
                                                                    {isProcessing ? (
                                                                        <>
                                                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                            Processing...
                                                                        </>
                                                                    ) : (
                                                                        "Break Down Tasks"
                                                                    )}
                                                                </Button>
                                                            </div>

                                                            <AnimatePresence>
                                                                {isProcessing && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 20 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: -20 }}
                                                                        className="mt-6 flex items-center justify-center text-gray-400"
                                                                    >
                                                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                                        <span>Breaking down workflow...</span>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>

                                                            <AnimatePresence>
                                                                {isProcessed && workflowSteps && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        exit={{ opacity: 0 }}
                                                                        transition={{ duration: 0.4 }}
                                                                        className="mt-6 space-y-4"
                                                                    >
                                                                        <motion.div
                                                                            initial={{ x: -20, opacity: 0 }}
                                                                            animate={{ x: 0, opacity: 1 }}
                                                                            transition={{ delay: 0.1 }}
                                                                            className="flex items-center text-green-500 gap-2"
                                                                        >
                                                                            <Check className="h-5 w-5" />
                                                                            <span>Workflow processed successfully</span>
                                                                        </motion.div>

                                                                        {/* Make Changes Button */}
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: 10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            transition={{ delay: 0.2 }}
                                                                            className="flex justify-end mb-4"
                                                                        >
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                onClick={() => setShowChangesSection(!showChangesSection)}
                                                                                className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 flex items-center gap-2"
                                                                            >
                                                                                <PenSquare className="h-4 w-4" />
                                                                                {showChangesSection ? "Hide Changes" : "Make Changes"}
                                                                                {showChangesSection ? (
                                                                                    <ChevronUp className="h-4 w-4" />
                                                                                ) : (
                                                                                    <ChevronDown className="h-4 w-4" />
                                                                                )}
                                                                            </Button>
                                                                        </motion.div>

                                                                        {/* Workflow Changes Section */}
                                                                        <AnimatePresence>
                                                                            {showChangesSection && (
                                                                                <motion.div
                                                                                    initial={{ opacity: 0, height: 0 }}
                                                                                    animate={{ opacity: 1, height: "auto" }}
                                                                                    exit={{ opacity: 0, height: 0 }}
                                                                                    transition={{ duration: 0.3 }}
                                                                                    className="overflow-hidden mb-6"
                                                                                >
                                                                                    <FormField
                                                                                        control={form.control}
                                                                                        name="workflowChanges"
                                                                                        render={({ field }) => (
                                                                                            <FormItem className="space-y-2">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <Edit className="h-5 w-5 text-blue-400" />
                                                                                                    <FormLabel className="text-white font-medium">
                                                                                                        Workflow Changes
                                                                                                    </FormLabel>
                                                                                                </div>
                                                                                                <FormDescription className="text-sm text-gray-400">
                                                                                                    Enter any changes or adjustments you want to make to the workflow.
                                                                                                </FormDescription>
                                                                                                <FormControl>
                                                                                                    <Textarea
                                                                                                        placeholder="Describe any changes to the workflow steps..."
                                                                                                        className="min-h-[100px] bg-gray-800 border-gray-700 text-white"
                                                                                                        {...field}
                                                                                                    />
                                                                                                </FormControl>

                                                                                                <div className="flex justify-end mt-2">
                                                                                                    <Button
                                                                                                        type="button"
                                                                                                        onClick={applyWorkflowChanges}
                                                                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                                                                        disabled={isApplyingChanges || !workflowChanges.trim()}
                                                                                                    >
                                                                                                        {isApplyingChanges ? (
                                                                                                            <>
                                                                                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                                                                Applying Changes...
                                                                                                            </>
                                                                                                        ) : changesApplied ? (
                                                                                                            <>
                                                                                                                <Check className="h-4 w-4 mr-2" />
                                                                                                                Changes Applied
                                                                                                            </>
                                                                                                        ) : (
                                                                                                            <>
                                                                                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                                                                                Apply Changes
                                                                                                            </>
                                                                                                        )}
                                                                                                    </Button>
                                                                                                </div>
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>

                                                                        <motion.div
                                                                            variants={containerVariants}
                                                                            initial="hidden"
                                                                            animate="visible"
                                                                            className="space-y-4"
                                                                        >
                                                                            {workflowSteps.map((step, idx) => (
                                                                                <motion.div
                                                                                    key={step.id}
                                                                                    variants={itemVariants}
                                                                                    custom={idx}
                                                                                    className="bg-gray-800 rounded-lg p-4"
                                                                                >
                                                                                    <div className="flex items-center justify-between mb-2">
                                                                                        <h3 className="text-white font-medium">{step.name || ""}</h3>
                                                                                        {/* <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            onClick={() => deleteParentStep(step.id)}
                                                                                            className="text-gray-400 hover:text-red-400 hover:bg-gray-700 h-8 w-8"
                                                                                            title="Delete section"
                                                                                        >
                                                                                            <Trash2 className="h-4 w-4" />
                                                                                        </Button> */}
                                                                                    </div>
                                                                                    <ul className="space-y-2">
                                                                                        {step.steps.map((subStep, index) => (
                                                                                            <motion.li
                                                                                                key={index}
                                                                                                initial={{ opacity: 0, x: -10 }}
                                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                                transition={{ delay: 0.1 * index }}
                                                                                                className="text-gray-400 text-sm flex items-start gap-2 group"
                                                                                            >
                                                                                                <div className="bg-gray-700 text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5">
                                                                                                    {index + 1}
                                                                                                </div>
                                                                                                <span className="flex-1">{subStep.name}</span>
                                                                                                {/* <Button
                                                                                                    type="button"
                                                                                                    variant="ghost"
                                                                                                    size="icon"
                                                                                                    onClick={() => deleteChildStep(step.id, index)}
                                                                                                    className="text-gray-700 hover:text-red-400 hover:bg-gray-700 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                                    title="Delete step"
                                                                                                >
                                                                                                    <X className="h-3 w-3" />
                                                                                                </Button> */}
                                                                                            </motion.li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </motion.div>
                                                                            ))}
                                                                        </motion.div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </CardContent>
                                                    </Card>
                                                </TabsContent>

                                                <TabsContent value="text" className="mt-4">
                                                    <Card className="bg-gray-900 border-gray-700">
                                                        <CardContent className="pt-6">
                                                            <FormField
                                                                control={form.control}
                                                                name="textInput"
                                                                render={({ field }) => (
                                                                    <FormItem className="mb-4">
                                                                        <FormControl>
                                                                            <Textarea
                                                                                placeholder="Describe your workflow steps in detail..."
                                                                                className="min-h-[200px] bg-gray-800 border-gray-700 text-white"
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormDescription className="text-xs text-gray-500 mt-2">
                                                                            Provide a detailed description of your workflow steps and we'll automatically
                                                                            process them.
                                                                        </FormDescription>
                                                                        <FormMessage className="text-red-400" />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <div className="flex justify-end">
                                                                <Button
                                                                    type="button"
                                                                    variant="default"
                                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                                    onClick={processWorkflow}
                                                                    disabled={isProcessing || !textInput.trim()}
                                                                >
                                                                    {isProcessing ? (
                                                                        <>
                                                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                            Processing...
                                                                        </>
                                                                    ) : (
                                                                        "Break Down Tasks"
                                                                    )}
                                                                </Button>
                                                            </div>

                                                            <AnimatePresence>
                                                                {isProcessing && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 20 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: -20 }}
                                                                        className="mt-6 flex items-center justify-center text-gray-400"
                                                                    >
                                                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                                        <span>Breaking down workflow...</span>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>

                                                            <AnimatePresence>
                                                                {isProcessed && workflowSteps && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        exit={{ opacity: 0 }}
                                                                        transition={{ duration: 0.4 }}
                                                                        className="mt-6 space-y-4"
                                                                    >
                                                                        <motion.div
                                                                            initial={{ x: -20, opacity: 0 }}
                                                                            animate={{ x: 0, opacity: 1 }}
                                                                            transition={{ delay: 0.1 }}
                                                                            className="flex items-center text-green-500 gap-2"
                                                                        >
                                                                            <Check className="h-5 w-5" />
                                                                            <span>Workflow processed successfully</span>
                                                                        </motion.div>

                                                                        {/* Make Changes Button */}
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: 10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            transition={{ delay: 0.2 }}
                                                                            className="flex justify-end mb-4"
                                                                        >
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                onClick={() => setShowChangesSection(!showChangesSection)}
                                                                                className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 flex items-center gap-2"
                                                                            >
                                                                                <PenSquare className="h-4 w-4" />
                                                                                {showChangesSection ? "Hide Changes" : "Make Changes"}
                                                                                {showChangesSection ? (
                                                                                    <ChevronUp className="h-4 w-4" />
                                                                                ) : (
                                                                                    <ChevronDown className="h-4 w-4" />
                                                                                )}
                                                                            </Button>
                                                                        </motion.div>

                                                                        {/* Workflow Changes Section */}
                                                                        <AnimatePresence>
                                                                            {showChangesSection && (
                                                                                <motion.div
                                                                                    initial={{ opacity: 0, height: 0 }}
                                                                                    animate={{ opacity: 1, height: "auto" }}
                                                                                    exit={{ opacity: 0, height: 0 }}
                                                                                    transition={{ duration: 0.3 }}
                                                                                    className="overflow-hidden mb-6"
                                                                                >
                                                                                    <FormField
                                                                                        control={form.control}
                                                                                        name="workflowChanges"
                                                                                        render={({ field }) => (
                                                                                            <FormItem className="space-y-2">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <Edit className="h-5 w-5 text-blue-400" />
                                                                                                    <FormLabel className="text-white font-medium">
                                                                                                        Workflow Changes
                                                                                                    </FormLabel>
                                                                                                </div>
                                                                                                <FormDescription className="text-sm text-gray-400">
                                                                                                    Enter any changes or adjustments you want to make to the workflow.
                                                                                                </FormDescription>
                                                                                                <FormControl>
                                                                                                    <Textarea
                                                                                                        placeholder="Describe any changes to the workflow steps..."
                                                                                                        className="min-h-[100px] bg-gray-800 border-gray-700 text-white"
                                                                                                        {...field}
                                                                                                    />
                                                                                                </FormControl>

                                                                                                <div className="flex justify-end mt-2">
                                                                                                    <Button
                                                                                                        type="button"
                                                                                                        onClick={applyWorkflowChanges}
                                                                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                                                                        disabled={isApplyingChanges || !workflowChanges.trim()}
                                                                                                    >
                                                                                                        {isApplyingChanges ? (
                                                                                                            <>
                                                                                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                                                                Applying Changes...
                                                                                                            </>
                                                                                                        ) : changesApplied ? (
                                                                                                            <>
                                                                                                                <Check className="h-4 w-4 mr-2" />
                                                                                                                Changes Applied
                                                                                                            </>
                                                                                                        ) : (
                                                                                                            <>
                                                                                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                                                                                Apply Changes
                                                                                                            </>
                                                                                                        )}
                                                                                                    </Button>
                                                                                                </div>
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>

                                                                        <motion.div
                                                                            variants={containerVariants}
                                                                            initial="hidden"
                                                                            animate="visible"
                                                                            className="space-y-4"
                                                                        >
                                                                            {workflowSteps.map((step, idx) => (
                                                                                <motion.div
                                                                                    key={step.id}
                                                                                    variants={itemVariants}
                                                                                    custom={idx}
                                                                                    className="bg-gray-800 rounded-lg p-4"
                                                                                >
                                                                                    <div className="flex items-center justify-between mb-2">
                                                                                        <h3 className="text-white font-medium">{step.name}</h3>

                                                                                    </div>
                                                                                    <ul className="space-y-2">
                                                                                        {step.steps.map((subStep, index) => (
                                                                                            <motion.li
                                                                                                key={index}
                                                                                                initial={{ opacity: 0, x: -10 }}
                                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                                transition={{ delay: 0.1 * index }}
                                                                                                className="text-gray-400 text-sm flex items-start gap-2 group"
                                                                                            >
                                                                                                <div className="bg-gray-700 text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5">
                                                                                                    {index + 1}
                                                                                                </div>
                                                                                                <span className="flex-1">{subStep.name}</span>

                                                                                            </motion.li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </motion.div>
                                                                            ))}
                                                                        </motion.div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </CardContent>
                                                    </Card>
                                                </TabsContent>
                                            </Tabs>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="pt-4"
                    >
                        <Button
                            type="submit"
                            onClick={() => {
                                console.log(form.formState.errors)
                            }}
                            disabled={!isFormValid() || isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white relative overflow-hidden group"
                        >
                            <span className={`${isSubmitting ? "opacity-0" : "opacity-100"} transition-opacity`}>
                                Create Automation
                            </span>
                            {isSubmitting && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                </span>
                            )}
                            <span className="absolute bottom-0 left-0 h-1 bg-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                        </Button>

                        {!isFormValid() && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="flex items-center gap-2 mt-4 text-amber-500 text-sm"
                            >
                                <AlertCircle className="h-4 w-4" />
                                <span>Please complete all required fields and process a workflow before submitting</span>
                            </motion.div>
                        )}
                    </motion.div>
                </form>
            </Form>
            <Dialog open={isFinalDialogOpen} onOpenChange={setIsFinalDialogOpen}>
                <DialogContent className="max-w-[60%] bg-purple-700">

                    <div className="flex gap-2 items-center font-semibold text-white text-lg">
                        <CalendarCheck />
                        <p>You Are Done From Your Side</p>
                    </div>
                    <Alert className=" bg-purple-800 text-white">
                        <LoaderCircle className="w-5 h-5 animate-spin text-white" />
                        <AlertTitle>Workflow Is Under Process!</AlertTitle>
                        <AlertDescription>
                            Your Workflow is under process and and ai agent is using knowledge base and creating actionable Agent Plan For Whole Workflow
                        </AlertDescription>
                    </Alert>
                    <div>
                        <ul className="list-disc text-white ml-6">
                            <li>The AI Agent reviews your workflow and extracts data from the knowledge base.</li>
                            <li>It then creates an actionable plan based on this data.</li>
                            <li>You Can Safely Close And Leave This Page</li>
                            <li>This process takes time, so it won't appear on your dashboard immediately.</li>
                        </ul>
                    </div>
                    <div className="flex w-full items-center justify-end">
                        <Button
                            onClick={() => {
                                navigate('/agenticAutomation')
                            }}
                            className="bg-purple-500 hover:bg-purple-800 w-fit border-2 border-white">
                            Ok! Go To Dashboard
                        </Button>

                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

