export interface Home {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NodeType = 'sensor' | 'motor' | 'light' | 'board';

export interface BoardPort {
  id: string;
  name: string;
  type: 'input' | 'output';
  connectedTo?: string;
  logic?: string;
}

export interface BoardConnection {
  inputs: string[];
  outputs: string[];
  logic: string;
}

export interface FlowNodeData {
  label: string;
  content?: string;
  nodeType: NodeType;
  ports?: BoardPort[];
  connections?: BoardConnection[];
  onDelete?: () => void;
}

export interface FlowNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface HomeFlow {
  nodes: FlowNode[];
  edges: FlowEdge[];
} 