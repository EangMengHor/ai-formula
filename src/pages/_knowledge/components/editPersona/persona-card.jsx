"use client"

import { useState } from "react"
import { Atom } from 'lucide-react'
import { motion } from "framer-motion"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

const descriptionLength = 120

export default function PersonaCard({ persona }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full max-w-2xl mx-auto"
        >
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="space-y-4">
                    <div className=" bg-blue-500/10 p-3 rounded-full text-left w-fit">
                        <Atom className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl text-slate-50 text-left">
                            {persona.name}
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-left">
                            {expanded
                                ? persona.description
                                : persona.description.substring(0, descriptionLength)}
                            {persona.description.length > descriptionLength && (
                                <Button
                                    variant="link"
                                    className="px-1.5 h-auto text-blue-400"
                                    onClick={() => setExpanded(!expanded)}
                                >
                                    {expanded ? "Read Less" : "Read More"}
                                </Button>
                            )}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="task">
                            <AccordionTrigger className="text-slate-200 hover:text-slate-50">
                                Task
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="text-sm text-slate-400">
                                    {persona.task}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="knowledge">
                            <AccordionTrigger className="text-slate-200 hover:text-slate-50">
                                Knowledge Base Items
                            </AccordionTrigger>
                            <AccordionContent>
                                <ScrollArea className="h-[300px] pr-4">
                                    {
                                        persona.knowledgeBaseSearch.length > 4 && <div className="text-sm text-slate-400 px-2 py-1 bg-slate-600 m-2 rounded-md">
                                            Scroll For More
                                        </div>
                                    }
                                    <ul className="space-y-2 text-sm text-slate-400">
                                        {persona.knowledgeBaseSearch.map((item, index) => (
                                            <li key={index} className="pl-4 border-l-2 border-slate-800">
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </ScrollArea>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="outputFormat">
                            <AccordionTrigger className="text-slate-200 hover:text-slate-50">
                                Output Format
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="text-sm text-slate-400">
                                    {persona.outputFormat}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="sourceLinks">
                            <AccordionTrigger className="text-slate-200 hover:text-slate-50">
                                Source Links
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="text-sm text-slate-400">
                                    {persona.sourceLinks.trim() === "" ? "No External Source Links Provided" : persona.sourceLinks}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="externalAccess">
                            <AccordionTrigger className="text-slate-200 hover:text-slate-50">
                                External Url Access
                            </AccordionTrigger>
                            <AccordionContent>
                                <Badge variant={persona.isExternalAllowed ? "success" : "destructive"}>
                                    {persona.isExternalAllowed ? "Allowed" : "Not Allowed"}
                                </Badge>
                            </AccordionContent>
                        </AccordionItem>

                    </Accordion>
                </CardContent>
            </Card>
        </motion.div>
    )
}
