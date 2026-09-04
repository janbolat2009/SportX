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

export const pushupConfig: ExerciseAnalysisConfig = {
  slug: "pushup",
  name: "Standard Floor Push-up",
  cameraSetupInstructions: "Position camera 2 meters away at ground/chest level with full body side-profile visible.",
  defaultCameraAngle: "Side View (90° Profile)",
  requiredLandmarks: [11, 12, 13, 14, 15, 16, 23, 24, 27, 28],
  primaryJoints: {
    left: [11, 13, 15],  // Shoulder, Elbow, Wrist
    right: [12, 14, 16], // Shoulder, Elbow, Wrist
  },
  secondaryJoints: {
    left: [11, 23, 27],  // Shoulder, Hip, Ankle (Torso Alignment)
    right: [12, 24, 28], // Shoulder, Hip, Ankle (Torso Alignment)
  },
  minimumConfidence: 0.38,
  minimumRomDegrees: 55,
  cooldownMs: 400,
  minRepDurationSec: 0.8,
  maxRepDurationSec: 5.5,
  phases: ["PLANK", "ECCENTRIC", "INFLECTION", "CONCENTRIC"],
  standingOrStartAngle: 155,
  descentTriggerAngle: 140,
  bottomTriggerAngle: 95,
  ascentTriggerAngle: 120,
  lockoutTriggerAngle: 150,
};

export class PushupAnalyzer {
  private config: ExerciseAnalysisConfig;
  private currentPhase: string = "PLANK";
  private repCount: number = 0;
  private minElbowAngle: number = 180;
  private repStartTime: number = 0;
  private lastRepCompleteTime: number = 0;
  private issuesInCurrentRep: TechniqueIssue[] = [];
  private startShoulderY: number | null = null;
  private deepestShoulderY: number = 0;

  constructor(config = pushupConfig) {
    this.config = config;
  }

