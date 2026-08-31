import {
  ExerciseAnalysisConfig,
  LandmarkPoint,
  AnalysisFrameResult,
  RepetitionResult,
  TechniqueIssue
} from '../types';
import {
  calculateJointAngle,
  getLandmarksConfidence
} from '../smoothing';

export const plankConfig: ExerciseAnalysisConfig = {
  slug: 'forearm_plank',
  name: 'Forearm Plank',
  cameraSetupInstructions: 'Position camera on the floor 2 to 3 meters away from the side showing full body from head to heels.',
  defaultCameraAngle: 'Side View (90°)',
  requiredLandmarks: [11, 12, 23, 24, 25, 26, 27, 28],
  primaryJoints: {
    left: [11, 23, 27],  // Shoulder, Hip, Ankle (or Knee)
    right: [12, 24, 28],
  },
  secondaryJoints: {
    left: [23, 25, 27],  // Hip, Knee, Ankle
    right: [24, 26, 28],
  },
  minimumConfidence: 0.40,
  minimumRomDegrees: 10,
  cooldownMs: 500,
  minRepDurationSec: 5.0,
  maxRepDurationSec: 300.0,
  phases: ['SETUP', 'HOLDING', 'REST'],
  standingOrStartAngle: 175,
  descentTriggerAngle: 165,
  bottomTriggerAngle: 160,
  ascentTriggerAngle: 170,
  lockoutTriggerAngle: 180,
};

export class PlankAnalyzer {
  private config: ExerciseAnalysisConfig;
  private currentPhase: string = 'SETUP';
  private holdStartTime: number = 0;
  private totalHoldSeconds: number = 0;
  private lastSecondReported: number = 0;
  private issuesInCurrentHold: TechniqueIssue[] = [];

  constructor(config = plankConfig) {
    this.config = config;
  }

  public reset(): void {
    this.currentPhase = 'SETUP';
    this.holdStartTime = 0;
    this.totalHoldSeconds = 0;
    this.lastSecondReported = 0;
    this.issuesInCurrentHold = [];
  }

  public analyzeFrame(landmarks: LandmarkPoint[], now: number): AnalysisFrameResult {
    const confidence = getLandmarksConfidence(landmarks, this.config.requiredLandmarks);

    if (confidence < this.config.minimumConfidence) {
      return {
        phase: this.currentPhase,
        phaseKey: 'phase.ready',
        primaryAngle: 180,
        symmetryRatio: 100,
        isRepCompleted: false,
        currentFeedbackKey: 'cue.stepBackFullBody',
        currentFeedbackDefault: 'Step back so your full body from head to heels is visible',
        feedbackSeverity: 'attention',
        confidenceScore: Math.round(confidence * 100),
        issues: [],
      };
    }

    const lHipAngle = calculateJointAngle(landmarks[11], landmarks[23], landmarks[27]);
    const rHipAngle = calculateJointAngle(landmarks[12], landmarks[24], landmarks[28]);
    const lVis = landmarks[23]?.visibility ?? 0.8;
    const rVis = landmarks[24]?.visibility ?? 0.8;

    const spineAngle = lVis >= rVis ? lHipAngle : rHipAngle;
    const currentIssues: TechniqueIssue[] = [];

    // Evaluate Alignment
    let feedbackKey = 'cue.plankAlign';
    let feedbackDefault = 'Hold a rigid straight line from head to heels';
    let severity: 'good' | 'attention' | 'deviation' = 'good';

    const isHorizontal = Math.abs(landmarks[11].y - landmarks[27].y) < 0.35; // Shoulder & ankle on similar plane

    if (!isHorizontal) {
      this.currentPhase = 'SETUP';
      this.holdStartTime = 0;
      return {
        phase: 'SETUP',
        phaseKey: 'phase.ready',
        primaryAngle: Math.round(spineAngle),
        symmetryRatio: 100,
        isRepCompleted: false,
        currentFeedbackKey: 'cue.standInFrame',
        currentFeedbackDefault: 'Assume forearm plank posture horizontally on floor',
        feedbackSeverity: 'attention',
        confidenceScore: Math.round(confidence * 100),
        issues: [],
      };
    }

    if (this.holdStartTime === 0) {
      this.holdStartTime = now;
      this.currentPhase = 'HOLDING';
    }

    const elapsedSeconds = Math.floor((now - this.holdStartTime) / 1000);
    this.totalHoldSeconds = elapsedSeconds;

    // Check for Hip Sag (Lumbar Hyperextension)
    if (spineAngle < 158) {
      feedbackKey = 'cue.plankHipSag';
      feedbackDefault = 'Squeeze glutes and raise hips — avoid sagging in lower back';
      severity = 'deviation';
      currentIssues.push({
        type: 'hip_sag',
        severity: 'high',
        messageKey: 'cue.plankHipSag',
        defaultMessage: 'Lower back sagging detected. Engage core and glutes.',
        metricValue: spineAngle,
        benchmarkValue: 180,
      });
    } else if (spineAngle > 200) {
      // Check for Hip Pike
      feedbackKey = 'cue.plankHipPike';
      feedbackDefault = 'Lower hips down into a flat neutral line';
      severity = 'attention';
      currentIssues.push({
        type: 'hip_pike',
        severity: 'medium',
        messageKey: 'cue.plankHipPike',
        defaultMessage: 'Hips elevated too high. Flatten body alignment.',
        metricValue: spineAngle,
        benchmarkValue: 180,
      });
    }

    return {
      phase: 'HOLDING',
      phaseKey: 'phase.isometric',
      primaryAngle: Math.round(spineAngle),
      symmetryRatio: 100,
      isRepCompleted: false,
      currentFeedbackKey: feedbackKey,
      currentFeedbackDefault: feedbackDefault,
      feedbackSeverity: severity,
      confidenceScore: Math.round(confidence * 100),
      issues: currentIssues,
    };
  }
}
