# Implementation Plan: Ponpoto Video Downloader

## Overview

This implementation plan converts the Ponpoto Video Downloader design into actionable coding tasks. The app is a client-side TypeScript web application that downloads and plays videos from Ponpoto URLs, supporting both MP4 and HLS formats, dual and single video modes, and includes a Video Archive for offline viewing.

## Tasks

- [x] 1. Set up project structure and core types
  - [x] 1.1 Create project directory structure and configuration files
    - Set up TypeScript configuration (tsconfig.json)
    - Set up build tooling (Vite or similar bundler)
    - Set up testing framework (Vitest with fast-check)
    - _Requirements: N/A (infrastructure)_
  
  - [x] 1.2 Define core TypeScript interfaces and types
    - Create types for FormatDetectionResult, VideoTypeResult, VideoStream
    - Create types for DownloadProgress, DownloadResult, VideoBlob
    - Create types for AppState, AppError, and error type union
    - Create types for ArchiveEntry, ArchiveEntryWithVideos, EntryMetadata
    - Create types for MediaDirectoryStructure, DownloadDirectory, DownloadedFile
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 12.1, 15.1, 15.2_

- [x] 2. Implement URL Input and Validation
  - [x] 2.1 Create URL Input Component
    - Create HTML structure for URL input field and download button
    - Implement getURL(), setError(), clearError(), setLoading() methods
    - Wire up onDownloadClick event handler
    - _Requirements: 1.1, 1.2_
  
  - [x] 2.2 Implement URL validation logic
    - Validate empty URL returns EMPTY_URL error
    - Validate invalid URL format returns INVALID_URL error
    - _Requirements: 1.3, 1.4_
  
  - [ ]* 2.3 Write property test for URL validation
    - **Property 1: URL Validation Rejects Invalid Inputs**
    - **Validates: Requirements 1.3, 1.4**

- [x] 3. Implement Format and Type Detection
  - [x] 3.1 Implement Format Detector
    - Create detectFormat() function that analyzes URL response
    - Detect MP4 format when .mp4 files found in response
    - Detect HLS format when .ts segments or .m3u8 playlists found
    - Return error when format cannot be determined
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 3.2 Write property test for format detection
    - **Property 2: Format Detection Correctly Identifies Video Format**
    - **Validates: Requirements 2.2, 2.3**
  
  - [x] 3.3 Implement Video Type Detector
    - Create detectType() function that counts video streams
    - Return 'single' when one stream detected
    - Return 'dual' when two streams detected
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 3.4 Write property test for video type detection
    - **Property 3: Video Type Detection Based on Stream Count**
    - **Validates: Requirements 3.2, 3.3**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Download Manager and Progress Reporting
  - [x] 5.1 Create Progress Bar Component
    - Create HTML structure for progress bar and status message
    - Implement show(), hide(), setProgress(), setMessage(), setSegmentInfo() methods
    - _Requirements: 4.2, 5.2, 10.1, 10.2, 11.3, 11.4_
  
  - [x] 5.2 Implement Download Manager core
    - Create download() function that orchestrates the download process
    - Implement cancel() function to abort in-progress downloads
    - Integrate with Format Detector and Type Detector
    - Report progress via callback with increasing percentages
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 10.1, 10.2_
  
  - [ ]* 5.3 Write property test for download progress
    - **Property 5: Download Progress Reporting**
    - **Validates: Requirements 4.2, 5.2, 10.2, 11.3, 11.4**
  
  - [x] 5.4 Implement MP4 download functionality
    - Download MP4 files directly using Fetch API
    - Create blob URLs for downloaded videos
    - Handle download errors with appropriate error types
    - _Requirements: 4.1, 4.3, 4.4_
  
  - [ ]* 5.5 Write property test for successful download
    - **Property 6: Successful Download Loads Videos**
    - **Validates: Requirements 4.3, 5.4**

