import { FormatDetectionResult, VideoTypeResult, VideoStream } from '../types';

/**
 * Detects whether content has one or two video streams
 * based on the format detection result.
 */
export function detectType(formatResult: FormatDetectionResult): VideoTypeResult {
  if (formatResult.error) {
    return {
      type: 'single',
      streams: [],
      error: formatResult.error
    };
  }
  
  const urls = formatResult.urls;
  
  if (urls.length === 0) {
    return {
      type: 'single',
      streams: [],
      error: 'No video streams detected'
    };
  }
  
  const streams = createStreamsFromUrls(urls);
  
  return {
    type: streams.length >= 2 ? 'dual' : 'single',
    streams
  };
}

/**
 * Creates VideoStream objects from URLs.
 * First two URLs become primary/secondary for dual mode,
 * single URL becomes main.
 */
function createStreamsFromUrls(urls: string[]): VideoStream[] {
  if (urls.length === 0) {
    return [];
  }
  
  if (urls.length === 1) {
    return [{
      id: 'stream-0',
      url: urls[0],
      label: 'main'
    }];
  }
  
  // Two or more streams - use first two as primary/secondary
  return [
    {
      id: 'stream-0',
      url: urls[0],
      label: 'primary'
    },
    {
      id: 'stream-1',
      url: urls[1],
      label: 'secondary'
    }
  ];
}
