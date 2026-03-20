import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createStorageManager, StorageManager } from './storageManager';

// Use fake-indexeddb for testing
import 'fake-indexeddb/auto';

describe('StorageManager', () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    storageManager = createStorageManager();
  });

  afterEach(async () => {
    await storageManager.clearCache();
  });

  describe('saveVideo and getVideo', () => {
    it('should store and retrieve a video blob', async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const blob = new Blob([testData], { type: 'video/mp4' });
      const key = 'test-video-1';

      await storageManager.saveVideo(key, blob);
      const retrieved = await storageManager.getVideo(key);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.size).toBe(blob.size);
      expect(retrieved!.type).toBe(blob.type);
    });

    it('should return null for non-existent key', async () => {
      const result = await storageManager.getVideo('non-existent-key');
      expect(result).toBeNull();
    });

    it('should overwrite existing video with same key', async () => {
      const key = 'test-video-overwrite';
      const blob1 = new Blob([new Uint8Array([1, 2, 3])], { type: 'video/mp4' });
      const blob2 = new Blob([new Uint8Array([4, 5, 6, 7, 8])], { type: 'video/webm' });

      await storageManager.saveVideo(key, blob1);
      await storageManager.saveVideo(key, blob2);
      
      const retrieved = await storageManager.getVideo(key);
      expect(retrieved!.size).toBe(blob2.size);
      expect(retrieved!.type).toBe(blob2.type);
    });
  });

  describe('hasVideo', () => {
    it('should return true for existing video', async () => {
      const key = 'test-video-exists';
      const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'video/mp4' });

      await storageManager.saveVideo(key, blob);
      const exists = await storageManager.hasVideo(key);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent video', async () => {
      const exists = await storageManager.hasVideo('non-existent-key');
      expect(exists).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should remove all stored videos', async () => {
      const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'video/mp4' });
      
      await storageManager.saveVideo('video-1', blob);
      await storageManager.saveVideo('video-2', blob);
      
      await storageManager.clearCache();
      
      const exists1 = await storageManager.hasVideo('video-1');
      const exists2 = await storageManager.hasVideo('video-2');
      
      expect(exists1).toBe(false);
      expect(exists2).toBe(false);
    });
  });

  describe('round trip preservation', () => {
    it('should preserve blob size and type through storage round trip', async () => {
      const testCases = [
        { data: new Uint8Array([1, 2, 3, 4, 5]), type: 'video/mp4' },
        { data: new Uint8Array([10, 20, 30]), type: 'video/webm' },
        { data: new Uint8Array(1000).fill(255), type: 'video/mp2t' },
      ];

      for (const { data, type } of testCases) {
        const key = `round-trip-${type}`;
        const blob = new Blob([data], { type });

        await storageManager.saveVideo(key, blob);
        const retrieved = await storageManager.getVideo(key);

        expect(retrieved).not.toBeNull();
        expect(retrieved!.size).toBe(blob.size);
        expect(retrieved!.type).toBe(blob.type);
      }
    });
  });
});
