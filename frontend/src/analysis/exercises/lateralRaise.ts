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

export const lateralRaiseConfig: ExerciseAnalysisConfig = {
  slug: 'lateral_raise',
  name: 'Dumbbell / Cable Lateral Raise',
  cameraSetupInstructions: 'Position camera 2 to 3 meters away directly in front at chest level.',
  defaultCameraAngle: 'Front View (0°)',
  requiredLandmarks: [11, 12, 13, 14, 23, 24],
  primaryJoints: {
    left: [23, 11, 13],  // Hip, Shoulder, Elbow
    right: [24, 12, 14],
  },
  secondaryJoints: {
    left: [11, 13, 15],  // Shoulder, Elbow, Wrist
    right: [12, 14, 16],
  },
  minimumConfidence: 0.40,
  minimumRomDegrees: 55,
  cooldownMs: 350,
  minRepDurationSec: 0.8,
  maxRepDurationSec: 5.0,
  phases: ['REST', 'ASCENT', 'TOP', 'DESCENT'],
  standingOrStartAngle: 25,
  descentTriggerAngle: 40,
  bottomTriggerAngle: 80,
  ascentTriggerAngle: 60,
  lockoutTriggerAngle: 30,
};

export class LateralRaiseAnalyzer {
  private config: ExerciseAnalysisConfig;
  private currentPhase: string = 'REST';
  private repCount: number = 0;
  private maxShoulderAngle: number = 0;
  private repStartTime: number = 0;
  private lastRepCompleteTime: number = 0;
  private issuesInCurrentRep: TechniqueIssue[] = [];

  constructor(config = lateralRaiseConfig) {
    this.config = config;
  }

  public reset(): void {
    this.currentPhase = 'REST';
    this.repCount = 0;
    this.maxShoulderAngle = 0;
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
        primaryAngle: 0,
        symmetryRatio: 100,
        isRepCompleted: false,
        currentFeedbackKey: 'cue.ensureArmsVisible',
        currentFeedbackDefault: 'Ensure your upper body and arms are in frame',
        feedbackSeverity: 'attention',
        confidenceScore: Math.round(confidence * 100),
        issues: [],
      };
    }

    const lAngle = calculateJointAngle(landmarks[23], landmarks[11], landmarks[13]);
    const rAngle = calculateJointAngle(landmarks[24], landmarks[12], landmarks[14]);
    const avgAngle = Math.round((lAngle + rAngle) / 2);

    let isRepCompleted = false;
    let completedRep: RepetitionResult | undefined;
    let feedbackKey = 'cue.lateralRaiseAscent';
    let feedbackDefault = 'Raise arms out to sides up to shoulder level';
    let severity: 'good' | 'attention' | 'deviation' = 'good';

    switch (this.currentPhase) {
      case 'REST':
        if (avgAngle > this.config.descentTriggerAngle && now - this.lastRepCompleteTime > this.config.cooldownMs) {
          this.currentPhase = 'ASCENT';
          this.repStartTime = now;
          this.maxShoulderAngle = avgAngle;
          this.issuesInCurrentRep = [];
          feedbackKey = 'cue.lateralRaiseAscent';
          feedbackDefault = 'Raise arms out to sides smoothly';
        } else {
          feedbackKey = 'cue.standInFrame';
          feedbackDefault = 'Stand upright with weights at your sides';
        }
        break;

      case 'ASCENT':
        if (avgAngle > this.maxShoulderAngle) {
          this.maxShoulderAngle = avgAngle;
        }

        if (avgAngle >= this.config.bottomTriggerAngle) {
          this.currentPhase = 'TOP';
          feedbackKey = 'cue.lateralRaiseNoTrap';
          feedbackDefault = 'Top reach — hold and squeeze lateral delts';
          severity = 'good';
        }
        break;

      case 'TOP':
        if (avgAngle < this.config.ascentTriggerAngle) {
          this.currentPhase = 'DESCENT';
          feedbackKey = 'cue.lateralRaiseControl';
          feedbackDefault = 'Lower weights slowly under 2-second control';
        }
        break;

      case 'DESCENT':
        if (avgAngle <= this.config.lockoutTriggerAngle) {
          this.currentPhase = 'REST';
          const duration = (now - this.repStartTime) / 1000;

          if (duration >= this.config.minRepDurationSec && duration <= this.config.maxRepDurationSec) {
            this.repCount++;
            isRepCompleted = true;
            this.lastRepCompleteTime = now;

            const romAchieved = this.maxShoulderAngle - 20;
            const romScore = Math.min(100, Math.round((romAchieved / 70) * 100));

            completedRep = {
              repNumber: this.repCount,
              startTime: this.repStartTime,
              endTime: now,
              durationSeconds: Math.round(duration * 10) / 10,
              repScore: Math.min(100, Math.max(60, romScore)),
              confidenceScore: Math.round(confidence * 100),
              alignmentScore: 92,
              romScore: romScore,
              symmetryScore: 92,
              tempoScore: 90,
              stabilityScore: 90,
              peakAngle: this.maxShoulderAngle,
              minAngle: 20,
              isValid: true,
              issues: [...this.issuesInCurrentRep],
            };

            feedbackKey = 'cue.repComplete';
            feedbackDefault = 'Rep completed! Great side delt contraction.';
            severity = 'good';
          }
        }
        break;
    }

    return {
      phase: this.currentPhase,
      phaseKey: `phase.${this.currentPhase.toLowerCase()}`,
      primaryAngle: avgAngle,
      symmetryRatio: 95,
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
