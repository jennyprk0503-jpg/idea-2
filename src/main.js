/**
 * FLOWER FLIP CAMERA - MAIN APPLICATION
 *
 * An interactive 3D installation where webcam silhouette reveals color in a grid of flowers.
 *
 * Architecture:
 * - SceneManager: Three.js scene, camera, lighting, render loop
 * - FlowerGrid: Manages grid of 3D flowers with flip animations
 * - SegmentationEngine: Webcam + MediaPipe person segmentation
 * - InteractionEngine: Maps mask to flower states
 * - UIController: Connects HTML controls to systems
 *
 * Flow:
 * 1. Initialize scene and flower grid
 * 2. Start webcam and segmentation
 * 3. Each frame:
 *    - Segmentation produces smoothed mask
 *    - InteractionEngine samples mask at each flower position
 *    - Flowers flip based on overlap with silhouette
 *    - Scene renders with smooth animations
 */

import { SceneManager } from './SceneManager.js';
import { FlowerGrid } from './FlowerGrid.js';
import { SegmentationEngine } from './SegmentationEngine.js';
import { InteractionEngine } from './InteractionEngine.js';
import { UIController } from './UIController.js';

class App {
  constructor() {
    this.sceneManager = null;
    this.flowerGrid = null;
    this.segmentationEngine = null;
    this.interactionEngine = null;
    this.uiController = null;
  }

  async init() {
    try {
      // 1. Initialize Three.js scene
      const canvas = document.getElementById('canvas');
      this.sceneManager = new SceneManager(canvas);

      // 2. Create flower grid
      this.flowerGrid = new FlowerGrid(this.sceneManager);

      // 3. Initialize segmentation engine
      this.segmentationEngine = new SegmentationEngine();

      // 4. Create interaction engine
      this.interactionEngine = new InteractionEngine(
        this.flowerGrid,
        this.segmentationEngine
      );

      // 5. Initialize UI controller
      this.uiController = new UIController(
        this.segmentationEngine,
        this.interactionEngine
      );

      // 6. Start webcam and segmentation
      this.uiController.updateLoading('Starting camera...');

      const success = await this.segmentationEngine.init();

      if (!success) {
        throw new Error(this.segmentationEngine.getError() || 'Camera initialization failed');
      }

      // 7. Register update callback for interaction
      this.sceneManager.onUpdate((deltaTime) => {
        this.interactionEngine.update(deltaTime);
      });

      // 8. Ready!
      this.uiController.showReady();

      console.log('✓ Flower Flip Camera initialized successfully');
    } catch (error) {
      console.error('Initialization failed:', error);
      this.uiController.showError(error.message);
    }
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
  });
} else {
  const app = new App();
  app.init();
}
