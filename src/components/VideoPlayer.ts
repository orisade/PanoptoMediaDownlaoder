import { VideoBlob, LoadedVideo } from '../types';

export interface VideoPlayerComponent {
  mode: 'dual' | 'single';
  isPlaying: boolean;
  currentSpeed: number;
  controlsEnabled: boolean;
  
  loadVideos(videos: VideoBlob[]): void;
  setMode(mode: 'dual' | 'single'): void;
  play(): void;
  pause(): void;
  stop(): void;
  seek(timeSeconds: number): void;
  setSpeed(rate: number): void;
  setSize(size: 'small' | 'medium' | 'large'): void;
  enterFullscreen(): void;
  swapVideos(): void;
  togglePrimary(): void;
  syncVideos(): void;
  enableControls(): void;
  disableControls(): void;
  
  onTimeUpdate: ((currentTime: number, duration: number) => void) | null;
}

const SYNC_TOLERANCE = 0.15; // seconds

export class VideoPlayer implements VideoPlayerComponent {
  mode: 'dual' | 'single' = 'dual';
  isPlaying = false;
  currentSpeed = 1;
  controlsEnabled = false;
  
  private container: HTMLElement;
  private videoContainer: HTMLElement;
  private wrapper1: HTMLElement;
  private wrapper2: HTMLElement;
  private video1: HTMLVideoElement;
  private video2: HTMLVideoElement;
  private playPauseBtn: HTMLButtonElement;
  private stopBtn: HTMLButtonElement;
  private swapBtn: HTMLButtonElement;
  private togglePrimaryBtn: HTMLButtonElement;
  private progressBar: HTMLElement;
  private progressFill: HTMLElement;
  private timeDisplay: HTMLElement;
  private speedBtns: NodeListOf<HTMLButtonElement>;
  private sizeBtns: { small: HTMLButtonElement; medium: HTMLButtonElement; large: HTMLButtonElement };
  private fullscreenBtn: HTMLButtonElement;
  
  private videos: LoadedVideo[] = [];
  
  onTimeUpdate: ((currentTime: number, duration: number) => void) | null = null;
  
