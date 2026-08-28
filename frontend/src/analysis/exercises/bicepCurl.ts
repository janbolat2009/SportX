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

export const bicepCurlConfig: ExerciseAnalysisConfig = {
  slug: 'bicep_curl',
  name: 'Bicep Curl (Barbell / Dumbbell)',
  cameraSetupInstructions: 'Position camera at chest/waist level from front or side angle.',
  defaultCameraAngle: 'Front / 45° View',
  requiredLandmarks: [11, 12, 13, 14, 15, 16],
  primaryJoints: {
    left: [11, 13, 15],  // Shoulder, Elbow, Wrist
    right: [12, 14, 16], // Shoulder, Elbow, Wrist
  },
  minimumConfidence: 0.35,
  minimumRomDegrees: 55,
  cooldownMs: 350,
  minRepDurationSec: 0.7,
  maxRepDurationSec: 5.0,
  phases: ['EXTENDED', 'CURLING', 'PEAK', 'LOWERING'],
  standingOrStartAngle: 145, // Arms fully extended downwards
  descentTriggerAngle: 125, // Curling initiates
  bottomTriggerAngle: 80,   // Peak squeeze (acute angle)
  ascentTriggerAngle: 95,   // Lowering begins
  lockoutTriggerAngle: 140, // Return to full extension
};

export class BicepCurlAnalyzer {
  private config: ExerciseAnalysisConfig;
  private currentPhase: string = 'EXTENDED';
  private repCount: number = 0;
  private minElbowAngle: number = 180;
  private repStartTime: number = 0;
  private lastRepCompleteTime: number = 0;
  private issuesInCurrentRep: TechniqueIssue[] = [];

  constructor(config = bicepCurlConfig) {
    this.config = config;
  }

  public reset(): void {
    this.currentPhase = 'EXTENDED';
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
        phaseKey: 'phase.extended',
        primaryAngle: 180,
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
    let feedbackKey = 'cue.curlNoSwing';
    let feedbackDefault = 'Curl smoothly without swinging';
    let feedbackSeverity: 'good' | 'attention' | 'deviation' = 'good';

    switch (this.currentPhase) {
      case 'EXTENDED':
      case 'READY':
        if (elbowAngle < this.config.descentTriggerAngle) {
          if (now - this.lastRepCompleteTime > this.config.cooldownMs) {
            this.currentPhase = 'CURLING';
            this.minElbowAngle = elbowAngle;
            this.repStartTime = now;
            this.issuesInCurrentRep = [];
            feedbackKey = 'cue.curlNoSwing';
            feedbackDefault = 'Curl smoothly without swinging';
          }
        }
        break;

      case 'CURLING':
        if (elbowAngle < this.minElbowAngle) {
          this.minElbowAngle = elbowAngle;
        }

        if (elbowAngle <= this.config.bottomTriggerAngle) {
          this.currentPhase = 'PEAK';
          feedbackKey = 'cue.peakSqueeze';
          feedbackDefault = 'Peak contraction — lower with control';
        }
        break;

      case 'PEAK':
        if (elbowAngle < this.minElbowAngle) {
          this.minElbowAngle = elbowAngle;
        }

        if (elbowAngle > this.config.ascentTriggerAngle) {
          this.currentPhase = 'LOWERING';
        }
        break;

      case 'LOWERING':
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

            const contractionScore = this.minElbowAngle <= 70 ? 98 : this.minElbowAngle <= 85 ? 90 : 80;
            const repScore = Math.round((contractionScore + symmetry + 92) / 3);

            completedRep = {
              repNumber: this.repCount,
              startTime: this.repStartTime,
              endTime: now,
              durationSeconds: Math.round(duration * 10) / 10,
              repScore,
              confidenceScore: Math.round(confidence * 100),
              alignmentScore: symmetry,
              romScore: contractionScore,
              symmetryScore: symmetry,
              tempoScore: 90,
              stabilityScore: 90,
              peakAngle: this.minElbowAngle,
              minAngle: this.minElbowAngle,
              isValid: this.minElbowAngle <= 85,
              issues: [...this.issuesInCurrentRep],
            };

            feedbackKey = 'cue.repComplete';
            feedbackDefault = 'Rep completed! Great form.';
            feedbackSeverity = 'good';
          }

          this.currentPhase = 'EXTENDED';
          this.minElbowAngle = 180;
        }
        break;
    }

    const phaseKey =
      this.currentPhase === 'CURLING'
        ? 'phase.curling'
        : this.currentPhase === 'PEAK'
        ? 'phase.peak'
        : this.currentPhase === 'LOWERING'
        ? 'phase.lowering'
        : 'phase.extended';

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
