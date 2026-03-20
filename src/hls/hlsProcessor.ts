import { AppError } from '../types';

/**
 * HLS Processor - handles downloading and processing HLS video streams.
 * 
 * Implements:
 * - Playlist parsing (m3u8 format)
 * - Segment downloading with progress reporting
 * - Segment concatenation into a single blob
 */

export interface HLSProcessor {
  /**
   * Downloads all segments from an HLS playlist and concatenates them
   * @param playlistUrl - URL to the m3u8 playlist
   * @param onProgress - Progress callback for segment downloads
   * @returns Concatenated video blob
   */
  processPlaylist(
    playlistUrl: string,
    onProgress: (current: number, total: number) => void
  ): Promise<Blob>;

  /**
   * Parses m3u8 playlist to extract segment URLs
   * @param content - The m3u8 playlist content
   * @param baseUrl - Base URL for resolving relative segment URLs
   * @returns Array of segment URLs
   */
  parsePlaylist(content: string, baseUrl: string): string[];

  /**
   * Concatenates multiple TS segments into a single blob
   * @param segments - Array of ArrayBuffers containing segment data
   * @returns Single Blob with MIME type 'video/mp2t'
   */
  concatenateSegments(segments: ArrayBuffer[]): Blob;
}

/**
 * Parses m3u8 playlist content to extract segment URLs.
 * Handles both relative and absolute URLs.
 * 
 * @param content - The m3u8 playlist content
 * @param baseUrl - Base URL for resolving relative segment URLs
 * @returns Array of fully resolved segment URLs
 */
export function parsePlaylist(content: string, baseUrl: string): string[] {
  const lines = content.split('\n');
  const segmentUrls: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines, comments, and m3u8 directives
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    // This is a segment URL
    const segmentUrl = resolveUrl(trimmedLine, baseUrl);
    segmentUrls.push(segmentUrl);
  }

  return segmentUrls;
}

/**
 * Resolves a URL against a base URL.
 * Handles absolute URLs (starting with http:// or https://) and relative URLs.
 * 
 * @param url - The URL to resolve (may be relative or absolute)
 * @param baseUrl - The base URL for resolution
 * @returns Fully resolved absolute URL
 */
function resolveUrl(url: string, baseUrl: string): string {
  // If URL is already absolute, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Use URL constructor for proper resolution
  try {
    return new URL(url, baseUrl).href;
  } catch {
    // Fallback: manual resolution for edge cases
    if (url.startsWith('/')) {
      // Absolute path - combine with origin
      const urlObj = new URL(baseUrl);
      return `${urlObj.origin}${url}`;
    } else {
      // Relative path - combine with base directory
      const baseDir = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
      return `${baseDir}${url}`;
    }
  }
}

/**
 * Concatenates multiple TS segments into a single Blob.
 * 
 * @param segments - Array of ArrayBuffers containing segment data
 * @returns Single Blob with MIME type 'video/mp2t'
 */
export function concatenateSegments(segments: ArrayBuffer[]): Blob {
  return new Blob(segments, { type: 'video/mp2t' });
}

/**
 * Downloads a single segment and returns its data as ArrayBuffer.
 * 
 * @param url - URL of the segment to download
 * @param signal - AbortSignal for cancellation support
 * @returns ArrayBuffer containing segment data
 * @throws Error with DOWNLOAD_FAILED type if download fails
 */
async function downloadSegment(
  url: string,
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.arrayBuffer();
}

/**
 * Downloads all segments from an HLS playlist with progress reporting.
 * 
 * @param segmentUrls - Array of segment URLs to download
 * @param onProgress - Callback for progress updates (current, total)
 * @param signal - AbortSignal for cancellation support
 * @returns Array of ArrayBuffers containing all segment data
 * @throws AppError with DOWNLOAD_FAILED type and segmentIndex if a segment fails
 */
export async function downloadSegments(
  segmentUrls: string[],
  onProgress: (current: number, total: number) => void,
  signal?: AbortSignal
): Promise<ArrayBuffer[]> {
  const segments: ArrayBuffer[] = [];
  const total = segmentUrls.length;

  for (let i = 0; i < total; i++) {
    // Report progress before downloading each segment
    onProgress(i, total);

    try {
      const segmentData = await downloadSegment(segmentUrls[i], signal);
      segments.push(segmentData);
    } catch (error) {
      // Create specific error with segment index
      const downloadError: AppError = {
        type: 'DOWNLOAD_FAILED',
        message: `Failed to download segment ${i + 1} of ${total}`,
        segmentIndex: i
      };
      throw downloadError;
    }
  }

  // Report final progress
  onProgress(total, total);

  return segments;
}

/**
 * Creates an HLS Processor instance.
 * 
 * @returns HLSProcessor implementation
 */
export function createHLSProcessor(): HLSProcessor {
  let abortController: AbortController | null = null;

  return {
    async processPlaylist(
      playlistUrl: string,
      onProgress: (current: number, total: number) => void
    ): Promise<Blob> {
      abortController = new AbortController();

      try {
        // Fetch the playlist content
        const response = await fetch(playlistUrl, { signal: abortController.signal });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch playlist: HTTP ${response.status}`);
        }

        const playlistContent = await response.text();

        // Parse the playlist to get segment URLs
        const segmentUrls = parsePlaylist(playlistContent, playlistUrl);

        if (segmentUrls.length === 0) {
          throw new Error('No segments found in playlist');
        }

        // Download all segments with progress reporting
        const segments = await downloadSegments(
          segmentUrls,
          onProgress,
          abortController.signal
        );

        // Concatenate segments into a single blob
        return concatenateSegments(segments);
      } finally {
        abortController = null;
      }
    },

    parsePlaylist,

    concatenateSegments
  };
}
