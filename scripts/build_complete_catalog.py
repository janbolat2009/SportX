# -*- coding: utf-8 -*-
import json, os, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from categories_data import CATEGORIES
from exercises_part1 import EXERCISES_PART1
from exercises_part1_back import EXERCISES_BACK
from exercises_part2 import EXERCISES_PART2
from exercises_part3 import EXERCISES_PART3
from exercises_part4_core import EXERCISES_CORE
from exercises_part4_legs import EXERCISES_LEGS
from exercises_part5 import EXERCISES_PART5
from additional_exercises import ADDITIONAL_EXERCISES

AI_SUPPORTED_SLUGS = {
    'squat', 'barbell_squat', 'goblet_squat',
    'pushup', 'push_up', 'push-up', 'resistance_band_pushup',
    'pullup', 'pull_up', 'pull-up', 'chinup', 'chin_up',
    'bicep_curl', 'bicep-curl', 'dumbbell_curl', 'barbell_bicep_curl', 'hammer_curl',
    'shoulder_press', 'overhead_press', 'military_press', 'arnold_press',
    'plank', 'forearm_plank', 'side_plank', 'copenhagen_plank',
    'lunge', 'bulgarian_split_squat', 'walking_lunges', 'split_squat',
    'lateral_raise', 'dumbbell_lateral_raise', 'cable_lateral_raise', 'side_lateral_raise'
}

all_exercises = []
seen_slugs = set()
for ex_list in [ADDITIONAL_EXERCISES, EXERCISES_PART1, EXERCISES_BACK, EXERCISES_PART2, EXERCISES_PART3, EXERCISES_CORE, EXERCISES_LEGS, EXERCISES_PART5]:
    for ex in ex_list:
        slug = ex['slug']
        if slug in AI_SUPPORTED_SLUGS:
            ex['analysis_supported'] = True
            ex['analysis_available'] = True
        else:
            ex['analysis_supported'] = False
            ex['analysis_available'] = False
        if slug not in seen_slugs:
            seen_slugs.add(slug)
            all_exercises.append(ex)

for i, ex in enumerate(all_exercises, start=1):
    ex['id'] = i

print(f'Total Catalog: {len(CATEGORIES)} categories, {len(all_exercises)} exercises.')

ts_content = 'import { Exercise, ExerciseCategory } from '../types';\n\nexport const FALLBACK_CATEGORIES: ExerciseCategory[] = ' + json.dumps(CATEGORIES, ensure_ascii=False, indent=2) + ';\n\nexport const FALLBACK_EXERCISES: Exercise[] = ' + json.dumps(all_exercises, ensure_ascii=False, indent=2) + ';\n'
with open('frontend/src/services/exerciseData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)
print('Wrote frontend/src/services/exerciseData.ts')
