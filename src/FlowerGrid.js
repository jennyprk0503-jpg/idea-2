/**
 * FLOWER GRID SYSTEM
 *
 * Manages a grid of flower instances with:
 * - Efficient rendering using grouped meshes
 * - Individual flip state per flower
 * - Idle animations (breathing, wobbling)
 * - Screen position caching for interaction
 *
 * Each flower is a separate mesh to allow independent rotation/flip.
 */

import * as THREE from 'three';
import { CONFIG, EASING } from './config.js';
import { createFlowerVariations } from './FlowerGeometry.js';
import { createFrontMaterial, createBackMaterial, assignColor } from './FlowerMaterials.js';

export class FlowerGrid {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.flowers = [];
    this.group = new THREE.Group();

    // Flower geometries (variations)
    this.geometries = createFlowerVariations(CONFIG.flower.shapeVariations);

    // Materials
    this.frontMaterial = createFrontMaterial();
    this.backMaterials = new Map(); // Cache materials by color

    this.init();
  }

  /**
   * Initialize the flower grid
   */
  init() {
    const { rows, cols, spacing } = CONFIG.grid;
    const totalFlowers = rows * cols;

    // Calculate grid centering offset
    const gridWidth = (cols - 1) * spacing;
    const gridHeight = (rows - 1) * spacing;
    const offsetX = -gridWidth / 2;
    const offsetY = -gridHeight / 2;

    // Create flowers
    let index = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * spacing + offsetX;
        const y = row * spacing + offsetY;
        const z = CONFIG.grid.zDepth;

        const flower = this.createFlower(x, y, z, index, totalFlowers);
        this.flowers.push(flower);
        this.group.add(flower.mesh);

        index++;
      }
    }

    this.sceneManager.add(this.group);

    // Register update callback for animations
    this.sceneManager.onUpdate((deltaTime, elapsedTime) => {
      this.update(deltaTime, elapsedTime);
    });
  }

  /**
   * Create a single flower instance
   */
  createFlower(x, y, z, index, totalFlowers) {
    // Pick random geometry variation
    const geometryIndex = index % this.geometries.length;
    const geometry = this.geometries[geometryIndex];

    // Assign color
    const colorHex = assignColor(index, totalFlowers);

    // Get or create back material for this color
    if (!this.backMaterials.has(colorHex)) {
      this.backMaterials.set(colorHex, createBackMaterial(colorHex));
    }
    const backMaterial = this.backMaterials.get(colorHex);

    // Create mesh (starts with front material)
    const mesh = new THREE.Mesh(geometry, this.frontMaterial);

    // Position
    mesh.position.set(x, y, z);

    // Random scale variation
    const scaleVariation = 1 + (Math.random() - 0.5) * CONFIG.flower.scaleVariation;
    const baseScale = CONFIG.flower.baseScale * scaleVariation;
    mesh.scale.set(baseScale, baseScale, baseScale);

    // Store original scale for idle animation
    const originalScale = baseScale;

    // Flower state object
    const flower = {
      mesh,
      index,
      position: { x, y, z },

      // Materials
      frontMaterial: this.frontMaterial,
      backMaterial,

      // Flip state
      state: 'front',          // 'front' or 'back'
      targetState: 'front',    // What state we're animating toward
      flipProgress: 0,         // 0 = front, 1 = back
      flipVelocity: 0,         // For smooth animation

      // Hysteresis tracking
      maskValue: 0,            // Current mask overlap value (0-1)
      holdTimer: 0,            // Time mask has been above/below threshold

      // Idle animation
      idlePhase: Math.random() * Math.PI * 2,
      idleSpeed: 1 + (Math.random() - 0.5) * CONFIG.flower.idleAnimation.speedVariation,
      originalScale,

      // Screen position cache (updated per frame)
      screenPos: { x: 0, y: 0 },
    };

    return flower;
  }

  /**
   * Update all flowers (called every frame)
   */
  update(deltaTime, elapsedTime) {
    for (const flower of this.flowers) {
      // Update idle animation
      if (CONFIG.flower.idleAnimation.enabled) {
        this.updateIdleAnimation(flower, elapsedTime);
      }

      // Update flip animation
      this.updateFlipAnimation(flower, deltaTime);

      // Cache screen position for interaction
      this.updateScreenPosition(flower);
    }
  }

  /**
   * Idle animation: subtle breathing and wobble
   */
  updateIdleAnimation(flower, elapsedTime) {
    const { scaleAmount, rotationAmount } = CONFIG.flower.idleAnimation;
    const phase = flower.idlePhase + elapsedTime * flower.idleSpeed;

    // Breathing scale
    const breathe = Math.sin(phase) * scaleAmount;
    const scale = flower.originalScale * (1 + breathe);

    // Wobble rotation
    const wobbleX = Math.sin(phase * 1.3) * rotationAmount;
    const wobbleY = Math.cos(phase * 1.7) * rotationAmount;

    // Apply (don't override flip rotation)
    flower.mesh.scale.set(scale, scale, scale);
    flower.mesh.rotation.x = wobbleX;
    flower.mesh.rotation.z = wobbleY;
  }

  /**
   * Update flip animation based on target state
   */
  updateFlipAnimation(flower, deltaTime) {
    const targetProgress = flower.targetState === 'back' ? 1 : 0;
    const diff = targetProgress - flower.flipProgress;

    // If already at target, skip
    if (Math.abs(diff) < 0.001) {
      flower.flipProgress = targetProgress;
      return;
    }

    // Smooth interpolation with easing
    const speed = 1 / CONFIG.flip.duration;
    flower.flipProgress += diff * speed * deltaTime * 10; // Multiply for responsiveness

    // Clamp
    flower.flipProgress = Math.max(0, Math.min(1, flower.flipProgress));

    // Apply easing
    const easingFunc = EASING[CONFIG.flip.easing] || EASING.easeInOutCubic;
    let easedProgress = easingFunc(flower.flipProgress);

    // Optional bounce
    if (CONFIG.flip.bounce.enabled) {
      const bounceAmount = CONFIG.flip.bounce.amount;
      // Add overshoot near the middle
      if (easedProgress > 0.4 && easedProgress < 0.6) {
        const bouncePhase = (easedProgress - 0.5) * 2; // -1 to 1
        easedProgress += Math.sin(bouncePhase * Math.PI) * bounceAmount;
      }
    }

    // Update rotation (flip on Y axis)
    flower.mesh.rotation.y = easedProgress * Math.PI;

    // Swap material at halfway point
    const isBackFacing = easedProgress > 0.5;
    flower.mesh.material = isBackFacing ? flower.backMaterial : flower.frontMaterial;

    // Update state
    flower.state = isBackFacing ? 'back' : 'front';
  }

  /**
   * Update screen position cache for this flower
   */
  updateScreenPosition(flower) {
    const worldPos = new THREE.Vector3(
      flower.position.x,
      flower.position.y,
      flower.position.z
    );

    flower.screenPos = this.sceneManager.worldToScreen(worldPos);
  }

  /**
   * Get flower at specific grid position
   */
  getFlowerAt(row, col) {
    const { cols } = CONFIG.grid;
    const index = row * cols + col;
    return this.flowers[index];
  }

  /**
   * Get all flowers
   */
  getAllFlowers() {
    return this.flowers;
  }

  /**
   * Set target state for a flower with hysteresis
   * @param {Object} flower - Flower object
   * @param {number} maskValue - Current mask overlap value (0-1)
   * @param {number} deltaTime - Time since last frame
   */
  setFlowerState(flower, maskValue, deltaTime) {
    flower.maskValue = maskValue;

    // Hysteresis thresholds
    const { thresholdOn, thresholdOff, holdTimeMs } = CONFIG.flip;

    // Determine desired state based on threshold
    let desiredState = flower.targetState;

    if (maskValue > thresholdOn) {
      desiredState = 'back';
    } else if (maskValue < thresholdOff) {
      desiredState = 'front';
    }

    // If desired state matches current target, reset hold timer
    if (desiredState === flower.targetState) {
      flower.holdTimer = 0;
      return;
    }

    // Accumulate hold time
    flower.holdTimer += deltaTime * 1000; // Convert to ms

    // If hold time exceeded, commit to new state
    if (flower.holdTimer >= holdTimeMs) {
      flower.targetState = desiredState;
      flower.holdTimer = 0;
    }
  }
}
