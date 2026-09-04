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

export const squatConfig: ExerciseAnalysisConfig = {
  slug: "squat",
  name: "Barbell / Bodyweight Squat",
  cameraSetupInstructions: "Position camera 2 to 3 meters away at hip level with full body visible from head to feet.",
  defaultCameraAngle: "Side View / 45° Angle",
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
  minimumRomDegrees: 55,
  cooldownMs: 400,
  minRepDurationSec: 0.9,
  maxRepDurationSec: 6.0,
  phases: ["STANDING", "DESCENT", "BOTTOM", "ASCENT"],
  standingOrStartAngle: 155,
  descentTriggerAngle: 145,
  bottomTriggerAngle: 105,
  ascentTriggerAngle: 125,
  lockoutTriggerAngle: 150,
};

export class SquatAnalyzer {
  private config: ExerciseAnalysisConfig;
  private currentPhase: string = "STANDING";
  private repCount: number = 0;
  private minKneeAngle: number = 180;
  private repStartTime: number = 0;
  private lastRepCompleteTime: number = 0;
  private issuesInCurrentRep: TechniqueIssue[] = [];
  private standingHipY: number | null = null;
  private deepestHipY: number = 0;

  constructor(config = squatConfig) {
    this.config = config;
  }

  public reset(): void {
    this.currentPhase = "STANDING";
    this.repCount = 0;
    this.minKneeAngle = 180;
    this.repStartTime = 0;
    this.lastRepCompleteTime = 0;
    this.issuesInCurrentRep = [];
    this.standingHipY = null;
    this.deepestHipY = 0;
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
        currentFeedbackDefault: "Step back so your full body from hips to feet is visible",
        feedbackSeverity: "attention",
        confidenceScore: Math.round(confidence * 100),
        issues: [],
      };
    }

    // 1. Joint angles
    const lKnee = calculateJointAngle(landmarks[23], landmarks[25], landmarks[27]);
    const rKnee = calculateJointAngle(landmarks[24], landmarks[26], landmarks[28]);
    const lHip = calculateJointAngle(landmarks[11], landmarks[23], landmarks[25]);
    const rHip = calculateJointAngle(landmarks[12], landmarks[24], landmarks[26]);

    const lVis = landmarks[25]?.visibility ?? 0.8;
    const rVis = landmarks[26]?.visibility ?? 0.8;

    let kneeAngle: number;
    let hipAngle: number;
    if (lVis > 0.45 && rVis > 0.45) {
      kneeAngle = Math.round((lKnee + rKnee) / 2);
      hipAngle = Math.round((lHip + rHip) / 2);
    } else if (lVis >= rVis) {
      kneeAngle = lKnee;
      hipAngle = lHip;
    } else {
      kneeAngle = rKnee;
      hipAngle = rHip;
    }

    const symmetry = calculateBilateralSymmetry(lKnee, rKnee);

    // 2. Trajectory tracking & Scale normalization
    const midHipY = (landmarks[23].y + landmarks[24].y) / 2;
    const torsoScale = calculateTorsoScale(landmarks);

    // 3. Biomechanical fault detection: Knee Valgus
    const kneeDist = calculateDistance(landmarks[25], landmarks[26]);
    const ankleDist = calculateDistance(landmarks[27], landmarks[28]);
    if (ankleDist > 0.1 && kneeDist < ankleDist * 0.78 && kneeAngle < 135) {
      if (!this.issuesInCurrentRep.some((i) => i.type === "valgus")) {
        this.issuesInCurrentRep.push({
          type: "valgus",
          severity: "high",
          messageKey: "cue.kneesOut",
          defaultMessage: "Keep knees tracking over toes — avoid inward collapse",
          errorName: "Knee Valgus (Inward Collapse)",
          correctiveInstruction: "Drive your knees outward over your pinky toes during both descent and ascent.",
          explanation: "Your knees caved inward relative to your ankles, placing excessive shear stress on the ACL.",
        });
      }
    }

    // 4. Biomechanical fault detection: Excessive Torso Forward Lean
    if (hipAngle < 65 && kneeAngle > 100) {
      if (!this.issuesInCurrentRep.some((i) => i.type === "torso_lean")) {
        this.issuesInCurrentRep.push({
          type: "torso_lean",
          severity: "medium",
          messageKey: "cue.chestUp",
          defaultMessage: "Keep your chest proud and spine neutral",
          errorName: "Excessive Forward Torso Lean",
          correctiveInstruction: "Keep your chest upright and drive hips through without collapsing your chest forward.",
          explanation: "Your torso tilted forward too early before reaching target squat depth.",
        });
      }
    }

    // 5. Asymmetry check
    if (symmetry < 78) {
      if (!this.issuesInCurrentRep.some((i) => i.type === "asymmetry")) {
        this.issuesInCurrentRep.push({
          type: "asymmetry",
          severity: "medium",
          messageKey: "cue.balanceWeight",
          defaultMessage: "Balance weight evenly between both feet",
          errorName: "Bilateral Weight Shift",
          correctiveInstruction: "Push evenly through the midfoot of both left and right feet.",
          explanation: "One knee took significantly more load than the other during the rep.",
          metricValue: symmetry,
        });
      }
    }

    let isRepCompleted = false;
    let completedRep: RepetitionResult | undefined;
    let feedbackKey = "cue.standInFrame";
    let feedbackDefault = "Maintain steady form";
    let feedbackSeverity: "good" | "attention" | "deviation" = "good";

    // 6. Kinematic State Machine with Hysteresis & Trajectory Verification
    switch (this.currentPhase) {
      case "STANDING":
      case "READY":
        this.standingHipY = midHipY;
        if (kneeAngle < this.config.descentTriggerAngle && now - this.lastRepCompleteTime > this.config.cooldownMs) {
          this.currentPhase = "DESCENT";
          this.minKneeAngle = kneeAngle;
          this.deepestHipY = midHipY;
          this.repStartTime = now;
          this.issuesInCurrentRep = [];
          feedbackKey = "cue.controlDescent";
          feedbackDefault = "Control descent smoothly";
        } else {
          feedbackKey = "cue.standInFrame";
          feedbackDefault = "Ready — initiate squat with hips and knees";
        }
        break;

      case "DESCENT":
        if (kneeAngle < this.minKneeAngle) {
          this.minKneeAngle = kneeAngle;
        }
        if (midHipY > this.deepestHipY) {
          this.deepestHipY = midHipY;
        }

        if (kneeAngle <= this.config.bottomTriggerAngle) {
          this.currentPhase = "BOTTOM";
          feedbackKey = "cue.goodDepth";
          feedbackDefault = "Good depth reached — drive up through midfoot";
        } else {
          feedbackKey = "cue.controlDescent";
          feedbackDefault = "Control descent smoothly down to parallel";
        }
        break;

      case "BOTTOM":
        if (kneeAngle < this.minKneeAngle) {
          this.minKneeAngle = kneeAngle;
        }
        if (midHipY > this.deepestHipY) {
          this.deepestHipY = midHipY;
        }

        if (kneeAngle > this.config.ascentTriggerAngle) {
          this.currentPhase = "ASCENT";
          feedbackKey = "cue.driveHipsUp";
          feedbackDefault = "Drive feet into floor and extend hips";
        } else {
          feedbackKey = "cue.goodDepth";
          feedbackDefault = "Parallel reached — power up";
        }
        break;

      case "ASCENT":
        if (kneeAngle >= this.config.lockoutTriggerAngle) {
          const duration = (now - this.repStartTime) / 1000;
          const rom = 180 - this.minKneeAngle;
          const hipDisplacement = Math.abs(this.deepestHipY - (this.standingHipY || midHipY)) / torsoScale;

          // Check if full cycle actually occurred (not jitter, not shallow bounce)
          if (
            duration >= this.config.minRepDurationSec &&
            duration <= this.config.maxRepDurationSec &&
            rom >= this.config.minimumRomDegrees &&
            hipDisplacement >= 0.12
          ) {
            this.repCount += 1;
            this.lastRepCompleteTime = now;
            isRepCompleted = true;

            const depthScore = this.minKneeAngle <= 95 ? 98 : this.minKneeAngle <= 108 ? 92 : 80;
            const tempoScore = duration >= 1.6 && duration <= 3.8 ? 96 : 82;
            const repScore = Math.round((depthScore + symmetry + tempoScore) / 3);

            // Incomplete depth check
            if (this.minKneeAngle > 105) {
              this.issuesInCurrentRep.push({
                type: "depth",
                severity: "medium",
                messageKey: "cue.squatDeeper",
                defaultMessage: "Squat lower until thighs reach parallel",
                errorName: "Incomplete Squat Depth",
                correctiveInstruction: "Descend until the crease of your hip is parallel with the top of your knee.",
                explanation: `Knee flexion reached ${this.minKneeAngle}° instead of target ≤95°.`,
                metricValue: this.minKneeAngle,
                benchmarkValue: 95,
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
              romScore: Math.min(100, Math.round((rom / 90) * 100)),
              symmetryScore: symmetry,
              tempoScore,
              stabilityScore: Math.round(92 - (this.issuesInCurrentRep.length * 6)),
              peakAngle: 180,
              minAngle: this.minKneeAngle,
              isValid: repScore >= 70,
              issues: [...this.issuesInCurrentRep],
            };

            feedbackKey = "cue.repComplete";
            feedbackDefault = `Rep ${this.repCount} complete! Great form.`;
            feedbackSeverity = "good";
          }

          this.currentPhase = "STANDING";
          this.minKneeAngle = 180;
        } else {
          feedbackKey = "cue.driveHipsUp";
          feedbackDefault = "Drive through heels to full standing lockout";
        }
        break;
    }

    if (this.issuesInCurrentRep.length > 0) {
      const highestIssue = this.issuesInCurrentRep[this.issuesInCurrentRep.length - 1];
      feedbackKey = highestIssue.messageKey;
      feedbackDefault = highestIssue.defaultMessage;
      feedbackSeverity = highestIssue.severity === "high" ? "deviation" : "attention";
    }

    return {
      phase: this.currentPhase,
      phaseKey: `phase.${this.currentPhase.toLowerCase()}`,
      primaryAngle: kneeAngle,
      secondaryAngle: hipAngle,
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
