import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    ConnectionMode,
    Panel,
    MarkerType,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode } from './CustomNode';
import { LayoutEngine } from '../../../lib/utils';
import { LAYOUT_CONFIG } from '../../../lib/config';

const nodeTypes = { custom: CustomNode };

const getEdgeStyle = (sourceX, sourceY, targetX, targetY) => {
    const distance = Math.sqrt(
        Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2)
    );

    return {
        stroke: LAYOUT_CONFIG.EDGE_COLOR,
        strokeWidth: LAYOUT_CONFIG.EDGE_STROKE_WIDTH,
        curvature: Math.min(0.8, distance / 1000),
    };
};

export function WorkflowDiagram({ data }) {
    const layoutEngine = useMemo(
        () =>
            new LayoutEngine({
                nodeGap: LAYOUT_CONFIG.NODE_GAP,
                canvasWidth: LAYOUT_CONFIG.CANVAS_WIDTH,
                canvasHeight: LAYOUT_CONFIG.CANVAS_HEIGHT,
            }),
        []
    );

    const processWorkflowData = useCallback(() => {
        const nodes = [];
        const edges = [];

        // Add start node
        const startNode = {
            id: 'start',
            type: 'custom',
            position: { x: 0, y: 0 },
            draggable: true,
            data: {
                name: '',
                goal: 'Start Interaction',
                isStart: true,
                execution: 1,
            },
        };
        nodes.push(startNode);

        // Process each level of nodes
        data.other.forEach((level) => {
            level.forEach((node) => {
                nodes.push({
                    id: node.personaId,
                    type: 'custom',
                    position: { x: 0, y: 0 },
                    draggable: true,
                    data: {
                        name: node.name || `Node ${node.personaId}`,
                        goal: node.goal,
                        execution: node.execution + 1,
                    },
                });

                // Connect to start if no inputs
                if (node.input.length === 0) {
                    edges.push({
                        id: `start-${node.personaId}`,
                        source: 'start',
                        target: node.personaId,
                        type: 'smoothstep',
                        animated: true,
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: LAYOUT_CONFIG.EDGE_COLOR,
                        },
                    });
                }

                // Add edges for other connections
                node.input.forEach((inputId) => {
                    edges.push({
                        id: `${inputId}-${node.personaId}`,
                        source: inputId,
                        target: node.personaId,
                        type: 'smoothstep',
                        animated: true,
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: LAYOUT_CONFIG.EDGE_COLOR,
                        },
                    });
                });
            });
        });

        // Add end node
        const endNode = {
            id: 'end',
            type: 'custom',
            position: { x: 0, y: 0 },
            draggable: true,
            data: {
                name: '',
                goal: 'End',
                isEnd: true,
                execution: Math.max(...nodes.map((n) => n.data.execution)) + 1,
            },
        };
        nodes.push(endNode);

        // Connect leaf nodes to end
        const nodesWithOutgoingEdges = new Set(edges.map((e) => e.source));
        nodes
            .filter((n) => n.id !== 'start' && n.id !== 'end' && !nodesWithOutgoingEdges.has(n.id))
            .forEach((node) => {
                edges.push({
                    id: `${node.id}-end`,
                    source: node.id,
                    target: 'end',
                    type: 'smoothstep',
                    animated: true,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: LAYOUT_CONFIG.EDGE_COLOR,
                    },
                });
            });

        const maxExecution = Math.max(...nodes.map((n) => n.data.execution));
        const positionedNodes = layoutEngine.calculateNodePositions(nodes, maxExecution);

        // Update edge styles based on node positions
        const positionedEdges = edges.map(edge => {
            const sourceNode = positionedNodes.find(n => n.id === edge.source);
            const targetNode = positionedNodes.find(n => n.id === edge.target);

            if (sourceNode && targetNode) {
                return {
                    ...edge,
                    style: getEdgeStyle(
                        sourceNode.position.x,
                        sourceNode.position.y,
                        targetNode.position.x,
                        targetNode.position.y
                    ),
                };
            }
            return edge;
        });

        return { nodes: positionedNodes, edges: positionedEdges };
    }, [data, layoutEngine]);

    const initialData = processWorkflowData();
    const [nodes, setNodes] = useState(initialData.nodes);
    const [edges, setEdges] = useState(initialData.edges);

    const onNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect = useCallback(
        (params) => {
            const sourceNode = nodes.find(n => n.id === params.source);
            const targetNode = nodes.find(n => n.id === params.target);

            if (sourceNode && targetNode) {
                const edgeStyle = getEdgeStyle(
                    sourceNode.position.x,
                    sourceNode.position.y,
                    targetNode.position.x,
                    targetNode.position.y
                );

                setEdges((eds) =>
                    addEdge(
                        {
                            ...params,
                            type: 'smoothstep',
                            animated: true,
                            style: edgeStyle,
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: LAYOUT_CONFIG.EDGE_COLOR,
                            },
                        },
                        eds
                    )
                );
            }
        },
        [nodes]
    );

    return (
        <div className="w-full h-[95%] bg-slate-900 rounded-xl overflow-hidden">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitViewOptions={{
                    padding: LAYOUT_CONFIG.FIT_VIEW_PADDING,
                    minZoom: LAYOUT_CONFIG.MIN_ZOOM,
                    maxZoom: LAYOUT_CONFIG.MAX_ZOOM,
                }}
                minZoom={LAYOUT_CONFIG.MIN_ZOOM}
                maxZoom={LAYOUT_CONFIG.MAX_ZOOM}
                attributionPosition="bottom-left"
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: true,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: LAYOUT_CONFIG.EDGE_COLOR,
                    },
                }}
            >
                <Background color="#475569" gap={16} />
                <Controls className="!bg-slate-800 !border-slate-700" />
                <Panel
                    position="top-left"
                    className="bg-slate-800/90 backdrop-blur p-4 rounded-lg text-slate-200 shadow-xl"
                >
                    <h3 className="text-sm font-medium mb-2">Workflow Legend</h3>
                    <div className="flex flex-col gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-emerald-600"></div>
                            <span>Start Node</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-rose-600"></div>
                            <span>End Node</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-slate-800"></div>
                            <span>Process Node</span>
                        </div>
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
}