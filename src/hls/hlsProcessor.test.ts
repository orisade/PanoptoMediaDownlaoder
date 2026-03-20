import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parsePlaylist,
  concatenateSegments,
  downloadSegments,
  createHLSProcessor
} from './hlsProcessor';

describe('HLS Processor', () => {
  describe('parsePlaylist', () => {
    it('should extract segment URLs from m3u8 content', () => {
      const content = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
segment0.ts
#EXTINF:10.0,
segment1.ts
#EXTINF:10.0,
segment2.ts
#EXT-X-ENDLIST`;

      const baseUrl = 'https://example.com/video/playlist.m3u8';
      const urls = parsePlaylist(content, baseUrl);

      expect(urls).toHaveLength(3);
      expect(urls[0]).toBe('https://example.com/video/segment0.ts');
      expect(urls[1]).toBe('https://example.com/video/segment1.ts');
      expect(urls[2]).toBe('https://example.com/video/segment2.ts');
    });

    it('should handle absolute URLs in playlist', () => {
      const content = `#EXTM3U
#EXT-X-VERSION:3
#EXTINF:10.0,
https://cdn.example.com/segment0.ts
#EXTINF:10.0,
https://cdn.example.com/segment1.ts
#EXT-X-ENDLIST`;

      const baseUrl = 'https://example.com/video/playlist.m3u8';
      const urls = parsePlaylist(content, baseUrl);

      expect(urls).toHaveLength(2);
      expect(urls[0]).toBe('https://cdn.example.com/segment0.ts');
      expect(urls[1]).toBe('https://cdn.example.com/segment1.ts');
    });

    it('should handle mixed relative and absolute URLs', () => {
      const content = `#EXTM3U
#EXTINF:10.0,
segment0.ts
#EXTINF:10.0,
https://cdn.example.com/segment1.ts
#EXTINF:10.0,
/absolute/path/segment2.ts
#EXT-X-ENDLIST`;

      const baseUrl = 'https://example.com/video/playlist.m3u8';
      const urls = parsePlaylist(content, baseUrl);

      expect(urls).toHaveLength(3);
      expect(urls[0]).toBe('https://example.com/video/segment0.ts');
      expect(urls[1]).toBe('https://cdn.example.com/segment1.ts');
      expect(urls[2]).toBe('https://example.com/absolute/path/segment2.ts');
    });

    it('should skip empty lines and comments', () => {
      const content = `#EXTM3U
#EXT-X-VERSION:3

# This is a comment
#EXTINF:10.0,
segment0.ts

#EXTINF:10.0,
segment1.ts
#EXT-X-ENDLIST`;

      const baseUrl = 'https://example.com/playlist.m3u8';
      const urls = parsePlaylist(content, baseUrl);

      expect(urls).toHaveLength(2);
    });

    it('should return empty array for playlist with no segments', () => {
      const content = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-ENDLIST`;

      const baseUrl = 'https://example.com/playlist.m3u8';
      const urls = parsePlaylist(content, baseUrl);

      expect(urls).toHaveLength(0);
    });

    it('should handle URLs with query parameters', () => {
      const content = `#EXTM3U
#EXTINF:10.0,
segment0.ts?token=abc123
#EXT-X-ENDLIST`;

      const baseUrl = 'https://example.com/video/playlist.m3u8';
      const urls = parsePlaylist(content, baseUrl);

      expect(urls).toHaveLength(1);
      expect(urls[0]).toBe('https://example.com/video/segment0.ts?token=abc123');
    });

    it('should handle subdirectory paths', () => {
      const content = `#EXTM3U
#EXTINF:10.0,
segments/720p/segment0.ts
#EXTINF:10.0,
segments/720p/segment1.ts
#EXT-X-ENDLIST`;

      const baseUrl = 'https://example.com/video/playlist.m3u8';
      const urls = parsePlaylist(content, baseUrl);

      expect(urls).toHaveLength(2);
      expect(urls[0]).toBe('https://example.com/video/segments/720p/segment0.ts');
      expect(urls[1]).toBe('https://example.com/video/segments/720p/segment1.ts');
    });
  });

  describe('concatenateSegments', () => {
    it('should concatenate segments into a single blob with correct MIME type', () => {
      const segment1 = new Uint8Array([1, 2, 3]).buffer;
      const segment2 = new Uint8Array([4, 5, 6]).buffer;
      const segment3 = new Uint8Array([7, 8, 9]).buffer;

      const blob = concatenateSegments([segment1, segment2, segment3]);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('video/mp2t');
      expect(blob.size).toBe(9);
    });

    it('should handle empty segments array', () => {
      const blob = concatenateSegments([]);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('video/mp2t');
      expect(blob.size).toBe(0);
    });

    it('should handle single segment', () => {
      const segment = new Uint8Array([1, 2, 3, 4, 5]).buffer;

      const blob = concatenateSegments([segment]);

      expect(blob.size).toBe(5);
      expect(blob.type).toBe('video/mp2t');
    });

    it('should preserve segment data order', async () => {
      const segment1 = new Uint8Array([1, 2]).buffer;
      const segment2 = new Uint8Array([3, 4]).buffer;

      const blob = concatenateSegments([segment1, segment2]);
      const arrayBuffer = await blob.arrayBuffer();
      const result = new Uint8Array(arrayBuffer);

      expect(Array.from(result)).toEqual([1, 2, 3, 4]);
    });

    it('should handle segments of different sizes', () => {
      const segment1 = new Uint8Array([1]).buffer;
      const segment2 = new Uint8Array([2, 3, 4, 5, 6]).buffer;
      const segment3 = new Uint8Array([7, 8]).buffer;

      const blob = concatenateSegments([segment1, segment2, segment3]);

      expect(blob.size).toBe(8);
    });
  });

  describe('downloadSegments', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      vi.resetAllMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should download all segments and report progress', async () => {
      const mockResponses = [
        new Uint8Array([1, 2, 3]).buffer,
        new Uint8Array([4, 5, 6]).buffer
      ];

      let fetchCallIndex = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        const buffer = mockResponses[fetchCallIndex++];
        return Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(buffer)
        });
      });

      const progressCalls: [number, number][] = [];
      const onProgress = (current: number, total: number) => {
        progressCalls.push([current, total]);
      };

      const segmentUrls = [
        'https://example.com/segment0.ts',
        'https://example.com/segment1.ts'
      ];

      const segments = await downloadSegments(segmentUrls, onProgress);

      expect(segments).toHaveLength(2);
      expect(progressCalls).toEqual([
        [0, 2],
        [1, 2],
        [2, 2]
      ]);
    });

    it('should throw error with segment index on failure', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new Uint8Array([1]).buffer)
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        });

      const segmentUrls = [
        'https://example.com/segment0.ts',
        'https://example.com/segment1.ts'
      ];

      await expect(downloadSegments(segmentUrls, vi.fn())).rejects.toMatchObject({
        type: 'DOWNLOAD_FAILED',
        message: 'Failed to download segment 2 of 2',
        segmentIndex: 1
      });
    });

    it('should handle empty segment list', async () => {
      const progressCalls: [number, number][] = [];
      const onProgress = (current: number, total: number) => {
        progressCalls.push([current, total]);
      };

      const segments = await downloadSegments([], onProgress);

      expect(segments).toHaveLength(0);
      expect(progressCalls).toEqual([[0, 0]]);
    });
  });

  describe('createHLSProcessor', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      vi.resetAllMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should process playlist and return concatenated blob', async () => {
      const playlistContent = `#EXTM3U
#EXTINF:10.0,
segment0.ts
#EXTINF:10.0,
segment1.ts
#EXT-X-ENDLIST`;

      const segment0Data = new Uint8Array([1, 2, 3]).buffer;
      const segment1Data = new Uint8Array([4, 5, 6]).buffer;

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(playlistContent)
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(segment0Data)
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(segment1Data)
        });

      const processor = createHLSProcessor();
      const progressCalls: [number, number][] = [];

      const blob = await processor.processPlaylist(
        'https://example.com/video/playlist.m3u8',
        (current, total) => progressCalls.push([current, total])
      );

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('video/mp2t');
      expect(blob.size).toBe(6);
      expect(progressCalls).toContainEqual([0, 2]);
      expect(progressCalls).toContainEqual([2, 2]);
    });

    it('should throw error when playlist fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const processor = createHLSProcessor();

      await expect(
        processor.processPlaylist('https://example.com/playlist.m3u8', vi.fn())
      ).rejects.toThrow('Failed to fetch playlist');
    });

    it('should throw error when playlist has no segments', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('#EXTM3U\n#EXT-X-ENDLIST')
      });

      const processor = createHLSProcessor();

      await expect(
        processor.processPlaylist('https://example.com/playlist.m3u8', vi.fn())
      ).rejects.toThrow('No segments found in playlist');
    });

    it('should expose parsePlaylist and concatenateSegments methods', () => {
      const processor = createHLSProcessor();

      expect(typeof processor.parsePlaylist).toBe('function');
      expect(typeof processor.concatenateSegments).toBe('function');
    });
  });
});
