import { useEffect, useRef, useState } from "react";
import VADVisualization from "./VADVisualization";
import { useParams } from "react-router-dom";
import { voiceToVoiceStoreMessageBatch } from "@/services/voice/voiceToVoiceStoreMessageBatch";
import { playSound } from "@/lib/utils";
import { CircleStop, Mic, MicOff } from "lucide-react";
import getTools from "./tools";
import { getSessionContext } from "@/services/voice/getSessionContext";
import { vectorStoreContext } from "@/services/voice/vectorStoreContext";
import { searchInternet } from "@/services/voice/searchInternet";
import { readFileContext } from "@/services/voice/readFileContext";
import { useToast } from "@/hooks/use-toast";
import { createVisualization } from "@/services/voice/createVisualization";
export default function VoiceInputBlock({
  setIsVoiceMode = () => {},
  setConversation = () => {},
}) {
  const { id } = useParams();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [userAudioStream, setUserAudioStream] = useState(null);
  const [remoteAudioStream, setRemoteAudioStream] = useState(null);
  //   const [transcripts, setTranscripts] = useState([]);
  const { toast } = useToast();
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const greetingDone = useRef(false);
  const isContextFeeded = useRef(false);
  const isToolsInitialized = useRef(false);
  const fileDataNamespace = useRef(null);
  const isMaxTokenIncreased = useRef(false);
  const [waitingMessage, setWaitingMessage] = useState(
    "Waiting for AI response...",
  );
  const pendingQueue = useRef([]);

  //   async function initOnOpen() {
  //     if (
  //       greetingDone.current &&
  //       isContextFeeded.current &&
  //       isToolsInitialized.current &&
  //       isMaxTokenIncreased.current &&
  //       !dataChannel &&
  //       !dataChannel.readyState === "open"
  //     ) {
  //       console.log(
  //         "Session already initialized, skipping greeting and context feed.",
  //       );
  //       return;
  //     }

  //     // 1️⃣ Greeting
  //     if (!greetingDone.current) {
  //       greetingDone.current = true;
  //       sendClientEvent({
  //         type: "conversation.item.create",
  //         item: {
  //           type: "message",
  //           role: "system",
  //           content: [
  //             {
  //               type: "input_text",
  //               text: "I am ARX agent, ready to operate. Please start speaking.",
  //             },
  //           ],
  //         },
  //       });
  //       sendClientEvent({
  //         type: "response.create",
  //         response: { instructions: "" },
  //       });
  //       playSound("/vtv.mp3");
  //     }

  //     // 2️⃣ Chat/file memory
  //     if (!isContextFeeded.current) {
  //       isContextFeeded.current = true;
  //       const data = await getSessionContext(id);
  //       fileDataNamespace.current = data.fileDataNamespace;
  //       const memoryText = [
  //         `Chat Memory:\n${JSON.stringify(data.chatContext, null, 2)}`,
  //         data.isFileData
  //           ? `File Data: ${Array.isArray(data.fileNames) ? data.fileNames.join(", ") : data.fileNames}`
  //           : "",
  //         `Knowledge Graph:\n${data.knowledgeGraph || "N/A"}`,
  //       ]
  //         .filter(Boolean)
  //         .join("\n\n");
  //       sendClientEvent({
  //         type: "conversation.item.create",
  //         item: {
  //           type: "message",
  //           role: "system",
  //           content: [{ type: "input_text", ext: memoryText }],
  //         },
  //       });
  //       sendClientEvent({
  //         type: "response.create",
  //         response: { instructions: "" },
  //       });
  //     }

  //     // 3️⃣ Initialize tools
  //     if (!isToolsInitialized.current) {
  //       isToolsInitialized.current = true;
  //       sendClientEvent(getTools(!!fileDataNamespace.current));
  //     }

  //     // 4️⃣ Increase tokens
  //     if (!isMaxTokenIncreased.current) {
  //       isMaxTokenIncreased.current = true;
  //       sendClientEvent({
  //         type: "session.update",
  //         session: { max_response_output_tokens: "inf" },
  //       });
  //     }
  //   }

  async function startSession() {
    try {
      // clear context
      greetingDone.current = false;
      isContextFeeded.current = false;
      isToolsInitialized.current = false;
      isMaxTokenIncreased.current = false;
      fileDataNamespace.current = null;

      setIsVoiceMode(true);
      setWaitingMessage("Connecting to AI...");
      const tokenResponse = await fetch(
        `${import.meta.env.VITE_SOCKET_URL}/api/voiceToVoice/realtime/session`,
      );
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      const pc = new RTCPeerConnection();

      audioElement.current = document.createElement("audio");
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => {
        audioElement.current.srcObject = e.streams[0];
        setRemoteAudioStream(e.streams[0]);
      };

      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!ms.getAudioTracks().length) {
        throw new Error(
          "No microphone tracks available—please check mic permissions.",
        );
      }
      setUserAudioStream(ms);
      pc.addTrack(ms.getTracks()[0]);
      // Store the track for mute/unmute
      window.__voiceInputMicTrack = ms.getTracks()[0];

      const dc = pc.createDataChannel("oai-events");
      // initialize only once channel is open
      dc.onopen = () => {
        console.log("🔗 DataChannel is open");
        setIsSessionActive(true);
        setEvents([]);
        setWaitingMessage("Ready to chat!");
        // Flush any queued messages immediately:
        pendingQueue.current.forEach((message) => {
          console.debug("→ Resending queued message:", message);
          sendClientEvent(message);
        });
        pendingQueue.current = [];
        // Now send your greeting, context, tools, etc.
        // initOnOpen(dc);
      };
      dc.onerror = (e) => {
        console.error("DataChannel error:", e);
        toast({
          title: "DataChannel Error",
          description: "Failed to establish data channel connection.",
          variant: "destructive",
        });
        // maybe show a toast or retry logic
      };
      dc.onclose = () => {
        console.warn("DataChannel closed");
        setIsSessionActive(false);
        toast({
          title: "DataChannel Closed",
          description: "The connection to the AI has been closed.",
        });
        // optionally try to re-negotiate or prompt the user
      };
      setDataChannel(dc);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 🔌 Wait for ICE gathering to finish, so our SDP has all candidates
      await new Promise((resolve) => {
        if (pc.iceGatheringState === "complete") return resolve();
        pc.onicecandidate = (evt) => {
          // when candidate === null, ICE gathering is complete
          console.log("ICE candidate:", evt.candidate);
          if (!evt.candidate) resolve();
        };
      });

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2025-06-03";
      // attempt SDP exchange up to 3× with exponential backoff
      let rawSdp,
        attempt = 0;
      while (attempt < 3) {
        try {
          const res = await fetch(
            `${baseUrl}?model=${model}&max_response_output_tokens=4000`,
            {
              method: "POST",
              body: offer.sdp,
              headers: {
                Authorization: `Bearer ${EPHEMERAL_KEY}`,
                "Content-Type": "application/sdp",
              },
            },
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          rawSdp = await res.text();
          break;
        } catch (err) {
          attempt++;
          console.warn(`SDP exchange failed (attempt ${attempt}):`, err);
          if (attempt === 3) throw err;
          await new Promise((r) => setTimeout(r, 500 * attempt));
        }
      }
      const answer = { type: "answer", sdp: rawSdp };

      // 🛡️ Validate SDP 
      if (!rawSdp.startsWith("v=0")) {
        throw new Error("Invalid SDP from server");
      }
      try {
        await pc.setRemoteDescription(answer);
      } catch (err) {
        console.error("setRemoteDescription failed:", err);
        throw err;
      }

      let _retrying = false;
      pc.oniceconnectionstatechange = () => {
        console.log("ICE state:", pc.iceConnectionState);
        if (
          !_retrying &&
          ["failed", "disconnected"].includes(pc.iceConnectionState)
        ) {
          _retrying = true;
          setWaitingMessage("Connection lost, retrying...");
          setTimeout(() => {
            stopSession(); 
            // startSession();
            setIsSessionActive(false);
            setWaitingMessage("Reconnecting...");
            console.warn("Retrying ICE connection...");

            _retrying = false;
          }, 1000);
        }
      };
      pc.onconnectionstatechange = () => {
        console.log("Peer connection state:", pc.connectionState);
      };

      peerConnection.current = pc;

      console.log("Session started successfully");
    } catch (error) {
      setWaitingMessage("Failed to start session. Please try again.");
    }
  }

  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }
    if (userAudioStream) {
      userAudioStream.getTracks().forEach((track) => track.stop());
      setUserAudioStream(null);
    }
    if (remoteAudioStream) {
      setRemoteAudioStream(null);
    }
    peerConnection.current?.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
    setIsVoiceMode(false);
    setIsMicMuted(false);
    window.__voiceInputMicTrack = null;
    playSound("/vtv.mp3");
    // clear context
    greetingDone.current = false;
    isContextFeeded.current = false;
    isToolsInitialized.current = false;
    isMaxTokenIncreased.current = false;
    fileDataNamespace.current = null;
    setEvents([]);
  }

  // Mute/unmute mic handler
  function toggleMicMute() {
    if (userAudioStream && userAudioStream.getAudioTracks().length > 0) {
      const track = userAudioStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMicMuted(!track.enabled ? true : false);
      }
    }
  }
  useEffect(() => {
    // If pendingQueue changes, process any queued messages
    if (pendingQueue.current.length > 0) {
      console.warn("Processing pending messages:", pendingQueue.current);
      while (pendingQueue.current.length > 0) {
        const message = pendingQueue.current.shift();
        console.debug("→ Resending queued message:", message);
        sendClientEvent(message);
      }
    }
  }, [pendingQueue.current]);

  function sendClientEvent(message) {
    if (!dataChannel) {
      console.warn(
        "DataChannel not ready, queuing message:",
        message,
        pendingQueue,
      );
      pendingQueue.current.push(message);
      return;
    }
    // log every event for diagnostics:
    console.debug("→ sendClientEvent:", message);
    const timestamp = new Date().toLocaleTimeString();
    message.event_id = message.event_id || crypto.randomUUID();
    dataChannel.send(JSON.stringify(message));
    if (!message.timestamp) {
      message.timestamp = timestamp;
    }
    setEvents((prev) => [message, ...prev]);
  }

  // Global refs for batching (must be declared in st st)
  const messagePointerRef = useRef(0);
  const batchedMessagesRef = useRef([]);
  const pendingHumanTranscriptRef = useRef(null);

  function addLoadingConversation(data) {
    setConversation((prev) => {
      const updated = [...prev];
      // Add a temporary message to show the search is happening
      updated.push({
        role: "ai",
        type: "quick",
        isLoading: true,
        isComplete: false,
        message: [
          {
            type: "text",
            content: data + "\n",
            isComplete: false,
          },
        ],
        cot: "",
        citations: [],
        agenticCitations: [],
      });
      return updated;
    });
  }
  async function processTranscript(event) {
    const now = new Date().toISOString();
    // Handle function call tools (generic for multiple tools)
    // Match OpenAI function call output pattern (like ToolPanel.jsx)
    if (
      event.type === "response.done" &&
      event.response &&
      Array.isArray(event.response.output)
    ) {
      event.response.output.forEach(async (output) => {
        if (output.type === "function_call") {
          let payload;
          let errorMessage = null;
          try {
            switch (output.name) {
              case "get_ARX_knowledge_graph_knowledge": {
                const { frameworkName } = JSON.parse(output.arguments);
                addLoadingConversation(
                  `Fetching knowledge for ${frameworkName}...`,
                );
                const data = await vectorStoreContext(frameworkName);
                payload = JSON.stringify(data, null, 2);
                break;
              }
              case "search_internet": {
                const { query } = JSON.parse(output.arguments);
                addLoadingConversation(`Searching internet for "${query}"...`);
                const results = await searchInternet(query);
                payload = JSON.stringify(results, null, 2);
                break;
              }
              case "read_file_context": {
                const { query } = JSON.parse(output.arguments);
                addLoadingConversation(`Searching file data for "${query}"...`);
                const fileData = await readFileContext(
                  query,
                  fileDataNamespace.current,
                );
                payload = JSON.stringify(fileData, null, 2);
                break;
              }
              case "create_visualization":
                {
                  const { chartType, prompt } = JSON.parse(output.arguments);
                  addLoadingConversation(
                    `Creating ${chartType} chart for ${prompt}...`,
                  );

                  const chart = await createVisualization(prompt, chartType);

                  if (chart.success) {
                    payload = JSON.stringify({
                      chart: chart.visualizationData || "error",
                      howToShow: `render the whole <dataChart> tag in your response without that element in your response it will now be render , properly show the whole tag ex. <dataChart>\n<chartType>type</chartType>\n<dataId>number</dataId>\n<dataName>name</dataName>\n<dataLabel>label</dataLabel>\n</dataChart>`,
                    });
                    console.warn(payload, "visualization payload");
                  }
                }
                break;
              default: {
                errorMessage = `Unknown function call: ${output.name}`;
                payload = JSON.stringify({ error: errorMessage });
              }
            }
          } catch (err) {
            errorMessage = `Tool call failed: ${output.name} - ${err?.message || err} try again to call the same tool or check the arguments you passed and it will work .`;
            payload = JSON.stringify({ error: errorMessage });
          }
          console.log(
            {
              type: "function_call_output",
              call_id: output.call_id,
              output: payload,
            },
            "visual 129730",
          );
          // Send the tool-output (success or error):
          sendClientEvent({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: output.call_id,
              output: payload,
            },
          });

          // If error, also send a message to the AI so it can respond to the user
          if (errorMessage) {
            sendClientEvent({
              type: "conversation.item.create",
              item: {
                type: "message",
                role: "system",
                content: [
                  {
                    type: "input_text",
                    text: `Tool call failed for ${output.name}: ${errorMessage}`,
                  },
                ],
              },
            });
          }

          // Once acknowledged, nudge the model to continue:
          const onAck = (e) => {
            const evt = JSON.parse(e.data);
            if (
              evt.type === "conversation.item.created" &&
              evt.item.type === "function_call_output" &&
              evt.item.call_id === output.call_id
            ) {
              sendClientEvent({ type: "response.create" });
              dataChannel.removeEventListener("message", onAck);
            }
          };
          dataChannel.addEventListener("message", onAck, { once: true });
        }
      });
    }
    setConversation((prev) => {
      const updated = [...prev];
      let newMessage = null;

      // 🔄 Merge all consecutive human messages at end
      const mergeConsecutiveHumans = () => {
        let i = updated.length - 1;
        const merged = [];

        // Scan backwards to collect consecutive human messages
        while (i >= 0 && updated[i].role === "human") {
          merged.unshift(updated[i].message); // store message string
          i--;
        }

        if (merged.length > 1) {
          // Remove those human messages
          updated.splice(i + 1, merged.length);

          // Push a single merged human message
          updated.push({
            role: "human",
            message: merged.join(" ").trim(),
            createdAt: now,
            cot: "",
            citations: [],
            agenticCitations: [],
          });
        }
      };

      // 🧠 Insert human if pending
      const insertPendingHumanIfNeeded = () => {
        if (pendingHumanTranscriptRef.current) {
          updated.push(pendingHumanTranscriptRef.current);
          batchedMessagesRef.current.push(pendingHumanTranscriptRef.current);
          pendingHumanTranscriptRef.current = null;
        }
      };

      // 🧽 Remove all incomplete AI before inserting final one
      const removeIncompleteAIs = () => {
        while (
          updated.length &&
          updated[updated.length - 1]?.role === "ai" &&
          !updated[updated.length - 1]?.isComplete
        ) {
          updated.pop();
        }
      };

      // 🗣️ Handle user audio transcript
      if (
        event.type === "conversation.item.input_audio_transcription.completed"
      ) {
        pendingHumanTranscriptRef.current = {
          role: "human",
          message: event.transcript,
          createdAt: now,
          cot: "",
          citations: [],
          agenticCitations: [],
        };

        insertPendingHumanIfNeeded();
      }

      // 🔁 AI delta (streaming)
      if (event.type === "response.audio_transcript.delta") {
        insertPendingHumanIfNeeded();
        mergeConsecutiveHumans(); // merge before AI response

        const lastAI = updated[updated.length - 1];
        if (lastAI && lastAI.role === "ai" && !lastAI.isComplete) {
          if (
            Array.isArray(lastAI.message) &&
            typeof lastAI.message[0]?.content === "string"
          ) {
            lastAI.message[0].content += event.delta;
          }
        } else {
          newMessage = {
            role: "ai",
            type: "quick",
            isLoading: true,
            isComplete: false,
            message: [
              {
                type: "text",
                content: event.delta,
                isComplete: false,
              },
            ],
            cot: "",
            citations: [],
            agenticCitations: [],
            tempAI: true,
          };
          updated.push(newMessage);
        }
      }

      // ✅ AI final transcript
      if (event.type === "response.audio_transcript.done") {
        insertPendingHumanIfNeeded();
        mergeConsecutiveHumans(); // merge before AI response
        removeIncompleteAIs();

        const incoming = event.transcript?.trim() || "";

        const processStreamingContent = (input, forceComplete = false) => {
          if (!input) return [];

          /** helper to push a text block if non-empty */
          const pushText = (arr, txt) => {
            const t = txt.trim();
            if (t) arr.push({ type: "text", content: t, isComplete: true });
          };

          // --- 1. Extract balanced <document> blocks ---
          const documentBlocks = [];
          const docRegex = /<document>/gi;
          let match;
          while ((match = docRegex.exec(input)) !== null) {
            const start = match.index;
            let depth = 1;
            let pos = start + match[0].length;
            while (depth > 0 && pos < input.length) {
              const nextOpen = input.indexOf("<document>", pos);
              const nextClose = input.indexOf("</document>", pos);
              if (nextClose === -1) break;
              if (nextOpen !== -1 && nextOpen < nextClose) {
                depth++;
                pos = nextOpen + 10;
              } else {
                depth--;
                pos = nextClose + 11;
              }
            }
            if (depth === 0) {
              const end = pos;
              let inner = input.slice(start + 10, end - 11).trim();
              let name = "Document";
              const nm = /<name>([\s\S]*?)<\/name>/i.exec(inner);
              if (nm) {
                name = nm[1].trim();
                inner = inner.replace(nm[0], "").trim();
              }
              documentBlocks.push({
                type: "document",
                name,
                content: inner,
                isComplete: true,
                start,
                end,
              });
              docRegex.lastIndex = end;
            }
          }

          // --- 2. Mask document spans to avoid nested matches ---
          let masked = input;
          documentBlocks.forEach(({ start, end }) => {
            masked =
              masked.slice(0, start) +
              " ".repeat(end - start) +
              masked.slice(end);
          });

          // --- 3. Define other block patterns ---
          const blockDefs = [
            {
              type: "visual",
              regex: /<visual>([\s\S]*?)<\/visual>/gi,
              handler: (m, start, end) => {
                let inner = m[1].trim();
                let name = "Visualization";
                const nm = /<name>([\s\S]*?)<\/name>/i.exec(inner);
                if (nm) {
                  name = nm[1].trim();
                  inner = inner.replace(nm[0], "").trim();
                }
                return {
                  type: "visual",
                  name,
                  content: inner,
                  isComplete: true,
                  start,
                  end,
                };
              },
            },
            {
              type: "mermaid",
              regex: /```mermaid([\s\S]*?)```/gi,
              handler: (m, start, end) => ({
                type: "mermaid",
                content: m[1].trim(),
                isComplete: true,
                start,
                end,
              }),
            },
            {
              type: "automationDaily",
              regex: /<automationCard>([\s\S]*?)<\/automationCard>/gi,
              handler: (m, start, end) => {
                const inner = m[1];
                const tag = (t) =>
                  new RegExp(`<${t}>([\\s\\S]*?)<\/${t}>`, "i")
                    .exec(inner)?.[1]
                    ?.trim() || "";
                return {
                  type: "automationDaily",
                  name: tag("name"),
                  task: tag("task"),
                  time: tag("time"),
                  outputFormat: tag("outputFormat"),
                  isComplete: true,
                  start,
                  end,
                };
              },
            },
            {
              type: "showUniProt",
              regex: /<showUniProt>([\s\S]*?)<\/showUniProt>/gi,
              handler: (m, start, end) => {
                let inner = m[1].trim();
                let name = "";
                const nm = /<name>([\s\S]*?)<\/name>/i.exec(inner);
                if (nm) {
                  name = nm[1].trim();
                  inner = inner.replace(nm[0], "").trim();
                }
                return {
                  type: "showUniProt",
                  name,
                  uniProt: inner,
                  isComplete: true,
                  start,
                  end,
                };
              },
            },
            {
              type: "chart",
              regex: /<dataChart>([\s\S]*?)<\/dataChart>/gi,
              handler: (m, start, end) => {
                let inner = m[1].trim();

                const extractTag = (tag, source) => {
                  const regex = new RegExp(
                    `<${tag}>([\\s\\S]*?)<\\/${tag}>`,
                    "i",
                  );
                  const match = regex.exec(source);
                  return match ? match[1].trim() : null;
                };

                const chartType = extractTag("chartType", inner);
                const dataId = extractTag("dataId", inner);
                const dataName = extractTag("dataName", inner);
                const dataLabel = extractTag("dataLabel", inner);

                return {
                  type: "chart",
                  chartType,
                  dataId,
                  dataName,
                  dataLabel,
                  isComplete: true,
                  start,
                  end,
                };
              },
            },

            {
              type: "persona",
              regex: /<\|agent\|([\s\S]*?)<\|end\|>/gi,
              handler: (m, start, end) => {
                const rawContent = m[1].trim();

                // Important: Don't use m[1] directly for parsing — use rawContent + manually remove tail
                const parsed = parseAgentBlock(
                  rawContent
                    .replaceAll("<visual>", "")
                    .replaceAll("</visual>", ""),
                );
                return {
                  type: "persona",
                  ...parsed,
                  isComplete: true,
                  start,
                  end,
                };
              },
            },
            {
              type: "vectorStoreJob",
              regex: /<newVectorStoreJob>([\s\S]*?)<\/newVectorStoreJob>/gi,
              handler: (m, start, end) => {
                const rawContent = m[1].trim();

                // Extract values from XML-style tags manually
                const vsIdMatch = rawContent.match(/<vsId>([\s\S]*?)<\/vsId>/i);
                const taskMatch = rawContent.match(/<task>([\s\S]*?)<\/task>/i);
                const nameMatch = rawContent.match(/<name>([\s\S]*?)<\/name>/i);

                return {
                  type: "vectorStoreJob",
                  vsId: vsIdMatch?.[1]?.trim() || null,
                  task: taskMatch?.[1]?.trim() || null,
                  name: nameMatch?.[1]?.trim() || "Vector Store Scrapper",
                  isComplete: true,
                  start,
                  end,
                };
              },
            },
            {
              type: "urlScraper",
              regex: /<urlScraper>([\s\S]*?)<\/urlScraper>/gi,
              handler: (m, start, end) => {
                const inner = m[1].trim();

                const extractTag = (tag, source) => {
                  const regex = new RegExp(
                    `<${tag}>([\\s\\S]*?)<\\/${tag}>`,
                    "i",
                  );
                  const match = regex.exec(source);
                  return match ? match[1].trim() : null;
                };

                return {
                  type: "urlScraper",
                  jobId: extractTag("jobid", inner),
                  name: extractTag("name", inner),
                  numOfUrls: extractTag("numOfUrls", inner),
                  isComplete: true,
                  start,
                  end,
                };
              },
            },
          ];

          // --- 4. Find other blocks in masked content ---
          const found = [];
          blockDefs.forEach((def) => {
            let rx = def.regex;
            let m;
            while ((m = rx.exec(masked)) !== null) {
              found.push(def.handler(m, m.index, rx.lastIndex));
            }
          });

          // Combine and sort all blocks
          const allBlocks = [...documentBlocks, ...found].sort(
            (a, b) => a.start - b.start,
          );

          // --- 5. Walk through content and build result ---
          const result = [];
          let cursor = 0;

          allBlocks.forEach((block) => {
            if (block.start > cursor) {
              pushText(result, input.slice(cursor, block.start));
            }
            block.isComplete =
              forceComplete ||
              Boolean(block.content && block.content.length > 0);
            result.push(block);
            cursor = block.end;
          });

          if (cursor < input.length) pushText(result, input.slice(cursor));

          if (result.length === 0) {
            result.push({
              type: "text",
              content: input.trim(),
              isComplete: true,
            });
          }

          // --- 6. Merge persona blocks into a simulation at original position ---
          const personas = result.filter((b) => b.type === "persona");
          if (personas.length) {
            const idx = result.findIndex((b) => b.type === "persona");
            const simulation = {
              type: "simulation",
              items: personas,
              isComplete: true,
            };
            const filtered = result.filter((b) => b.type !== "persona");
            filtered.splice(idx, 0, simulation);
            return filtered;
          }

          return result;
        };

        newMessage = {
          role: "ai",
          type: "quick",
          isLoading: false,
          isComplete: true,
          message: processStreamingContent(incoming, true),
          createdAt: now,
          cot: "",
          citations: [],
          agenticCitations: [],
        };

        updated.push(newMessage);
        // 💾 Batch saving logic
        if (newMessage) {
          batchedMessagesRef.current.push(newMessage);

          const batchToSend = batchedMessagesRef.current.map((chat) => ({
            role: chat.role,
            content:
              chat.role === "ai"
                ? chat.message?.[0]?.content || ""
                : chat.message || "",
          }));

          voiceToVoiceStoreMessageBatch(id, batchToSend);
          messagePointerRef.current += batchedMessagesRef.current.length;
          batchedMessagesRef.current = [];
        }
      }

      return updated;
    });
  }

  useEffect(() => {
    if (!dataChannel) return;
    // --- Clean up previous listeners to avoid duplicates ---
    let messageListener = (e) => {
      const event = JSON.parse(e.data);
      if (!event.timestamp) {
        event.timestamp = new Date().toLocaleTimeString();
      }
      processTranscript(event);
      setEvents((prev) => [event, ...prev]);
    };
    // let openListener = () => {
    //   setIsSessionActive(true);
    //   setEvents([]);
    //   //   setTranscripts([]);
    // };
    dataChannel.addEventListener("message", messageListener);
    // dataChannel.addEventListener("open", openListener);
    return () => {
      dataChannel.removeEventListener("message", messageListener);
      //   dataChannel.removeEventListener("open", openListener);
    };
  }, [dataChannel, id]);
  useEffect(() => {
    // start
    startSession();

    return () => {
      stopSession();
      // Cleanup
      if (audioElement.current) {
        audioElement.current.srcObject = null;
        audioElement.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isSessionActive && !greetingDone.current) {
      greetingDone.current = true;
      playSound("/vtv.mp3");
    }
  }, [isSessionActive]);

  useEffect(() => {
    async function init() {
      if (!isSessionActive || !dataChannel) return;
      // 1️⃣ Greeting (only once)
      if (!greetingDone.current) {
        greetingDone.current = true;

        // Send a system message into the conversation
        sendClientEvent({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "system",
            content: [
              {
                type: "input_text",
                text: "Greet the user with a friendly message and say: 'I am ARX agent, ready to operate.' Ask them to start speaking.",
              },
            ],
          },
        });

        // Now ask the model to generate that greeting
        sendClientEvent({
          type: "response.create",
          response: {
            instructions: "", // no extra instructions needed here
          },
        });

        playSound("/vtv.mp3");
      }

      // 2️⃣ Feed in your chat/file memory as a **system** message (only once)
      if (!isContextFeeded.current) {
        isContextFeeded.current = true;
        const data = await getSessionContext(id);
        console.log("Session context data:", data);
        fileDataNamespace.current = data.fileDataNamespace || null;
        const memoryText = `
  Here is the context of the chat (if any):

  Chat Memory:
  ${JSON.stringify(data.chatContext, null, 2)}

  ${
    data.isFileData
      ? `File Data:\n${
          Array.isArray(data.fileNames)
            ? data.fileNames.join(", ")
            : data.fileNames
        }\n`
      : ""
  }

  Knowledge Graph:
  ${data.knowledgeGraph || "N/A"}

  Whenever I ask about frameworks, only mention frameworks from this graph.
        `.trim();

        // Inject as a system message
        sendClientEvent({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "system",
            content: [{ type: "input_text", text: memoryText }],
          },
        });

        // Now trigger the model turn so it “sees” that memory
        sendClientEvent({
          type: "response.create",
          response: { instructions: "" },
        });

        console.log("Chat context sent to AI");
      }

      // 3️⃣ Initialize tools (only once)
      if (!isToolsInitialized.current) {
        isToolsInitialized.current = true;
        sendClientEvent(
          getTools(
            fileDataNamespace.current && fileDataNamespace.current !== "",
          ),
        );
        console.log("Tools initialized");
      }
    }

    if (!isMaxTokenIncreased.current) {
      isMaxTokenIncreased.current = true;

      sendClientEvent({
        type: "session.update",
        session: { max_response_output_tokens: "inf" },
      });
      console.log("Max response tokens increased to 4096");
    }

    init();
  }, [isSessionActive]);

  return (
    <div className="w-full mb-4 flex justify-between bg-slate-900 p-10 rounded-3xl">
      {/* VAD */}
      <div>
        <VADVisualization
          audioStream={userAudioStream}
          remoteAudioStream={remoteAudioStream}
          isSessionActive={isSessionActive}
          onStart={startSession}
          onStop={stopSession}
        />
      </div>

      <div className="font-semibold pt-5">{waitingMessage}</div>
      {isSessionActive ? (
        <div className="flex items-center gap-4">
          {/* Mic mute/unmute button */}
          <button
            className={`p-3 rounded-full w-fit h-fit border shadow-md transition-all duration-200 
      ${
        isMicMuted
          ? "bg-white text-blue-900  hover:bg-blue-50"
          : "bg-blue-900 text-white  hover:bg-blue-800"
      }`}
            onClick={toggleMicMute}
            disabled={!isSessionActive}
            title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMicMuted ? <MicOff /> : <Mic />}
          </button>

          {/* Stop session button */}
          <button
            className="p-3 rounded-full w-fit h-fit bg-red-900/70 text-white shadow-md hover:bg-red-500 transition-all duration-200"
            onClick={stopSession}
            disabled={!isSessionActive}
            title="Stop Session"
          >
            <CircleStop />
          </button>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
}
