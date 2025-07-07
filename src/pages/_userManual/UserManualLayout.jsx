import ExtendedFeaturesNavBar from "@/components/custom/ExtendFeaturesNavBar";
import FeatureSections from "./components/FeatureSections";
import { userManualUrl } from "@/namespace/client";
import { validToShowMenuForKnowledge } from "./config";
import { m } from "framer-motion";

export const featuresData = [
  /* -------------------------------------------------
   * 1. CORE USER MANUAL – MAJOR MODES & AGENTS
   * -------------------------------------------------*/
  {
    section: "User Manual",
    isLargeCard: true,
    items: [
      /* ---------- 1-B. Agentic Simulation ----------*/
      {
        name: "Agentic Simulation",
        description: "Generate Agents On The Go!",
        gradient: "from-blue-400 to-cyan-300",
        pageContent: `
# Auto Agentic Simulation

Creates a **bespoke swarm of AI agents**—each pursuing a sub-goal derived from your prompt—and coordinates them through our *interaction planning & cycling module*.

## How It Works
1. **Prompt Analysis** → sub-goals + agent roster.  
2. **Iterative Interaction Cycles** – agents debate, gather evidence, and refine reasoning in parallel.  
3. **Synthesis Agent** – merges outputs into a polished final response.

## Key Features
- **Agentic Citations** – every sentence is tagged with the agent that produced it.  
- **Cross-agent memory sharing** – avoids duplicate work and contradictions.  
- Handles up to **32 parallel agents** in a single run.

## When to Use
- Exploratory research requiring multiple perspectives.  
- Large strategy questions (business, legal, scientific).`,
      },

      /* ---------- 1-C. Deep Thinking ----------*/
      {
        name: "Deep Thinking",
        description: "Agentic reasoning before answering.",
        gradient: "from-yellow-300 to-amber-200",
        pageContent: `
# Deep Thinking

A **single, heavyweight reasoning agent** that quietly plans before speaking.

## Context Awareness
- **Chat memory** – recognises past dialogue.  
- **File data** – embeds your uploaded docs.  
- **Internet search** – live look-ups for missing facts.  
- **Attached workflow** – follows or extends predefined flows.  
- **Knowledge blocks** – injects domain-specific frameworks.

## Workflow
1. Draft hidden scratchpad.  
2. Verify facts via search / vector stores.  
3. Produce answer only after internal validation.  

Use it when accuracy beats speed.`,
      },

      /* ---------- 1-D. One Shot (Fastest) ----------*/
      {
        name: "One Shot (Fastest)",
        description: "Ultra-speed agent with broad tool access.",
        gradient: "from-orange-300 to-orange-500",
        pageContent: `
# One Shot Response

Delivers near-instant outputs by **skipping iterative deliberation**.

## Capabilities
- File & image search  
- Knowledge-block lookup  
- Workflow execution  
- Rapid job creation:  
  - Automation  
  - Web-scraper  
  - OSINT (admin)

Ideal for time-sensitive or high-volume tasks.`,
      },
    ],
  },

  /* -------------------------------------------------
   * 2. ACTIONS & DATA-CENTRIC TOOLS
   * -------------------------------------------------*/
  {
    section: "Actions",
    subtitle: "Things You Can Build or Launch",
    isLargeCard: false,
    items: [
      /* ---------- 2-A. First Automation ----------*/
      {
        name: "Create Your First Automation",
        description: "Spin up a recurring task in minutes.",
        gradient: "from-gray-500 to-gray-700",
        pageContent: `
# Create Your First Automation

1. Switch to **Quick Response**.  
2. Describe a daily chore (“Summarise these PDFs every morning”).  
3. Answer follow-up questions.  
4. ARx schedules a daily job (viewable under **Automation**).  

*Daily email digests rolling out soon.*`,
      },

      /* ---------- 2-B. Multi Vector Store Creator ----------*/
      {
        name: "Multi Vector Store Creator",
        description: "Bring your own embeddings—at scale.",
        gradient: "from-emerald-400 to-emerald-800",
        pageContent: `
# Multi Vector Store Creator

Upload documents and spin up **isolated vector databases** per project or client.

## Highlights
- upload files or scrape websites.
- Automatic metadata extraction (title, author, date).  
- Configure namespace, distance metric, chunk size.  
- you just upload file and attach that as knowledge block in chat thread to use that vector store.

Perfect for agencies hosting models for multiple customers.`,
      },

      /* ---------- 2-C. Chat → Workflow ----------*/
      {
        name: "Chat Thread → Workflow",
        description: "Convert discussions into executable flows.",
        gradient: "from-indigo-400 to-violet-700",
        pageContent: `
# Chat Thread to Workflow Creator

Turns a brainstormed chat into a **LangGraph / Airflow-style DAG**.

1. Select *Convert to Workflow* from the thread menu.  
2. ARx detects intents → nodes → edges.  
3. Review and tweak in the workflow by entering the prompt(optional)

# how to create
1. click on options button in chat session
2. go to "chat to workflow" option
3. enter prompt if needed and click on "create workflow"
4. ARx generates a workflow with nodes for each intent.
5. you can activate that workflow in any chat thread.

adds reusability and interagotion 
`,
      },

      /* ---------- 2-D. Prompt Templates ----------*/
      {
        name: "Prompt Templates",
        description: "Reusable prompt blueprints with variables.",
        gradient: "from-fuchsia-400 to-rose-500",
        pageContent: `
# Prompt Templates

Save time by parameterising frequent prompts.

## Features

- use the large number of pre build ARX optimized prompt templates
- select the prompt from template hub, and enter the variables
- click start , that's it.
`,
      },
    ],
  },

  /* -------------------------------------------------
   * 3. ACCESSORIES & INPUT MODES
   * -------------------------------------------------*/
  {
    section: "ARX Accessories",
    subtitle: "Orbital Features around Chat & Automation",
    isLargeCard: false,
    items: [
      /* ---------- 3-A. File Upload ----------*/
      {
        name: "File Upload",
        description: "Drag-and-drop documents into context.",
        gradient: "from-teal-400 to-teal-800",
        pageContent: `
# File Upload

Supported formats: **PDF, DOCX, TXT, CSV, PDB, JSON**.

## Pipeline
1. Client-side chunking (to respect browser memory).  
2. Secure multipart upload
3. Auto-vectorised & added to your chosen vector store.  
4. Available to all agents in the session.

`,
      },

      /* ---------- 3-B. Voice-to-Prompt Mic ----------*/
      {
        name: "Mic (Voice to Prompt)",
        description: "Talk instead of typing.",
        gradient: "from-purple-300 to-purple-700",
        pageContent: `
# Voice to Prompt Mic

Uses **WebRTC + VAD** for real-time detection.

## Flow
1. Click mic icon → grant microphone permission.  
2. Speech is streamed to voice to text agent to generate prompt
3. Language auto-detect; punctuation restored.

Ideal for mobile users or hands-free workflows.`,
      },

      /* ---------- 3-C. Mode Switching ----------*/
      {
        name: "Mode Switching",
        description: "Jump between Normal, Deep, Agentic.",
        gradient: "from-purple-400 to-red-800",
        pageContent: `
# Mode Switching

Find the **mode toggle** next to the send button.

- **Quick Response** – fastest single agent.  
- **Deep Thinking** – deliberative single agent.  
- **Agentic Simulation** – multi-agent swarm.

Switching keeps thread context intact.`,
      },
    ],
  },

  /* -------------------------------------------------
   * 4. VOICE TECHNOLOGY
   * -------------------------------------------------*/
  {
    section: "ARX Voice Technology",
    subtitle: "Real-time Voice-to-Voice Conversation",
    isLargeCard: false,
    items: [
      {
        name: "ARX Voice Agent",
        description: "Multi-model voice mixing.",
        gradient: "from-lime-400 to-lime-800",
        pageContent: `
# ARX Voice Agent

select the waves icon that appears in chat box
- it starts the voice agent
- it can
1. read files
2. remember your normal chat
3. check internet
4. create visualizations.


`,
      },
    ],
  },

  /* -------------------------------------------------
   * 5. ADVANCED RESEARCH TOOLS
   * -------------------------------------------------*/
  {
    section: "Research & Retrieval",
    subtitle: "Dig Deeper with Expert Modules",
    isLargeCard: false,
    items: [
      {
        name: "Deep Research",
        description: "Multi-step evidence gathering with citations.",
        gradient: "from-cyan-400 to-blue-800",
        pageContent: `
# Deep Research

Combines **internet search**, **vector DB look-ups**, and **academic APIs**.

- Generates a research plan  
- Executes parallel queries  
- Returns a structured report with inline citations ([1], [2]).

Use the *Generate Research* button in any thread.`,
      },
      {
        name: "Internet Search",
        description: "Live web results with auto-citing.",
        gradient: "from-sky-400 to-sky-700",
        pageContent: `
# Internet Search


- Top-K results summarised.  
- Direct quotes are footnoted.  
- Click a citation to open source in new tab.

Great for fact-checking.`,
      },
      {
        name: "Web Vector Store Scraper",
        description: "Crawl, chunk & embed web pages.",
        gradient: "from-amber-400 to-amber-700",
        pageContent: `
# Web Vector Store Scraper

1. Enter a domain or sitemap.  
2. Choose depth & rate-limit.  
3. Pages are scraped → markdown → embeddings into your chosen vector DB.

Built-in deduplication & robots.txt respect.`,
      },
      {
        name: "Alphafold Predictions",
        description: "Retrieve protein structures on demand.",
        gradient: "from-green-300 to-green-600",
        pageContent: `
# Alphafold Predictions Retriever

Enter a **UniProt ID** or FASTA sequence → get predicted 3-D structure.

- Renders PDB with $3Dmol or Mol* (switchable).  
- Provides confidence scores & per-residue pLDDT.  
- Export PDB or PNG directly.`,
      },
    ],
  },

  /* -------------------------------------------------
   * 6. VISUALISATION & OUTPUT TOOLS
   * -------------------------------------------------*/
  {
    section: "Visualisation Creator",
    subtitle: "Turn Data into Charts",
    isLargeCard: false,
    items: [
      {
        name: "Chart Builder",
        description: "Pie, Line, Area, Bar in one click.",
        gradient: "from-orange-400 to-pink-600",
        pageContent: `
# Visualisation Creator

Upload CSV/JSON or reference a dataframe in chat.

1. Pick chart type (Pie, Line, Area, Bar).  
2. Map columns → axes.  
3. ARx generates an interactive chart (Recharts).  
4. Download as PNG or embed code.

Great for quick dashboards.`,
      },
    ],
  },

  /* -------------------------------------------------
   * 7. RESPONSE UTILITIES
   * -------------------------------------------------*/
  {
    section: "Response Utilities",
    subtitle: "Every Answer, Supercharged",
    isLargeCard: false,
    items: [
      {
        name: "Copy / Download / TTS",
        description: "Tools under every message bubble.",
        gradient: "from-stone-400 to-stone-700",
        pageContent: `
# Response Utilities

Below each response you’ll find three icons:

- **📋 Copy** – copies raw Markdown to clipboard.  
- **⬇️ Download** – saves content as \`response.md\`.  
- **🔊 Text-to-Speech** – streams audio via Nova TTS.

All actions are instantaneous and don’t affect thread history.`,
      },
    ],
  },

  /* -------------------------------------------------
   * 8. CHAT MANAGEMENT
   * -------------------------------------------------*/
  {
    section: "Chat Management",
    subtitle: "Keep Your Workspace Organised",
    isLargeCard: false,
    items: [
      {
        name: "Delete Thread",
        description: "Remove conversations permanently.",
        gradient: "from-red-400 to-red-700",
        pageContent: `
# Delete Chat Thread

1. Open the **⋮** menu beside the thread name.  
2. Click **Delete** → confirm.  
3. Vector references and attachments are purged within 30 minutes.`,
      },
      {
        name: "Rename Thread",
        description: "Give conversations meaningful titles.",
        gradient: "from-blue-300 to-blue-600",
        pageContent: `
# Rename Chat Thread

- Click the thread title (or the pencil icon).  
- Type the new name → press ⏎.  
- Title syncs across devices instantly.`,
      },
    ],
  },
];

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
);
}
