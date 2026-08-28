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

export const pushupConfig: ExerciseAnalysisConfig = {
  slug: 'pushup',
  name: 'Standard Push-Up',
  cameraSetupInstructions: 'Position camera side-on (90 degrees) at floor level showing full body from hands to feet.',
  defaultCameraAngle: 'Side View (Floor Level)',
  requiredLandmarks: [11, 12, 13, 14, 15, 16, 23, 24, 27, 28],
  primaryJoints: {
    left: [11, 13, 15],  // Shoulder, Elbow, Wrist
    right: [12, 14, 16], // Shoulder, Elbow, Wrist
  },
  secondaryJoints: {
    left: [11, 23, 27],  // Shoulder, Hip, Ankle (Body alignment)
    right: [12, 24, 28], // Shoulder, Hip, Ankle
  },
  minimumConfidence: 0.35,
  minimumRomDegrees: 50,
  cooldownMs: 350,
  minRepDurationSec: 0.7,
  maxRepDurationSec: 5.0,
  phases: ['PLANK', 'DESCENT', 'BOTTOM', 'ASCENT'],
  standingOrStartAngle: 155,
  descentTriggerAngle: 140,
  bottomTriggerAngle: 100,
  ascentTriggerAngle: 118,
  lockoutTriggerAngle: 150,
};

export class PushupAnalyzer {
  private config: ExerciseAnalysisConfig;
  private currentPhase: string = 'PLANK';
  private repCount: number = 0;
  private minElbowAngle: number = 180;
  private repStartTime: number = 0;
  private lastRepCompleteTime: number = 0;
  private issuesInCurrentRep: TechniqueIssue[] = [];

  constructor(config = pushupConfig) {
    this.config = config;
  }

  public reset(): void {
    this.currentPhase = 'PLANK';
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
        phaseKey: 'phase.plank',
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

    // Body alignment check (Plank line)
    const bodyLineAngle = calculateJointAngle(landmarks[11], landmarks[23], landmarks[27]);
    if (bodyLineAngle < 150) {
      if (!this.issuesInCurrentRep.some((i) => i.type === 'hip_sag')) {
        this.issuesInCurrentRep.push({
          type: 'hip_sag',
          severity: 'medium',
          messageKey: 'cue.driveHipsUp',
          defaultMessage: 'Keep hips aligned with shoulders (avoid sagging)',
          metricValue: bodyLineAngle,
        });
      }
    }

    let isRepCompleted = false;
    let completedRep: RepetitionResult | undefined;
    let feedbackKey = 'cue.lowerChestControl';
    let feedbackDefault = 'Lower chest with control';
    let feedbackSeverity: 'good' | 'attention' | 'deviation' = 'good';

    switch (this.currentPhase) {
      case 'PLANK':
      case 'READY':
        if (elbowAngle < this.config.descentTriggerAngle) {
          if (now - this.lastRepCompleteTime > this.config.cooldownMs) {
            this.currentPhase = 'DESCENT';
            this.minElbowAngle = elbowAngle;
            this.repStartTime = now;
            this.issuesInCurrentRep = [];
            feedbackKey = 'cue.lowerChestControl';
            feedbackDefault = 'Lower chest with control';
          }
        }
        break;

      case 'DESCENT':
        if (elbowAngle < this.minElbowAngle) {
          this.minElbowAngle = elbowAngle;
        }

        if (elbowAngle <= this.config.bottomTriggerAngle) {
          this.currentPhase = 'BOTTOM';
          feedbackKey = 'cue.targetDepthPress';
          feedbackDefault = 'Target depth reached — press up powerfully';
        }
        break;

      case 'BOTTOM':
        if (elbowAngle < this.minElbowAngle) {
          this.minElbowAngle = elbowAngle;
        }

        if (elbowAngle > this.config.ascentTriggerAngle) {
          this.currentPhase = 'ASCENT';
        }
        break;

      case 'ASCENT':
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

            const depthScore = this.minElbowAngle <= 90 ? 98 : this.minElbowAngle <= 102 ? 90 : 80;
            const alignmentScore = bodyLineAngle >= 160 ? 96 : 82;
            const repScore = Math.round((depthScore + alignmentScore + symmetry) / 3);

            completedRep = {
              repNumber: this.repCount,
              startTime: this.repStartTime,
              endTime: now,
              durationSeconds: Math.round(duration * 10) / 10,
              repScore,
              confidenceScore: Math.round(confidence * 100),
              alignmentScore,
              romScore: depthScore,
              symmetryScore: symmetry,
              tempoScore: 92,
              stabilityScore: alignmentScore,
              peakAngle: this.minElbowAngle,
              minAngle: this.minElbowAngle,
              isValid: this.minElbowAngle <= 108,
              issues: [...this.issuesInCurrentRep],
            };

            feedbackKey = 'cue.repComplete';
            feedbackDefault = 'Rep completed! Great form.';
            feedbackSeverity = 'good';
          }

          this.currentPhase = 'PLANK';
          this.minElbowAngle = 180;
        }
        break;
    }

    const phaseKey =
      this.currentPhase === 'DESCENT'
        ? 'phase.descent'
        : this.currentPhase === 'BOTTOM'
        ? 'phase.bottom'
        : this.currentPhase === 'ASCENT'
        ? 'phase.ascent'
        : 'phase.plank';

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
