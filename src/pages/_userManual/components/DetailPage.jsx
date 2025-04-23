"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import { ArrowLeft } from "lucide-react"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"

export default function DetailPage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get the item data from localStorage
    const storedItem = localStorage.getItem("selectedItem")
    if (storedItem) {
      setItem(JSON.parse(storedItem))
    }
    setLoading(false)
  }, [])

  const handleBack = () => {
    navigate(-1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-black text-white p-6 md:p-12">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Item not found</h1>
          <p>The requested item could not be found. Please go back and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header image with gradient */}
      <div className={`w-full h-64 md:h-80 bg-gradient-to-br ${item.gradient}`}>
        <div className="container mx-auto h-full flex items-center justify-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-white"
          >
            {item.name}
          </motion.h1>
        </div>
      </div>

      {/* Content area */}
      <div className="container mx-auto p-6 md:p-12">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </motion.button>

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="prose prose-invert prose-lg max-w-none"
          >
            <ReactMarkdown
              className="module"
              children={item.pageContent || "No content available."}
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                table: ({ children }) => (
                  <table
                    style={{
                      borderCollapse: "collapse",
                      width: "100%",
                      borderRadius: "8px",
                      overflow: "hidden",
                      color: "#e0e0e0",
                      margin: "1rem 0"
                    }}
                  >
                    {children}
                  </table>
                ),
                th: ({ children }) => (
                  <th
                    style={{
                      border: "1px solid #444",
                      padding: "8px",
                      backgroundColor: "transparent",
                      textAlign: "left"
                    }}
                  >
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td
                    style={{
                      border: "1px solid #444",
                      padding: "8px",
                      backgroundColor: "#222",
                      color: "#e0e0e0"
                    }}
                  >
                    {children}
                  </td>
                )
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