- [ ] 6. Implement HLS Processing
  - [ ] 6.1 Implement HLS Playlist Parser
    - Create parsePlaylist() function to extract segment URLs from m3u8
    - Handle both relative and absolute URLs
    - _Requirements: 5.1_
  
  - [ ] 6.2 Implement HLS Segment Downloader
    - Download all TS segments with progress reporting
    - Handle individual segment failures with specific error messages
    - _Requirements: 5.1, 5.2, 5.5_
  
  - [ ] 6.3 Implement HLS Segment Concatenation
    - Create concatenateSegments() function to merge ArrayBuffers into single Blob
    - Set correct MIME type (video/mp2t)
    - _Requirements: 5.3_
  
  - [ ]* 6.4 Write property test for HLS concatenation
    - **Property 7: HLS Segment Concatenation Produces Valid Blob**
    - **Validates: Requirements 5.3**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Video Player Component
  - [ ] 8.1 Create base Video Player structure
    - Extend dual-video-player.html template
    - Create setMode() function to switch between 'dual' and 'single' modes
    - Implement loadVideos() to load blob URLs into video elements
    - _Requirements: 3.4, 3.5, 6.1, 7.1_
  
  - [ ]* 8.2 Write property test for player layout
    - **Property 4: Player Layout Matches Video Type**
    - **Validates: Requirements 3.4, 3.5, 6.1, 7.1**
  
  - [ ] 8.3 Implement dual video synchronization
    - Implement syncVideos() to keep both videos at same time position
    - Sync on timeupdate events with 0.15s tolerance
    - _Requirements: 6.2_
  
  - [ ]* 8.4 Write property test for time synchronization
    - **Property 9: Dual Video Time Synchronization**
    - **Validates: Requirements 6.2, 6.6**
  
  - [ ] 8.5 Implement playback controls (play, pause, stop)
    - Implement play() to start both videos simultaneously
    - Implement pause() to pause both videos simultaneously
    - Implement stop() to pause and reset to beginning
    - _Requirements: 6.3, 6.4, 6.5, 7.2_
  
  - [ ]* 8.6 Write property test for playback control synchronization
    - **Property 8: Dual Video Playback Control Synchronization**
    - **Validates: Requirements 6.3, 6.4, 6.5**
  
  - [ ] 8.7 Implement seek functionality
    - Implement seek() to update both videos to same time position
    - Wire up progress bar click handler
    - _Requirements: 6.6, 7.3_
  
  - [ ] 8.8 Implement swap and toggle primary controls
    - Implement swapVideos() to exchange video positions
    - Implement togglePrimary() to switch which video is larger
    - _Requirements: 6.7, 6.8_
  
  - [ ] 8.9 Implement single video mode
    - Hide dual-specific controls (swap, toggle primary) in single mode
    - Display single video container
    - _Requirements: 7.1, 7.4_
  
  - [ ]* 8.10 Write property test for single mode controls
    - **Property 12: Single Mode Hides Dual-Specific Controls**
    - **Validates: Requirements 7.4**

- [ ] 9. Implement Playback Speed and Size Controls
  - [ ] 9.1 Implement speed control
    - Create speed buttons for 0.5x, 1x, 1.25x, 1.5x, 2x
    - Implement setSpeed() to change playbackRate on all videos
    - Visually indicate selected speed
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 9.2 Write property test for speed control
    - **Property 10: Speed Control Applies to All Videos**
    - **Validates: Requirements 8.2**
  
  - [ ] 9.3 Implement size control
    - Create size buttons for small, medium, large
    - Implement setSize() to change container max-width
    - _Requirements: 9.1, 9.2_
  
  - [ ]* 9.4 Write property test for size control
    - **Property 11: Size Control Updates Container**
    - **Validates: Requirements 9.2**
  
  - [ ] 9.5 Implement fullscreen functionality
    - Implement enterFullscreen() using requestFullscreen API
    - _Requirements: 9.3, 9.4_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement Storage and Offline Support
  - [ ] 11.1 Implement Storage Manager with IndexedDB
    - Create saveVideo() to store blobs in IndexedDB
    - Create getVideo() to retrieve blobs from IndexedDB
    - Create hasVideo() to check cache existence
    - Create clearCache() to remove all cached videos
    - _Requirements: 11.2, 11.6_
  
  - [ ]* 11.2 Write property test for storage round trip
    - **Property 14: Storage Persistence Round Trip**
    - **Validates: Requirements 11.2, 11.6**
  
  - [ ] 11.3 Implement playback control gating
    - Disable playback controls until download is complete
    - Enable controls only when downloadStatus is 'complete'
    - _Requirements: 11.1, 11.5, 11.7, 11.8_
  
  - [ ]* 11.4 Write property test for playback gating
    - **Property 13: Playback Disabled Until Download Complete**
    - **Validates: Requirements 11.1, 11.5, 11.8**