  public reset(): void {
    this.currentPhase = "PLANK";
    this.repCount = 0;
    this.minElbowAngle = 180;
    this.repStartTime = 0;
    this.lastRepCompleteTime = 0;
    this.issuesInCurrentRep = [];
    this.startShoulderY = null;
    this.deepestShoulderY = 0;
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
        currentFeedbackDefault: "Position camera so your head, torso and feet are visible",
        feedbackSeverity: "attention",
        confidenceScore: Math.round(confidence * 100),
        issues: [],
      };
    }

    const lElbow = calculateJointAngle(landmarks[11], landmarks[13], landmarks[15]);
    const rElbow = calculateJointAngle(landmarks[12], landmarks[14], landmarks[16]);
    const lTorso = calculateJointAngle(landmarks[11], landmarks[23], landmarks[27]);
    const rTorso = calculateJointAngle(landmarks[12], landmarks[24], landmarks[28]);

    const lVis = landmarks[13]?.visibility ?? 0.8;
    const rVis = landmarks[14]?.visibility ?? 0.8;

    let elbowAngle: number;
    let torsoAngle: number;
    if (lVis > 0.45 && rVis > 0.45) {
      elbowAngle = Math.round((lElbow + rElbow) / 2);
      torsoAngle = Math.round((lTorso + rTorso) / 2);
    } else if (lVis >= rVis) {
      elbowAngle = lElbow;
      torsoAngle = lTorso;
    } else {
      elbowAngle = rElbow;
      torsoAngle = rTorso;
    }

    const symmetry = calculateBilateralSymmetry(lElbow, rElbow);
    const midShoulderY = (landmarks[11].y + landmarks[12].y) / 2;
    const torsoScale = calculateTorsoScale(landmarks);

    // Technique: Sagging or Piking Torso Line
    if (torsoAngle < 152) {
      if (!this.issuesInCurrentRep.some((i) => i.type === "torso_sag")) {
        this.issuesInCurrentRep.push({
          type: "torso_sag",
          severity: "high",
          messageKey: "cue.braceCore",
          defaultMessage: "Brace your core and glutes — keep body in a rigid straight line",
          errorName: "Torso Sagging / Broken Plank",
          correctiveInstruction: "Squeeze your abdominal wall and glutes so your hips do not droop toward the floor.",
          explanation: "Your hip angle broke under 155°, losing rigid spinal alignment.",
          metricValue: torsoAngle,
          benchmarkValue: 170,
        });
      }
    }

    // Technique: Asymmetric push
    if (symmetry < 76) {
      if (!this.issuesInCurrentRep.some((i) => i.type === "asymmetry")) {
        this.issuesInCurrentRep.push({
          type: "asymmetry",
          severity: "medium",
          messageKey: "cue.balanceWeight",
          defaultMessage: "Press evenly with both arms",
          errorName: "Uneven Arm Pressing",
          correctiveInstruction: "Distribute your bodyweight evenly through both palms.",
          explanation: "One elbow extended significantly faster than the other during lockout.",
          metricValue: symmetry,
        });
      }
    }

    let isRepCompleted = false;
    let completedRep: RepetitionResult | undefined;
    let feedbackKey = "cue.pushupPlank";
    let feedbackDefault = "Hold solid plank position";
    let feedbackSeverity: "good" | "attention" | "deviation" = "good";

    switch (this.currentPhase) {
      case "PLANK":
      case "READY":
        this.startShoulderY = midShoulderY;
        if (elbowAngle < this.config.descentTriggerAngle && now - this.lastRepCompleteTime > this.config.cooldownMs) {
          this.currentPhase = "ECCENTRIC";
          this.minElbowAngle = elbowAngle;
          this.deepestShoulderY = midShoulderY;
          this.repStartTime = now;
          this.issuesInCurrentRep = [];
          feedbackKey = "cue.controlDescent";
          feedbackDefault = "Lower chest with control";
        } else {
          feedbackKey = "cue.pushupPlank";
          feedbackDefault = "Ready — lower chest toward floor";
        }
        break;

      case "ECCENTRIC":
        if (elbowAngle < this.minElbowAngle) {
          this.minElbowAngle = elbowAngle;
        }
        if (midShoulderY > this.deepestShoulderY) {
          this.deepestShoulderY = midShoulderY;
        }

        if (elbowAngle <= this.config.bottomTriggerAngle) {
          this.currentPhase = "INFLECTION";
          feedbackKey = "cue.goodDepth";
          feedbackDefault = "Good chest depth — press floor away";
        } else {
          feedbackKey = "cue.controlDescent";
          feedbackDefault = "Lower smoothly until elbows reach 90°";
        }
        break;

      case "INFLECTION":
        if (elbowAngle < this.minElbowAngle) {
          this.minElbowAngle = elbowAngle;
        }
        if (midShoulderY > this.deepestShoulderY) {
          this.deepestShoulderY = midShoulderY;
        }

        if (elbowAngle > this.config.ascentTriggerAngle) {
          this.currentPhase = "CONCENTRIC";
          feedbackKey = "cue.pushupDrive";
          feedbackDefault = "Drive hands through floor to plank";
        }
        break;

      case "CONCENTRIC":
        if (elbowAngle >= this.config.lockoutTriggerAngle) {
          const duration = (now - this.repStartTime) / 1000;
          const rom = 180 - this.minElbowAngle;
          const shoulderDisplacement = Math.abs(this.deepestShoulderY - (this.startShoulderY || midShoulderY)) / torsoScale;

          if (
            duration >= this.config.minRepDurationSec &&
            duration <= this.config.maxRepDurationSec &&
            rom >= this.config.minimumRomDegrees &&
            shoulderDisplacement >= 0.10
          ) {
            this.repCount += 1;
            this.lastRepCompleteTime = now;
            isRepCompleted = true;

            const depthScore = this.minElbowAngle <= 90 ? 98 : this.minElbowAngle <= 105 ? 90 : 80;
            const tempoScore = duration >= 1.4 && duration <= 3.6 ? 96 : 84;
            const repScore = Math.round((depthScore + symmetry + tempoScore) / 3);

            if (this.minElbowAngle > 98) {
              this.issuesInCurrentRep.push({
                type: "depth",
                severity: "medium",
                messageKey: "cue.pushupDeeper",
                defaultMessage: "Lower chest closer to floor for full 90° elbow flexion",
                errorName: "Shallow Push-up Depth",
                correctiveInstruction: "Bring your chest to fist-distance from the floor to achieve full pectoral stretch.",
                explanation: `Elbow angle reached ${this.minElbowAngle}° instead of target ≤90°.`,
                metricValue: this.minElbowAngle,
                benchmarkValue: 90,
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
              stabilityScore: Math.round(94 - (this.issuesInCurrentRep.length * 6)),
              peakAngle: 180,
              minAngle: this.minElbowAngle,
              isValid: repScore >= 70,
              issues: [...this.issuesInCurrentRep],
            };

            feedbackKey = "cue.repComplete";
            feedbackDefault = `Rep ${this.repCount} complete! Clean form.`;
            feedbackSeverity = "good";
          }

          this.currentPhase = "PLANK";
          this.minElbowAngle = 180;
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
      primaryAngle: elbowAngle,
      secondaryAngle: torsoAngle,
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
