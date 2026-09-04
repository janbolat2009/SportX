import { LandmarkPoint } from "./types";

export class LandmarkSmoother {
  private prevLandmarks: LandmarkPoint[] | null = null;
  private prevTime: number = 0;
  private minAlpha: number = 0.40;
  private maxAlpha: number = 0.85;
  private missingCounter: Map<number, number> = new Map();

  constructor(minAlpha: number = 0.40, maxAlpha: number = 0.85) {
    this.minAlpha = minAlpha;
    this.maxAlpha = maxAlpha;
  }

  public setAlpha(alpha: number): void {
    this.minAlpha = Math.max(0.1, Math.min(1.0, alpha));
  }

  public smooth(rawLandmarks: LandmarkPoint[], now: number = Date.now()): LandmarkPoint[] {
    if (!rawLandmarks || rawLandmarks.length === 0) {
      return [];
    }

    if (!this.prevLandmarks || this.prevLandmarks.length !== rawLandmarks.length) {
      this.prevLandmarks = rawLandmarks.map((lm) => ({ ...lm }));
      this.prevTime = now;
      return rawLandmarks;
    }

    const dt = Math.max(0.001, (now - this.prevTime) / 1000);
    this.prevTime = now;

    const smoothed: LandmarkPoint[] = rawLandmarks.map((lm, idx) => {
      const prev = this.prevLandmarks![idx];

      // Handle temporary occlusion / missing landmark (<150ms interpolation)
      const currentVis = lm.visibility ?? 0.8;
      if (currentVis < 0.25) {
        const missed = (this.missingCounter.get(idx) || 0) + 1;
        this.missingCounter.set(idx, missed);
        if (missed <= 5 && prev) {
          return {
            x: prev.x,
            y: prev.y,
            z: prev.z,
            visibility: 0.3,
          };
        }
      } else {
        this.missingCounter.set(idx, 0);
      }

      // Compute velocity for adaptive alpha
      const vx = Math.abs(lm.x - prev.x) / dt;
      const vy = Math.abs(lm.y - prev.y) / dt;
      const velocity = Math.sqrt(vx * vx + vy * vy);

      // Map velocity [0.05, 1.5] to alpha [minAlpha, maxAlpha]
      const t = Math.max(0, Math.min(1, (velocity - 0.05) / 1.45));
      const adaptiveAlpha = this.minAlpha + t * (this.maxAlpha - this.minAlpha);

      const smoothX = prev.x * (1 - adaptiveAlpha) + lm.x * adaptiveAlpha;
      const smoothY = prev.y * (1 - adaptiveAlpha) + lm.y * adaptiveAlpha;
      const smoothZ = lm.z !== undefined && prev.z !== undefined
        ? prev.z * (1 - adaptiveAlpha) + lm.z * adaptiveAlpha
        : lm.z;
      const smoothVis = lm.visibility !== undefined && prev.visibility !== undefined
        ? prev.visibility * (1 - adaptiveAlpha) + lm.visibility * adaptiveAlpha
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
    this.prevTime = 0;
    this.missingCounter.clear();
  }
}

export function calculateDistance(a: LandmarkPoint, b: LandmarkPoint): number {
  if (!a || !b) return 0;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateTorsoScale(landmarks: LandmarkPoint[]): number {
  if (!landmarks || landmarks.length < 25) return 1.0;
  const ls = landmarks[11];
  const rs = landmarks[12];
  const lh = landmarks[23];
  const rh = landmarks[24];

  if (!ls || !rs || !lh || !rh) return 1.0;

  const midShoulderX = (ls.x + rs.x) / 2;
  const midShoulderY = (ls.y + rs.y) / 2;
  const midHipX = (lh.x + rh.x) / 2;
  const midHipY = (lh.y + rh.y) / 2;

  const dist = Math.sqrt(
    Math.pow(midShoulderX - midHipX, 2) + Math.pow(midShoulderY - midHipY, 2)
  );

  return Math.max(0.15, dist);
}

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

export function calculateBilateralSymmetry(leftAngle: number, rightAngle: number): number {
  const diff = Math.abs(leftAngle - rightAngle);
  const symmetry = Math.max(50, Math.min(100, Math.round(100 - diff * 1.1)));
  return symmetry;
}

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
