export interface ProgressBarComponent {
  show(): void;
  hide(): void;
  setProgress(percent: number): void;
  setMessage(message: string): void;
  setSegmentInfo(current: number, total: number): void;
}

export function createProgressBarComponent(container: HTMLElement): ProgressBarComponent {
  // Create HTML structure
  const wrapper = document.createElement('div');
  wrapper.className = 'progress-section';
  wrapper.innerHTML = `
    <div class="progress-box">
      <div class="progress-message" id="progress-message">Preparing download...</div>
      <div class="progress-bar-container">
        <div class="progress-bar" id="progress-bar"></div>
      </div>
      <div class="progress-details">
        <span class="progress-percent" id="progress-percent">0%</span>
        <span class="progress-segment-info" id="progress-segment-info"></span>
      </div>
    </div>
  `;
  
  container.appendChild(wrapper);
  
  const progressMessage = wrapper.querySelector('#progress-message') as HTMLElement;
  const progressBar = wrapper.querySelector('#progress-bar') as HTMLElement;
  const progressPercent = wrapper.querySelector('#progress-percent') as HTMLElement;
  const progressSegmentInfo = wrapper.querySelector('#progress-segment-info') as HTMLElement;
  
  // Initially hidden
  wrapper.style.display = 'none';
  
  const component: ProgressBarComponent = {
    show(): void {
      wrapper.style.display = 'block';
    },
    
    hide(): void {
      wrapper.style.display = 'none';
    },
    
    setProgress(percent: number): void {
      const clampedPercent = Math.max(0, Math.min(100, percent));
      progressBar.style.width = `${clampedPercent}%`;
      progressPercent.textContent = `${Math.round(clampedPercent)}%`;
    },
    
    setMessage(message: string): void {
      progressMessage.textContent = message;
    },
    
    setSegmentInfo(current: number, total: number): void {
      if (total > 0) {
        progressSegmentInfo.textContent = `Segment ${current} of ${total}`;
        progressSegmentInfo.style.display = 'inline';
      } else {
        progressSegmentInfo.textContent = '';
        progressSegmentInfo.style.display = 'none';
      }
    }
  };
  
  return component;
}

// CSS styles for the progress bar component
export const progressBarStyles = `
  .progress-section {
    margin-bottom: 20px;
  }
  
  .progress-box {
    background: #2a2a2a;
    padding: 15px;
    border-radius: 8px;
  }
  
  .progress-message {
    text-align: center;
    margin-bottom: 10px;
    font-size: 0.95rem;
    color: #ccc;
  }
  
  .progress-bar-container {
    width: 100%;
    height: 20px;
    background: #1a1a1a;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #4a4a4a;
  }
  
  .progress-bar {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #0066cc, #0088ff);
    border-radius: 10px;
    transition: width 0.3s ease;
  }
  
  .progress-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    font-size: 0.85rem;
  }
  
  .progress-percent {
    color: #0088ff;
    font-weight: bold;
  }
  
  .progress-segment-info {
    color: #888;
  }
`;
