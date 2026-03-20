import { FormatDetectionResult } from '../types';

/**
 * Detects whether the URL contains MP4 or HLS format videos
 * by analyzing the response content for video file references.
 */
export async function detectFormat(url: string): Promise<FormatDetectionResult> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        format: 'mp4',
        urls: [],
        error: `URL inaccessible: ${response.status}`
      };
    }
    
    const content = await response.text();
    return detectFormatFromContent(content, url);
  } catch (error) {
    return {
      format: 'mp4',
      urls: [],
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Analyzes content string to detect video format.
 * Exported for testing purposes.
 */
export function detectFormatFromContent(content: string, baseUrl: string): FormatDetectionResult {
  const mp4Urls = extractMp4Urls(content, baseUrl);
  const hlsUrls = extractHlsUrls(content, baseUrl);
  
  // If both formats found, prioritize HLS (more specific)
  if (hlsUrls.length > 0) {
    return {
      format: 'hls',
      urls: hlsUrls
    };
  }
  
  if (mp4Urls.length > 0) {
    return {
      format: 'mp4',
      urls: mp4Urls
    };
  }
  
  return {
    format: 'mp4',
    urls: [],
    error: 'Could not detect video format. The URL may not contain valid video content'
  };
}

/**
 * Extracts MP4 file URLs from content.
 */
function extractMp4Urls(content: string, baseUrl: string): string[] {
  const mp4Pattern = /["']([^"']*\.mp4)["']/gi;
  const urls: string[] = [];
  let match;
  
  while ((match = mp4Pattern.exec(content)) !== null) {
    const url = resolveUrl(match[1], baseUrl);
    if (!urls.includes(url)) {
      urls.push(url);
    }
  }
  
  return urls;
}

/**
 * Extracts HLS playlist URLs (.m3u8) or TS segment URLs from content.
 */
function extractHlsUrls(content: string, baseUrl: string): string[] {
  const m3u8Pattern = /["']([^"']*\.m3u8)["']/gi;
  const tsPattern = /["']([^"']*\.ts)["']/gi;
  const urls: string[] = [];
  let match;
  
  // First look for m3u8 playlists
  while ((match = m3u8Pattern.exec(content)) !== null) {
    const url = resolveUrl(match[1], baseUrl);
    if (!urls.includes(url)) {
      urls.push(url);
    }
  }
  
  // If no m3u8 found, look for .ts segments
  if (urls.length === 0) {
    while ((match = tsPattern.exec(content)) !== null) {
      const url = resolveUrl(match[1], baseUrl);
      if (!urls.includes(url)) {
        urls.push(url);
      }
    }
  }
  
  return urls;
}

/**
 * Resolves a potentially relative URL against a base URL.
 */
function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}
