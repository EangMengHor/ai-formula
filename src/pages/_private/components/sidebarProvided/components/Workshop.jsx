
import { useState } from "react"
import { Search, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
export default function Workshop() {
    const [searchQuery, setSearchQuery] = useState("")

    const navCards = [
        {
            id: 1,
            to: "/knowledge",
            title: "Knowledge Base & Persona",
            description: "Create superior personas and knowledge base with chatting functionality",
        },
        {
            id: 2,
            to: "/agenticAutomation",
            title: "Superior persona Automation",
            description: "Create Automations for superior persona",
        },
        {
            id: 3,
            to: "/oasis",
            title: "Oasis - Social Media Simulation",
            description: "Create and simulate social media posts and analyze the social media environment",
        },
        {
            id: 4,
            to: "/addToPermenentKnowledgeBase",
            title: "Add to Permenent Knowledge Base",
            description: "Add New Document to the permenent knowledge base",
        },
    ]

    const filteredCards = navCards.filter(
        (card) =>
            card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            card.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    }

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 },
    }



    return (
        <main className="min-h-screen bg-black text-white">
            <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center justify-center mb-16"
                >
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">ARX Workshop</h1>
                    <h2 className="text-2xl font-light text-center mb-10 text-gray-400">Utilize Comprehensive ARX Tools ?</h2>

                    <div className="relative w-full max-w-xl mb-8">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-500" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Search capabilities..."
                            className="pl-12 py-6 bg-gray-900 border-gray-800 rounded-lg text-white w-full focus:ring-gray-700 focus:border-gray-700 transition-all duration-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {filteredCards.map((card) => {
                        return (
                            <motion.div key={card.id} variants={item}>
                                <Link to={card.to} className="block h-full">
                                    <div className="h-full rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden group">
                                        <div className="p-6">
                                            <h3 className="text-lg font-medium text-white mb-3">{card.title}</h3>
                                            <p className="text-gray-400 mb-6 text-sm">{card.description}</p>

                                            <div className="flex items-center text-gray-300 text-sm font-medium">
                                                <span>Explore</span>
                                                <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        )
                    })}
                </motion.div>

                {filteredCards.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                        <h3 className="text-xl font-medium mb-2 text-white">No results found</h3>
                        <p className="text-gray-400">Try a different search term</p>
                    </motion.div>
                )}
            </div>
        </main>
    )
}