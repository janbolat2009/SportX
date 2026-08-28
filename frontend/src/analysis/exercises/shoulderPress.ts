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

export const shoulderPressConfig: ExerciseAnalysisConfig = {
  slug: 'shoulder_press',
  name: 'Overhead Shoulder Press',
  cameraSetupInstructions: 'Position camera at chest level capturing from hips to above head.',
  defaultCameraAngle: 'Front View',
  requiredLandmarks: [11, 12, 13, 14, 15, 16],
  primaryJoints: {
    left: [11, 13, 15],  // Shoulder, Elbow, Wrist
    right: [12, 14, 16], // Shoulder, Elbow, Wrist
  },
  minimumConfidence: 0.35,
  minimumRomDegrees: 50,
  cooldownMs: 350,
  minRepDurationSec: 0.7,
  maxRepDurationSec: 5.0,
  phases: ['RACK', 'PRESSING', 'LOCKOUT', 'LOWERING'],
  standingOrStartAngle: 90,  // Rack position at shoulders
  descentTriggerAngle: 110, // Pressing starts
  bottomTriggerAngle: 150,  // Lockout overhead
  ascentTriggerAngle: 130,  // Lowering starts
  lockoutTriggerAngle: 95,  // Return to rack
};

export class ShoulderPressAnalyzer {
  private config: ExerciseAnalysisConfig;
  private currentPhase: string = 'RACK';
  private repCount: number = 0;
  private maxElbowAngle: number = 0;
  private repStartTime: number = 0;
  private lastRepCompleteTime: number = 0;
  private issuesInCurrentRep: TechniqueIssue[] = [];

  constructor(config = shoulderPressConfig) {
    this.config = config;
  }

  public reset(): void {
    this.currentPhase = 'RACK';
    this.repCount = 0;
    this.maxElbowAngle = 0;
    this.repStartTime = 0;
    this.lastRepCompleteTime = 0;
    this.issuesInCurrentRep = [];
  }

  public analyzeFrame(landmarks: LandmarkPoint[], now: number): AnalysisFrameResult {
    const confidence = getLandmarksConfidence(landmarks, this.config.requiredLandmarks);

    if (confidence < this.config.minimumConfidence) {
      return {
        phase: this.currentPhase,
        phaseKey: 'phase.rack',
        primaryAngle: 90,
        symmetryRatio: 100,
        isRepCompleted: false,
        currentFeedbackKey: 'cue.ensureArmsVisible',
        currentFeedbackDefault: 'Ensure your arms and torso are in frame',
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
    let feedbackKey = 'cue.pressVertical';
    let feedbackDefault = 'Press vertically overhead';
    let feedbackSeverity: 'good' | 'attention' | 'deviation' = 'good';

    switch (this.currentPhase) {
      case 'RACK':
      case 'READY':
        if (elbowAngle > this.config.descentTriggerAngle) {
          if (now - this.lastRepCompleteTime > this.config.cooldownMs) {
            this.currentPhase = 'PRESSING';
            this.maxElbowAngle = elbowAngle;
            this.repStartTime = now;
            this.issuesInCurrentRep = [];
            feedbackKey = 'cue.pressVertical';
            feedbackDefault = 'Press vertically overhead';
          }
        }
        break;

      case 'PRESSING':
        if (elbowAngle > this.maxElbowAngle) {
          this.maxElbowAngle = elbowAngle;
        }

        if (elbowAngle >= this.config.bottomTriggerAngle) {
          this.currentPhase = 'LOCKOUT';
          feedbackKey = 'cue.lockoutReached';
          feedbackDefault = 'Full overhead lockout reached';
        }
        break;

      case 'LOCKOUT':
        if (elbowAngle < this.config.ascentTriggerAngle) {
          this.currentPhase = 'LOWERING';
        }
        break;

      case 'LOWERING':
        if (elbowAngle <= this.config.lockoutTriggerAngle) {
          const duration = (now - this.repStartTime) / 1000;
          const rom = this.maxElbowAngle - 90;

          if (
            duration >= this.config.minRepDurationSec &&
            duration <= this.config.maxRepDurationSec &&
            rom >= this.config.minimumRomDegrees
          ) {
            this.repCount += 1;
            this.lastRepCompleteTime = now;
            isRepCompleted = true;

            const lockoutScore = this.maxElbowAngle >= 155 ? 98 : this.maxElbowAngle >= 145 ? 90 : 82;
            const repScore = Math.round((lockoutScore + symmetry + 92) / 3);

            completedRep = {
              repNumber: this.repCount,
              startTime: this.repStartTime,
              endTime: now,
              durationSeconds: Math.round(duration * 10) / 10,
              repScore,
              confidenceScore: Math.round(confidence * 100),
              alignmentScore: symmetry,
              romScore: lockoutScore,
              symmetryScore: symmetry,
              tempoScore: 90,
              stabilityScore: 92,
              peakAngle: this.maxElbowAngle,
              minAngle: 90,
              isValid: this.maxElbowAngle >= 145,
              issues: [...this.issuesInCurrentRep],
            };

            feedbackKey = 'cue.repComplete';
            feedbackDefault = 'Rep completed! Great form.';
            feedbackSeverity = 'good';
          }

          this.currentPhase = 'RACK';
          this.maxElbowAngle = 0;
        }
        break;
    }

    const phaseKey =
      this.currentPhase === 'PRESSING'
        ? 'phase.pressing'
        : this.currentPhase === 'LOCKOUT'
        ? 'phase.lockout'
        : this.currentPhase === 'LOWERING'
        ? 'phase.lowering'
        : 'phase.rack';

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
