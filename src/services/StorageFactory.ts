import { LocalStorageClient } from './LocalStorageClient';
import { StorageObject, StorageBoard, StorageHome } from '../types/storage';

class StorageFactory {
  private static objectClient: LocalStorageClient<StorageObject>;
  private static boardClient: LocalStorageClient<StorageBoard>;
  private static homeClient: LocalStorageClient<StorageHome>;

  static getObjectClient(): LocalStorageClient<StorageObject> {
    console.log('StorageFactory: Getting object client');
    if (!this.objectClient) {
      console.log('StorageFactory: Creating new object client');
      this.objectClient = new LocalStorageClient<StorageObject>('objects');
    }
    return this.objectClient;
  }

  static getBoardClient(): LocalStorageClient<StorageBoard> {
    console.log('StorageFactory: Getting board client');
    if (!this.boardClient) {
      console.log('StorageFactory: Creating new board client');
      this.boardClient = new LocalStorageClient<StorageBoard>('boards');
    }
    return this.boardClient;
  }

  static getHomeClient(): LocalStorageClient<StorageHome> {
    console.log('StorageFactory: Getting home client');
    if (!this.homeClient) {
      console.log('StorageFactory: Creating new home client');
      this.homeClient = new LocalStorageClient<StorageHome>('homes');
    }
    return this.homeClient;
  }
}

export default StorageFactory; 