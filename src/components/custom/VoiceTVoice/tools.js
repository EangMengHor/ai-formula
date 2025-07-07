const knowledgeGraphToolDescription = `this tools helps you to get the knowledge of the knowledge graph that you have , so when user gives any problem pick all the best frameworks call all the frameworks to get the most ranked vector store knowledge.`

export default function getTools(isFiles = false) {
    // You can add more tools here as needed

    const tools = [
        {
            type: "function",
            name: "get_ARX_knowledge_graph_knowledge",
            description: knowledgeGraphToolDescription,
            parameters: {
                type: "object",
                strict: true,
                properties: {
                    frameworkName: {
                        type: "string",
                        description:
                            "Name of the framework to get the knowledge from the knowledge graph",
                    },
                },
                required: ["frameworkName"],
            },
        },
        {
            type: "function",
            name: "search_internet",
            description:
                "Perform an internet search for the given query and return the top results. use this not only when user say to do that, you can use this tool internall if any framework or formula require realtime data for solving problem. so just call this quick tool to get the best realtime data.",
            parameters: {
                type: "object",
                strict: true,
                properties: {
                    query: {
                        type: "string",
                        description: "The search query string",
                    },
                },
                required: ["query"],
            },
        },
        {
            type: "function",
            name: "create_visualization",
            description:
                "Creates a visualization based on the given chart type and prompt. it will give you element to show and it automatically render the visualization. just do that.",
            parameters: {
                type: "object",
                strict: true,
                properties: {
                    chartType: {
                        type: "string",
                        description: "Type of chart to create, e.g., 'bar', 'area', 'pie', etc. can't be anything else than these types.",
                    },
                    prompt: {
                        type: "string",
                        description: "Description of what the chart should represent and any styling guidelines. dont give any data and all it will automatically figure out just tell what visualization you want with complete description. it must be simple prompt , this tool can search on latest data automatically , just give simple prompt ex. 'tesla stock growth in 5 year chart' or 'population growth in 5 year chart' or 'sales growth in 5 year chart' or 'company revenue growth in 5 year chart' or 'company profit growth in 5 year chart' or 'company loss growth in 5 year chart' or 'company stock price growth in 5 year chart'. it will automatically search on latest data and give you the best visualization.",
                    },
                },
                required: ["chartType", "prompt"],
            },
        },
    ];

    if (isFiles) {
        tools.push({
            type: "function",
            name: "read_file_context",
            description:
                "Search the uploaded file-vector store for the given query and namespace, returning the best-matching chunks.",
            parameters: {
                type: "object",
                strict: true,
                properties: {
                    query: {
                        type: "string",
                        description: "The search query string",
                    },
                },
                required: ["query", "namespace"],
            },
        });
    }
    return {
        type: "session.update",
        session: {
            tools,
            tool_choice: "auto",
        },
    };
}