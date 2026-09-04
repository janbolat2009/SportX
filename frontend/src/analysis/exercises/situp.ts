import {
  ExerciseAnalysisConfig,
  LandmarkPoint,
  AnalysisFrameResult,
  RepetitionResult,
  TechniqueIssue
} from "../types";
import {
  calculateJointAngle,
  calculateBilateralSymmetry,
  getLandmarksConfidence,
  calculateTorsoScale
} from "../smoothing";

export const situpConfig: ExerciseAnalysisConfig = {
  slug: "situp",
  name: "Sit-up / Abdominal Curl",
  cameraSetupInstructions: "Position camera 2 meters away at ground level showing full side profile on mat.",
  defaultCameraAngle: "Side View (Ground Level)",
  requiredLandmarks: [11, 12, 23, 24, 25, 26],
  primaryJoints: {
    left: [11, 23, 25],  // Shoulder, Hip, Knee
    right: [12, 24, 26], // Shoulder, Hip, Knee
  },
  minimumConfidence: 0.38,
  minimumRomDegrees: 55,
  cooldownMs: 400,
  minRepDurationSec: 0.9,
  maxRepDurationSec: 5.0,
  phases: ["SUPINE", "CURLING", "UPRIGHT", "LOWERING"],
  standingOrStartAngle: 145,
  descentTriggerAngle: 130,
  bottomTriggerAngle: 75,
  ascentTriggerAngle: 90,
  lockoutTriggerAngle: 140,
};

export class SitupAnalyzer {
  private config: ExerciseAnalysisConfig;
  private currentPhase: string = "SUPINE";
  private repCount: number = 0;
  private minTorsoAngle: number = 180;
  private repStartTime: number = 0;
  private lastRepCompleteTime: number = 0;
  private issuesInCurrentRep: TechniqueIssue[] = [];

  constructor(config = situpConfig) {
    this.config = config;
  }

  public reset(): void {
    this.currentPhase = "SUPINE";
    this.repCount = 0;
    this.minTorsoAngle = 180;
    this.repStartTime = 0;
    this.lastRepCompleteTime = 0;
    this.issuesInCurrentRep = [];
  }

  public analyzeFrame(landmarks: LandmarkPoint[], now: number): AnalysisFrameResult {
    const confidence = getLandmarksConfidence(landmarks, this.config.requiredLandmarks);

    if (confidence < this.config.minimumConfidence) {
      return {
        phase: this.currentPhase,
        phaseKey: "phase.ready",
        primaryAngle: 180,
        symmetryRatio: 100,
        isRepCompleted: false,
        currentFeedbackKey: "cue.stepBackFullBody",
        currentFeedbackDefault: "Position camera to see side profile from shoulders to knees",
        feedbackSeverity: "attention",
        confidenceScore: Math.round(confidence * 100),
        issues: [],
      };
    }

    const lTorso = calculateJointAngle(landmarks[11], landmarks[23], landmarks[25]);
    const rTorso = calculateJointAngle(landmarks[12], landmarks[24], landmarks[26]);
    const lVis = landmarks[11]?.visibility ?? 0.8;
    const rVis = landmarks[12]?.visibility ?? 0.8;

    let torsoAngle: number;
    if (lVis > 0.45 && rVis > 0.45) {
      torsoAngle = Math.round((lTorso + rTorso) / 2);
    } else if (lVis >= rVis) {
      torsoAngle = lTorso;
    } else {
      torsoAngle = rTorso;
    }

    const symmetry = calculateBilateralSymmetry(lTorso, rTorso);

    let isRepCompleted = false;
    let completedRep: RepetitionResult | undefined;
    let feedbackKey = "cue.situpSupine";
    let feedbackDefault = "Lie supine on mat with knees bent at 90°";
    let feedbackSeverity: "good" | "attention" | "deviation" = "good";

    switch (this.currentPhase) {
      case "SUPINE":
      case "READY":
        if (torsoAngle < this.config.descentTriggerAngle && now - this.lastRepCompleteTime > this.config.cooldownMs) {
          this.currentPhase = "CURLING";
          this.minTorsoAngle = torsoAngle;
          this.repStartTime = now;
          this.issuesInCurrentRep = [];
          feedbackKey = "cue.curlUp";
          feedbackDefault = "Engage abs and curl chest toward thighs";
        }
        break;

      case "CURLING":
        if (torsoAngle < this.minTorsoAngle) {
          this.minTorsoAngle = torsoAngle;
        }

        if (torsoAngle <= this.config.bottomTriggerAngle) {
          this.currentPhase = "UPRIGHT";
          feedbackKey = "cue.situpUpright";
          feedbackDefault = "Full upright reach — control descent";
        }
        break;

      case "UPRIGHT":
        if (torsoAngle > this.config.ascentTriggerAngle) {
          this.currentPhase = "LOWERING";
          feedbackKey = "cue.controlDescent";
          feedbackDefault = "Lower shoulders smoothly to mat";
        }
        break;

      case "LOWERING":
        if (torsoAngle >= this.config.lockoutTriggerAngle) {
          const duration = (now - this.repStartTime) / 1000;
          const rom = 180 - this.minTorsoAngle;

          if (duration >= this.config.minRepDurationSec && duration <= this.config.maxRepDurationSec && rom >= this.config.minimumRomDegrees) {
            this.repCount += 1;
            this.lastRepCompleteTime = now;
            isRepCompleted = true;

            const repScore = this.minTorsoAngle <= 70 ? 98 : 86;

            if (this.minTorsoAngle > 75) {
              this.issuesInCurrentRep.push({
                type: "situp_depth",
                severity: "medium",
                messageKey: "cue.situpHigher",
                defaultMessage: "Curl torso all the way up until chest approaches thighs",
                errorName: "Partial Crunch / Incomplete Sit-up",
                correctiveInstruction: "Flex through your spine until your chest comes within 20cm of your thighs.",
                explanation: `Torso angle reached ${this.minTorsoAngle}° instead of target ≤70°.`,
              });
            }

            completedRep = {
              repNumber: this.repCount,
              startTime: this.repStartTime,
              endTime: now,
              durationSeconds: Math.round(duration * 10) / 10,
              repScore,
              confidenceScore: Math.round(confidence * 100),
              alignmentScore: symmetry,
              romScore: Math.min(100, Math.round((rom / 110) * 100)),
              symmetryScore: symmetry,
              tempoScore: 92,
              stabilityScore: 95,
              peakAngle: 180,
              minAngle: this.minTorsoAngle,
              isValid: repScore >= 70,
              issues: [...this.issuesInCurrentRep],
            };

            feedbackKey = "cue.repComplete";
            feedbackDefault = `Rep ${this.repCount} complete! Solid abdominal contraction.`;
            feedbackSeverity = "good";
          }

          this.currentPhase = "SUPINE";
          this.minTorsoAngle = 180;
        }
        break;
    }

    return {
      phase: this.currentPhase,
      phaseKey: `phase.${this.currentPhase.toLowerCase()}`,
      primaryAngle: torsoAngle,
      symmetryRatio: symmetry,
      isRepCompleted,
      completedRep,
      currentFeedbackKey: feedbackKey,
      currentFeedbackDefault: feedbackDefault,
      feedbackSeverity,
      confidenceScore: Math.round(confidence * 100),
      issues: [...this.issuesInCurrentRep],
    };
  }
}
