import { Node, Edge } from 'reactflow';

export type NodeType = 'board' | 'sensor' | 'motor' | 'light';

export interface BoardPort {
  id: string;
  name: string;
  type: 'input' | 'output';
  connectedTo?: string;
  logic?: string;
}

export interface BoardConnection {
  sourcePortId: string;
  targetPortId: string;
}

export interface FlowNodeData {
  label: string;
  content?: string;
  nodeType: NodeType;
  ports?: BoardPort[];
  connections?: BoardConnection[];
  onDelete?: () => void;
}

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge;

export interface Port {
  id: string;
  name: string;
  connectedTo?: string;
} 