# GaunPulse — Citizen Reporting Workflow

## Overview
The **Citizen Reporting Module** enables rural Nepali residents to lodge infrastructure damage reports (roads, bridges, drinking water, schools, health posts, landslides) using dynamic geographic hierarchies, multimedia evidence (photos and voice notes), and speech-to-text recognition.

## 1. Dynamic Geographic Hierarchy
- **Province → District → Municipality → Ward → Village/Settlement**
- Selecting a municipality dynamically retrieves only the wards (e.g. 1 to `ward_count`) and villages belonging to that municipality.
- Switching municipalities automatically resets dependent ward, village, and coordinates to prevent cross-municipality corruption.
- **Unregistered Settlement Fallback**: When an incident occurs in a remote hamlet or settlement not yet indexed in OpenStreetMap or the municipal gazetteer, the citizen can select "Other / Unregistered Settlement" and type the local name (e.g., *Chhapra Danda*, *Upper Bazzar*).

## 2. Evidence Collection
- **Photos**: Multi-image upload supporting up to 5 photos (`.jpg`, `.jpeg`, `.png`, `.webp`) up to 5MB each with client-side thumbnail previews, file size indicators, and removal controls.
- **Voice Notes**: In-browser recording using the HTML5 `MediaRecorder` API with live elapsed recording timers, runtime MIME type detection (`audio/webm`, `audio/ogg`, `audio/mp4`), audio playback preview, and re-recording options.
- **Speech-to-Text Transcription**: Browser-native Web Speech API with dual-language support (`ne-NP` Nepali and `en-US` English). Real-time speech transcription can be reviewed, edited, and inserted directly into the incident description.
- **GPS Coordinates**: Auto-centered on the selected ward or village centroid, with an interactive coordinate picker and GPS capture button.

## 3. Lifecycle & Dual-Sync Architecture
1. **Submission**:
   - Persisted in MySQL `complaints` table with status `pending`.
   - Dual-synced into core `issues` table with status `pending_verification`.
   - Generates a unique tracking code (`GP-2026-XXXXX`).
   - Creates an automated acknowledgment notification in `citizen_notifications`.
2. **Isolation Guarantee**:
   - Reports in `pending_verification` remain isolated from confirmed critical disruptions.
   - NetworkX simulations, AI prioritization agents, and action plans only ingest verified infrastructure failures.
3. **Verification**:
   - Ward officers or municipal engineers review reports in the **Verification Queue**.
   - Promoting to `verified` marks the issue as an active municipal disruption and notifies the citizen.
   - Rejection requires an explicit reason and closes the complaint without polluting municipal infrastructure data.
