import { BaseEntity, StorageClient } from '../types/storage';

export class LocalStorageClient<T extends BaseEntity> implements StorageClient<T> {
  private storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = `shui-ta-home:${storageKey}`;
    console.log('LocalStorageClient initialized with key:', this.storageKey);
  }

  private getAll(): T[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      console.log(`[Storage:${this.storageKey}] Reading data:`, data);
      const parsedData = data ? JSON.parse(data) : [];
      console.log(`[Storage:${this.storageKey}] Parsed data:`, parsedData);
      return parsedData;
    } catch (error) {
      console.error(`[Storage:${this.storageKey}] Error reading data:`, error);
      return [];
    }
  }

  private saveAll(items: T[]): void {
    try {
      console.log(`[Storage:${this.storageKey}] Saving items:`, items);
      const serializedData = JSON.stringify(items);
      console.log(`[Storage:${this.storageKey}] Serialized data:`, serializedData);
      localStorage.setItem(this.storageKey, serializedData);
      
      // Verify the save
      const savedData = localStorage.getItem(this.storageKey);
      console.log(`[Storage:${this.storageKey}] Verification - Data in storage:`, savedData);
    } catch (error) {
      console.error(`[Storage:${this.storageKey}] Error saving data:`, error);
    }
  }

  async findAll(): Promise<T[]> {
    console.log(`[Storage:${this.storageKey}] Finding all items`);
    const items = this.getAll();
    console.log(`[Storage:${this.storageKey}] Found ${items.length} items`);
    return items;
  }

  async findById(id: string): Promise<T | null> {
    console.log(`[Storage:${this.storageKey}] Finding item with id:`, id);
    const items = this.getAll();
    const item = items.find(item => item.id === id);
    console.log(`[Storage:${this.storageKey}] Found item:`, item);
    return item || null;
  }

  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    console.log(`[Storage:${this.storageKey}] Creating new item with data:`, data);
    const items = this.getAll();
    const newItem = {
      ...data as any,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    } as T;

    console.log(`[Storage:${this.storageKey}] Created item:`, newItem);
    items.push(newItem);
    this.saveAll(items);
    return newItem;
  }

  async update(id: string, data: Partial<Omit<T, keyof BaseEntity>>): Promise<T> {
    console.log(`[Storage:${this.storageKey}] Updating item ${id} with data:`, data);
    const items = this.getAll();
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      console.error(`[Storage:${this.storageKey}] Item ${id} not found for update`);
      throw new Error(`Item with id ${id} not found`);
    }

    const updatedItem = {
      ...items[index],
      ...data,
      updatedAt: Date.now()
    } as T;

    console.log(`[Storage:${this.storageKey}] Updated item:`, updatedItem);
    items[index] = updatedItem;
    this.saveAll(items);
    return updatedItem;
  }

  async delete(id: string): Promise<void> {
    console.log(`[Storage:${this.storageKey}] Deleting item:`, id);
    const items = this.getAll();
    const filteredItems = items.filter(item => item.id !== id);
    console.log(`[Storage:${this.storageKey}] Remaining items after delete:`, filteredItems);
    this.saveAll(filteredItems);
  }
} 