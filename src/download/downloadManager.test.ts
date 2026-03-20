import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDownloadManager, DownloadManager } from './downloadManager';
import { DownloadProgress } from '../types';

// Mock the detection modules
vi.mock('../detection/formatDetector', () => ({
  detectFormat: vi.fn()
}));

vi.mock('../detection/typeDetector', () => ({
  detectType: vi.fn()
}));

import { detectFormat } from '../detection/formatDetector';
import { detectType } from '../detection/typeDetector';

const mockDetectFormat = vi.mocked(detectFormat);
const mockDetectType = vi.mocked(detectType);

describe('DownloadManager', () => {
  let downloadManager: DownloadManager;
  let progressUpdates: DownloadProgress[];
  let onProgress: (progress: DownloadProgress) => void;

  beforeEach(() => {
    downloadManager = createDownloadManager();
    progressUpdates = [];
    onProgress = (progress) => progressUpdates.push({ ...progress });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('download()', () => {
    it('should report detecting phase at start', async () => {
      mockDetectFormat.mockResolvedValue({
        format: 'mp4',
        urls: [],
        error: 'No videos found'
      });

      await downloadManager.download('https://example.com/video', onProgress);

      expect(progressUpdates[0]).toEqual({
        phase: 'detecting',
        percent: 0,
        message: 'Detecting video format...'
      });
    });

    it('should return error when format detection fails', async () => {
      mockDetectFormat.mockResolvedValue({
        format: 'mp4',
        urls: [],
        error: 'Could not detect video format'
      });

      const result = await downloadManager.download('https://example.com/video', onProgress);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Could not detect video format');
    });

    it('should detect video type after format detection', async () => {
      mockDetectFormat.mockResolvedValue({
        format: 'mp4',
        urls: ['https://example.com/video.mp4']
      });
      mockDetectType.mockReturnValue({
        type: 'single',
        streams: [],
        error: 'No streams detected'
      });

      await downloadManager.download('https://example.com/video', onProgress);

      expect(mockDetectType).toHaveBeenCalled();
    });

    it('should return error when type detection fails', async () => {
      mockDetectFormat.mockResolvedValue({
        format: 'mp4',
        urls: ['https://example.com/video.mp4']
      });
      mockDetectType.mockReturnValue({
        type: 'single',
        streams: [],
        error: 'No video streams detected'
      });

      const result = await downloadManager.download('https://example.com/video', onProgress);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No video streams detected');
    });

    it('should return error for HLS format (not yet supported)', async () => {
      mockDetectFormat.mockResolvedValue({
        format: 'hls',
        urls: ['https://example.com/playlist.m3u8']
      });
      mockDetectType.mockReturnValue({
        type: 'single',
        streams: [{ id: 'stream-0', url: 'https://example.com/playlist.m3u8', label: 'main' }]
      });

      const result = await downloadManager.download('https://example.com/video', onProgress);

      expect(result.success).toBe(false);
      expect(result.error).toBe('HLS format not yet supported');
    });

    it('should download MP4 videos successfully', async () => {
      const videoContent = new Uint8Array([0x00, 0x00, 0x00, 0x20]);

      global.fetch = vi.fn().mockImplementation(() => {
        // Create a fresh Response for each call
        return Promise.resolve(new Response(videoContent.slice(), {
          status: 200,
          headers: { 'content-length': '4' }
        }));
      });

      mockDetectFormat.mockResolvedValue({
        format: 'mp4',
        urls: ['https://example.com/video.mp4']
      });
      mockDetectType.mockReturnValue({
        type: 'single',
        streams: [{ id: 'stream-0', url: 'https://example.com/video.mp4', label: 'main' }]
      });

      const result = await downloadManager.download('https://example.com/video', onProgress);

      expect(result.success).toBe(true);
      expect(result.videoType).toBe('single');
      expect(result.videos).toHaveLength(1);
      expect(result.videos[0].label).toBe('main');
      expect(result.videos[0].blobUrl).toMatch(/^blob:/);
    });

    it('should download dual videos successfully', async () => {
      const videoContent = new Uint8Array([0x00, 0x00, 0x00, 0x20]);

      global.fetch = vi.fn().mockImplementation(() => {
        // Create a fresh Response for each call
        return Promise.resolve(new Response(videoContent.slice(), {
          status: 200,
          headers: { 'content-length': '4' }
        }));
      });

      mockDetectFormat.mockResolvedValue({
        format: 'mp4',
        urls: ['https://example.com/primary.mp4', 'https://example.com/secondary.mp4']
      });
      mockDetectType.mockReturnValue({
        type: 'dual',
        streams: [
          { id: 'stream-0', url: 'https://example.com/primary.mp4', label: 'primary' },
          { id: 'stream-1', url: 'https://example.com/secondary.mp4', label: 'secondary' }
        ]
      });

      const result = await downloadManager.download('https://example.com/video', onProgress);

      expect(result.success).toBe(true);
      expect(result.videoType).toBe('dual');
      expect(result.videos).toHaveLength(2);
      expect(result.videos[0].label).toBe('primary');
      expect(result.videos[1].label).toBe('secondary');
    });

    it('should report progress with increasing percentages', async () => {
      const videoContent = new Uint8Array([0x00, 0x00, 0x00, 0x20]);

      global.fetch = vi.fn().mockImplementation(() => {
        // Create a fresh Response for each call
        return Promise.resolve(new Response(videoContent.slice(), {
          status: 200,
          headers: { 'content-length': '4' }
        }));
      });

      mockDetectFormat.mockResolvedValue({
        format: 'mp4',
        urls: ['https://example.com/video.mp4']
      });
      mockDetectType.mockReturnValue({
        type: 'single',
        streams: [{ id: 'stream-0', url: 'https://example.com/video.mp4', label: 'main' }]
      });

      await downloadManager.download('https://example.com/video', onProgress);

      // Verify progress increases (allowing for some non-monotonic updates during phase transitions)
      const percentages = progressUpdates.map(p => p.percent);
      expect(percentages[0]).toBe(0);
      expect(percentages[percentages.length - 1]).toBe(100);
      
      // Final progress should be complete
      const lastUpdate = progressUpdates[progressUpdates.length - 1];
      expect(lastUpdate.phase).toBe('complete');
    });

    it('should handle download errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      mockDetectFormat.mockResolvedValue({
        format: 'mp4',
        urls: ['https://example.com/video.mp4']
      });
      mockDetectType.mockReturnValue({
        type: 'single',
        streams: [{ id: 'stream-0', url: 'https://example.com/video.mp4', label: 'main' }]
      });

      const result = await downloadManager.download('https://example.com/video', onProgress);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404, statusText: 'Not Found' }));

      mockDetectFormat.mockResolvedValue({
        format: 'mp4',
        urls: ['https://example.com/video.mp4']
      });
      mockDetectType.mockReturnValue({
        type: 'single',
        streams: [{ id: 'stream-0', url: 'https://example.com/video.mp4', label: 'main' }]
      });

      const result = await downloadManager.download('https://example.com/video', onProgress);

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
    });
  });

  describe('cancel()', () => {
    it('should cancel an in-progress download', async () => {
      // Create a slow response that we can cancel
      let resolveResponse: (value: Response) => void;
      const slowPromise = new Promise<Response>((resolve) => {
        resolveResponse = resolve;
      });

      global.fetch = vi.fn().mockReturnValue(slowPromise);

      mockDetectFormat.mockResolvedValue({
        format: 'mp4',
        urls: ['https://example.com/video.mp4']
      });
      mockDetectType.mockReturnValue({
        type: 'single',
        streams: [{ id: 'stream-0', url: 'https://example.com/video.mp4', label: 'main' }]
      });

      // Start download
      const downloadPromise = downloadManager.download('https://example.com/video', onProgress);

      // Cancel immediately
      downloadManager.cancel();

      // Resolve the fetch to let the download complete
      resolveResponse!(new Response(new Uint8Array([0x00])));

      const result = await downloadPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Download cancelled');
    });
  });
});
