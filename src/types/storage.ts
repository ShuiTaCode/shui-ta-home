import { Port, BoardConnection } from '../types';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorageObject extends BaseEntity {
  label: string;
  content?: string;
  nodeType: 'sensor' | 'motor' | 'light';
  position: {
    x: number;
    y: number;
  };
  homes: StorageHome[];
}

export interface StorageBoard extends BaseEntity {
  name: string;
  inputs: Port[];
  outputs: Port[];
  connections: BoardConnection[];
}

export interface StorageHome extends BaseEntity {
  name: string;
  description?: string;
  image?: string;
  objects: StorageObject[];
  boards: StorageBoard[];
}

export interface StorageClient<T extends BaseEntity> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: Omit<T, keyof BaseEntity>): Promise<T>;
  update(id: string, data: Partial<Omit<T, keyof BaseEntity>>): Promise<T>;
  delete(id: string): Promise<void>;
} 