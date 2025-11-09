import { useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';

// Custom node components
const PiggyNode = ({ data }: any) => (
  <div className="bg-[#f8f3e9] rounded-full p-8 border-4 border-[#6b4423] shadow-2xl">
    <div className="text-4xl font-rique font-bold text-center text-[#6b4423]">{data.label}</div>
    <div className="text-xs font-lexend text-[#8b6240] text-center mt-2">
      {data.subtitle}
    </div>
  </div>
);

const CategoryNode = ({ data }: any) => (
  <div className="bg-[#6b4423] rounded-2xl p-6 border-4 border-[#5a3a1f] shadow-xl min-w-[160px]">
    <div className="text-lg font-rique font-bold text-[#fdfbf7] text-center mb-1">
      {data.label}
    </div>
    <div className="text-xs font-lexend text-[#f8f3e9] text-center">
      {data.subtitle}
    </div>
  </div>
);

const InsightNode = ({ data }: any) => (
  <div className="bg-[#fdfbf7] rounded-2xl p-4 border-3 border-[#6b4423] shadow-xl min-w-[220px] max-w-[280px]">
    <div className="text-sm font-rique font-bold text-[#6b4423] mb-2">
      {data.label}
    </div>
    <div className="text-xs font-lexend text-[#8b6240] leading-relaxed">
      {data.description}
    </div>
  </div>
);

const nodeTypes = {
  piggy: PiggyNode,
  insight: InsightNode,
  category: CategoryNode,
};

export const PiggyGraph = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  const userId = 'u_demo_min';

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/piggy-graph?user_id=${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch graph data');
        }

        const data = await response.json();
        console.log('Piggy Graph Data:', data);

        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      } catch (error) {
        console.error('Error fetching piggy graph:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-rique font-bold text-[#6b4423] mb-8">Piggy Graph</h1>
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-[#6b4423] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-rique font-bold text-[#6b4423] mb-4">
          Piggy Graph
        </h1>
        <p className="text-lg font-lexend text-[#8b6240] mb-6">
          Your spending habits, preferences, and AI-powered insights visualized
        </p>

        {/* Graph Visualization */}
        <div 
          className="bg-white rounded-3xl border-4 border-[#6b4423] shadow-xl overflow-hidden"
          style={{ height: '950px' }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.4}
            maxZoom={1.5}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#6b4423', strokeWidth: 3 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#6b4423',
                width: 20,
                height: 20,
              },
            }}
            attributionPosition="bottom-left"
          >
            <Background color="#6b4423" gap={16} />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};