- [ ] 12. Implement Title Extractor
  - [ ] 12.1 Implement title extraction from source page
    - Create extractTitle() to parse title from Ponpoto page HTML
    - Create generateDefaultTitle() for fallback when extraction fails
    - _Requirements: 12.3, 12.4_
  
  - [ ]* 12.2 Write property test for title extraction
    - **Property 18: Title Extraction or Default Generation**
    - **Validates: Requirements 12.3, 12.4**

- [ ] 13. Implement Archive Manager
  - [ ] 13.1 Implement Archive Manager core
    - Create createEntry() to store new archive entries
    - Create listEntries() to retrieve all entries sorted by date
    - Create getEntry() to load specific entry with videos
    - _Requirements: 12.1, 12.2, 13.1, 13.2_
  
  - [ ]* 13.2 Write property test for archive entry creation
    - **Property 15: Archive Entry Creation for Downloads**
    - **Validates: Requirements 12.1, 12.2, 13.1**
  
  - [ ]* 13.3 Write property test for archive list ordering
    - **Property 17: Archive Entry List Ordering**
    - **Validates: Requirements 12.1**
  
  - [ ] 13.4 Implement dual video grouping
    - Store both videos under single entry with shared title
    - Return both videos when entry is selected
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [ ]* 13.5 Write property test for dual video grouping
    - **Property 16: Dual Video Grouping in Archive**
    - **Validates: Requirements 13.2, 13.3, 13.4**
  
  - [ ] 13.6 Implement title update functionality
    - Create updateTitle() to modify entry title
    - Persist title changes to storage
    - _Requirements: 12.5_
  
  - [ ] 13.7 Implement entry deletion
    - Create deleteEntry() to remove entry and associated files
    - Remove Download_Directory and all contents
    - _Requirements: 15.5_
  
  - [ ]* 13.8 Write property test for archive deletion
    - **Property 19: Archive Entry Deletion Removes Directory**
    - **Validates: Requirements 15.5**

- [ ] 14. Implement Media Directory Structure
  - [ ] 14.1 Implement media directory organization
    - Create Download_Directory for each archive entry
    - Store metadata.json with entry information
    - Store video files with appropriate naming
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [ ]* 14.2 Write property test for directory structure
    - **Property 20: Media Directory Structure Consistency**
    - **Validates: Requirements 15.2, 15.3, 15.4**

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implement Archive View Component
  - [ ] 16.1 Create Archive View UI
    - Create HTML structure for archive list display
    - Implement render() to display entry list
    - Implement showEmptyState() for when no videos exist
    - _Requirements: 12.1, 12.2, 12.6_
  
  - [ ] 16.2 Implement archive entry selection
    - Wire up onEntrySelect event handler
    - Load selected entry videos into player
    - Set player mode based on entry videoType
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [ ]* 16.3 Write property test for archive selection
    - **Property 21: Archive Selection Loads Correct Player Mode**
    - **Validates: Requirements 14.2, 14.3**
  
  - [ ] 16.3 Implement title editing UI
    - Implement enableTitleEdit(), saveTitleEdit(), cancelTitleEdit()
    - Wire up onTitleEdit event handler
    - _Requirements: 12.5_
  
  - [ ] 16.4 Implement entry deletion UI
    - Add delete button to each entry
    - Wire up onEntryDelete event handler with confirmation
    - _Requirements: 15.5_

- [ ] 17. Implement Error Handling
  - [ ] 17.1 Create Error Display Component
    - Create HTML structure for error messages
    - Implement show(), hide(), showRetry() methods
    - Display appropriate messages for each error type
    - _Requirements: 1.3, 1.4, 2.4, 4.4, 5.5, 10.3, 10.4, 10.5, 11.7_
  
  - [ ] 17.2 Implement error recovery strategies
    - Add retry button for network errors
    - Handle storage quota exceeded errors
    - _Requirements: 10.4, 10.5_

- [ ] 18. Integration and Wiring
  - [ ] 18.1 Wire all components together
    - Connect URL Input to Download Manager
    - Connect Download Manager to Video Player
    - Connect Archive View to Video Player
    - Connect all components to Error Display
    - _Requirements: All_
  
  - [ ] 18.2 Implement main application entry point
    - Initialize all components
    - Set up event listeners
    - Handle application state transitions
    - _Requirements: All_

- [ ] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript as selected by the user
- Testing framework: Vitest with fast-check for property-based testing
