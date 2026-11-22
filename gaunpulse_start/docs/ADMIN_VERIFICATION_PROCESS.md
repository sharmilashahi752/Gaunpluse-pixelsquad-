# GaunPulse — Admin Verification Process & Triage Queue

## Overview
The Admin Verification Process ensures that unverified citizen reports cannot skew critical infrastructure disruptions, network reliability calculations, or budget allocations until confirmed on-site by municipal technical personnel.

## 1. Verification Queue Interface
In **Issues & Alerts** (`IssuesPage.jsx`), administrators and ward officers access two dedicated views:
1. **All Municipal Issues**: Comprehensive catalogue of confirmed, in-progress, and resolved infrastructure incidents.
2. **Citizen Reports Awaiting Verification**: Filtered queue displaying reports with pending status (`pending_verification`, `submitted`).
   - Counter badge highlights pending items requiring attention.
   - Evidence badges highlight attached photo counts, audio recordings, and speech-to-text transcripts.

## 2. Review & Field Verification Actions
When inspecting a pending report, staff can review:
- Incident description and GPS coordinates.
- Audio evidence playback via the inline audio player.
- Speech-to-text transcript in Nepali and English.
- Multi-photo evidence gallery with zoom/full-size preview.

Staff can execute one of three formal verification actions:
1. **Verify Report (Confirm Disruption)**:
   - Sets status to `verified`.
   - Records `verified_by`, `verified_at`, and `verification_notes`.
   - Synchronizes complaint status to `verified`.
   - Logs an `issue_verified` audit event in `audit_logs`.
   - Notifies citizen: *"Your report has been verified on-site by municipal technical staff and queued for repair planning."*
   - Immediately incorporates the issue into NetworkX simulations, AI Problem Prioritization, and Action Plans.
2. **Request More Information**:
   - Sets status to `more_information_needed`.
   - Records official response notes.
   - Synchronizes complaint status to `more_information_needed`.
   - Notifies citizen: *"Municipal staff requested additional details on your report: [Notes]"*.
3. **Reject Report (Close)**:
   - Requires explicit `rejection_reason`.
   - Sets status to `rejected`.
   - Synchronizes complaint status to `rejected`.
   - Logs an `issue_rejected` audit event in `audit_logs`.
   - Notifies citizen with the rationale.
   - Excludes the report permanently from active infrastructure disruptions.

## 3. Role-Based Scoping & Security
- **System Admin**: Can view and verify reports across all municipalities.
- **Municipality Admin**: Scoped strictly to reports within their municipality workspace. Cross-municipality attempts return `403 Forbidden`.
- **Ward Officer**: Scoped strictly to reports within their assigned ward. Cross-ward attempts return `403 Forbidden`.
