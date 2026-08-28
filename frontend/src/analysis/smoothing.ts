import { LandmarkPoint } from './types';

export class LandmarkSmoother {
  private prevLandmarks: LandmarkPoint[] | null = null;
  private alpha: number;

  constructor(alpha: number = 0.65) {
    this.alpha = alpha;
  }

  public setAlpha(alpha: number): void {
    this.alpha = Math.max(0.1, Math.min(1.0, alpha));
  }

  public smooth(rawLandmarks: LandmarkPoint[]): LandmarkPoint[] {
    if (!rawLandmarks || rawLandmarks.length === 0) {
      return [];
    }

    if (!this.prevLandmarks || this.prevLandmarks.length !== rawLandmarks.length) {
      this.prevLandmarks = rawLandmarks.map((lm) => ({ ...lm }));
      return rawLandmarks;
    }

    const smoothed: LandmarkPoint[] = rawLandmarks.map((lm, idx) => {
      const prev = this.prevLandmarks![idx];
      const smoothX = prev.x * (1 - this.alpha) + lm.x * this.alpha;
      const smoothY = prev.y * (1 - this.alpha) + lm.y * this.alpha;
      const smoothZ = lm.z !== undefined && prev.z !== undefined
        ? prev.z * (1 - this.alpha) + lm.z * this.alpha
        : lm.z;
      const smoothVis = lm.visibility !== undefined && prev.visibility !== undefined
        ? prev.visibility * (1 - this.alpha) + lm.visibility * this.alpha
        : lm.visibility;

      return {
        x: smoothX,
        y: smoothY,
        z: smoothZ,
        visibility: smoothVis,
      };
    });

    this.prevLandmarks = smoothed;
    return smoothed;
  }

  public reset(): void {
    this.prevLandmarks = null;
  }
}

/**
 * Calculates 2D angle between vectors BA and BC using dot product.
 * Returns angle in degrees [0, 180].
 */
export function calculateJointAngle(
  a: LandmarkPoint,
  b: LandmarkPoint,
  c: LandmarkPoint
): number {
  if (!a || !b || !c) return 180;

  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;

  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

  if (mag1 * mag2 === 0) return 180;

  const cosAngle = Math.max(-1.0, Math.min(1.0, dot / (mag1 * mag2)));
  return Math.round((Math.acos(cosAngle) * 180.0) / Math.PI);
}

/**
 * Calculates 3D angle between vectors BA and BC using dot product.
 */
export function calculateJointAngle3D(
  a: LandmarkPoint,
  b: LandmarkPoint,
  c: LandmarkPoint
): number {
  if (!a || !b || !c) return 180;

  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v1z = (a.z || 0) - (b.z || 0);

  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const v2z = (c.z || 0) - (b.z || 0);

  const dot = v1x * v2x + v1y * v2y + v1z * v2z;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z);

  if (mag1 * mag2 === 0) return 180;

  const cosAngle = Math.max(-1.0, Math.min(1.0, dot / (mag1 * mag2)));
  return Math.round((Math.acos(cosAngle) * 180.0) / Math.PI);
}

/**
 * Calculates bilateral symmetry ratio given left and right joint angles [0, 100].
 */
export function calculateBilateralSymmetry(leftAngle: number, rightAngle: number): number {
  const diff = Math.abs(leftAngle - rightAngle);
  const symmetry = Math.max(50, Math.min(100, Math.round(100 - diff)));
  return symmetry;
}

/**
 * Computes average visibility for a set of landmark indices.
 */
export function getLandmarksConfidence(landmarks: LandmarkPoint[], indices: number[]): number {
  if (!landmarks || landmarks.length === 0 || indices.length === 0) return 0;
  let totalVis = 0;
  let count = 0;

  for (const idx of indices) {
    if (landmarks[idx]) {
      totalVis += landmarks[idx].visibility ?? 0.8;
      count += 1;
    }
  }

  return count > 0 ? totalVis / count : 0;
}
