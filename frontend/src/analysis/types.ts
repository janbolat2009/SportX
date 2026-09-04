export type JointName =
  | 'nose'
  | 'left_eye'
  | 'right_eye'
  | 'left_ear'
  | 'right_ear'
  | 'left_shoulder'
  | 'right_shoulder'
  | 'left_elbow'
  | 'right_elbow'
  | 'left_wrist'
  | 'right_wrist'
  | 'left_hip'
  | 'right_hip'
  | 'left_knee'
  | 'right_knee'
  | 'left_ankle'
  | 'right_ankle'
  | 'left_heel'
  | 'right_heel'
  | 'left_foot_index'
  | 'right_foot_index';

// MediaPipe 33 Landmark Index Mapping
export const LANDMARK_INDEX: Record<string, number> = {
  nose: 0,
  left_shoulder: 11,
  right_shoulder: 12,
  left_elbow: 13,
  right_elbow: 14,
  left_wrist: 15,
  right_wrist: 16,
  left_hip: 23,
  right_hip: 24,
  left_knee: 25,
  right_knee: 26,
  left_ankle: 27,
  right_ankle: 28,
  left_heel: 29,
  right_heel: 30,
  left_foot_index: 31,
  right_foot_index: 32,
};

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface JointAngleMetric {
  name: string;
  pointA: number;
  pointB: number; // vertex
  pointC: number;
  idealRange: [number, number]; // [min, max]
}

export interface TechniqueIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  messageKey: string;
  defaultMessage: string;
  metricValue?: number;
  benchmarkValue?: number;
  errorName?: string;
  correctiveInstruction?: string;
  explanation?: string;
}

export interface StructuredAnalysisFacts {
  exerciseSlug: string;
  exerciseName: string;
  totalReps: number;
  validReps: number;
  durationSeconds: number;
  overallScore: number;
  symmetryScore: number;
  romScore: number;
  alignmentScore: number;
  tempoScore: number;
  stabilityScore: number;
  passedChecks: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  detectedErrors: Array<{
    id: string;
    title: string;
    severity: 'low' | 'medium' | 'high';
    explanation: string;
    correctiveInstruction: string;
    metricValue?: number;
    benchmarkValue?: number;
  }>;
  howToImprove: string[];
}

export interface RepetitionResult {
  repNumber: number;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  repScore: number;
  confidenceScore: number;
  alignmentScore: number;
  romScore: number;
  symmetryScore: number;
  tempoScore: number;
  stabilityScore: number;
  peakAngle: number;
  minAngle: number;
  isValid: boolean;
  issues: TechniqueIssue[];
}

export interface ExerciseAnalysisConfig {
  slug: string;
  name: string;
  cameraSetupInstructions: string;
  defaultCameraAngle: string;
  requiredLandmarks: number[];
  primaryJoints: {
    left: [number, number, number];
    right: [number, number, number];
  };
  secondaryJoints?: {
    left?: [number, number, number];
    right?: [number, number, number];
  };
  minimumConfidence: number;
  minimumRomDegrees: number;
  cooldownMs: number;
  minRepDurationSec: number;
  maxRepDurationSec: number;
  phases: string[];
  // Condition functions or angle thresholds
  standingOrStartAngle: number; // Hysteresis threshold
  descentTriggerAngle: number;
  bottomTriggerAngle: number;
  ascentTriggerAngle: number;
  lockoutTriggerAngle: number;
}

export interface AnalysisFrameResult {
  phase: string;
  phaseKey: string;
  primaryAngle: number;
  secondaryAngle?: number;
  symmetryRatio: number;
  isRepCompleted: boolean;
  completedRep?: RepetitionResult;
  currentFeedbackKey: string;
  currentFeedbackDefault: string;
  feedbackSeverity: 'good' | 'attention' | 'deviation';
  confidenceScore: number;
  issues: TechniqueIssue[];
}
