// Format Detection Types
export interface FormatDetectionResult {
  format: 'mp4' | 'hls';
  urls: string[];
  error?: string;
}

// Video Type Detection Types
export interface VideoTypeResult {
  type: 'dual' | 'single';
  streams: VideoStream[];
  error?: string;
}

export interface VideoStream {
  id: string;
  url: string;
  label: 'primary' | 'secondary' | 'main';
}

// Download Types
export interface DownloadProgress {
  phase: 'detecting' | 'downloading' | 'processing' | 'complete';
  percent: number;
  message: string;
  segmentInfo?: {
    current: number;
    total: number;
  };
}

export type ProgressCallback = (progress: DownloadProgress) => void;

export interface DownloadResult {
  success: boolean;
  videoType: 'dual' | 'single';
  videos: VideoBlob[];
  error?: string;
}

export interface VideoBlob {
  label: string;
  blob: Blob;
  blobUrl: string;
}


// App State Types
export interface AppState {
  url: string;
  urlError: string | null;
  downloadStatus: 'idle' | 'detecting' | 'downloading' | 'processing' | 'complete' | 'error';
  downloadProgress: number;
  downloadMessage: string;
  downloadError: string | null;
  videoFormat: 'mp4' | 'hls' | null;
  videoType: 'dual' | 'single' | null;
  videos: LoadedVideo[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  playerSize: 'small' | 'medium' | 'large';
  primaryVideoIndex: number;
}

export interface LoadedVideo {
  label: string;
  blobUrl: string;
  element: HTMLVideoElement;
}

// Error Types
export type AppError =
  | { type: 'EMPTY_URL'; message: string }
  | { type: 'INVALID_URL'; message: string }
  | { type: 'FORMAT_DETECTION_FAILED'; message: string }
  | { type: 'NETWORK_ERROR'; message: string; details?: string }
  | { type: 'URL_INACCESSIBLE'; message: string }
  | { type: 'DOWNLOAD_FAILED'; message: string; segmentIndex?: number }
  | { type: 'PROCESSING_FAILED'; message: string }
  | { type: 'ARCHIVE_LOAD_FAILED'; message: string }
  | { type: 'ENTRY_NOT_FOUND'; message: string; entryId: string }
  | { type: 'TITLE_UPDATE_FAILED'; message: string; entryId: string }
  | { type: 'ENTRY_DELETE_FAILED'; message: string; entryId: string }
  | { type: 'STORAGE_QUOTA_EXCEEDED'; message: string };

// Archive Types
export interface ArchiveEntry {
  id: string;
  title: string;
  videoType: 'dual' | 'single';
  sourceUrl: string;
  downloadDate: Date;
  directoryPath: string;
  videoCount: number;
}

export interface ArchiveEntryWithVideos extends ArchiveEntry {
  videos: VideoBlob[];
}

export interface EntryMetadata {
  id: string;
  title: string;
  videoType: 'dual' | 'single';
  sourceUrl: string;
  downloadDate: string;
  videos: VideoFileInfo[];
}

export interface VideoFileInfo {
  label: string;
  filename: string;
  mimeType: string;
  size: number;
}

// Media Directory Types
export interface MediaDirectoryStructure {
  rootPath: string;
  entries: Map<string, DownloadDirectory>;
}

export interface DownloadDirectory {
  entryId: string;
  path: string;
  files: DownloadedFile[];
}

export interface DownloadedFile {
  name: string;
  type: 'video' | 'metadata';
  mimeType: string;
  size: number;
}

// HLS Types
export interface HLSPlaylist {
  version: number;
  targetDuration: number;
  segments: HLSSegment[];
}

export interface HLSSegment {
  url: string;
  duration: number;
  sequence: number;
}
