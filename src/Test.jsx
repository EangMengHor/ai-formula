import { useEffect, useRef, useState } from "react";
import PollInteraction from "./components/PollInteraction";
import { parseContent } from "./lib/utils";
import ChatSimulation from "./components/custom/AiInteraction/ChatSimulation";
import { getPersonaById } from "./services/n8n-knowledge-apis/getPersonaById";

export default function Test() {
  async function a() {
    const response = await getPersonaById(3375);
  }
  const interactionLogs = useRef();
  const [conversation, setConversation] = useState([
    {
      role: "ai",
      message: [],
    },
  ]);
  useEffect(() => {
    //         const a = `<|agent|><|title|The Political Warlord<|title|><|goal|Incorporate feedback received from The Legal Shield and The Media Propagandist to finalize the electoral strategy. Emphasize the importance of legal compliance and media effectiveness as critical components of the overall strategy, ensuring cohesive integration across all facets of the campaign.<|goal|><|team|"The Media Propagandist"<|team|>, <|team|"The Economic Nationalist"<|team|>

    // # Comprehensive Political Strategy Dossier: Integrating Legal Compliance and Media Effectiveness

    // Hello esteemed colleagues, I'm delighted to collaborate with fellow experts like "The Legal Shield" and "The Media Propagandist" in refining our electoral strategy. It's encouraging to see the strategic insights from "The Legal Shield," which provide robust legal safeguards, and the astute media engagement frameworks outlined by "The Media Propagandist." Your inputs significantly fortify our campaign's foundation, ensuring both legal compliance and media effectiveness are seamlessly integrated for maximal impact.

    // ---

    // ## Tools and Frameworks

    // To enact a successful research framework, I will utilize relevant insights and methodologies from our knowledge base.

    // ### Part 1: Legal Compliance Integration
    // 1. **Feedback from The Legal Shield**:
    //    - Ensure all campaign strategies are checked for alignment with legal restrictions to avoid potential conflicts. Legal guidelines must be adhered to in every narrative framing and campaign communication.
    //    - Implement a monitoring system to enforce legal compliance across all digital platforms.

    // ### Part 2: Media Effectiveness Approach
    // 1. **Insights from The Media Propagandist**:
    //    - Adopt advanced media monitoring tools for real-time feedback and narrative adjustment.
    //    - Shape narratives to captivate audiences while maintaining compliance, focusing on the use of psychological framing techniques.
    //    - Prepare an agile media strategy capable of counteracting misinformation with fact-based narratives promptly.

    // ### Part 3: Cohesive Integration Strategy
    // - **Risk Analysis & Mitigation**: Conduct a risk analysis to identify potential threats in communication and compliance, implementing proactive responses to each identified risk.
    // - **Strategic Recommendations**:
    //   - Emphasize cross-training between legal and media teams to ensure both legal robustness and media engagement work hand in hand.
    //   - Utilize performance analytics to optimize voter engagement continuously.

    // ---

    // ### Implementation Framework

    // 1. **Coalition Management**:
    //    - Create a unified task force bringing together legal, media, and strategy experts to ensure coherent implementation.
    //    - Regular strategy meetings to ensure all aspects of legal and media plans are in sync.

    // 2. **Crisis Management**:
    //    - Designate crisis response roles for immediate reaction to unexpected challenges.
    //    - Draft crisis communication plans informed by both legal guidelines and effective media practices to safeguard party interests.

    // 3. **Feedback Loop & Iterative Improvement**:
    //    - Establish continuous feedback loops using both legal check-ins and media analytics to adjust strategies as required.
    //    - Factor in public sentiment analysis to guide narrative adjustments, ensuring message resonance with target audiences.

    // ---

    // ### Conclusion

    // By synthesizing insights from "The Legal Shield" and "The Media Propagandist" into the comprehensive electoral strategy, we ensure a robust, legally compliant, and media-effective campaign structure. These imbrications enhance our capacity to project a compelling narrative while safeguarding against legal pitfalls, thus paving a clear pathway to electoral success.

    // I look forward to continuous collaboration as we refine and implement these strategies. Your input remains invaluable in achieving our shared vision for an exemplary campaign.<|end|>
    // `

    //         const parser = parseContent(a)
    //         const items = parser.flatMap(data => data.items);
    //         // interactionLogs.current = items
    //         console.log(items, "extracted items");

    a();
    a();
  }, []);

  useEffect(() => {
    console.log(conversation, "conversation is here !!");
  }, [conversation]);
  return (
    <div className="bg-[#09105f]">
      {/* <PollInteraction 
            interactionData={{"output": [[{"goal": "Research and outline the key components of effective child defense systems, focusing on advocacy outreach strategies that can be applied to support these initiatives. Provide insights on how technology can enhance these strategies based on current trends.", "name": "Outreach Engine Designer", "input": [], "execution": 1, "personaId": "1614"}, {"goal": "Collect and analyze legislative data that pertains to child defense and protection initiatives, providing a comprehensive overview of existing bills and policies that impact youth advocacy. This analysis should inform the Outreach Engine Designer's findings.", "name": "Legislative Researcher", "input": ["1614"], "execution": 1, "personaId": "1602"}]]}} /> */}
      <ChatSimulation
        personas={[
          {
            type: "persona",
            isComplete: true,
            content:
              ', \n\n\n# Comprehensive Political Strategy Dossier: Integrating Legal Compliance and Media Effectiveness\n\nHello esteemed colleagues, I\'m delighted to collaborate with fellow experts like "The Legal Shield" and "The Media Propagandist" in refining our electoral strategy. It\'s encouraging to see the strategic insights from "The Legal Shield," which provide robust legal safeguards, and the astute media engagement frameworks outlined by "The Media Propagandist." Your inputs significantly fortify our campaign\'s foundation, ensuring both legal compliance and media effectiveness are seamlessly integrated for maximal impact.\n\n---\n\n## Tools and Frameworks\n\nTo enact a successful research framework, I will utilize relevant insights and methodologies from our knowledge base.\n\n### Part 1: Legal Compliance Integration\n1. **Feedback from The Legal Shield**:\n   - Ensure all campaign strategies are checked for alignment with legal restrictions to avoid potential conflicts. Legal guidelines must be adhered to in every narrative framing and campaign communication.\n   - Implement a monitoring system to enforce legal compliance across all digital platforms.\n\n### Part 2: Media Effectiveness Approach\n1. **Insights from The Media Propagandist**:\n   - Adopt advanced media monitoring tools for real-time feedback and narrative adjustment.\n   - Shape narratives to captivate audiences while maintaining compliance, focusing on the use of psychological framing techniques.\n   - Prepare an agile media strategy capable of counteracting misinformation with fact-based narratives promptly.\n\n### Part 3: Cohesive Integration Strategy\n- **Risk Analysis & Mitigation**: Conduct a risk analysis to identify potential threats in communication and compliance, implementing proactive responses to each identified risk.\n- **Strategic Recommendations**: \n  - Emphasize cross-training between legal and media teams to ensure both legal robustness and media engagement work hand in hand.\n  - Utilize performance analytics to optimize voter engagement continuously.\n\n---\n\n### Implementation Framework\n\n1. **Coalition Management**:\n   - Create a unified task force bringing together legal, media, and strategy experts to ensure coherent implementation.\n   - Regular strategy meetings to ensure all aspects of legal and media plans are in sync.\n\n2. **Crisis Management**:\n   - Designate crisis response roles for immediate reaction to unexpected challenges. \n   - Draft crisis communication plans informed by both legal guidelines and effective media practices to safeguard party interests.\n\n3. **Feedback Loop & Iterative Improvement**:\n   - Establish continuous feedback loops using both legal check-ins and media analytics to adjust strategies as required.\n   - Factor in public sentiment analysis to guide narrative adjustments, ensuring message resonance with target audiences.\n\n---\n\n### Conclusion\n\nBy synthesizing insights from "The Legal Shield" and "The Media Propagandist" into the comprehensive electoral strategy, we ensure a robust, legally compliant, and media-effective campaign structure. These imbrications enhance our capacity to project a compelling narrative while safeguarding against legal pitfalls, thus paving a clear pathway to electoral success.\n\nI look forward to continuous collaboration as we refine and implement these strategies. Your input remains invaluable in achieving our shared vision for an exemplary campaign.',
            title: "The Political Warlord",
            goal: "Incorporate feedback received from The Legal Shield and The Media Propagandist to finalize the electoral strategy. Emphasize the importance of legal compliance and media effectiveness as critical components of the overall strategy, ensuring cohesive integration across all facets of the campaign.",
            team: ["The Media Propagandist", "The Economic Nationalist"],
          },
        ]}
        isLoading={true}
        effect={true}
      />
    </div>
  );
}
