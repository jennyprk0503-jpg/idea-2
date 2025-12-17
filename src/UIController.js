/**
 * UI CONTROLLER
 *
 * Connects HTML controls to the application systems.
 * Handles user input and updates CONFIG/system parameters.
 */

import { CONFIG } from './config.js';

export class UIController {
  constructor(segmentationEngine, interactionEngine) {
    this.segmentationEngine = segmentationEngine;
    this.interactionEngine = interactionEngine;

    this.initControls();
    this.updateStatus('Initializing...');
  }

  /**
   * Initialize control event listeners
   */
  initControls() {
    // Sensitivity slider
    const sensitivitySlider = document.getElementById('sensitivity');
    const sensitivityValue = document.getElementById('sensitivity-value');

    sensitivitySlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value) / 50; // 0-2 range
      this.interactionEngine.setSensitivity(value);
      sensitivityValue.textContent = value.toFixed(2);
    });

    // Smoothing slider
    const smoothingSlider = document.getElementById('smoothing');
    const smoothingValue = document.getElementById('smoothing-value');

    smoothingSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value) / 100; // 0-1 range
      this.segmentationEngine.setSmoothingFactor(value);
      smoothingValue.textContent = value.toFixed(2);
    });

    // Flip speed slider
    const flipSpeedSlider = document.getElementById('flip-speed');
    const flipSpeedValue = document.getElementById('flip-speed-value');

    flipSpeedSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value) / 25; // 0.4-2.0 range
      CONFIG.flip.duration = 1 / value; // Inverse for duration
      flipSpeedValue.textContent = `${value.toFixed(1)}x`;
    });

    // Show debug toggle
    const showDebugCheckbox = document.getElementById('show-debug');
    const debugCanvas = document.getElementById('debug-canvas');

    showDebugCheckbox.addEventListener('change', (e) => {
      const show = e.target.checked;
      CONFIG.debug.showMaskCanvas = show;

      if (show) {
        debugCanvas.classList.add('visible');
      } else {
        debugCanvas.classList.remove('visible');
      }
    });

    // Idle animation toggle
    const idleAnimationCheckbox = document.getElementById('idle-animation');

    idleAnimationCheckbox.addEventListener('change', (e) => {
      CONFIG.flower.idleAnimation.enabled = e.target.checked;
    });
  }

  /**
   * Update status message
   */
  updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = type; // 'info', 'ready', 'error'
  }

  /**
   * Update loading screen
   */
  updateLoading(message, hide = false) {
    const loadingEl = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');

    if (hide) {
      loadingEl.classList.add('hidden');
    } else {
      loadingText.textContent = message;
    }
  }

  /**
   * Show error state
   */
  showError(message) {
    this.updateStatus(message, 'error');
    this.updateLoading(`Error: ${message}`, false);
  }

  /**
   * Show ready state
   */
  showReady() {
    this.updateStatus('Ready - Move in front of camera', 'ready');
    this.updateLoading('', true);
  }
}
