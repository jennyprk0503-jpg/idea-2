/**
 * CONFIGURATION FILE
 *
 * Central place for all tunable parameters.
 * Adjust these values to change behavior without diving into implementation code.
 */

export const CONFIG = {
  // ============================================================
  // FLOWER GRID LAYOUT
  // ============================================================
  grid: {
    rows: 8,              // Number of flower rows
    cols: 12,             // Number of flower columns
    spacing: 1.2,         // Space between flowers (world units)
    zDepth: 0,            // Base Z position of grid
  },

  // ============================================================
  // FLOWER VISUAL PROPERTIES
  // ============================================================
  flower: {
    baseScale: 0.4,       // Base size of each flower
    scaleVariation: 0.15, // Random scale variance (0-1)

    // Idle animation (subtle breathing/wobble)
    idleAnimation: {
      enabled: true,
      scaleAmount: 0.03,    // How much flowers "breathe"
      rotationAmount: 0.05, // Subtle rotation wobble
      speedVariation: 0.3,  // Speed variance per flower
    },

    // Number of flower shape variations to generate
    shapeVariations: 8,
  },

  // ============================================================
  // COLOR PALETTE (from reference image)
  // ============================================================
  colors: {
    palette: [
      '#FF845E',  // Coral
      '#F549B8',  // Bubblegum Pink
      '#FFE382',  // Jasmine
      '#D7F9F1',  // Mint Green
      '#9AD4D6',  // Tiffany Blue
      '#C9BBF4',  // Periwinkle
    ],

    // How colors are assigned to flowers
    // Options: 'random', 'tiled', 'clustered'
    assignmentMode: 'random',
  },

  // ============================================================
  // MATERIAL / JELLY LOOK
  // ============================================================
  materials: {
    // Grayscale front face properties
    front: {
      color: '#e8e8e8',
      roughness: 0.4,
      metalness: 0.1,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
    },

    // Colored back face properties (glossy/jelly)
    back: {
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      transmission: 0.05,    // Slight translucency
    },
  },

  // ============================================================
  // FLIP ANIMATION
  // ============================================================
  flip: {
    duration: 0.8,          // Seconds for a full flip
    easing: 'easeInOutCubic', // Easing function name

    // Hysteresis: different thresholds for flip-on vs flip-off
    // Prevents jitter at threshold boundary
    thresholdOn: 0.55,      // Mask value to trigger flip to colored
    thresholdOff: 0.45,     // Mask value to trigger flip back to grayscale

    // Hold time: require overlap for this duration before flipping
    holdTimeMs: 150,        // Milliseconds

    // Optional bounce/wobble when crossing halfway point
    bounce: {
      enabled: true,
      amount: 0.08,         // Overshoot amount
    },
  },

  // ============================================================
  // CAMERA / SEGMENTATION
  // ============================================================
  camera: {
    // MediaPipe Selfie Segmentation model
    // Options: 0 (general, 256x256), 1 (landscape, 144x256)
    modelSelection: 1,

    // Resolution for mask processing (lower = faster)
    maskWidth: 256,
    maskHeight: 192,

    // Temporal smoothing (Exponential Moving Average)
    // Higher = smoother but more lag, Lower = responsive but jittery
    temporalSmoothing: 0.2, // 0-1, where 0 = no smoothing

    // Spatial blur to soften mask edges
    spatialBlur: {
      enabled: true,
      radius: 4,            // Blur kernel size
    },

    // Frame rate limit for segmentation (to save CPU)
    // null = process every frame
    maxFPS: 30,
  },

  // ============================================================
  // SCENE / RENDERING
  // ============================================================
  scene: {
    background: '#f5f5f5',  // Gallery-like background

    // Camera settings
    cameraFOV: 50,
    cameraNear: 0.1,
    cameraFar: 1000,
    cameraDistance: 10,

    // Lighting
    lighting: {
      ambient: {
        color: '#ffffff',
        intensity: 0.6,
      },
      directional: {
        color: '#ffffff',
        intensity: 0.8,
        position: [5, 8, 5],
      },
      // Rim light for depth
      rim: {
        color: '#e8f4f8',
        intensity: 0.3,
        position: [-3, 2, -5],
      },
    },
  },

  // ============================================================
  // PERFORMANCE
  // ============================================================
  performance: {
    // Use instanced meshes for flowers (recommended: true)
    useInstancing: true,

    // Pixel ratio (1 = standard, 2 = retina)
    // Set to 1 for better performance on slower devices
    maxPixelRatio: 2,

    // Enable anti-aliasing
    antialias: true,
  },

  // ============================================================
  // DEBUG
  // ============================================================
  debug: {
    showMaskCanvas: false,  // Show mask visualization
    logPerformance: false,  // Log FPS and timing
    showStats: false,       // Show Three.js stats
  },
};

/**
 * EASING FUNCTIONS
 * Used for smooth flip animations
 */
export const EASING = {
  linear: t => t,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutElastic: t => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeOutBack: t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};
