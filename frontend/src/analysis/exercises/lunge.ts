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

export const lungeConfig: ExerciseAnalysisConfig = {
  slug: 'bulgarian_split_squat',
  name: 'Bulgarian Split Squat / Lunge',
  cameraSetupInstructions: 'Position camera 2.5 to 3.5 meters away at knee/hip level showing side profile of both legs.',
  defaultCameraAngle: 'Side View (90°)',
  requiredLandmarks: [23, 24, 25, 26, 27, 28],
  primaryJoints: {
    left: [23, 25, 27],  // Hip, Knee, Ankle
    right: [24, 26, 28],
  },
  secondaryJoints: {
    left: [11, 23, 25],
    right: [12, 24, 26],
  },
  minimumConfidence: 0.40,
  minimumRomDegrees: 50,
  cooldownMs: 350,
  minRepDurationSec: 1.0,
  maxRepDurationSec: 6.0,
  phases: ['STANDING', 'DESCENT', 'BOTTOM', 'ASCENT'],
  standingOrStartAngle: 160,
  descentTriggerAngle: 145,
  bottomTriggerAngle: 105,
  ascentTriggerAngle: 125,
  lockoutTriggerAngle: 155,
};

export class LungeAnalyzer {
  private config: ExerciseAnalysisConfig;
  private currentPhase: string = 'STANDING';
  private repCount: number = 0;
  private minKneeAngle: number = 180;
  private repStartTime: number = 0;
  private lastRepCompleteTime: number = 0;
  private issuesInCurrentRep: TechniqueIssue[] = [];

  constructor(config = lungeConfig) {
    this.config = config;
  }

  public reset(): void {
    this.currentPhase = 'STANDING';
    this.repCount = 0;
    this.minKneeAngle = 180;
    this.repStartTime = 0;
    this.lastRepCompleteTime = 0;
    this.issuesInCurrentRep = [];
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
        currentFeedbackDefault: 'Step back so front and rear legs are fully visible',
        feedbackSeverity: 'attention',
        confidenceScore: Math.round(confidence * 100),
        issues: [],
      };
    }

    const lVis = landmarks[25]?.visibility ?? 0.8;
    const rVis = landmarks[26]?.visibility ?? 0.8;
    const lKnee = calculateJointAngle(landmarks[23], landmarks[25], landmarks[27]);
    const rKnee = calculateJointAngle(landmarks[24], landmarks[26], landmarks[28]);

    // Track the front working leg (the one with lower starting angle or clearer depth)
    const workingKneeAngle = lKnee < rKnee ? lKnee : rKnee;
    const currentAngle = Math.round(workingKneeAngle);

    let isRepCompleted = false;
    let completedRep: RepetitionResult | undefined;
    let feedbackKey = 'cue.lungeDescend';
    let feedbackDefault = 'Descend smoothly until front thigh reaches parallel';
    let severity: 'good' | 'attention' | 'deviation' = 'good';

    switch (this.currentPhase) {
      case 'STANDING':
        if (currentAngle < this.config.descentTriggerAngle && now - this.lastRepCompleteTime > this.config.cooldownMs) {
          this.currentPhase = 'DESCENT';
          this.repStartTime = now;
          this.minKneeAngle = currentAngle;
          this.issuesInCurrentRep = [];
          feedbackKey = 'cue.controlDescent';
          feedbackDefault = 'Control descent smoothly';
        } else {
          feedbackKey = 'cue.standInFrame';
          feedbackDefault = 'Stand ready in athletic split stance';
        }
        break;

      case 'DESCENT':
        if (currentAngle < this.minKneeAngle) {
          this.minKneeAngle = currentAngle;
        }

        if (currentAngle <= this.config.bottomTriggerAngle) {
          this.currentPhase = 'BOTTOM';
          feedbackKey = 'cue.goodDepth';
          feedbackDefault = 'Good depth — drive through front heel';
          severity = 'good';
        } else {
          feedbackKey = 'cue.lungeDescend';
          feedbackDefault = 'Lower front thigh to parallel (90° knee flexion)';
        }
        break;

      case 'BOTTOM':
        if (currentAngle > this.config.ascentTriggerAngle) {
          this.currentPhase = 'ASCENT';
          feedbackKey = 'cue.lungeDrive';
          feedbackDefault = 'Drive through front midfoot and heel';
        }
        break;

      case 'ASCENT':
        if (currentAngle >= this.config.lockoutTriggerAngle) {
          this.currentPhase = 'STANDING';
          const duration = (now - this.repStartTime) / 1000;

          if (duration >= this.config.minRepDurationSec && duration <= this.config.maxRepDurationSec) {
            this.repCount++;
            isRepCompleted = true;
            this.lastRepCompleteTime = now;

            const romAchieved = 170 - this.minKneeAngle;
            const romScore = Math.min(100, Math.round((romAchieved / 80) * 100));

            completedRep = {
              repNumber: this.repCount,
              startTime: this.repStartTime,
              endTime: now,
              durationSeconds: Math.round(duration * 10) / 10,
              repScore: Math.min(100, Math.max(60, romScore)),
              confidenceScore: Math.round(confidence * 100),
              alignmentScore: 92,
              romScore: romScore,
              symmetryScore: 90,
              tempoScore: 90,
              stabilityScore: 92,
              peakAngle: 170,
              minAngle: this.minKneeAngle,
              isValid: true,
              issues: [...this.issuesInCurrentRep],
            };

            feedbackKey = 'cue.repComplete';
            feedbackDefault = 'Rep completed! Great depth.';
            severity = 'good';
          }
        }
        break;
    }

    return {
      phase: this.currentPhase,
      phaseKey: `phase.${this.currentPhase.toLowerCase()}`,
      primaryAngle: currentAngle,
      symmetryRatio: 92,
      isRepCompleted,
      completedRep,
      currentFeedbackKey: feedbackKey,
      currentFeedbackDefault: feedbackDefault,
      feedbackSeverity: severity,
      confidenceScore: Math.round(confidence * 100),
      issues: this.issuesInCurrentRep,
    };
  }
}
