export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface StorageObject extends BaseEntity {
  label: string;
  content?: string;
  nodeType: 'sensor' | 'motor' | 'light';
  position: {
    x: number;
    y: number;
  };
}

export interface StorageBoard extends BaseEntity {
  label: string;
  content?: string;
  position: {
    x: number;
    y: number;
  };
  ports: BoardPort[];
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