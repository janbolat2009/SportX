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
  calculateDistance,
  calculateTorsoScale
} from "../smoothing";

export const jumpingJackConfig: ExerciseAnalysisConfig = {
  slug: "jumping_jack",
  name: "Jumping Jacks",
  cameraSetupInstructions: "Step back 2.5 to 3.5 meters so your full body, feet, and overhead arm reach are in frame.",
  defaultCameraAngle: "Front View (Full Body)",
  requiredLandmarks: [11, 12, 13, 14, 15, 16, 23, 24, 27, 28],
  primaryJoints: {
    left: [11, 13, 15],  // Arm reach
    right: [12, 14, 16],
  },
  minimumConfidence: 0.38,
  minimumRomDegrees: 50,
  cooldownMs: 300,
  minRepDurationSec: 0.5,
  maxRepDurationSec: 2.8,
  phases: ["CLOSED", "EXPANDING", "PEAK", "CLOSING"],
  standingOrStartAngle: 155,
  descentTriggerAngle: 120,
  bottomTriggerAngle: 80,
  ascentTriggerAngle: 110,
  lockoutTriggerAngle: 150,
};

export class JumpingJackAnalyzer {
  private config: ExerciseAnalysisConfig;
  private currentPhase: string = "CLOSED";
  private repCount: number = 0;
  private repStartTime: number = 0;
  private lastRepCompleteTime: number = 0;
  private issuesInCurrentRep: TechniqueIssue[] = [];
  private peakArmAngle: number = 0;

  constructor(config = jumpingJackConfig) {
    this.config = config;
  }

  public reset(): void {
    this.currentPhase = "CLOSED";
    this.repCount = 0;
    this.repStartTime = 0;
    this.lastRepCompleteTime = 0;
    this.issuesInCurrentRep = [];
    this.peakArmAngle = 0;
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
        currentFeedbackDefault: "Step back so full body and arms overhead are visible",
        feedbackSeverity: "attention",
        confidenceScore: Math.round(confidence * 100),
        issues: [],
      };
    }

    const torsoScale = calculateTorsoScale(landmarks);

    // Measure arm abduction angle (Torso-Shoulder-Wrist or Hip-Shoulder-Wrist)
    const lArmAngle = calculateJointAngle(landmarks[23], landmarks[11], landmarks[15]);
    const rArmAngle = calculateJointAngle(landmarks[24], landmarks[12], landmarks[16]);
    const armAngle = Math.round((lArmAngle + rArmAngle) / 2);

    // Measure normalized feet stance width
    const ankleDist = calculateDistance(landmarks[27], landmarks[28]) / torsoScale;
    const wristDist = calculateDistance(landmarks[15], landmarks[16]) / torsoScale;
    const symmetry = calculateBilateralSymmetry(lArmAngle, rArmAngle);

    let isRepCompleted = false;
    let completedRep: RepetitionResult | undefined;
    let feedbackKey = "cue.standInFrame";
    let feedbackDefault = "Feet together, hands at sides";
    let feedbackSeverity: "good" | "attention" | "deviation" = "good";

    switch (this.currentPhase) {
      case "CLOSED":
      case "READY":
        if (armAngle > 60 && ankleDist > 0.45 && now - this.lastRepCompleteTime > this.config.cooldownMs) {
          this.currentPhase = "EXPANDING";
          this.repStartTime = now;
          this.peakArmAngle = armAngle;
          this.issuesInCurrentRep = [];
          feedbackKey = "cue.expandWide";
          feedbackDefault = "Jump wide and reach overhead";
        }
        break;

      case "EXPANDING":
        if (armAngle > this.peakArmAngle) {
          this.peakArmAngle = armAngle;
        }

        if (armAngle >= 140 && ankleDist >= 0.70) {
          this.currentPhase = "PEAK";
          feedbackKey = "cue.overheadClap";
          feedbackDefault = "Arms reach peak overhead";
        }
        break;

      case "PEAK":
        if (armAngle < 125 || ankleDist < 0.60) {
          this.currentPhase = "CLOSING";
          feedbackKey = "cue.returnStance";
          feedbackDefault = "Return feet together and hands to sides";
        }
        break;

      case "CLOSING":
        if (armAngle <= 45 && ankleDist <= 0.40) {
          const duration = (now - this.repStartTime) / 1000;

          if (duration >= this.config.minRepDurationSec && duration <= this.config.maxRepDurationSec) {
            this.repCount += 1;
            this.lastRepCompleteTime = now;
            isRepCompleted = true;

            const armScore = this.peakArmAngle >= 150 ? 98 : 85;
            const repScore = Math.round((armScore + symmetry) / 2);

            if (this.peakArmAngle < 140) {
              this.issuesInCurrentRep.push({
                type: "arm_rom",
                severity: "medium",
                messageKey: "cue.reachOverhead",
                defaultMessage: "Reach fully overhead — touch hands at top",
                errorName: "Incomplete Arm Reach",
                correctiveInstruction: "Raise your arms until they are nearly vertical overhead on every jump.",
                explanation: `Arms reached ${this.peakArmAngle}° abduction instead of target ≥150°.`,
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
              romScore: Math.min(100, Math.round((this.peakArmAngle / 160) * 100)),
              symmetryScore: symmetry,
              tempoScore: 92,
              stabilityScore: 94,
              peakAngle: this.peakArmAngle,
              minAngle: armAngle,
              isValid: repScore >= 70,
              issues: [...this.issuesInCurrentRep],
            };

            feedbackKey = "cue.repComplete";
            feedbackDefault = `Rep ${this.repCount} complete! Rhythm on point.`;
            feedbackSeverity = "good";
          }

          this.currentPhase = "CLOSED";
          this.peakArmAngle = 0;
        }
        break;
    }

    return {
      phase: this.currentPhase,
      phaseKey: `phase.${this.currentPhase.toLowerCase()}`,
      primaryAngle: armAngle,
      secondaryAngle: Math.round(ankleDist * 100),
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
