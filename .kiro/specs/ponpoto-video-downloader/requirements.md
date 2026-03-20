# Requirements Document

## Introduction

The Ponpoto Video Downloader App is a web-based application that allows users to download and play videos from Ponpoto URLs. The app supports two video types (dual video with webcam and screen share, or single video) and two download formats (direct MP4 files or HLS .ts segments). The player UI is based on the existing dual-video-player.html template, replacing file upload inputs with URL-based downloading.

## Glossary

- **App**: The Ponpoto Video Downloader web application
- **Ponpoto_URL**: A valid URL pointing to a Ponpoto video resource
- **Dual_Video**: A video recording containing two separate video streams (webcam and screen share)
- **Single_Video**: A video recording containing only one video stream
- **MP4_Format**: Direct MP4 video files that can be downloaded and played directly
- **HLS_Format**: HTTP Live Streaming format consisting of multiple .ts segment files
- **TS_Segment**: A Transport Stream file that is part of an HLS video stream
- **Video_Player**: The synchronized video playback component based on dual-video-player.html
- **URL_Input**: The text input field where users enter the Ponpoto URL
- **Download_Manager**: The component responsible for fetching and processing video files
- **Format_Detector**: The component that determines whether a URL contains MP4 or HLS format videos
- **Progress_Bar**: A visual indicator displaying the percentage of download completion
- **Offline_Mode**: The state when the App operates without an active network connection using locally stored content
- **Video_Archive**: The library view displaying all previously downloaded videos
- **Archive_Entry**: A single item in the Video_Archive representing one download (may contain one or two videos)
- **Media_Directory**: The root directory structure where all downloaded video content is stored
- **Download_Directory**: A subdirectory within Media_Directory containing files for a single Archive_Entry

## Requirements

### Requirement 1: URL Input Interface

**User Story:** As a user, I want to enter a Ponpoto URL, so that I can download and watch videos from that source.

#### Acceptance Criteria

1. THE App SHALL display a URL input field for entering Ponpoto URLs
2. THE App SHALL display a download button to initiate the download process
3. WHEN the user clicks the download button with an empty URL, THE App SHALL display an error message indicating a URL is required
4. WHEN the user enters an invalid URL format, THE App SHALL display an error message indicating the URL is invalid

### Requirement 2: Video Format Detection

**User Story:** As a user, I want the app to automatically detect the video format, so that I don't need to manually specify whether it's MP4 or HLS.

#### Acceptance Criteria

1. WHEN a valid Ponpoto_URL is submitted, THE Format_Detector SHALL analyze the URL to determine the video format
2. WHEN MP4 files are detected in the network response, THE Format_Detector SHALL identify the format as MP4_Format
3. WHEN .ts segment files are detected in the network response, THE Format_Detector SHALL identify the format as HLS_Format
4. IF the Format_Detector cannot determine the video format, THEN THE App SHALL display an error message indicating format detection failed

### Requirement 3: Video Type Detection

**User Story:** As a user, I want the app to automatically detect whether the video is dual or single, so that the appropriate player layout is displayed.

#### Acceptance Criteria

1. WHEN video resources are detected, THE App SHALL determine if the content is Dual_Video or Single_Video
2. WHEN two video streams are detected, THE App SHALL identify the content as Dual_Video
3. WHEN one video stream is detected, THE App SHALL identify the content as Single_Video
4. WHEN Dual_Video is detected, THE App SHALL display the dual video player layout with primary and secondary video containers
5. WHEN Single_Video is detected, THE App SHALL display a single video player layout

### Requirement 4: MP4 Video Download

**User Story:** As a user, I want to download MP4 videos directly, so that I can watch them in the player.

#### Acceptance Criteria

1. WHEN MP4_Format is detected, THE Download_Manager SHALL download the MP4 file(s) from the source
2. WHEN downloading MP4 files, THE App SHALL display a progress indicator showing download status
3. WHEN MP4 download completes successfully, THE Download_Manager SHALL load the video(s) into the Video_Player
4. IF an MP4 download fails, THEN THE App SHALL display an error message with the failure reason

### Requirement 5: HLS Video Download and Processing

**User Story:** As a user, I want to download HLS segmented videos, so that I can watch videos that are delivered in .ts format.

#### Acceptance Criteria

1. WHEN HLS_Format is detected, THE Download_Manager SHALL download all TS_Segment files for the video
2. WHEN downloading HLS segments, THE App SHALL display a progress indicator showing the number of segments downloaded
3. WHEN all TS_Segment files are downloaded, THE Download_Manager SHALL concatenate them into a playable video
4. WHEN HLS processing completes successfully, THE Download_Manager SHALL load the video(s) into the Video_Player
5. IF a TS_Segment download fails, THEN THE App SHALL display an error message indicating which segment failed

### Requirement 6: Dual Video Player

**User Story:** As a user, I want to watch dual videos with synchronized playback, so that I can view webcam and screen share recordings together.

#### Acceptance Criteria

1. WHEN Dual_Video content is loaded, THE Video_Player SHALL display two video containers (primary and secondary)
2. THE Video_Player SHALL synchronize playback between both videos so they play at the same time position
3. WHEN the user clicks play, THE Video_Player SHALL start both videos simultaneously
4. WHEN the user clicks pause, THE Video_Player SHALL pause both videos simultaneously
5. WHEN the user clicks stop, THE Video_Player SHALL stop both videos and reset to the beginning
6. WHEN the user seeks using the progress bar, THE Video_Player SHALL update both videos to the same time position
7. THE Video_Player SHALL provide a swap button to exchange the positions of the two videos
8. THE Video_Player SHALL provide a toggle primary button to switch which video is displayed larger

