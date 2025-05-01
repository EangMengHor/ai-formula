# Quick response — Web User Manual

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
*N/A*