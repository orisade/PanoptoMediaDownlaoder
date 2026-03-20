export interface URLInputComponent {
  urlInput: HTMLInputElement;
  downloadButton: HTMLButtonElement;
  errorDisplay: HTMLElement;
  
  getURL(): string;
  setError(message: string): void;
  clearError(): void;
  setLoading(loading: boolean): void;
  
  onDownloadClick: ((url: string) => void) | null;
}

export function createURLInputComponent(container: HTMLElement): URLInputComponent {
  // Create HTML structure
  const wrapper = document.createElement('div');
  wrapper.className = 'url-input-section';
  wrapper.innerHTML = `
    <div class="url-input-box">
      <label for="ponpoto-url">Ponpoto URL:</label>
      <div class="url-input-row">
        <input type="text" id="ponpoto-url" placeholder="Enter Ponpoto URL..." />
        <button id="download-btn" type="button">Download</button>
      </div>
      <div class="url-error" id="url-error"></div>
    </div>
  `;
  
  container.appendChild(wrapper);
  
  const urlInput = wrapper.querySelector('#ponpoto-url') as HTMLInputElement;
  const downloadButton = wrapper.querySelector('#download-btn') as HTMLButtonElement;
  const errorDisplay = wrapper.querySelector('#url-error') as HTMLElement;
  
  const component: URLInputComponent = {
    urlInput,
    downloadButton,
    errorDisplay,
    onDownloadClick: null,
    
    getURL(): string {
      return urlInput.value.trim();
    },
    
    setError(message: string): void {
      errorDisplay.textContent = message;
      errorDisplay.style.display = 'block';
      urlInput.classList.add('error');
    },
    
    clearError(): void {
      errorDisplay.textContent = '';
      errorDisplay.style.display = 'none';
      urlInput.classList.remove('error');
    },
    
    setLoading(loading: boolean): void {
      downloadButton.disabled = loading;
      downloadButton.textContent = loading ? 'Downloading...' : 'Download';
      urlInput.disabled = loading;
    }
  };
  
  // Wire up event handler
  downloadButton.addEventListener('click', () => {
    if (component.onDownloadClick) {
      component.onDownloadClick(component.getURL());
    }
  });
  
  // Allow Enter key to trigger download
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && component.onDownloadClick) {
      component.onDownloadClick(component.getURL());
    }
  });
  
  return component;
}

// CSS styles for the URL input component
export const urlInputStyles = `
  .url-input-section {
    margin-bottom: 20px;
  }
  
  .url-input-box {
    background: #2a2a2a;
    padding: 15px;
    border-radius: 8px;
    text-align: center;
  }
  
  .url-input-box label {
    display: block;
    margin-bottom: 10px;
    font-size: 1rem;
  }
  
  .url-input-row {
    display: flex;
    gap: 10px;
    justify-content: center;
    align-items: center;
  }
  
  .url-input-row input {
    flex: 1;
    max-width: 500px;
    padding: 10px 15px;
    border: 2px solid #4a4a4a;
    border-radius: 5px;
    background: #1a1a1a;
    color: #fff;
    font-size: 1rem;
  }
  
  .url-input-row input:focus {
    outline: none;
    border-color: #0066cc;
  }
  
  .url-input-row input.error {
    border-color: #cc3333;
  }
  
  .url-input-row input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .url-input-row button {
    padding: 10px 25px;
    background: #0066cc;
    color: #fff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.2s;
  }
  
  .url-input-row button:hover:not(:disabled) {
    background: #0077ee;
  }
  
  .url-input-row button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .url-error {
    display: none;
    color: #ff6666;
    margin-top: 10px;
    font-size: 0.9rem;
  }
`;
