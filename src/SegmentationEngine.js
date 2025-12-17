/**
 * SEGMENTATION ENGINE
 *
 * Handles webcam access and real-time person segmentation using MediaPipe.
 * Outputs a smoothed, processed mask that can be used for interaction.
 *
 * Key features:
 * - MediaPipe Selfie Segmentation for person silhouette
 * - Temporal smoothing (EMA) to reduce jitter
 * - Spatial blur for soft edges
 * - Frame rate limiting for performance
 * - Debug visualization
 */

import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { Camera } from '@mediapipe/camera_utils';
import { CONFIG } from './config.js';

export class SegmentationEngine {
  constructor() {
    this.videoElement = document.getElementById('webcam');
    this.debugCanvas = document.getElementById('debug-canvas');
    this.debugCtx = this.debugCanvas.getContext('2d', { willReadFrequently: true });

    // Mask data (RGBA)
    this.maskWidth = CONFIG.camera.maskWidth;
    this.maskHeight = CONFIG.camera.maskHeight;
    this.currentMask = null;
    this.previousMask = null;

    // Temporal smoothing
    this.smoothingFactor = CONFIG.camera.temporalSmoothing;

    // Frame rate limiting
    this.maxFPS = CONFIG.camera.maxFPS;
    this.lastProcessTime = 0;
    this.frameInterval = this.maxFPS ? 1000 / this.maxFPS : 0;

    // Status
    this.isReady = false;
    this.error = null;

    // Callbacks
    this.onMaskUpdateCallback = null;
  }

  /**
   * Initialize webcam and segmentation
   */
  async init() {
    try {
      // Initialize MediaPipe Selfie Segmentation
      this.segmentation = new SelfieSegmentation({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
        }
      });

      this.segmentation.setOptions({
        modelSelection: CONFIG.camera.modelSelection,
        selfieMode: true, // Mirror for natural interaction
      });

      this.segmentation.onResults((results) => this.onResults(results));

      // Setup webcam
      const camera = new Camera(this.videoElement, {
        onFrame: async () => {
          // Frame rate limiting
          const now = Date.now();
          if (this.frameInterval && now - this.lastProcessTime < this.frameInterval) {
            return;
          }
          this.lastProcessTime = now;

          await this.segmentation.send({ image: this.videoElement });
        },
        width: this.maskWidth,
        height: this.maskHeight,
      });

      await camera.start();

      this.camera = camera;
      this.isReady = true;

      return true;
    } catch (err) {
      console.error('Segmentation initialization failed:', err);
      this.error = err.message;
      return false;
    }
  }

  /**
   * Process segmentation results
   */
  onResults(results) {
    if (!results.segmentationMask) return;

    // Get mask as ImageData
    const maskImageData = this.extractMaskData(results.segmentationMask);

    // Apply temporal smoothing
    const smoothedMask = this.applyTemporalSmoothing(maskImageData);

    // Apply spatial blur if enabled
    const processedMask = CONFIG.camera.spatialBlur.enabled
      ? this.applySpatialBlur(smoothedMask)
      : smoothedMask;

    // Store current mask
    this.currentMask = processedMask;

    // Update debug visualization if enabled
    if (CONFIG.debug.showMaskCanvas) {
      this.updateDebugCanvas(processedMask);
    }

    // Trigger callback
    if (this.onMaskUpdateCallback) {
      this.onMaskUpdateCallback(processedMask);
    }
  }

  /**
   * Extract mask data from MediaPipe result
   * @param {ImageData|HTMLCanvasElement} segmentationMask
   * @returns {ImageData}
   */
  extractMaskData(segmentationMask) {
    // Create temporary canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.maskWidth;
    tempCanvas.height = this.maskHeight;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

    // Draw mask
    tempCtx.drawImage(segmentationMask, 0, 0, this.maskWidth, this.maskHeight);

    // Get image data
    return tempCtx.getImageData(0, 0, this.maskWidth, this.maskHeight);
  }

  /**
   * Apply temporal smoothing (Exponential Moving Average)
   * Reduces jitter by blending with previous frame
   */
  applyTemporalSmoothing(currentMaskData) {
    if (!this.previousMask) {
      // First frame, no smoothing
      this.previousMask = new ImageData(
        new Uint8ClampedArray(currentMaskData.data),
        this.maskWidth,
        this.maskHeight
      );
      return currentMaskData;
    }

    const smoothed = new ImageData(this.maskWidth, this.maskHeight);
    const alpha = this.smoothingFactor;

    // EMA: smoothed = alpha * current + (1 - alpha) * previous
    for (let i = 0; i < currentMaskData.data.length; i += 4) {
      // Only smooth the R channel (mask value), keep others
      const currentVal = currentMaskData.data[i];
      const previousVal = this.previousMask.data[i];

      const smoothedVal = alpha * currentVal + (1 - alpha) * previousVal;

      smoothed.data[i] = smoothedVal;     // R
      smoothed.data[i + 1] = smoothedVal; // G
      smoothed.data[i + 2] = smoothedVal; // B
      smoothed.data[i + 3] = 255;         // A
    }

    // Update previous mask
    this.previousMask = new ImageData(
      new Uint8ClampedArray(smoothed.data),
      this.maskWidth,
      this.maskHeight
    );

    return smoothed;
  }

  /**
   * Apply spatial blur to soften mask edges
   * Simple box blur for performance
   */
  applySpatialBlur(maskData) {
    const radius = CONFIG.camera.spatialBlur.radius;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.maskWidth;
    tempCanvas.height = this.maskHeight;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

    // Draw current mask
    tempCtx.putImageData(maskData, 0, 0);

    // Apply blur using canvas filter (fast)
    tempCtx.filter = `blur(${radius}px)`;
    tempCtx.drawImage(tempCanvas, 0, 0);

    return tempCtx.getImageData(0, 0, this.maskWidth, this.maskHeight);
  }

  /**
   * Update debug canvas visualization
   */
  updateDebugCanvas(maskData) {
    this.debugCtx.putImageData(maskData, 0, 0);
  }

  /**
   * Register callback for mask updates
   */
  onMaskUpdate(callback) {
    this.onMaskUpdateCallback = callback;
  }

  /**
   * Get current mask data
   */
  getCurrentMask() {
    return this.currentMask;
  }

  /**
   * Get mask value at normalized screen coordinates (0-1)
   * @param {number} x - Normalized X (0-1)
   * @param {number} y - Normalized Y (0-1)
   * @returns {number} Mask value 0-1
   */
  getMaskValueAt(x, y) {
    if (!this.currentMask) return 0;

    // Convert to mask pixel coordinates
    const px = Math.floor(x * this.maskWidth);
    const py = Math.floor(y * this.maskHeight);

    // Bounds check
    if (px < 0 || px >= this.maskWidth || py < 0 || py >= this.maskHeight) {
      return 0;
    }

    // Get pixel index
    const index = (py * this.maskWidth + px) * 4;

    // Return normalized value (0-1)
    return this.currentMask.data[index] / 255;
  }

  /**
   * Update smoothing factor
   */
  setSmoothingFactor(value) {
    this.smoothingFactor = Math.max(0, Math.min(1, value));
  }

  /**
   * Check if segmentation is ready
   */
  ready() {
    return this.isReady;
  }

  /**
   * Get any error that occurred
   */
  getError() {
    return this.error;
  }
}
