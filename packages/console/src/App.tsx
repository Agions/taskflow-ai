import { useState } from 'react'
import { ReactFlow, Background, Controls, MiniMap, Node, Edge, addEdge, Connection, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Play, Save, Settings, Plus, FileText, GitBranch, Database, MessageSquare, Zap } from 'lucide-react'

// 初始节点数据
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    position: { x: 100, y: 100 },
    data: { label: '用户输入', icon: MessageSquare },
  },
  {
    id: '2',
    position: { x: 300, y: 100 },
    data: { label: 'AI 路由', icon: GitBranch },
  },
  {
    id: '3',
    position: { x: 500, y: 50 },
    data: { label: '工具调用', icon: Zap },
  },
  {
    id: '4',
    position: { x: 500, y: 150 },
    data: { label: '数据库查询', icon: Database },
  },
  {
    id: '5',
    position: { x: 700, y: 100 },
    data: { label: '响应生成', icon: FileText },
  },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-5', source: '3', target: '5' },
  { id: 'e4-5', source: '4', target: '5' },
]

// 自定义节点组件
function CustomNode({ data }: { data: { label: string; icon: any } }) {
  const Icon = data.icon || FileText
  return (
    <div className="node">
      <div className="node-header">
        <div className="node-icon">
          <Icon size={14} />
        </div>
        <div className="node-title">{data.label}</div>
      </div>
      <div className="node-body">点击配置</div>
    </div>
  )
}

const nodeTypes = {
  custom: CustomNode,
}

// 示例工作流列表
const workflows = [
  { id: '1', name: '客服工作流', status: 'running', lastRun: '2分钟前' },
  { id: '2', name: '数据处理', status: 'idle', lastRun: '1小时前' },
  { id: '3', name: '报告生成', status: 'error', lastRun: '3小时前' },
]

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [activeTab, setActiveTab] = useState('workflows')
  const [selectedWorkflow, setSelectedWorkflow] = useState(workflows[0])

  const onConnect = (params: Connection) => setEdges((eds) => addEdge(params, eds))

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="logo">⚡ TaskFlow AI</div>
        <nav className="nav">
          <button className={`nav-btn ${activeTab === 'workflows' ? 'active' : ''}`} onClick={() => setActiveTab('workflows')}>
            工作流
          </button>
          <button className={`nav-btn ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
            模板
          </button>
          <button className={`nav-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
            日志
          </button>
        </nav>
      </header>

      {/* Main */}
      <main className="main">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <span className="sidebar-title">工作流列表</span>
            <button className="btn">
              <Plus size={14} style={{ marginRight: 4 }} />
              新建
            </button>
          </div>
          <div className="workflow-list">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className={`workflow-item ${selectedWorkflow.id === wf.id ? 'active' : ''}`}
                onClick={() => setSelectedWorkflow(wf)}
              >
                <div className="workflow-name">{wf.name}</div>
                <div className="workflow-meta">
                  <span className={`status-badge ${wf.status}`}>
                    {wf.status === 'running' ? '●' : '○'} {wf.status === 'running' ? '运行中' : wf.status === 'error' ? '错误' : '空闲'}
                  </span>
                  <span>{wf.lastRun}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <div className="canvas">
          <div className="canvas-header">
            <div className="canvas-title">{selectedWorkflow.name}</div>
            <div className="canvas-actions">
              <button className="btn-icon" title="保存">
                <Save size={18} />
              </button>
              <button className="btn-icon" title="运行">
                <Play size={18} />
              </button>
              <button className="btn-icon" title="设置">
                <Settings size={18} />
              </button>
            </div>
          </div>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#333" gap={20} />
            <Controls />
            <MiniMap nodeColor="#00d4aa" />
          </ReactFlow>
        </div>

        {/* Panel */}
        <aside className="panel">
          <div className="panel-header">属性面板</div>
          <div className="panel-body">
            <div className="panel-section">
              <div className="panel-label">工作流名称</div>
              <div className="panel-value">{selectedWorkflow.name}</div>
            </div>
            <div className="panel-section">
              <div className="panel-label">状态</div>
              <div className="panel-value">
                <span className={`status-badge ${selectedWorkflow.status}`}>
                  {selectedWorkflow.status === 'running' ? '● 运行中' : selectedWorkflow.status === 'error' ? '● 错误' : '● 空闲'}
                </span>
              </div>
            </div>
            <div className="panel-section">
              <div className="panel-label">节点数量</div>
              <div className="panel-value">{nodes.length} 个</div>
            </div>
            <div className="panel-section">
              <div className="panel-label">执行次数</div>
              <div className="panel-value">42 次</div>
            </div>
          </div>
        </aside>
      </main>

      {/* Logs */}
      <div className="logs">
        <div className="log-item">
          <span className="log-time">23:05:12</span>
          <span className="log-info">[INFO] 工作流启动: {selectedWorkflow.name}</span>
        </div>
        <div className="log-item">
          <span className="log-time">23:05:13</span>
          <span className="log-info">[INFO] 节点 "用户输入" 执行完成</span>
        </div>
        <div className="log-item">
          <span className="log-time">23:05:15</span>
          <span className="log-info">[INFO] 节点 "AI 路由" 执行完成</span>
        </div>
        <div className="log-item">
          <span className="log-time">23:05:18</span>
          <span className="log-warn">[WARN] 主模型响应较慢，耗时 2.3s</span>
        </div>
        <div className="log-item">
          <span className="log-time">23:05:20</span>
          <span className="log-info">[INFO] 节点 "工具调用" 执行完成</span>
        </div>
      </div>
    </>
  )
}
