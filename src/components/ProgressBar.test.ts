import { describe, it, expect, beforeEach } from 'vitest';
import { createProgressBarComponent, ProgressBarComponent } from './ProgressBar';

describe('ProgressBarComponent', () => {
  let container: HTMLElement;
  let component: ProgressBarComponent;

  beforeEach(() => {
    container = document.createElement('div');
    component = createProgressBarComponent(container);
  });

  describe('show()', () => {
    it('should make the progress section visible', () => {
      const wrapper = container.querySelector('.progress-section') as HTMLElement;
      expect(wrapper.style.display).toBe('none');
      
      component.show();
      
      expect(wrapper.style.display).toBe('block');
    });
  });

  describe('hide()', () => {
    it('should hide the progress section', () => {
      component.show();
      const wrapper = container.querySelector('.progress-section') as HTMLElement;
      expect(wrapper.style.display).toBe('block');
      
      component.hide();
      
      expect(wrapper.style.display).toBe('none');
    });
  });

  describe('setProgress()', () => {
    it('should update the progress bar width', () => {
      const progressBar = container.querySelector('#progress-bar') as HTMLElement;
      
      component.setProgress(50);
      
      expect(progressBar.style.width).toBe('50%');
    });

    it('should update the progress percentage text', () => {
      const progressPercent = container.querySelector('#progress-percent') as HTMLElement;
      
      component.setProgress(75);
      
      expect(progressPercent.textContent).toBe('75%');
    });

    it('should clamp progress to 0-100 range', () => {
      const progressBar = container.querySelector('#progress-bar') as HTMLElement;
      const progressPercent = container.querySelector('#progress-percent') as HTMLElement;
      
      component.setProgress(-10);
      expect(progressBar.style.width).toBe('0%');
      expect(progressPercent.textContent).toBe('0%');
      
      component.setProgress(150);
      expect(progressBar.style.width).toBe('100%');
      expect(progressPercent.textContent).toBe('100%');
    });

    it('should round decimal percentages', () => {
      const progressPercent = container.querySelector('#progress-percent') as HTMLElement;
      
      component.setProgress(33.7);
      
      expect(progressPercent.textContent).toBe('34%');
    });
  });

  describe('setMessage()', () => {
    it('should update the progress message', () => {
      const progressMessage = container.querySelector('#progress-message') as HTMLElement;
      
      component.setMessage('Downloading video...');
      
      expect(progressMessage.textContent).toBe('Downloading video...');
    });
  });

  describe('setSegmentInfo()', () => {
    it('should display segment info when total > 0', () => {
      const segmentInfo = container.querySelector('#progress-segment-info') as HTMLElement;
      
      component.setSegmentInfo(5, 10);
      
      expect(segmentInfo.textContent).toBe('Segment 5 of 10');
      expect(segmentInfo.style.display).toBe('inline');
    });

    it('should hide segment info when total is 0', () => {
      const segmentInfo = container.querySelector('#progress-segment-info') as HTMLElement;
      
      // First show some segment info
      component.setSegmentInfo(5, 10);
      expect(segmentInfo.style.display).toBe('inline');
      
      // Then hide it
      component.setSegmentInfo(0, 0);
      
      expect(segmentInfo.textContent).toBe('');
      expect(segmentInfo.style.display).toBe('none');
    });
  });

  describe('initial state', () => {
    it('should be hidden by default', () => {
      const wrapper = container.querySelector('.progress-section') as HTMLElement;
      expect(wrapper.style.display).toBe('none');
    });

    it('should have default message', () => {
      const progressMessage = container.querySelector('#progress-message') as HTMLElement;
      expect(progressMessage.textContent).toBe('Preparing download...');
    });

    it('should start at 0%', () => {
      const progressPercent = container.querySelector('#progress-percent') as HTMLElement;
      expect(progressPercent.textContent).toBe('0%');
    });
  });
});
