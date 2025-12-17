/**
 * FLOWER GEOMETRY GENERATOR
 *
 * Creates cute, varied flower shapes with a jelly/soft aesthetic.
 * Generates multiple shape variations for visual interest.
 */

import * as THREE from 'three';

/**
 * Generate a flower geometry variant
 * @param {number} seed - Random seed for consistent variation
 * @returns {THREE.BufferGeometry}
 */
export function createFlowerGeometry(seed = 0) {
  // Seeded random for consistent geometry per seed
  const random = seededRandom(seed);

  // Randomize flower parameters
  const petalCount = Math.floor(random() * 3) + 5; // 5-7 petals
  const petalLength = 0.4 + random() * 0.2;        // 0.4-0.6
  const petalWidth = 0.3 + random() * 0.15;        // 0.3-0.45
  const centerSize = 0.2 + random() * 0.1;         // 0.2-0.3
  const petalCurve = 0.8 + random() * 0.4;         // 0.8-1.2

  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const normals = [];
  const uvs = [];

  // Create center circle
  const centerSegments = 16;
  const centerVertexOffset = vertices.length / 3;

  for (let i = 0; i <= centerSegments; i++) {
    const angle = (i / centerSegments) * Math.PI * 2;
    const x = Math.cos(angle) * centerSize;
    const y = Math.sin(angle) * centerSize;
    vertices.push(x, y, 0.05); // Slight Z offset for depth
    normals.push(0, 0, 1);
    uvs.push(x / centerSize * 0.5 + 0.5, y / centerSize * 0.5 + 0.5);
  }

  // Center point
  vertices.push(0, 0, 0.1);
  normals.push(0, 0, 1);
  uvs.push(0.5, 0.5);

  const centerPointIndex = (vertices.length / 3) - 1;

  // Triangle fan for center
  for (let i = 0; i < centerSegments; i++) {
    indices.push(
      centerPointIndex,
      centerVertexOffset + i,
      centerVertexOffset + i + 1
    );
  }

  // Create petals
  for (let p = 0; p < petalCount; p++) {
    const baseAngle = (p / petalCount) * Math.PI * 2;
    const petalStartIndex = vertices.length / 3;

    // Petal shape: curved, organic
    const petalSegments = 12;
    const widthSegments = 3;

    for (let i = 0; i <= petalSegments; i++) {
      const t = i / petalSegments;
      const distance = t * petalLength;

      // Width profile: narrow at base, wide in middle, narrow at tip
      const widthProfile = Math.sin(t * Math.PI) * petalWidth;

      // Curve profile: petals curve outward
      const curveAmount = Math.pow(t, petalCurve) * 0.2;

      for (let j = 0; j <= widthSegments; j++) {
        const s = (j / widthSegments - 0.5) * 2; // -1 to 1
        const localX = s * widthProfile;
        const localY = distance;
        const localZ = curveAmount * (1 - Math.abs(s));

        // Rotate around center
        const worldX = Math.cos(baseAngle) * localY - Math.sin(baseAngle) * localX;
        const worldY = Math.sin(baseAngle) * localY + Math.cos(baseAngle) * localX;
        const worldZ = localZ;

        vertices.push(worldX, worldY, worldZ);

        // Approximate normal (pointing outward and slightly forward)
        const nx = Math.cos(baseAngle) * 0.3 + s * Math.sin(baseAngle) * 0.3;
        const ny = Math.sin(baseAngle) * 0.3 - s * Math.cos(baseAngle) * 0.3;
        const nz = 0.9;
        const nLength = Math.sqrt(nx * nx + ny * ny + nz * nz);
        normals.push(nx / nLength, ny / nLength, nz / nLength);

        uvs.push(t, (j / widthSegments));
      }
    }

    // Create triangles for petal
    for (let i = 0; i < petalSegments; i++) {
      for (let j = 0; j < widthSegments; j++) {
        const a = petalStartIndex + i * (widthSegments + 1) + j;
        const b = a + widthSegments + 1;
        const c = a + 1;
        const d = b + 1;

        indices.push(a, b, c);
        indices.push(c, b, d);
      }
    }

    // Connect petal base to center
    const petalBase = petalStartIndex;
    for (let j = 0; j < widthSegments; j++) {
      indices.push(
        centerVertexOffset + Math.floor((p / petalCount) * centerSegments),
        petalBase + j,
        petalBase + j + 1
      );
    }
  }

  // Set geometry attributes
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  // Compute normals for smooth shading
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Create an array of flower geometry variations
 * @param {number} count - Number of variations to create
 * @returns {THREE.BufferGeometry[]}
 */
export function createFlowerVariations(count) {
  const variations = [];
  for (let i = 0; i < count; i++) {
    variations.push(createFlowerGeometry(i));
  }
  return variations;
}

/**
 * Seeded random number generator
 * @param {number} seed
 * @returns {Function} Random function returning 0-1
 */
function seededRandom(seed) {
  let value = seed;
  return function() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}
