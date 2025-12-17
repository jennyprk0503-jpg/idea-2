# Flower Flip Camera 🌸

An interactive browser-based 3D installation where your webcam silhouette reveals vibrant colors in a grid of jelly-style flowers. Move your body to "unlock" color as your silhouette passes over the grayscale flowers, creating a calm and satisfying interactive experience.

![Flower Flip Demo](https://via.placeholder.com/800x400/f5f5f5/9AD4D6?text=Flower+Flip+Camera)

## ✨ Features

- **3D Jelly Flowers**: Grid of cute, soft-looking flowers with subtle idle animations
- **Real-time Silhouette**: MediaPipe person segmentation (no visible webcam feed)
- **Color Reveal**: Flowers flip from grayscale to vibrant colors where silhouette appears
- **Smooth Interactions**: Hysteresis, hold time, and temporal smoothing prevent jitter
- **Adjustable Controls**: Fine-tune sensitivity, smoothing, and flip speed in real-time
- **Performance Optimized**: Efficient rendering, frame rate limiting, instanced meshes

## 🎨 Color Palette

The installation uses a carefully selected pastel palette:

- **Coral**: `#FF845E`
- **Bubblegum Pink**: `#F549B8`
- **Jasmine**: `#FFE382`
- **Mint Green**: `#D7F9F1`
- **Tiffany Blue**: `#9AD4D6`
- **Periwinkle**: `#C9BBF4`

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Modern browser (Chrome recommended, Safari may have WebGL limitations)
- Webcam access

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Start development server:**

```bash
npm run dev
```

3. **Open in browser:**

Navigate to `http://localhost:5173` (or the URL shown in terminal)

4. **Grant camera permissions:**

When prompted, allow webcam access in your browser

5. **Interact:**

Move in front of your camera and watch flowers flip to reveal color!

## 📁 Project Structure

```
flower-flip-camera/
├── index.html              # Main HTML with UI controls
├── package.json            # Dependencies and scripts
├── src/
│   ├── main.js            # Application entry point
│   ├── config.js          # Central configuration (TUNE HERE!)
│   ├── SceneManager.js    # Three.js scene setup
│   ├── FlowerGeometry.js  # Flower shape generator
│   ├── FlowerMaterials.js # Material/color system
│   ├── FlowerGrid.js      # Grid management + flip animations
│   ├── SegmentationEngine.js  # Webcam + MediaPipe segmentation
│   ├── InteractionEngine.js   # Mask-to-flower mapping
│   └── UIController.js    # UI controls handler
└── README.md
```

## 🎛️ Configuration Guide

All tunable parameters are in **`src/config.js`**. This is your one-stop shop for customization.

### Grid Layout

```javascript
grid: {
  rows: 8,              // Number of flower rows
  cols: 12,             // Number of flower columns
  spacing: 1.2,         // Space between flowers
}
```

### Flip Animation

```javascript
flip: {
  duration: 0.8,        // Seconds for full flip
  thresholdOn: 0.55,    // Mask value to flip ON (higher = harder)
  thresholdOff: 0.45,   // Mask value to flip OFF (lower = stickier)
  holdTimeMs: 150,      // Required overlap time before flip
}
```

**Key tuning tips:**
- **Faster flips**: Lower `duration` (e.g., `0.5`)
- **More sensitive**: Lower `thresholdOn` (e.g., `0.4`)
- **Less jittery**: Increase `holdTimeMs` (e.g., `200`)
- **Wider hysteresis**: Increase gap between `thresholdOn` and `thresholdOff`

### Segmentation / Camera

```javascript
camera: {
  maskWidth: 256,           // Mask resolution (lower = faster)
  maskHeight: 192,
  temporalSmoothing: 0.2,   // 0-1 (higher = smoother, more lag)
  spatialBlur: {
    enabled: true,
    radius: 4,              // Blur kernel size
  },
  maxFPS: 30,               // Frame rate limit (null = unlimited)
}
```

**Performance tips:**
- Lower `maskWidth/maskHeight` for slower devices
- Reduce `maxFPS` to save CPU
- Increase `temporalSmoothing` if mask is jittery

### Visual Style

```javascript
materials: {
  front: {
    color: '#e8e8e8',     // Grayscale color
    roughness: 0.4,       // 0 = glossy, 1 = matte
    clearcoat: 0.3,       // Jelly shine
  },
  back: {
    roughness: 0.15,      // Glossier when colored
    clearcoat: 0.8,       // More shine
    transmission: 0.05,   // Slight translucency
  },
}
```

### Idle Animation

```javascript
idleAnimation: {
  enabled: true,
  scaleAmount: 0.03,      // Breathing intensity
  rotationAmount: 0.05,   // Wobble intensity
  speedVariation: 0.3,    // Speed randomness
}
```

## 🔧 How It Works

### Architecture Overview

```
┌─────────────────┐
│  SceneManager   │  Three.js scene, camera, render loop
└────────┬────────┘
         │
    ┌────▼────────────────────────────┐
    │      FlowerGrid                 │  Grid of flowers with flip state
    │  - Individual flip animations   │
    │  - Hysteresis state machine     │
    │  - Screen position caching      │
    └────────┬────────────────────────┘
             │
        ┌────▼──────────────┐
        │ InteractionEngine │  Maps mask → flower states
        └────────┬──────────┘
                 │
        ┌────────▼──────────────┐
        │  SegmentationEngine   │  Webcam + MediaPipe
        │  - Temporal smoothing │
        │  - Spatial blur       │
        └───────────────────────┘
```

### Segmentation Pipeline

1. **Webcam Input**: Video element captures camera feed
2. **MediaPipe Processing**: Selfie Segmentation model produces person mask
3. **Temporal Smoothing**: Exponential Moving Average (EMA) reduces jitter
   ```
   smoothed = alpha * current + (1 - alpha) * previous
   ```
4. **Spatial Blur**: Soften edges for organic feel
5. **Mask Output**: Normalized 0-1 values per pixel

### Overlap Detection

For each flower:
1. **World → Screen**: Convert 3D flower position to 2D screen coordinates
2. **Sample Mask**: Read mask value at those coordinates
3. **Apply Sensitivity**: Power curve adjustment
4. **Threshold Check**: Compare to `thresholdOn` / `thresholdOff`

### Hysteresis State Machine

Prevents jitter at threshold boundary:

```
Current State: FRONT
Mask > thresholdOn for holdTimeMs → Flip to BACK

Current State: BACK
Mask < thresholdOff for holdTimeMs → Flip to FRONT
```

This creates stable, intentional flips rather than rapid flickering.

### Flip Animation

Each flower animates independently:

1. **Target State**: Set by InteractionEngine
2. **Progress**: Smoothly interpolate 0 (front) → 1 (back)
3. **Easing**: Apply easing function for natural motion
4. **Rotation**: Map progress to Y-axis rotation (0° → 180°)
5. **Material Swap**: Switch at 90° (halfway point)
6. **Optional Bounce**: Add overshoot near middle for playfulness

## 🎨 Adding New Flower Shapes

Flower geometries are procedurally generated in `src/FlowerGeometry.js`.

To add more variety:

1. **Increase shape count** in `config.js`:
   ```javascript
   flower: {
     shapeVariations: 12,  // Default is 8
   }
   ```

2. **Customize generation** in `FlowerGeometry.js`:
   - Modify `petalCount`, `petalLength`, `petalWidth` ranges
   - Adjust `petalCurve` for different shapes
   - Change center size and segments

3. **Add manual geometries**:
   ```javascript
   export function createCustomFlower() {
     // Custom geometry creation
     return geometry;
   }
   ```

## 🎨 Changing Color Assignment

In `src/config.js`, set `assignmentMode`:

**Random** (default):
```javascript
assignmentMode: 'random'  // Stable random per flower
```

**Tiled** (repeating pattern):
```javascript
assignmentMode: 'tiled'   // Colors repeat in order
```

**Clustered** (gradient zones):
```javascript
assignmentMode: 'clustered'  // Smooth color transitions
```

## 🔄 Alternative Segmentation Methods

The default uses **MediaPipe Selfie Segmentation** (person-only).

For detecting **any object**, you can implement background subtraction:

### Background Subtraction Approach

1. **Create new file** `src/BackgroundSubtraction.js`:

```javascript
export class BackgroundSubtraction {
  constructor() {
    this.background = null;
  }

  calibrate(videoFrame) {
    // Capture current frame as background
    this.background = videoFrame;
  }

  process(videoFrame) {
    // Compare with background
    // Return mask where difference > threshold
  }
}
```

2. **Update SegmentationEngine.js**:
   - Add mode selector
   - Implement frame differencing
   - Add calibration UI

3. **Trade-offs**:
   - ✅ Detects any object
   - ❌ Less stable (lighting changes affect it)
   - ❌ Requires calibration step

## 🐛 Troubleshooting

### Stuck at "Initializing camera..."

If you're stuck at the initialization screen, follow these steps:

1. **Run the diagnostic test** (most helpful!):
   - Open `http://localhost:5173/test.html` in your browser
   - This will test camera permissions, MediaPipe loading, etc.
   - Follow the specific error messages provided

2. **Check browser console** (Press F12):
   - Look for errors in the Console tab
   - Common issues:
     - `NotAllowedError`: You denied camera permission → Click camera icon in address bar to allow
     - `NotFoundError`: No camera detected → Connect a webcam
     - `NotReadableError`: Camera in use → Close other apps using camera
     - `Failed to fetch`: Network issue → Check internet connection (MediaPipe loads from CDN)

3. **Grant camera permissions**:
   - Look for a camera icon in your browser's address bar
   - Click it and select "Allow"
   - Refresh the page

4. **Try a different browser**:
   - Chrome or Edge (Chromium) are recommended
   - Firefox works but may be slower
   - Safari may have WebGL/MediaPipe issues

5. **Check localhost is running**:
   ```bash
   npm run dev
   ```
   - Should show: `Local: http://localhost:5173/`
   - If port is in use, Vite will use a different port

### Camera not starting (general)

- **Check permissions**: Ensure browser has webcam access
- **Try different browser**: Chrome has best WebGL/webcam support
- **Check console**: Look for error messages (F12 → Console tab)
- **HTTPS required**: Camera access needs secure context (localhost is OK)
- **MediaPipe loading**: May take 5-10 seconds on first load (downloads from CDN)

### Poor performance / lag

1. **Lower mask resolution** in `config.js`:
   ```javascript
   maskWidth: 128,
   maskHeight: 96,
   ```

2. **Limit FPS**:
   ```javascript
   maxFPS: 20,  // Lower for slower devices
   ```

3. **Reduce grid size**:
   ```javascript
   grid: {
     rows: 6,
     cols: 8,
   }
   ```

4. **Disable anti-aliasing**:
   ```javascript
   performance: {
     antialias: false,
   }
   ```

### Flowers flipping too much / too jittery

1. **Increase hold time**:
   ```javascript
   holdTimeMs: 250,  // Require longer overlap
   ```

2. **Increase smoothing**:
   ```javascript
   temporalSmoothing: 0.4,  // More smoothing
   ```

3. **Widen hysteresis**:
   ```javascript
   thresholdOn: 0.6,   // Harder to flip on
   thresholdOff: 0.3,  // Easier to stay on
   ```

### Flowers not flipping at all

1. **Lower threshold**:
   ```javascript
   thresholdOn: 0.3,  // More sensitive
   ```

2. **Increase sensitivity** via UI slider (move to right)

3. **Check debug view**: Enable "Show Mask Debug" to see segmentation

## 📊 Performance Optimization

### Current Optimizations

- ✅ Grouped meshes (one geometry instance per flower)
- ✅ Material reuse (shared front material, cached back materials)
- ✅ Frame rate limiting on segmentation
- ✅ Low-resolution mask processing
- ✅ Screen position caching
- ✅ Efficient mask sampling

### Further Optimizations (if needed)

1. **Use InstancedMesh**: For even better performance with identical geometries
2. **Level of Detail (LOD)**: Simplify flowers far from silhouette
3. **Shader-based flipping**: Move rotation to vertex shader
4. **Web Workers**: Offload mask processing to separate thread
5. **Adaptive quality**: Lower mask res when CPU usage is high

## 🎯 Design Decisions Explained

### Why Hysteresis?

Without hysteresis, flowers at the threshold boundary would rapidly flip back and forth (jitter). Different thresholds for on/off create a "sticky" behavior that feels intentional.

### Why Hold Time?

Requiring sustained overlap prevents accidental flips from noise or quick hand movements. It makes interactions feel deliberate.

### Why Temporal Smoothing?

MediaPipe segmentation can have frame-to-frame variance. Smoothing creates a more stable mask by blending with previous frames (Exponential Moving Average).

### Why Spatial Blur?

Softens the silhouette edges for an organic, dreamy feel. Sharp edges would create harsh flip boundaries.

### Why Grouped Meshes vs. InstancedMesh?

InstancedMesh is more efficient but harder to animate individually. Grouped meshes allow per-flower rotation/state while still being performant for <100 flowers.

### Why Two Materials Instead of Shader Blending?

Material swap at halfway point is simpler and gives clear visual distinction. Shader blending would allow smooth color transitions but adds complexity.

## 🛠️ Development

### Build for Production

```bash
npm run build
```

Outputs optimized files to `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Adding New Features

**Example: Add particle effects on flip**

1. Create `src/ParticleSystem.js`
2. Emit particles in `FlowerGrid.js` when `flipProgress` crosses 0.5
3. Update particle positions in render loop
4. Add toggle in `config.js` and UI

## 📄 License

MIT License - feel free to use and modify!

## 🙏 Credits

- **Three.js**: 3D rendering
- **MediaPipe**: Real-time person segmentation
- **Vite**: Fast development and building

---

Built with ❤️ for playful, interactive art experiences.