### Requirement 7: Single Video Player

**User Story:** As a user, I want to watch single videos with standard playback controls, so that I can view recordings that only have one video stream.

#### Acceptance Criteria

1. WHEN Single_Video content is loaded, THE Video_Player SHALL display one video container
2. THE Video_Player SHALL provide play, pause, and stop controls for the single video
3. THE Video_Player SHALL provide a progress bar for seeking within the video
4. THE Video_Player SHALL hide dual-video specific controls (swap, toggle primary) when displaying single video

### Requirement 8: Playback Speed Control

**User Story:** As a user, I want to adjust playback speed, so that I can watch videos faster or slower as needed.

#### Acceptance Criteria

1. THE Video_Player SHALL provide speed control buttons for 0.5x, 1x, 1.25x, 1.5x, and 2x playback speeds
2. WHEN a speed button is clicked, THE Video_Player SHALL change the playback rate of all loaded videos to the selected speed
3. THE Video_Player SHALL visually indicate the currently selected speed

### Requirement 9: Size and Fullscreen Controls

**User Story:** As a user, I want to adjust the player size and enter fullscreen mode, so that I can customize my viewing experience.

#### Acceptance Criteria

1. THE Video_Player SHALL provide size control buttons for small, medium, and large player sizes
2. WHEN a size button is clicked, THE Video_Player SHALL resize the player container accordingly
3. THE Video_Player SHALL provide a fullscreen button
4. WHEN the fullscreen button is clicked, THE Video_Player SHALL enter fullscreen mode for the video container

### Requirement 10: Download Status and Error Handling

**User Story:** As a user, I want to see download progress and clear error messages, so that I know the status of my video download.

#### Acceptance Criteria

1. WHILE downloading videos, THE App SHALL display a status message indicating download is in progress
2. WHILE downloading videos, THE App SHALL display a progress indicator (percentage or segment count)
3. WHEN download completes successfully, THE App SHALL display a success message
4. IF a network error occurs during download, THEN THE App SHALL display an error message describing the network issue
5. IF the Ponpoto_URL is inaccessible, THEN THE App SHALL display an error message indicating the URL cannot be reached


### Requirement 11: Offline Viewing Support

**User Story:** As a user, I want all video media to be fully downloaded before playback begins, so that I can watch videos offline without network interruptions.

#### Acceptance Criteria

1. WHEN a Ponpoto_URL is submitted, THE Download_Manager SHALL download all media files (video, audio, and related assets) before enabling playback
2. THE App SHALL store downloaded content locally in browser storage for offline viewing
3. WHILE downloading media, THE App SHALL display a progress bar showing the percentage of total download completion
4. WHEN download is in progress, THE App SHALL update the progress bar in real-time as data is received
5. WHEN all media downloads complete successfully, THE Video_Player SHALL enable playback controls
6. WHILE offline (no network connection), THE Video_Player SHALL play previously downloaded content without errors
7. IF the download is interrupted before completion, THEN THE App SHALL display an error message and disable playback until download completes
8. THE App SHALL prevent playback from starting until all required media files are fully downloaded


### Requirement 12: Video Archive/Library Display

**User Story:** As a user, I want to see a list of all previously downloaded videos, so that I can easily access and replay my downloaded content.

#### Acceptance Criteria

1. THE App SHALL display a Video_Archive view showing all previously downloaded videos
2. WHEN the Video_Archive is displayed, THE App SHALL show each Archive_Entry with its title
3. THE App SHALL extract video titles automatically from the source web page when available
4. WHERE a title cannot be extracted, THE App SHALL allow the user to provide a custom title for the Archive_Entry
5. THE App SHALL allow the user to edit the title of any Archive_Entry
6. WHEN no videos have been downloaded, THE Video_Archive SHALL display an empty state message


### Requirement 13: Dual Video Grouping in Archive

**User Story:** As a user, I want dual videos to be grouped together as a single entry, so that I can select and play both videos together.

#### Acceptance Criteria

1. WHEN a Dual_Video is downloaded, THE App SHALL store both videos as a single Archive_Entry
2. THE Video_Archive SHALL display Dual_Video content as a single entry with an indicator showing it contains two videos
3. WHEN the user selects a Dual_Video Archive_Entry, THE App SHALL load both videos into the Video_Player together
4. THE Archive_Entry for Dual_Video SHALL share a single title for both videos


### Requirement 14: Archive Video Selection and Playback

**User Story:** As a user, I want to select videos from the archive to play them, so that I can rewatch previously downloaded content.

#### Acceptance Criteria

1. WHEN the user selects an Archive_Entry, THE App SHALL load the associated video(s) into the Video_Player
2. WHEN a Single_Video Archive_Entry is selected, THE App SHALL display the single video player layout
3. WHEN a Dual_Video Archive_Entry is selected, THE App SHALL display the dual video player layout
4. THE App SHALL enable playback controls immediately when loading videos from the Video_Archive


### Requirement 15: Media Directory Storage Structure

**User Story:** As a user, I want downloaded videos to be organized in separate directories, so that my media files are well-organized and easy to manage.

#### Acceptance Criteria

1. THE App SHALL store all downloaded content within a Media_Directory structure
2. WHEN a video is downloaded, THE App SHALL create a unique Download_Directory for that Archive_Entry
3. THE Download_Directory SHALL contain all video files and metadata for the Archive_Entry
4. THE App SHALL store metadata (title, video type, download date) alongside the video files in each Download_Directory
5. WHEN an Archive_Entry is deleted, THE App SHALL remove the corresponding Download_Directory and all its contents