  constructor(containerSelector: string = '.container') {
    this.container = document.querySelector(containerSelector) as HTMLElement;
    this.videoContainer = document.getElementById('videoContainer') as HTMLElement;
    this.wrapper1 = document.getElementById('wrapper1') as HTMLElement;
    this.wrapper2 = document.getElementById('wrapper2') as HTMLElement;
    this.video1 = document.getElementById('video1') as HTMLVideoElement;
    this.video2 = document.getElementById('video2') as HTMLVideoElement;
    this.playPauseBtn = document.getElementById('playPause') as HTMLButtonElement;
    this.stopBtn = document.getElementById('stop') as HTMLButtonElement;
    this.swapBtn = document.getElementById('swap') as HTMLButtonElement;
    this.togglePrimaryBtn = document.getElementById('toggleSize') as HTMLButtonElement;
    this.progressBar = document.getElementById('progressBar') as HTMLElement;
    this.progressFill = document.getElementById('progressFill') as HTMLElement;
    this.timeDisplay = document.getElementById('timeDisplay') as HTMLElement;
    this.speedBtns = document.querySelectorAll('[data-speed]') as NodeListOf<HTMLButtonElement>;
    this.sizeBtns = {
      small: document.getElementById('sizeSmall') as HTMLButtonElement,
      medium: document.getElementById('sizeMedium') as HTMLButtonElement,
      large: document.getElementById('sizeLarge') as HTMLButtonElement,
    };
    this.fullscreenBtn = document.getElementById('fullscreen') as HTMLButtonElement;
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Play/Pause button
    this.playPauseBtn.addEventListener('click', () => {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    });
    
    // Stop button
    this.stopBtn.addEventListener('click', () => this.stop());
    
    // Swap button
    this.swapBtn.addEventListener('click', () => this.swapVideos());
    
    // Toggle primary button
    this.togglePrimaryBtn.addEventListener('click', () => this.togglePrimary());
    
    // Progress bar seek
    this.progressBar.addEventListener('click', (e) => {
      const rect = this.progressBar.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const duration = this.video1.duration || 0;
      if (duration > 0) {
        this.seek(pct * duration);
      }
    });
    
    // Speed buttons
    this.speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.dataset.speed || '1');
        this.setSpeed(speed);
      });
    });
    
    // Size buttons
    this.sizeBtns.small.addEventListener('click', () => this.setSize('small'));
    this.sizeBtns.medium.addEventListener('click', () => this.setSize('medium'));
    this.sizeBtns.large.addEventListener('click', () => this.setSize('large'));
    
    // Fullscreen button
    this.fullscreenBtn.addEventListener('click', () => this.enterFullscreen());
    
    // Video time update and sync
    this.video1.addEventListener('timeupdate', () => {
      this.updateProgress();
      this.syncVideos();
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.video1.currentTime, this.video1.duration || 0);
      }
    });
    
    // Play/pause state sync
    this.video1.addEventListener('play', () => this.updatePlayPauseButton(true));
    this.video1.addEventListener('pause', () => this.updatePlayPauseButton(false));
    this.video2.addEventListener('play', () => this.updatePlayPauseButton(true));
    this.video2.addEventListener('pause', () => this.updatePlayPauseButton(false));
    
    // Click on video to toggle play/pause
    this.video1.addEventListener('click', () => this.togglePlayPause());
    this.video2.addEventListener('click', () => this.togglePlayPause());
  }
  
  private togglePlayPause(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  private updatePlayPauseButton(playing: boolean): void {
    this.isPlaying = playing;
    this.playPauseBtn.textContent = playing ? '⏸ Pause' : '▶ Play';
  }
  
  private updateProgress(): void {
    const current = this.video1.currentTime;
    const duration = this.video1.duration || 0;
    const pct = duration > 0 ? (current / duration) * 100 : 0;
    this.progressFill.style.width = `${pct}%`;
    this.timeDisplay.textContent = `${this.formatTime(current)} / ${this.formatTime(duration)}`;
  }
  
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
  
  loadVideos(videos: VideoBlob[]): void {
    this.videos = videos.map(v => ({
      label: v.label,
      blobUrl: v.blobUrl,
      element: v.label === 'primary' || v.label === 'main' ? this.video1 : this.video2,
    }));
    
    if (videos.length === 1) {
      this.setMode('single');
      this.video1.src = videos[0].blobUrl;
    } else if (videos.length === 2) {
      this.setMode('dual');
      const primary = videos.find(v => v.label === 'primary');
      const secondary = videos.find(v => v.label === 'secondary');
      if (primary) this.video1.src = primary.blobUrl;
      if (secondary) this.video2.src = secondary.blobUrl;
    }
  }
  
  setMode(mode: 'dual' | 'single'): void {
    this.mode = mode;
    
    if (mode === 'single') {
      // Hide second video wrapper and dual-specific controls
      this.wrapper2.style.display = 'none';
      this.swapBtn.style.display = 'none';
      this.togglePrimaryBtn.style.display = 'none';
      // Make first wrapper take full width
      this.wrapper1.classList.remove('primary');
      this.wrapper1.style.flex = '1';
    } else {
      // Show second video wrapper and dual-specific controls
      this.wrapper2.style.display = '';
      this.swapBtn.style.display = '';
      this.togglePrimaryBtn.style.display = '';
      // Restore dual layout
      this.wrapper1.classList.add('primary');
      this.wrapper1.style.flex = '';
    }
  }

  play(): void {
    if (!this.controlsEnabled) return;
    this.syncVideos();
    this.video1.play();
    if (this.mode === 'dual') {
      this.video2.play();
    }
    this.isPlaying = true;
  }
  
  pause(): void {
    if (!this.controlsEnabled) return;
    this.video1.pause();
    if (this.mode === 'dual') {
      this.video2.pause();
    }
    this.isPlaying = false;
  }
  
  stop(): void {
    if (!this.controlsEnabled) return;
    this.video1.pause();
    this.video1.currentTime = 0;
    if (this.mode === 'dual') {
      this.video2.pause();
      this.video2.currentTime = 0;
    }
    this.isPlaying = false;
  }
  
  seek(timeSeconds: number): void {
    if (!this.controlsEnabled) return;
    this.video1.currentTime = timeSeconds;
    if (this.mode === 'dual') {
      this.video2.currentTime = timeSeconds;
    }
  }
  
  syncVideos(): void {
    if (this.mode !== 'dual') return;
    
    const diff = Math.abs(this.video1.currentTime - this.video2.currentTime);
    if (diff > SYNC_TOLERANCE) {
      this.video2.currentTime = this.video1.currentTime;
    }
  }
  
  setSpeed(rate: number): void {
    this.currentSpeed = rate;
    this.video1.playbackRate = rate;
    if (this.mode === 'dual') {
      this.video2.playbackRate = rate;
    }
    
    // Update active button state
    this.speedBtns.forEach(btn => {
      const btnSpeed = parseFloat(btn.dataset.speed || '1');
      btn.classList.toggle('active', btnSpeed === rate);
    });
  }
  
  setSize(size: 'small' | 'medium' | 'large'): void {
    const sizeMap = {
      small: '1000px',
      medium: '1400px',
      large: '100%',
    };
    
    this.container.style.maxWidth = sizeMap[size];
    
    // Update active button state
    Object.entries(this.sizeBtns).forEach(([key, btn]) => {
      btn.classList.toggle('active', key === size);
    });
  }
  
  enterFullscreen(): void {
    if (this.videoContainer.requestFullscreen) {
      this.videoContainer.requestFullscreen();
    }
  }
  
  swapVideos(): void {
    if (this.mode !== 'dual') return;
    
    // Swap DOM positions
    this.videoContainer.insertBefore(this.wrapper2, this.wrapper1);
    
    // Swap classes
    const w1Classes = this.wrapper1.className;
    this.wrapper1.className = this.wrapper2.className;
    this.wrapper2.className = w1Classes;
  }
  
  togglePrimary(): void {
    if (this.mode !== 'dual') return;
    
    this.wrapper1.classList.toggle('primary');
    this.wrapper2.classList.toggle('primary');
  }
  
  enableControls(): void {
    this.controlsEnabled = true;
    this.playPauseBtn.disabled = false;
    this.stopBtn.disabled = false;
    this.swapBtn.disabled = false;
    this.togglePrimaryBtn.disabled = false;
    this.progressBar.style.pointerEvents = 'auto';
    this.speedBtns.forEach(btn => btn.disabled = false);
    this.sizeBtns.small.disabled = false;
    this.sizeBtns.medium.disabled = false;
    this.sizeBtns.large.disabled = false;
    this.fullscreenBtn.disabled = false;
  }
  
  disableControls(): void {
    this.controlsEnabled = false;
    this.playPauseBtn.disabled = true;
    this.stopBtn.disabled = true;
    this.swapBtn.disabled = true;
    this.togglePrimaryBtn.disabled = true;
    this.progressBar.style.pointerEvents = 'none';
    this.speedBtns.forEach(btn => btn.disabled = true);
    this.sizeBtns.small.disabled = true;
    this.sizeBtns.medium.disabled = true;
    this.sizeBtns.large.disabled = true;
    this.fullscreenBtn.disabled = true;
  }
  
  // Getters for testing
  getVideo1(): HTMLVideoElement {
    return this.video1;
  }
  
  getVideo2(): HTMLVideoElement {
    return this.video2;
  }
  
  getWrapper1(): HTMLElement {
    return this.wrapper1;
  }
  
  getWrapper2(): HTMLElement {
    return this.wrapper2;
  }
  
  getSwapButton(): HTMLButtonElement {
    return this.swapBtn;
  }
  
  getTogglePrimaryButton(): HTMLButtonElement {
    return this.togglePrimaryBtn;
  }
  
  getPlayPauseButton(): HTMLButtonElement {
    return this.playPauseBtn;
  }
  
  getStopButton(): HTMLButtonElement {
    return this.stopBtn;
  }
}

export function createVideoPlayer(containerSelector?: string): VideoPlayer {
  return new VideoPlayer(containerSelector);
}
