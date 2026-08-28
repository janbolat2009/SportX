import {
  ExerciseAnalysisConfig,
  LandmarkPoint,
  AnalysisFrameResult,
  RepetitionResult,
  TechniqueIssue
} from '../types';
import {
  calculateJointAngle,
  calculateBilateralSymmetry,
  getLandmarksConfidence
} from '../smoothing';

export const pullupConfig: ExerciseAnalysisConfig = {
  slug: 'pullup',
  name: 'Pull-Up / Chin-Up',
  cameraSetupInstructions: 'Position camera in front or at 45 degrees, capturing from pull-up bar down to hips.',
  defaultCameraAngle: 'Front / 45° View',
  requiredLandmarks: [11, 12, 13, 14, 15, 16, 23, 24],
  primaryJoints: {
    left: [11, 13, 15],  // Shoulder, Elbow, Wrist
    right: [12, 14, 16], // Shoulder, Elbow, Wrist
  },
  minimumConfidence: 0.35,
  minimumRomDegrees: 55,
  cooldownMs: 400,
  minRepDurationSec: 0.8,
  maxRepDurationSec: 6.0,
  phases: ['HANG', 'PULLING', 'TOP', 'DESCENDING'],
  standingOrStartAngle: 150, // Arms extended at bottom hang
  descentTriggerAngle: 135,
  bottomTriggerAngle: 80,   // Top of pull-up (acute elbow angle)
  ascentTriggerAngle: 95,
  lockoutTriggerAngle: 145, // Return to full dead hang
};

export class PullupAnalyzer {
  private config: ExerciseAnalysisConfig;
  private currentPhase: string = 'HANG';
  private repCount: number = 0;
  private minElbowAngle: number = 180;
  private repStartTime: number = 0;
  private lastRepCompleteTime: number = 0;
  private issuesInCurrentRep: TechniqueIssue[] = [];

  constructor(config = pullupConfig) {
    this.config = config;
  }

  public reset(): void {
    this.currentPhase = 'HANG';
    this.repCount = 0;
    this.minElbowAngle = 180;
    this.repStartTime = 0;
    this.lastRepCompleteTime = 0;
    this.issuesInCurrentRep = [];
  }

  public analyzeFrame(landmarks: LandmarkPoint[], now: number): AnalysisFrameResult {
    const confidence = getLandmarksConfidence(landmarks, this.config.requiredLandmarks);

    if (confidence < this.config.minimumConfidence) {
      return {
        phase: this.currentPhase,
        phaseKey: 'phase.hang',
        primaryAngle: 180,
        symmetryRatio: 100,
        isRepCompleted: false,
        currentFeedbackKey: 'cue.ensureArmsVisible',
        currentFeedbackDefault: 'Ensure your upper body and arms are visible in frame',
        feedbackSeverity: 'attention',
        confidenceScore: Math.round(confidence * 100),
        issues: [],
      };
    }

    const lVis = Math.min(
      landmarks[11]?.visibility ?? 0.8,
      landmarks[13]?.visibility ?? 0.8,
      landmarks[15]?.visibility ?? 0.8
    );
    const rVis = Math.min(
      landmarks[12]?.visibility ?? 0.8,
      landmarks[14]?.visibility ?? 0.8,
      landmarks[16]?.visibility ?? 0.8
    );

    const lElbow = calculateJointAngle(landmarks[11], landmarks[13], landmarks[15]);
    const rElbow = calculateJointAngle(landmarks[12], landmarks[14], landmarks[16]);

    let elbowAngle: number;
    if (lVis > 0.45 && rVis > 0.45) {
      elbowAngle = Math.round((lElbow + rElbow) / 2);
    } else if (lVis >= rVis) {
      elbowAngle = lElbow;
    } else {
      elbowAngle = rElbow;
    }

    const symmetry = calculateBilateralSymmetry(lElbow, rElbow);

    let isRepCompleted = false;
    let completedRep: RepetitionResult | undefined;
    let feedbackKey = 'cue.pullVertical';
    let feedbackDefault = 'Pull chest up to bar smoothly';
    let feedbackSeverity: 'good' | 'attention' | 'deviation' = 'good';

    switch (this.currentPhase) {
      case 'HANG':
      case 'READY':
        if (elbowAngle < this.config.descentTriggerAngle) {
          if (now - this.lastRepCompleteTime > this.config.cooldownMs) {
            this.currentPhase = 'PULLING';
            this.minElbowAngle = elbowAngle;
            this.repStartTime = now;
            this.issuesInCurrentRep = [];
            feedbackKey = 'cue.pullVertical';
            feedbackDefault = 'Pull chest up to bar smoothly';
          }
        }
        break;

      case 'PULLING':
        if (elbowAngle < this.minElbowAngle) {
          this.minElbowAngle = elbowAngle;
        }

        if (elbowAngle <= this.config.bottomTriggerAngle) {
          this.currentPhase = 'TOP';
          feedbackKey = 'cue.topReach';
          feedbackDefault = 'Top reached! Lower with control into full extension';
        }
        break;

      case 'TOP':
        if (elbowAngle < this.minElbowAngle) {
          this.minElbowAngle = elbowAngle;
        }

        if (elbowAngle > this.config.ascentTriggerAngle) {
          this.currentPhase = 'DESCENDING';
        }
        break;

      case 'DESCENDING':
        if (elbowAngle >= this.config.lockoutTriggerAngle) {
          const duration = (now - this.repStartTime) / 1000;
          const rom = 180 - this.minElbowAngle;

          if (
            duration >= this.config.minRepDurationSec &&
            duration <= this.config.maxRepDurationSec &&
            rom >= this.config.minimumRomDegrees
          ) {
            this.repCount += 1;
            this.lastRepCompleteTime = now;
            isRepCompleted = true;

            const depthScore = this.minElbowAngle <= 70 ? 98 : this.minElbowAngle <= 85 ? 90 : 80;
            const repScore = Math.round((depthScore + symmetry + 90) / 3);

            completedRep = {
              repNumber: this.repCount,
              startTime: this.repStartTime,
              endTime: now,
              durationSeconds: Math.round(duration * 10) / 10,
              repScore,
              confidenceScore: Math.round(confidence * 100),
              alignmentScore: symmetry,
              romScore: depthScore,
              symmetryScore: symmetry,
              tempoScore: 92,
              stabilityScore: 90,
              peakAngle: this.minElbowAngle,
              minAngle: this.minElbowAngle,
              isValid: this.minElbowAngle <= 90,
              issues: [...this.issuesInCurrentRep],
            };

            feedbackKey = 'cue.repComplete';
            feedbackDefault = 'Rep completed! Great form.';
            feedbackSeverity = 'good';
          }

          this.currentPhase = 'HANG';
          this.minElbowAngle = 180;
        }
        break;
    }

    const phaseKey =
      this.currentPhase === 'PULLING'
        ? 'phase.pulling'
        : this.currentPhase === 'TOP'
        ? 'phase.top'
        : this.currentPhase === 'DESCENDING'
        ? 'phase.lowering'
        : 'phase.hang';

    return {
      phase: this.currentPhase,
      phaseKey,
      primaryAngle: elbowAngle,
      symmetryRatio: symmetry,
      isRepCompleted,
      completedRep,
      currentFeedbackKey: feedbackKey,
      currentFeedbackDefault: feedbackDefault,
      feedbackSeverity,
      confidenceScore: Math.round(confidence * 100),
      issues: this.issuesInCurrentRep,
    };
  }
}
