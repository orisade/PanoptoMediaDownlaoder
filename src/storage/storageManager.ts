/**
 * Storage Manager - Handles caching downloaded videos in IndexedDB for offline access
 * Requirements: 11.2, 11.6
 */

const DB_NAME = 'ponpoto-video-downloader';
const DB_VERSION = 1;
const VIDEO_STORE = 'videos';

export interface StorageManager {
  saveVideo(key: string, blob: Blob): Promise<void>;
  getVideo(key: string): Promise<Blob | null>;
  hasVideo(key: string): Promise<boolean>;
  clearCache(): Promise<void>;
}

class IndexedDBStorageManager implements StorageManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(VIDEO_STORE)) {
          db.createObjectStore(VIDEO_STORE);
        }
      };
    });

    return this.dbPromise;
  }

  async saveVideo(key: string, blob: Blob): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(VIDEO_STORE, 'readwrite');
      const store = transaction.objectStore(VIDEO_STORE);
      
      const request = store.put(blob, key);
      
      request.onerror = () => {
        reject(new Error(`Failed to save video: ${request.error?.message}`));
      };
      
      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async getVideo(key: string): Promise<Blob | null> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(VIDEO_STORE, 'readonly');
      const store = transaction.objectStore(VIDEO_STORE);
      
      const request = store.get(key);
      
      request.onerror = () => {
        reject(new Error(`Failed to get video: ${request.error?.message}`));
      };
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  async hasVideo(key: string): Promise<boolean> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(VIDEO_STORE, 'readonly');
      const store = transaction.objectStore(VIDEO_STORE);
      
      const request = store.count(IDBKeyRange.only(key));
      
      request.onerror = () => {
        reject(new Error(`Failed to check video existence: ${request.error?.message}`));
      };
      
      request.onsuccess = () => {
        resolve(request.result > 0);
      };
    });
  }

  async clearCache(): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(VIDEO_STORE, 'readwrite');
      const store = transaction.objectStore(VIDEO_STORE);
      
      const request = store.clear();
      
      request.onerror = () => {
        reject(new Error(`Failed to clear cache: ${request.error?.message}`));
      };
      
      request.onsuccess = () => {
        resolve();
      };
    });
  }
}

// Singleton instance
let storageManagerInstance: StorageManager | null = null;

export function getStorageManager(): StorageManager {
  if (!storageManagerInstance) {
    storageManagerInstance = new IndexedDBStorageManager();
  }
  return storageManagerInstance;
}

// For testing - allows injecting a mock
export function setStorageManager(manager: StorageManager): void {
  storageManagerInstance = manager;
}

export function createStorageManager(): StorageManager {
  return new IndexedDBStorageManager();
}
