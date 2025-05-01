import ExtendedFeaturesNavBar from "@/components/custom/ExtendFeaturesNavBar"
import FeatureSections from "./components/FeatureSections"
import { userManualUrl } from "@/namespace/client"
import { validToShowMenuForKnowledge } from "./config"
import { m } from "framer-motion"

export const featuresData = [
  {
    section: "User Manual",
    isLargeCard: true,
    items: [
      {
        name: "Auto Agentic Simulation",
        description: "Generate Agents On The Go!",
        gradient: "from-blue-400 to-cyan-300",
        pageContent: `
  # GPT-4.1
  
  GPT-4.1 is our flagship language model, designed to excel at complex reasoning tasks and generate high-quality text across a wide range of domains.
  
  ## Key Features
  
  - Enhanced reasoning capabilities
  - Improved factual accuracy
  - Better context handling with 128k token context window
  - Reduced hallucinations
  - Faster inference speeds
  
  ## Use Cases
  
  GPT-4.1 is ideal for applications requiring deep understanding and complex reasoning, such as:
  
  - Research assistance
  - Content creation
  - Code generation and debugging
  - Complex problem-solving
  - Educational tutoring
  
  ## Technical Specifications
  
  - 1.8 trillion parameters
  - Trained on diverse datasets up to April 2023
  - Supports multiple modalities including text and code
  - Available through API and ChatGPT interface
          `,
      },
      {
        name: "Manual Agentic Simulation",
        description: "Multi Agent Chating With Your Own Agents!",
        gradient: "from-purple-400 to-blue-400",
        pageContent: `
  # o4-mini
  
  o4-mini is our compact yet powerful reasoning model, designed to provide excellent performance at a more affordable price point.
  
  ## Key Features
  
  - Optimized for efficiency
  - 90% of o4's capabilities at 30% of the cost
  - Low-latency responses
  - Excellent for production deployments
  
  ## Use Cases
  
  o4-mini is perfect for:
  
  - Customer support automation
  - Content moderation
  - Summarization tasks
  - Real-time applications
  - Mobile applications
  
  ## Technical Specifications
  
  - 220 billion parameters
  - 16k token context window
  - Optimized for deployment on standard hardware
  - Available through API with flexible pricing
          `,
      },
      {
        name: "Deep Thinking",
        description: "Agentic Thinking Before Answering!",
        gradient: "from-yellow-300 to-amber-200",
        pageContent: `
  # o3
  
  o3 is our most powerful reasoning model, designed for tasks requiring deep understanding and complex problem-solving.
  
  ## Key Features
  
  - State-of-the-art reasoning capabilities
  - Exceptional performance on benchmarks
  - Strong mathematical and logical reasoning
  - Nuanced understanding of context and implications
  
  ## Use Cases
  
  o3 excels at:
  
  - Scientific research assistance
  - Complex data analysis
  - Advanced problem-solving
  - Strategic planning
  - Educational applications requiring deep expertise
  
  ## Technical Specifications
  
  - 1.3 trillion parameters
  - 64k token context window
  - Trained on diverse datasets including scientific literature
  - Available through API with enterprise support options
          `,
      },
    ],
  },
  {
    section: "Chat Feature",
    subtitle: "Direct Chating With ARX",
    isLargeCard: false,
    items: [
      {
        name: "Quick",
        description: "Faster Answering Using ARX Knowledge",
        gradient: "from-orange-300 to-orange-500",
        pageContent:   `# Quick response — Web User Manual

> **Version:** v1.0 – generated 2024-06-07  
> **Context:** Part of the AI-powered Knowledge Graph & Retrieval-Augmented Generation (RAG) platform.

---

## 1 · Quick overview
The Quick response feature provides fast access to the Adaptive Regulatory Compliance 
Index (ARCS) system within the chat environment. It enables rapid extraction and retrieval 
of compliance knowledge to support follow-up questions efficiently.

## 2 · Key capabilities
- Enables fast first-time extraction of ARCS knowledge within about 30 seconds.  
- Provides quick responses of 3-4 seconds for all follow-up queries.  
- Supports ongoing conversations with clear intent for better context handling.  
- Helps users ask multiple follow-ups without delay, improving efficiency.  
- Includes a reconnect option to handle server disconnection issues gracefully.

## 3 · Access & prerequisites
| Requirement   | Details                               |
|---------------|-------------------------------------|
| Account role  | User role with chat and ARCS access |
| Browser       | Modern browsers (Chrome, Firefox, Edge) latest versions recommended |
| Network       | Stable internet connection; no special firewall or VPN rules required |
| Other         | Feature enabled in user settings; ARCS system access granted |

## 4 · Using the feature (step-by-step)
1. Navigate to the chat interface and locate the Quick response feature in the dropdown menu.  
![Quick response, image 2 : image that points on whee to select quick response feature](https://wohssewzaigezyoucrsu.supabase.co/storage/v1/object/public/usermanual//QR-dropdown.png)  

2. Start your conversation by entering your first message with a clear intent to load ARCS knowledge.  
![Quick Response, Image 1: image that points on quick response section](https://wohssewzaigezyoucrsu.supabase.co/storage/v1/object/public/usermanual//Screenshot%202025-03-29%20192215.png)  

3. Wait approximately 30 seconds while the system extracts all relevant ARCS knowledge in the background.  

4. For subsequent queries, enjoy faster responses around 3-4 seconds due to cached data.  

5. If a disconnection occurs, a reconnect button will appear—click it to restore the session promptly.

## 5 · How it works behind the scenes
The Quick response feature triggers the RAG pipeline by first performing a vector search 
of ARCS documents. It then uses Neo4j to retrieve a focused sub-graph of relevant compliance 
information. Finally, the system synthesizes answers to your queries, enabling quick follow-up 
responses.

## 6 · Best practices & tips
> ⚡ *Performance tip:* Start your chat session with a clearly defined intent to improve 
accuracy and context for follow-up questions.

## 7 · Limitations
- Initial query requires around 30 seconds to extract knowledge, causing a brief wait.  
- Disconnections may interrupt the session, requiring manual reconnection.  
- Response speed depends on system load and network conditions.

## 8 · Troubleshooting
| Symptom                                | Likely cause                 | Resolution                      |
|--------------------------------------|------------------------------|--------------------------------|
| Slow response on first query          | Initial knowledge extraction | Wait approx. 30 seconds         |
| Chat not responding after disconnection | Lost server connection       | Click the reconnect button      |

## 9 · FAQ
**Q:** Why does the first message take longer?  
**A:** The first message triggers extraction of the entire ARCS knowledge, which takes about 30 seconds.  

**Q:** How can I speed up follow-up responses?  
**A:** Following the initial extraction, subsequent queries respond in 3-4 seconds using cached knowledge.  

**Q:** What should I do if the connection drops?  
**A:** Click the reconnect button displayed to restore your chat session promptly.

## 10 · Release notes
*Initial release*

## 11 · Further resources
*N/A*`,
      },
      {
        name: "Deep Thinking",
        description: "Pre processed , Researched , Calculated And Chaing Of Thought Reasoning Chat",
        gradient: "from-yellow-300 to-amber-200",
        pageContent: `
  # o3
  
  o3 is our most powerful reasoning model, designed for tasks requiring deep understanding and complex problem-solving.
  
  ## Key Features
  
  - State-of-the-art reasoning capabilities
  - Exceptional performance on benchmarks
  - Strong mathematical and logical reasoning
  - Nuanced understanding of context and implications
  
  ## Use Cases
  
  o3 excels at:
  
  - Scientific research assistance
  - Complex data analysis
  - Advanced problem-solving
  - Strategic planning
  - Educational applications requiring deep expertise
  
  ## Technical Specifications
  
  - 1.3 trillion parameters
  - 64k token context window
  - Trained on diverse datasets including scientific literature
  - Available through API with enterprise support options
          `,
      },
     
    ],
  },
  {
    section:"Agentic Simulation",
    subtitle:"Multi Agent Chat With ARX Knowledge",
    isLargeCard:false,
    items:[
      {
        name: "Auto Agentic Automation",
        description: "Pre processed , Researched , Calculated And Chaing Of Thought Reasoning Chat",
        gradient: "from-blue-400 to-cyan-300",
        pageContent: `
  # o3
  
  o3 is our most powerful reasoning model, designed for tasks requiring deep understanding and complex problem-solving.
  
  ## Key Features
  
  - State-of-the-art reasoning capabilities
  - Exceptional performance on benchmarks
  - Strong mathematical and logical reasoning
  - Nuanced understanding of context and implications
  
  ## Use Cases
  
  o3 excels at:
  
  - Scientific research assistance
  - Complex data analysis
  - Advanced problem-solving
  - Strategic planning
  - Educational applications requiring deep expertise
  
  ## Technical Specifications
  
  - 1.3 trillion parameters
  - 64k token context window
  - Trained on diverse datasets including scientific literature
  - Available through API with enterprise support options
          `,
      },
      {
        name: "Manual Agentic Automation",
        description: "Pre processed , Researched , Calculated And Chaing Of Thought Reasoning Chat",
        gradient: "from-purple-400 to-blue-400",
        pageContent: `
  # o3
  
  o3 is our most powerful reasoning model, designed for tasks requiring deep understanding and complex problem-solving.
  
  ## Key Features
  
  - State-of-the-art reasoning capabilities
  - Exceptional performance on benchmarks
  - Strong mathematical and logical reasoning
  - Nuanced understanding of context and implications
  
  ## Use Cases
  
  o3 excels at:
  
  - Scientific research assistance
  - Complex data analysis
  - Advanced problem-solving
  - Strategic planning
  - Educational applications requiring deep expertise
  
  ## Technical Specifications
  
  - 1.3 trillion parameters
  - 64k token context window
  - Trained on diverse datasets including scientific literature
  - Available through API with enterprise support options
          `,
      }
    ]
  },
  {
    section:"Agentic Automation",
    subtitle:"Multi Agent Daily Automated Workflow Based Automation",
    isLargeCard:false,
    items:[
      {
        name: "Create Your First Automation",
        description: "How We Can Create New Agentic Automation",
        gradient: "from-gray-500 to-gray-700",
        pageContent: `
  # o3
  
  o3 is our most powerful reasoning model, designed for tasks requiring deep understanding and complex problem-solving.
  
  ## Key Features
  
  - State-of-the-art reasoning capabilities
  - Exceptional performance on benchmarks
  - Strong mathematical and logical reasoning
  - Nuanced understanding of context and implications
  
  ## Use Cases
  
  o3 excels at:
  
  - Scientific research assistance
  - Complex data analysis
  - Advanced problem-solving
  - Strategic planning
  - Educational applications requiring deep expertise
  
  ## Technical Specifications
  
  - 1.3 trillion parameters
  - 64k token context window
  - Trained on diverse datasets including scientific literature
  - Available through API with enterprise support options
          `,
      },
      {
        name: "How It Impacts",
        description: "How to Access, visualize , refine and filter your agentic automations",
        gradient: "from-red-400 to-red-800",
        pageContent: `
  # o3
  
  o3 is our most powerful reasoning model, designed for tasks requiring deep understanding and complex problem-solving.
  
  ## Key Features
  
  - State-of-the-art reasoning capabilities
  - Exceptional performance on benchmarks
  - Strong mathematical and logical reasoning
  - Nuanced understanding of context and implications
  
  ## Use Cases
  
  o3 excels at:
  
  - Scientific research assistance
  - Complex data analysis
  - Advanced problem-solving
  - Strategic planning
  - Educational applications requiring deep expertise
  
  ## Technical Specifications
  
  - 1.3 trillion parameters
  - 64k token context window
  - Trained on diverse datasets including scientific literature
  - Available through API with enterprise support options
          `,
      }
    ]
  },
  {
    section:"ARX Accessories",
    subtitle:"Orbital Features Of ARX Chat And Automation",
    isLargeCard:false,
    items:[
      {
        name: "Mic",
        description: " Voice To Text Prompting",
        gradient: "from-purple-300 to-purple-700",
        pageContent: `
  # o3
  
  o3 is our most powerful reasoning model, designed for tasks requiring deep understanding and complex problem-solving.
  
  ## Key Features
  
  - State-of-the-art reasoning capabilities
  - Exceptional performance on benchmarks
  - Strong mathematical and logical reasoning
  - Nuanced understanding of context and implications
  
  ## Use Cases
  
  o3 excels at:
  
  - Scientific research assistance
  - Complex data analysis
  - Advanced problem-solving
  - Strategic planning
  - Educational applications requiring deep expertise
  
  ## Technical Specifications
  
  - 1.3 trillion parameters
  - 64k token context window
  - Trained on diverse datasets including scientific literature
  - Available through API with enterprise support options
          `,
      },
      {
        name: "File Upload",
        description: "How We Can Upload Files To ARX And How It Works",
        gradient: "from-teal-400 to-teal-800",
        pageContent: `
  # o3
  
  o3 is our most powerful reasoning model, designed for tasks requiring deep understanding and complex problem-solving.
  
  ## Key Features
  
  - State-of-the-art reasoning capabilities
  - Exceptional performance on benchmarks
  - Strong mathematical and logical reasoning
  - Nuanced understanding of context and implications
  
  ## Use Cases
  
  o3 excels at:
  
  - Scientific research assistance
  - Complex data analysis
  - Advanced problem-solving
  - Strategic planning
  - Educational applications requiring deep expertise
  
  ## Technical Specifications
  
  - 1.3 trillion parameters
  - 64k token context window
  - Trained on diverse datasets including scientific literature
  - Available through API with enterprise support options
          `,
      },
      {
        name: "Mode Switching",
        description: "How To Switch The Chat Mode.",
        gradient: "from-purple-400 to-red-800",
        pageContent: `
  # o3
  
  o3 is our most powerful reasoning model, designed for tasks requiring deep understanding and complex problem-solving.
  
  ## Key Features
  
  - State-of-the-art reasoning capabilities
  - Exceptional performance on benchmarks
  - Strong mathematical and logical reasoning
  - Nuanced understanding of context and implications
  
  ## Use Cases
  
  o3 excels at:
  
  - Scientific research assistance
  - Complex data analysis
  - Advanced problem-solving
  - Strategic planning
  - Educational applications requiring deep expertise
  
  ## Technical Specifications
  
  - 1.3 trillion parameters
  - 64k token context window
  - Trained on diverse datasets including scientific literature
  - Available through API with enterprise support options
          `,
      },
    ]
  },
  {
    section:"ARX Voice Technology",
    subtitle:"Real Time Voice To Voice Conversation With ARX Knowledge",
    isLargeCard:false,
    items:[
      {
        name: "ARX Next Voice Agent",
        description: "Most Superior ,Fast And Fully Integrated Voice Agent with ARX",
        gradient: "from-rose-300 to-rose-700",
        pageContent: `
  # o3
  
  o3 is our most powerful reasoning model, designed for tasks requiring deep understanding and complex problem-solving.
  
  ## Key Features
  
  - State-of-the-art reasoning capabilities
  - Exceptional performance on benchmarks
  - Strong mathematical and logical reasoning
  - Nuanced understanding of context and implications
  
  ## Use Cases
  
  o3 excels at:
  
  - Scientific research assistance
  - Complex data analysis
  - Advanced problem-solving
  - Strategic planning
  - Educational applications requiring deep expertise
  
  ## Technical Specifications
  
  - 1.3 trillion parameters
  - 64k token context window
  - Trained on diverse datasets including scientific literature
  - Available through API with enterprise support options
          `,
      },
      {
        name: "ARX Purple Voice Agent",
        description: "Multi Model Voice Agent With ARX Knowledge",
        gradient: "from-lime-400 to-lime-800",
        pageContent: `
  # o3
  
  o3 is our most powerful reasoning model, designed for tasks requiring deep understanding and complex problem-solving.
  
  ## Key Features
  
  - State-of-the-art reasoning capabilities
  - Exceptional performance on benchmarks
  - Strong mathematical and logical reasoning
  - Nuanced understanding of context and implications
  
  ## Use Cases
  
  o3 excels at:
  
  - Scientific research assistance
  - Complex data analysis
  - Advanced problem-solving
  - Strategic planning
  - Educational applications requiring deep expertise
  
  ## Technical Specifications
  
  - 1.3 trillion parameters
  - 64k token context window
  - Trained on diverse datasets including scientific literature
  - Available through API with enterprise support options
          `,
      }
    ]
  },
]

export default function UserManualLayout() {
  return (
    <main className="min-h-screen  bg-black text-white p-6 md:p-12">
      <ExtendedFeaturesNavBar
        href={userManualUrl}
        label="Back To Oasis Dashboard"
        validToShowMenu={validToShowMenuForKnowledge}
      />


      <FeatureSections sections={featuresData} />


    </main>
  )
}
