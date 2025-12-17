/**
 * INTERACTION ENGINE
 *
 * Maps segmentation mask to flower flip states.
 *
 * How it works:
 * 1. Each frame, get current mask from SegmentationEngine
 * 2. For each flower, sample the mask at its screen position
 * 3. If mask value > threshold, trigger flip to colored state
 * 4. If mask value < threshold, trigger flip back to grayscale
 * 5. FlowerGrid handles hysteresis and hold time
 *
 * This creates the "unlocking color" effect as the silhouette moves.
 */

import { CONFIG } from './config.js';

export class InteractionEngine {
  constructor(flowerGrid, segmentationEngine) {
    this.flowerGrid = flowerGrid;
    this.segmentationEngine = segmentationEngine;

    // Sensitivity multiplier (adjustable via UI)
    this.sensitivityMultiplier = 1.0;

    // Enable/disable interaction
    this.enabled = true;
  }

  /**
   * Update interaction (called every frame)
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    if (!this.enabled) return;
    if (!this.segmentationEngine.ready()) return;

    const flowers = this.flowerGrid.getAllFlowers();

    // Process each flower
    for (const flower of flowers) {
      // Get mask value at flower's screen position
      const maskValue = this.getMaskValueAtFlower(flower);

      // Apply sensitivity
      const adjustedMaskValue = this.applysensitivity(maskValue);

      // Update flower state with hysteresis
      this.flowerGrid.setFlowerState(flower, adjustedMaskValue, deltaTime);
    }
  }

  /**
   * Sample mask at flower's screen position
   * @param {Object} flower
   * @returns {number} Mask value 0-1
   */
  getMaskValueAtFlower(flower) {
    const { x, y } = flower.screenPos;

    // Sample mask at screen position
    return this.segmentationEngine.getMaskValueAt(x, y);
  }

  /**
   * Apply sensitivity adjustment to mask value
   * @param {number} maskValue - Raw mask value 0-1
   * @returns {number} Adjusted mask value 0-1
   */
  applysensitivity(maskValue) {
    // Simple power curve for sensitivity
    // Higher sensitivity = easier to trigger
    // Lower sensitivity = harder to trigger

    const adjusted = Math.pow(maskValue, 1 / this.sensitivityMultiplier);
    return Math.max(0, Math.min(1, adjusted));
  }

  /**
   * Set sensitivity (0-2, where 1 is default)
   */
  setSensitivity(value) {
    this.sensitivityMultiplier = Math.max(0.1, Math.min(3, value));
  }

  /**
   * Enable/disable interaction
   */
  setEnabled(enabled) {
    this.enabled = enabled;

    // If disabled, reset all flowers to front state
    if (!enabled) {
      const flowers = this.flowerGrid.getAllFlowers();
      for (const flower of flowers) {
        flower.targetState = 'front';
      }
    }
  }
}
