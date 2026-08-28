import { AnalysisFrameResult, LandmarkPoint } from './types';
import { SquatAnalyzer } from './exercises/squat';
import { PushupAnalyzer } from './exercises/pushup';
import { PullupAnalyzer } from './exercises/pullup';
import { BicepCurlAnalyzer } from './exercises/bicepCurl';
import { ShoulderPressAnalyzer } from './exercises/shoulderPress';

export interface IExerciseAnalyzer {
  reset(): void;
  analyzeFrame(landmarks: LandmarkPoint[], now: number): AnalysisFrameResult;
}

export class ExerciseAnalyzerFactory {
  public static create(slug: string): IExerciseAnalyzer {
    switch (slug.toLowerCase()) {
      case 'squat':
      case 'barbell_squat':
      case 'goblet_squat':
        return new SquatAnalyzer();

      case 'pushup':
      case 'push_up':
      case 'push-up':
        return new PushupAnalyzer();

      case 'pullup':
      case 'pull_up':
      case 'pull-up':
      case 'chinup':
      case 'chin_up':
        return new PullupAnalyzer();

      case 'bicep_curl':
      case 'bicep-curl':
      case 'dumbbell_curl':
        return new BicepCurlAnalyzer();

      case 'shoulder_press':
      case 'overhead_press':
      case 'military_press':
        return new ShoulderPressAnalyzer();

      default:
        // Default to squat analyzer for general lower body / kinetic chain movements
        return new SquatAnalyzer();
    }
  }
}
