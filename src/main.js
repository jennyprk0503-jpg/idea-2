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
      console.log('[App] Initializing Flower Flip Camera...');

      // 1. Initialize Three.js scene
      console.log('[App] Step 1/6: Setting up 3D scene...');
      const canvas = document.getElementById('canvas');
      this.sceneManager = new SceneManager(canvas);

      // 2. Create flower grid
      console.log('[App] Step 2/6: Creating flower grid...');
      this.flowerGrid = new FlowerGrid(this.sceneManager);

      // 3. Initialize segmentation engine
      console.log('[App] Step 3/6: Initializing segmentation...');
      this.segmentationEngine = new SegmentationEngine();

      // 4. Create interaction engine
      console.log('[App] Step 4/6: Setting up interaction engine...');
      this.interactionEngine = new InteractionEngine(
        this.flowerGrid,
        this.segmentationEngine
      );

      // 5. Initialize UI controller
      console.log('[App] Step 5/6: Initializing UI...');
      this.uiController = new UIController(
        this.segmentationEngine,
        this.interactionEngine
      );

      // 6. Start webcam and segmentation
      console.log('[App] Step 6/6: Starting camera...');
      this.uiController.updateLoading('Loading MediaPipe model...');

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

      console.log('[App] ✓ Flower Flip Camera initialized successfully!');
      console.log('[App] Move in front of your camera to see flowers flip!');
    } catch (error) {
      console.error('[App] ✗ Initialization failed:', error);
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
