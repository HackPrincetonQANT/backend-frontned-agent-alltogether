import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
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
  const { user } = useUser();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id || 'user_35EFmFe77RGaAFSAQLfPtEin7XW';

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
        console.log('Nodes count:', data.nodes?.length);
        console.log('Edges count:', data.edges?.length);
        console.log('First edge:', data.edges?.[0]);

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
      <div className="bg-[#f8f3e9] rounded-3xl p-8 border-4 border-[#6b4423]">
        <h2 className="text-3xl font-rique font-bold text-[#6b4423] mb-4">Piggy Graph</h2>
        <div className="flex items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-[#6b4423] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f3e9] rounded-3xl p-8 border-4 border-[#6b4423]">
      <h2 className="text-3xl font-rique font-bold text-[#6b4423] mb-4">
        Piggy Graph
      </h2>
      <p className="text-lg font-lexend text-[#8b6240] mb-6">
        Your spending habits, preferences, and AI-powered insights visualized
      </p>

      {/* Graph Visualization */}
      <div 
        className="bg-white rounded-2xl border-4 border-[#6b4423] shadow-xl overflow-hidden"
        style={{ height: '800px', width: '100%' }}
      >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ 
              padding: 0.2,
              includeHiddenNodes: false,
              minZoom: 0.5,
              maxZoom: 1.2
            }}
            minZoom={0.3}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#6b4423',
                width: 25,
                height: 25,
              },
            }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
          >
            <Background color="#6b4423" gap={16} size={1} />
            <Controls />
          </ReactFlow>
        </div>
    </div>
  );
};
