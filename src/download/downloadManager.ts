import { detectFormat } from '../detection/formatDetector';
import { detectType } from '../detection/typeDetector';
import {
  DownloadProgress,
  DownloadResult,
  ProgressCallback,
  VideoBlob,
  FormatDetectionResult,
  VideoTypeResult
} from '../types';

export interface DownloadManager {
  download(url: string, onProgress: ProgressCallback): Promise<DownloadResult>;
  cancel(): void;
}

/**
 * Creates a Download Manager that orchestrates the video download process.
 * Integrates with Format Detector and Type Detector, reports progress,
 * and handles MP4 downloads (HLS support to be added later).
 */
export function createDownloadManager(): DownloadManager {
  let abortController: AbortController | null = null;
  let isCancelled = false;

  return {
    async download(url: string, onProgress: ProgressCallback): Promise<DownloadResult> {
      isCancelled = false;
      abortController = new AbortController();

      try {
        // Phase 1: Detecting format (0-10%)
        onProgress({
          phase: 'detecting',
          percent: 0,
          message: 'Detecting video format...'
        });

        if (isCancelled) {
          return createCancelledResult();
        }

        const formatResult = await detectFormat(url);
        
        onProgress({
          phase: 'detecting',
          percent: 5,
          message: `Detected ${formatResult.format.toUpperCase()} format`
        });

        if (formatResult.error) {
          return {
            success: false,
            videoType: 'single',
            videos: [],
            error: formatResult.error
          };
        }

        if (isCancelled) {
          return createCancelledResult();
        }

        // Phase 2: Detecting video type (10-15%)
        onProgress({
          phase: 'detecting',
          percent: 10,
          message: 'Detecting video type...'
        });

        const typeResult = detectType(formatResult);

        onProgress({
          phase: 'detecting',
          percent: 15,
          message: `Detected ${typeResult.type} video (${typeResult.streams.length} stream${typeResult.streams.length !== 1 ? 's' : ''})`
        });

        if (typeResult.error) {
          return {
            success: false,
            videoType: typeResult.type,
            videos: [],
            error: typeResult.error
          };
        }

        if (isCancelled) {
          return createCancelledResult();
        }

        // Phase 3: Downloading videos (15-95%)
        onProgress({
          phase: 'downloading',
          percent: 15,
          message: 'Starting download...'
        });

        let videos: VideoBlob[];

        if (formatResult.format === 'mp4') {
          videos = await downloadMP4Videos(
            typeResult,
            abortController.signal,
            (downloadPercent, message) => {
              // Map download progress from 15% to 95%
              const mappedPercent = 15 + (downloadPercent * 0.8);
              onProgress({
                phase: 'downloading',
                percent: mappedPercent,
                message
              });
            }
          );
        } else {
          // HLS format - to be implemented in Task 6
          return {
            success: false,
            videoType: typeResult.type,
            videos: [],
            error: 'HLS format not yet supported'
          };
        }

        if (isCancelled) {
          // Clean up blob URLs if cancelled
          videos.forEach(v => URL.revokeObjectURL(v.blobUrl));
          return createCancelledResult();
        }

        // Phase 4: Complete (95-100%)
        onProgress({
          phase: 'processing',
          percent: 95,
          message: 'Finalizing...'
        });

        onProgress({
          phase: 'complete',
          percent: 100,
          message: 'Download complete!'
        });

        return {
          success: true,
          videoType: typeResult.type,
          videos
        };

      } catch (error) {
        if (isCancelled || (error instanceof Error && error.name === 'AbortError')) {
          return createCancelledResult();
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          videoType: 'single',
          videos: [],
          error: `Download failed: ${errorMessage}`
        };
      } finally {
        abortController = null;
      }
    },

    cancel(): void {
      isCancelled = true;
      if (abortController) {
        abortController.abort();
      }
    }
  };
}

/**
 * Downloads MP4 video files and creates blob URLs.
 */
async function downloadMP4Videos(
  typeResult: VideoTypeResult,
  signal: AbortSignal,
  onProgress: (percent: number, message: string) => void
): Promise<VideoBlob[]> {
  const videos: VideoBlob[] = [];
  const totalStreams = typeResult.streams.length;

  for (let i = 0; i < totalStreams; i++) {
    const stream = typeResult.streams[i];
    const streamProgress = (i / totalStreams) * 100;
    
    onProgress(
      streamProgress,
      `Downloading ${stream.label} video (${i + 1}/${totalStreams})...`
    );

    const blob = await downloadFile(stream.url, signal, (filePercent) => {
      // Calculate overall progress for this stream
      const overallPercent = ((i + filePercent / 100) / totalStreams) * 100;
      onProgress(
        overallPercent,
        `Downloading ${stream.label} video... ${Math.round(filePercent)}%`
      );
    });

    const blobUrl = URL.createObjectURL(blob);
    
    videos.push({
      label: stream.label,
      blob,
      blobUrl
    });
  }

  return videos;
}

/**
 * Downloads a single file with progress reporting.
 */
async function downloadFile(
  url: string,
  signal: AbortSignal,
  onProgress: (percent: number) => void
): Promise<Blob> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  if (!response.body) {
    // Fallback for browsers without streaming support
    const blob = await response.blob();
    onProgress(100);
    return blob;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    received += value.length;

    if (total > 0) {
      onProgress((received / total) * 100);
    } else {
      // Unknown total size - report indeterminate progress
      onProgress(Math.min(received / 1000000 * 10, 90)); // Rough estimate
    }
  }

  onProgress(100);
  
  // Determine MIME type from URL or default to video/mp4
  const mimeType = getMimeTypeFromUrl(url);
  return new Blob(chunks, { type: mimeType });
}

/**
 * Determines MIME type from URL extension.
 */
function getMimeTypeFromUrl(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase().split('?')[0];
  
  switch (extension) {
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'ts':
      return 'video/mp2t';
    case 'm3u8':
      return 'application/vnd.apple.mpegurl';
    default:
      return 'video/mp4';
  }
}

/**
 * Creates a result object for cancelled downloads.
 */
function createCancelledResult(): DownloadResult {
  return {
    success: false,
    videoType: 'single',
    videos: [],
    error: 'Download cancelled'
  };
}
