"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { io } from "socket.io-client"
import ExecutionTimeline from "./ExecutionTimeline"
import { motion } from "framer-motion"
import { StreamingResponse } from "./StreamingRendered"
import { Fallback } from "@radix-ui/react-avatar"


// Main component that handles socket connection and event processing
export default function AIExecutionFlow() {
    const [steps, setSteps] = useState([])
    const [isComplete, setIsComplete] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [loading, setLoading] = useState(false)

    // New improved streaming response state
    const [markdownBuffer, setMarkdownBuffer] = useState(``)
    const [isStreaming, setIsStreaming] = useState(false)
    const lastChunkRef = useRef("")
    const streamTimeoutRef = useRef(null)

    // Keep the original state variables for compatibility
    const [finalResponse, setFinalResponse] = useState("")
    const [visibleText, setVisibleText] = useState("");

    const socket = useRef(null)
    const currentStepRef = useRef(null)

    useEffect(() => {
        console.log(steps)
    }, [steps])

    // Socket connection and event handling
    useEffect(() => {
        console.log("socket.current", socket.current)
        // Initialize socket connection
        socket.current = io("ws://localhost:5000")

        // Handle socket connection events
        socket.current.on("connect", () => {
            console.log("Connected to socket server:", socket.current.id)
            setIsConnected(true)
        })

        socket.current.on("disconnect", () => {
            console.log("Disconnected from socket server")
            setIsConnected(false)
        })

        // Handle AI execution events
        socket.current.on("event", (event) => {
            handleSocketEvent(event)
        })

        // Handle errors
        socket.current.on("error", (error) => {
            console.error("Socket error:", error)
        })

        // Cleanup on unmount
        return () => {
            if (socket.current) {
                socket.current.disconnect()
            }
            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current)
            }
        }
    }, [])

    // Monitor streaming status and finalize after inactivity
    useEffect(() => {
        if (isStreaming) {
            // Reset any existing timeout
            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current)
            }

            // Set new timeout to detect end of streaming
            streamTimeoutRef.current = setTimeout(() => {
                setIsStreaming(false)
                console.log("Stream completed due to inactivity")
            }, 60000) // 2 seconds of inactivity means streaming is done
        }

        return () => {
            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current)
            }
        }
    }, [markdownBuffer, isStreaming])

    useEffect(() => {
        console.log("finalResponse", finalResponse)
    }, [finalResponse, visibleText])

    // Function to handle socket events
    const handleSocketEvent = (event) => {
        console.log("Received event:", event)

        // Show loading indicator before adding new content
        if (event.type && event.type !== "stepAgentGoal" && event.type !== "knowledge" && event.type !== "search") {
            setLoading(true)

            // Hide loading indicator after a short delay
            setTimeout(() => {
                setLoading(false)
            }, 1000)
        }

        // Handle different event types
        if (event.type === "defineGoal") {
            // Create a new goal step
            const newStep = { type: "defineGoal", text: "" }
            setSteps(prevSteps => [...prevSteps, newStep])
            currentStepRef.current = newStep
        }

        else if (event.type === "finalResponse") {
            console.log("finalResponse event received:", event);

            // Update the streaming status
            setIsStreaming(true);

            // Append the new content directly to the markdown buffer
            setMarkdownBuffer((prev) => prev + event.content);

            // Update the last chunk reference
            lastChunkRef.current = event.content;
        }

        else if (event.type === "thinking") {
            // Create a new thinking step
            const newStep = { type: "thinking", text: "" }
            setSteps(prevSteps => [...prevSteps, newStep])
            currentStepRef.current = newStep
        }

        else if (event.type === "stepAgent") {
            // Create a new step agent execution step
            const newStep = { type: "stepAgent", goal: "", isLoadingKnowledge: false, isLoadingSearch: false }
            setSteps(prevSteps => [...prevSteps, newStep])
            currentStepRef.current = newStep
        }
        else if (event.type === "stepAgentGoal") {
            console.log("stepAgentGoal event received:", event)
            // Update the current stepAgent's goal
            setSteps((prevSteps) => {
                const updatedSteps = [...prevSteps];
                const lastStep = updatedSteps[updatedSteps.length - 1];
                console.log("lastStep", lastStep)
                console.log("goal", event.content)
                // if (lastStep && lastStep.type === "stepAgent") {
                lastStep.goal = (lastStep.goal && lastStep.goal !== undefined) ? (lastStep.goal + event.content || "") : (event.content || ""); // Update the goal with the content from the event
                currentStepRef.current = lastStep;
                // }

                return updatedSteps;
            });
        }
        else if (event.type === "knowledge") {
            // This is a sub-event of stepAgent, mark it as loading knowledge
            setSteps(prevSteps => {
                const updatedSteps = [...prevSteps]
                const lastStep = updatedSteps[updatedSteps.length - 1]

                if (lastStep && lastStep.type === "stepAgent") {
                    lastStep.isLoadingKnowledge = true
                    currentStepRef.current = lastStep
                }

                return updatedSteps
            })
        }

        else if (event.type === "search") {
            // This is a sub-event of stepAgent, mark it as loading search results
            setSteps(prevSteps => {
                const updatedSteps = [...prevSteps]
                const lastStep = updatedSteps[updatedSteps.length - 1]

                if (lastStep && lastStep.type === "stepAgent") {
                    lastStep.isLoadingSearch = true
                    currentStepRef.current = lastStep
                }

                return updatedSteps
            })
        }

        else if (event.type === "reEvaluating") {
            // Create a new re-evaluating step
            const newStep = { type: "reEvaluating", text: "" }
            setSteps(prevSteps => [...prevSteps, newStep])
            currentStepRef.current = newStep
        }
        else if (event.content) {
            setSteps((prevSteps) => {
                const updatedSteps = [...prevSteps];
                const lastStep = updatedSteps[updatedSteps.length - 1];

                if (lastStep) {
                    if (event.type === "stepAgentGoal" && lastStep.type === "stepAgent") {
                        // Append to the goal if it's a stepAgentGoal event
                        lastStep.goal = (lastStep.goal || "") + event.content;
                    } else {
                        // Otherwise append to text as before
                        lastStep.text = (lastStep.text || "") + event.content;
                    }
                }

                return updatedSteps;
            });
        }
        else if (event.type === "finish") {
            // Create a finish step
            const newStep = { type: "finish" }
            setSteps(prevSteps => [...prevSteps, newStep])
            setIsComplete(true)
            setIsStreaming(false) // Ensure streaming is marked as complete
        }

        // Handle content streaming
        else if (event.content) {
            setSteps(prevSteps => {
                const updatedSteps = [...prevSteps]
                const lastStep = updatedSteps[updatedSteps.length - 1]

                if (lastStep) {
                    // Append content to the text of the last step
                    lastStep.text = (lastStep.text || "") + event.content
                }

                return updatedSteps
            })
        }

        // Handle estimated steps and time
        else if (event.estimatedSteps && event.estimatedTime) {
            setSteps(prevSteps => {
                const updatedSteps = [...prevSteps]
                const lastStep = updatedSteps[updatedSteps.length - 1]

                if (lastStep && lastStep.type === "defineGoal") {
                    lastStep.estimatedSteps = event.estimatedSteps
                    lastStep.estimatedTime = event.estimatedTime
                }
                return updatedSteps
            })
        }

        // Handle knowledge base items
        else if (event.items) {
            setLoading(true)
            setTimeout(() => {
                setSteps(prevSteps => {
                    const updatedSteps = [...prevSteps]
                    const lastStep = updatedSteps[updatedSteps.length - 1]

                    if (lastStep && lastStep.type === "stepAgent") {
                        lastStep.knowledgeBase = lastStep.knowledgeBase
                            ? [...lastStep.knowledgeBase, ...event.items]
                            : event.items
                        lastStep.isLoadingKnowledge = false
                    }

                    return updatedSteps
                })
                setLoading(false)
            }, 100)
        }

        // Handle search URLs
        else if (event.urls) {
            setLoading(true)
            setTimeout(() => {
                setSteps(prevSteps => {
                    const updatedSteps = [...prevSteps]
                    const lastStep = updatedSteps[updatedSteps.length - 1]

                    if (lastStep && lastStep.type === "stepAgent") {
                        lastStep.search = event.urls
                        lastStep.isLoadingSearch = false
                    }

                    return updatedSteps
                })
                setLoading(false)
            }, 300)
        }
    }

    // Function to send a message to the AI
    const sendMessage = (prompt, sessionId, mode, isSwarm, swarmIds, isAutoSwarm) => {
        if (!socket.current || !isConnected) {
            console.error("Socket not connected")
            return
        }

        // Clear previous steps when starting a new conversation
        setSteps([])
        setIsComplete(false)
        setFinalResponse("") // Clear the final response as well
        setVisibleText("") // Clear the visible text
        setMarkdownBuffer("") // Clear our markdown buffer
        setIsStreaming(false) // Reset streaming state
        lastChunkRef.current = "" // Clear last chunk reference

        // Send the message to the server
        socket.current.emit("chat", { prompt, sessionId, mode, isSwarm, swarmIds, isAutoSwarm })
    }

    return (
        <div className="ai-execution-flow min-h-screen h-full flex flex-col flex-1 bg-black">
            {/* Optional: Add a form to send messages */}
            {!steps.length && (
                <div className="p-4">
                    <button
                        onClick={() => sendMessage("Provide a very detailed plan to acquire Lamborghini Company including the purchase price and all the details that can be funneled", "b4375d98-4794-479d-8a42-8d8d5da38e51", "large", false, ['226472ff-5a25-4449-be1c-ac84051657a7'], false)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Start AI Process
                    </button>
                </div>
            )}

            {/* Use the existing ExecutionTimeline component */}
            <ExecutionTimeline
                steps={steps}
                isComplete={isComplete}
                isLoading={loading}
                newStepIndex={steps.length > 0 ? steps.length - 1 : null}
            />

            {/* Improved Markdown Response Rendering */}
            <div className="font-semibold text-lg text-white w-screen">
                {markdownBuffer && (
                    <div className="final-response p-4 border border-gray-800 rounded-lg bg-gray-900 shadow-lg w-full items-center">
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            Final Response
                            {isStreaming && (
                                <span className="ml-2 inline-flex">
                                    <span className="h-2 w-2 bg-purple-600 rounded-full animate-pulse mx-0.5"></span>
                                    <span className="h-2 w-2 bg-purple-600 rounded-full animate-pulse mx-0.5" style={{ animationDelay: '0.2s' }}></span>
                                    <span className="h-2 w-2 bg-purple-600 rounded-full animate-pulse mx-0.5" style={{ animationDelay: '0.4s' }}></span>
                                </span>
                            )}
                        </h2>

                        <div className="text-stream flex  w-screen items-center justify-center">
                            <div className="prose prose-invert  max-w-3xl ">
                                <StreamingResponse content={markdownBuffer} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}