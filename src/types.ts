import { Node, Edge } from 'reactflow';

export type NodeType = 'sensor' | 'motor' | 'light' | 'board';

export interface BoardPort {
  id: string;
  name: string;
  type: 'input' | 'output';
  connectedTo?: string;
  logic?: string;
}

export interface BoardConnection {
  inputs: string[];    // Array von Port-IDs
  outputs: string[];   // Array von Port-IDs
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

export interface FlowNode extends Node<FlowNodeData> {}
export interface FlowEdge extends Edge {} 