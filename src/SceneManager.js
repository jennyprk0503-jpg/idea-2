/**
 * SCENE MANAGER
 *
 * Handles Three.js scene setup, camera, lighting, and render loop.
 * Provides a clean interface for other systems to interact with the 3D scene.
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Callback arrays for update loop
    this.updateCallbacks = [];
    this.renderCallbacks = [];

    this.init();
  }

  /**
   * Initialize Three.js scene, camera, renderer, and lighting
   */
  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.scene.background);

    // Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.scene.cameraFOV,
      aspect,
      CONFIG.scene.cameraNear,
      CONFIG.scene.cameraFar
    );

    // Position camera to view grid centered at origin
    this.camera.position.set(0, 0, CONFIG.scene.cameraDistance);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: CONFIG.performance.antialias,
      alpha: false,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, CONFIG.performance.maxPixelRatio)
    );

    // Enable physically correct lighting
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Setup lighting
    this.setupLights();

    // Handle window resize
    window.addEventListener('resize', () => this.onResize());

    // Start render loop
    this.animate();
  }

  /**
   * Setup scene lighting
   * Uses ambient + directional + rim light for depth and dimension
   */
  setupLights() {
    const { ambient, directional, rim } = CONFIG.scene.lighting;

    // Ambient light (soft base illumination)
    const ambientLight = new THREE.AmbientLight(
      ambient.color,
      ambient.intensity
    );
    this.scene.add(ambientLight);

    // Main directional light (key light)
    const dirLight = new THREE.DirectionalLight(
      directional.color,
      directional.intensity
    );
    dirLight.position.set(...directional.position);
    this.scene.add(dirLight);

    // Rim light (back light for depth)
    const rimLight = new THREE.DirectionalLight(
      rim.color,
      rim.intensity
    );
    rimLight.position.set(...rim.position);
    this.scene.add(rimLight);
  }

  /**
   * Handle window resize
   */
  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  /**
   * Register a callback to be called every frame during update phase
   * @param {Function} callback - Function to call with (deltaTime, elapsedTime)
   */
  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  /**
   * Register a callback to be called every frame during render phase
   * @param {Function} callback - Function to call before render
   */
  onRender(callback) {
    this.renderCallbacks.push(callback);
  }

  /**
   * Main animation loop
   */
  animate = () => {
    requestAnimationFrame(this.animate);

    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Call all update callbacks
    for (const callback of this.updateCallbacks) {
      callback(deltaTime, elapsedTime);
    }

    // Call all render callbacks
    for (const callback of this.renderCallbacks) {
      callback();
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Get screen position of a 3D world position
   * @param {THREE.Vector3} worldPosition
   * @returns {{x: number, y: number}} Screen coordinates (0-1 range)
   */
  worldToScreen(worldPosition) {
    const vector = worldPosition.clone();
    vector.project(this.camera);

    return {
      x: (vector.x + 1) / 2,
      y: (1 - vector.y) / 2, // Flip Y because screen coords are top-down
    };
  }

  /**
   * Add an object to the scene
   */
  add(object) {
    this.scene.add(object);
  }

  /**
   * Remove an object from the scene
   */
  remove(object) {
    this.scene.remove(object);
  }

  /**
   * Get current canvas dimensions
   */
  getCanvasSize() {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }
}
