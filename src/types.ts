import { Node, Edge } from 'reactflow';

export interface Port {
  id: string;
  name: string;
  connectedTo?: string;
}

export interface FlowNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
    inputs?: Port[];
    outputs?: Port[];
    onDelete?: () => void;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export enum NodeType {
  BOARD = 'board',
  SENSOR = 'sensor',
  MOTOR = 'motor'
}

export interface FlowNodeData {
  label: string;
  inputs?: Port[];
  outputs?: Port[];
  onDelete?: () => void;
}

export interface BoardConnection {
  sourcePortId: string;
  targetPortId: string;
}

export interface BoardPort {
  id: string;
  name: string;
  type: 'input' | 'output';
  connectedTo?: string;
  logic?: string;
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