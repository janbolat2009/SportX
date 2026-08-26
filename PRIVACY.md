# SportX: Privacy Architecture & Youth Data Protection Policy

## 1. Core Youth Privacy Principles

Given that SportX is designed for adolescents, high school athletes, and junior competitors, privacy and data minimization are primary architectural requirements:

1. **Client-Side Edge Inference Preference**: Real-time camera processing is executed locally in the browser. Raw camera pixel buffers do NOT need to be transmitted or stored on backend servers during live sessions.
2. **Anonymized Research Subject Identifiers**: Biological profiles are mapped to random pseudo-anonymous IDs (e.g. `SUBJ_00492`). Kinematic datasets stored for scientific research contain zero Personally Identifiable Information (PII).
3. **Strict Coach-Athlete Isolation**: Athletes can only be viewed by coaches with whom they have an explicit, active `CoachAthleteRelationship`. No cross-athlete data exposure exists.
4. **Transparent Retention & Right to Erasure**: Athletes have full control to delete past workout recordings, video uploads, and holistic logs at any time.

---

## 2. Video Processing & Storage Protocol

When an athlete uploads a video for asynchronous analysis:
- **Purpose Limitation**: Videos are strictly processed to extract 3D pose landmarks and kinematic trajectories.
- **Auto-Purge**: Video files in `uploads/` can be automatically deleted after feature extraction is finalized or stored securely according to user preference.
- **Zero Third-Party Model Training**: User video feeds are never shared with external commercial AI aggregators.
