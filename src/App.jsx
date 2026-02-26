import React, { useState, useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Zap, 
  Filter, 
  Play, 
  Trash2, 
  Download, 
  ChevronRight, 
  Settings2,
  Briefcase,
  Code,
  Target,
  DollarSign,
  MapPin,
  Type,
  Send,
  Bookmark,
  Bell,
  BarChart,
  Users
} from 'lucide-react';

// --- Custom Node Components ---

const TriggerNode = ({ data, selected }) => (
  <div className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 transition-all ${selected ? 'border-blue-600 ring-2 ring-blue-100' : 'border-blue-500'}`}>
    <div className="flex items-center gap-2 mb-1">
      <div className="p-1 bg-blue-500 rounded text-white">
        <Zap size={14} />
      </div>
      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Trigger</span>
    </div>
    <div className="text-sm font-semibold text-slate-800">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-white" />
  </div>
);

const ConditionNode = ({ data, selected }) => (
  <div className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 transition-all ${selected ? 'border-yellow-600 ring-2 ring-yellow-100' : 'border-yellow-500'}`}>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-yellow-500 border-2 border-white" />
    <div className="flex items-center gap-2 mb-1">
      <div className="p-1 bg-yellow-500 rounded text-white">
        <Filter size={14} />
      </div>
      <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Condition</span>
    </div>
    <div className="text-sm font-semibold text-slate-800">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-yellow-500 border-2 border-white" />
  </div>
);

const ActionNode = ({ data, selected }) => (
  <div className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 transition-all ${selected ? 'border-green-600 ring-2 ring-green-100' : 'border-green-500'}`}>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-green-500 border-2 border-white" />
    <div className="flex items-center gap-2 mb-1">
      <div className="p-1 bg-green-500 rounded text-white">
        <Play size={14} />
      </div>
      <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Action</span>
    </div>
    <div className="text-sm font-semibold text-slate-800">{data.label}</div>
  </div>
);

const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};

// --- Sidebar Data ---

const SIDEBAR_ITEMS = {
  triggers: [
    { type: 'trigger', label: 'New Internship Posted', icon: Briefcase },
    { type: 'trigger', label: 'New Job Posted', icon: Briefcase },
    { type: 'trigger', label: 'New Coding Contest', icon: Code },
  ],
  conditions: [
    { type: 'condition', label: 'Skill Match Above %', icon: Target },
    { type: 'condition', label: 'Stipend Greater Than', icon: DollarSign },
    { type: 'condition', label: 'Location Equals', icon: MapPin },
    { type: 'condition', label: 'Keyword In Title', icon: Type },
  ],
  actions: [
    { type: 'action', label: 'Auto Apply', icon: Send },
    { type: 'action', label: 'Save Opportunity', icon: Bookmark },
    { type: 'action', label: 'Notify Me', icon: Bell },
    { type: 'action', label: 'Add to Tracker', icon: BarChart },
    { type: 'action', label: 'Share to Community', icon: Users },
  ],
};

// --- Main Component ---

const WorkflowBuilder = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  const onDragStart = (event, nodeType, label) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { 
          label,
          platforms: '',
          minStipend: '',
          keywords: '',
          resume: '',
          notificationType: 'Email'
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = (field, value) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              [field]: value,
            },
          };
        }
        return node;
      })
    );
    setSelectedNode((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
    }));
  };

  const deleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const exportFlow = () => {
    const flow = {
      nodes,
      edges,
    };
    console.log('Exported Flow:', JSON.stringify(flow, null, 2));
    alert('Flow exported to console!');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">CareerFlow</h1>
            <p className="text-xs text-slate-500 font-medium">Workflow Automation Builder</p>
          </div>
        </div>
        <button 
          onClick={exportFlow}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Download size={16} />
          Export Flow
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-72 border-r border-slate-200 bg-white overflow-y-auto p-4 shrink-0">
          <div className="space-y-8">
            {Object.entries(SIDEBAR_ITEMS).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-grab hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                      onDragStart={(event) => onDragStart(event, item.type, item.label)}
                      draggable
                    >
                      <div className={`p-2 rounded-lg text-white shadow-sm ${
                        item.type === 'trigger' ? 'bg-blue-500' : 
                        item.type === 'condition' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}>
                        <item.icon size={18} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 relative bg-[#f8fafc]" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#cbd5e1" gap={20} />
            <Controls className="bg-white border-slate-200 shadow-lg rounded-lg overflow-hidden" />
          </ReactFlow>
        </main>

        {/* Right Settings Panel */}
        <aside className={`w-80 border-l border-slate-200 bg-white transition-all duration-300 shrink-0 ${selectedNode ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full'}`}>
          {selectedNode ? (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 size={18} className="text-slate-400" />
                  <h2 className="font-bold text-slate-800">Node Settings</h2>
                </div>
                <button 
                  onClick={deleteNode}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete Node"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Label</label>
                  <p className="text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                    {selectedNode.data.label}
                  </p>
                </div>

                {selectedNode.type === 'trigger' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Select Platforms</label>
                      <input 
                        type="text"
                        placeholder="e.g. LinkedIn, Unstop"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                        value={selectedNode.data.platforms || ''}
                        onChange={(e) => updateNodeData('platforms', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {selectedNode.type === 'condition' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Minimum Stipend</label>
                      <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="number"
                          placeholder="0"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm transition-all"
                          value={selectedNode.data.minStipend || ''}
                          onChange={(e) => updateNodeData('minStipend', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Keywords</label>
                      <input 
                        type="text"
                        placeholder="e.g. Remote, Frontend"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm transition-all"
                        value={selectedNode.data.keywords || ''}
                        onChange={(e) => updateNodeData('keywords', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {selectedNode.type === 'action' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Resume to Use</label>
                      <select 
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm transition-all bg-white"
                        value={selectedNode.data.resume || ''}
                        onChange={(e) => updateNodeData('resume', e.target.value)}
                      >
                        <option value="">Select Resume</option>
                        <option value="main">Main Software Engineer Resume</option>
                        <option value="intern">Internship Specific Resume</option>
                        <option value="design">Product Design Portfolio</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Notification Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Email', 'Push'].map((type) => (
                          <button
                            key={type}
                            onClick={() => updateNodeData('notificationType', type)}
                            className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                              selectedNode.data.notificationType === type 
                                ? 'bg-green-500 text-white border-green-500 shadow-sm' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-green-200'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                  Settings auto-save on change
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <ChevronRight size={32} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">No Node Selected</h3>
                <p className="text-sm text-slate-500 mt-1">Select a node on the canvas to edit its automation settings.</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilder />
    </ReactFlowProvider>
  );
}
