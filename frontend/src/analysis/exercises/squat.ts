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

export const squatConfig: ExerciseAnalysisConfig = {
  slug: 'squat',
  name: 'Barbell / Bodyweight Squat',
  cameraSetupInstructions: 'Position camera 2 to 3 meters away at hip level with full body visible from head to feet.',
  defaultCameraAngle: 'Side View / 45° Angle',
  requiredLandmarks: [11, 12, 23, 24, 25, 26, 27, 28],
  primaryJoints: {
    left: [23, 25, 27],  // Hip, Knee, Ankle
    right: [24, 26, 28], // Hip, Knee, Ankle
  },
  secondaryJoints: {
    left: [11, 23, 25],  // Shoulder, Hip, Knee
    right: [12, 24, 26], // Shoulder, Hip, Knee
  },
  minimumConfidence: 0.40,
  minimumRomDegrees: 60, // e.g. from 165° down to 105° = 60° ROM
  cooldownMs: 350,
  minRepDurationSec: 0.8,
  maxRepDurationSec: 6.0,
  phases: ['STANDING', 'DESCENT', 'BOTTOM', 'ASCENT'],
  standingOrStartAngle: 155,
  descentTriggerAngle: 145,
  bottomTriggerAngle: 110,
  ascentTriggerAngle: 125,
  lockoutTriggerAngle: 150,
};

export class SquatAnalyzer {
  private config: ExerciseAnalysisConfig;
  private currentPhase: string = 'STANDING';
  private repCount: number = 0;
  private minKneeAngle: number = 180;
  private repStartTime: number = 0;
  private lastRepCompleteTime: number = 0;
  private issuesInCurrentRep: TechniqueIssue[] = [];

  constructor(config = squatConfig) {
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
        currentFeedbackDefault: 'Step back so your full body from hips to feet is visible',
        feedbackSeverity: 'attention',
        confidenceScore: Math.round(confidence * 100),
        issues: [],
      };
    }

    // Measure left and right knee angles
    const lVis = Math.min(
      landmarks[23]?.visibility ?? 0.8,
      landmarks[25]?.visibility ?? 0.8,
      landmarks[27]?.visibility ?? 0.8
    );
    const rVis = Math.min(
      landmarks[24]?.visibility ?? 0.8,
      landmarks[26]?.visibility ?? 0.8,
      landmarks[28]?.visibility ?? 0.8
    );

    const lKnee = calculateJointAngle(landmarks[23], landmarks[25], landmarks[27]);
    const rKnee = calculateJointAngle(landmarks[24], landmarks[26], landmarks[28]);

    // Visibility-weighted angle for side or diagonal camera view
    let kneeAngle: number;
    if (lVis > 0.45 && rVis > 0.45) {
      kneeAngle = Math.round((lKnee + rKnee) / 2);
    } else if (lVis >= rVis) {
      kneeAngle = lKnee;
    } else {
      kneeAngle = rKnee;
    }

    const symmetry = calculateBilateralSymmetry(lKnee, rKnee);

    // Technique checks
    if (symmetry < 80) {
      if (!this.issuesInCurrentRep.some((i) => i.type === 'asymmetry')) {
        this.issuesInCurrentRep.push({
          type: 'asymmetry',
          severity: 'medium',
          messageKey: 'cue.balanceWeight',
          defaultMessage: 'Balance weight evenly between both legs',
          metricValue: symmetry,
        });
      }
    }

    let isRepCompleted = false;
    let completedRep: RepetitionResult | undefined;
    let feedbackKey = 'cue.standInFrame';
    let feedbackDefault = 'Maintain steady form';
    let feedbackSeverity: 'good' | 'attention' | 'deviation' = 'good';

    // State Machine Transitions
    switch (this.currentPhase) {
      case 'STANDING':
      case 'READY':
        if (kneeAngle < this.config.descentTriggerAngle) {
          if (now - this.lastRepCompleteTime > this.config.cooldownMs) {
            this.currentPhase = 'DESCENT';
            this.minKneeAngle = kneeAngle;
            this.repStartTime = now;
            this.issuesInCurrentRep = [];
            feedbackKey = 'cue.controlDescent';
            feedbackDefault = 'Control descent smoothly';
          }
        } else {
          feedbackKey = 'cue.standInFrame';
          feedbackDefault = 'Ready to begin squat';
        }
        break;

      case 'DESCENT':
        if (kneeAngle < this.minKneeAngle) {
          this.minKneeAngle = kneeAngle;
        }

        if (kneeAngle <= this.config.bottomTriggerAngle) {
          this.currentPhase = 'BOTTOM';
          feedbackKey = 'cue.goodDepth';
          feedbackDefault = 'Good depth — drive up through midfoot';
        } else {
          feedbackKey = 'cue.controlDescent';
          feedbackDefault = 'Control descent smoothly';
        }
        break;

      case 'BOTTOM':
        if (kneeAngle < this.minKneeAngle) {
          this.minKneeAngle = kneeAngle;
        }

        if (kneeAngle > this.config.ascentTriggerAngle) {
          this.currentPhase = 'ASCENT';
          feedbackKey = 'cue.driveHipsUp';
          feedbackDefault = 'Drive hips and chest up together';
        } else {
          feedbackKey = 'cue.goodDepth';
          feedbackDefault = 'Good depth — drive up through midfoot';
        }
        break;

      case 'ASCENT':
        if (kneeAngle >= this.config.lockoutTriggerAngle) {
          const duration = (now - this.repStartTime) / 1000;
          const rom = 180 - this.minKneeAngle;

          if (
            duration >= this.config.minRepDurationSec &&
            duration <= this.config.maxRepDurationSec &&
            rom >= this.config.minimumRomDegrees
          ) {
            this.repCount += 1;
            this.lastRepCompleteTime = now;
            isRepCompleted = true;

            const depthScore = this.minKneeAngle <= 95 ? 98 : this.minKneeAngle <= 108 ? 92 : 82;
            const tempoScore = duration >= 1.6 && duration <= 3.8 ? 95 : 84;
            const repScore = Math.round((depthScore + symmetry + tempoScore) / 3);

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
              tempoScore,
              stabilityScore: 92,
              peakAngle: this.minKneeAngle,
              minAngle: this.minKneeAngle,
              isValid: this.minKneeAngle <= 115,
              issues: [...this.issuesInCurrentRep],
            };

            feedbackKey = 'cue.repComplete';
            feedbackDefault = 'Rep completed! Great form.';
            feedbackSeverity = 'good';
          }

          this.currentPhase = 'STANDING';
          this.minKneeAngle = 180;
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
        : 'phase.standing';

    return {
      phase: this.currentPhase,
      phaseKey,
      primaryAngle: kneeAngle,
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
