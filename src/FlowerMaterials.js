/**
 * FLOWER MATERIALS
 *
 * Creates materials for the two flower states:
 * - Front: Matte grayscale (unflipped state)
 * - Back: Glossy colored with jelly-like properties (flipped state)
 *
 * Uses THREE.MeshPhysicalMaterial for realistic lighting and clearcoat.
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

/**
 * Create grayscale material for front face (unflipped)
 * @returns {THREE.MeshPhysicalMaterial}
 */
export function createFrontMaterial() {
  const { front } = CONFIG.materials;

  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(front.color),
    roughness: front.roughness,
    metalness: front.metalness,
    clearcoat: front.clearcoat,
    clearcoatRoughness: front.clearcoatRoughness,
    side: THREE.DoubleSide,
  });
}

/**
 * Create colored material for back face (flipped)
 * @param {string} colorHex - Hex color string from palette
 * @returns {THREE.MeshPhysicalMaterial}
 */
export function createBackMaterial(colorHex) {
  const { back } = CONFIG.materials;

  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorHex),
    roughness: back.roughness,
    metalness: back.metalness,
    clearcoat: back.clearcoat,
    clearcoatRoughness: back.clearcoatRoughness,
    transmission: back.transmission,
    side: THREE.DoubleSide,
  });
}

/**
 * Assign a color from the palette based on index and assignment mode
 * @param {number} index - Flower index in grid
 * @param {number} totalFlowers - Total number of flowers
 * @returns {string} Hex color string
 */
export function assignColor(index, totalFlowers) {
  const { palette, assignmentMode } = CONFIG.colors;

  switch (assignmentMode) {
    case 'random':
      // Stable random based on index
      return palette[seededRandomInt(index, palette.length)];

    case 'tiled':
      // Simple repeating pattern
      return palette[index % palette.length];

    case 'clustered':
      // Gradient-like zones
      const normalizedIndex = index / totalFlowers;
      const paletteIndex = Math.floor(normalizedIndex * palette.length);
      return palette[Math.min(paletteIndex, palette.length - 1)];

    default:
      return palette[0];
  }
}

/**
 * Seeded random integer
 * @param {number} seed
 * @param {number} max - Exclusive max
 * @returns {number}
 */
function seededRandomInt(seed, max) {
  let value = seed;
  value = (value * 9301 + 49297) % 233280;
  return Math.floor((value / 233280) * max);
}
