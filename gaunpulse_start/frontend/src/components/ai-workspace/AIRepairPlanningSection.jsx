import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Loader2,
  MapPin,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { Card, CardHeader, StatusBadge } from '../ui';
import { useVillageSelection } from '../../context/VillageSelectionContext';
import { deduplicateVillages, formatVillageLabel } from '../../utils/villageUtils';
import { cachedFetchJson } from '../../utils/apiCache';

export default function AIRepairPlanningSection({ onNavigate }) {
  const { selectedVillageId, setSelectedVillageId, selectedVillage, villages: contextVillages } = useVillageSelection();
  const [villages, setVillages] = useState(contextVillages || []);
  const [issues, setIssues] = useState([]);
  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [draftPlan, setDraftPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [loadingIssues, setLoadingIssues] = useState(false);

  // Editable form state
  const [title, setTitle] = useState('');
  const [ward, setWard] = useState('Ward 1');
  const [priority, setPriority] = useState('Critical');
  const [responsibleTeam, setResponsibleTeam] = useState('Rapid Response Bridge Engineering Unit');
  const [targetDays, setTargetDays] = useState(7);
  const [description, setDescription] = useState('');
  const [inspectionTasks, setInspectionTasks] = useState([]);
  const [temporaryMeasures, setTemporaryMeasures] = useState('');
  const [unknowns, setUnknowns] = useState('');

  // Sync villages from context
  useEffect(() => {
    if (contextVillages && contextVillages.length > 0) {
      setVillages(contextVillages);
    } else {
      cachedFetchJson('http://127.0.0.1:8000/api/villages', {}, { ttlMs: 120000 })
        .then((data) => {
          if (Array.isArray(data)) setVillages(data);
        })
        .catch((err) => console.error('Failed to load villages:', err));
    }
  }, [contextVillages]);

  const currentVillageObj = selectedVillage || villages.find((v) => Number(v.id) === Number(selectedVillageId));
  const villageName = currentVillageObj?.name || 'Selected Village';
  const villageWard = currentVillageObj?.ward_no ? `Ward ${currentVillageObj.ward_no}` : 'Ward 1';

  // Load issues when selectedVillageId changes
  useEffect(() => {
    if (!selectedVillageId) return;

    setLoadingIssues(true);
    setError(null);
    setDraftPlan(null);
    setSavedSuccess(false);
    setSelectedIssueId('');

    fetch(`http://127.0.0.1:8000/api/issues?village_id=${selectedVillageId}`)
      .then((r) => r.json())
      .then((data) => {
        const raw = Array.isArray(data) ? data : (data.data || []);
        setIssues(raw);
        if (raw.length > 0) {
          setSelectedIssueId(String(raw[0].id));
        }
      })
      .catch((err) => {
        console.error('Failed to load issues for repair planning:', err);
        setError('Could not load issues for the selected village.');
      })
      .finally(() => {
        setLoadingIssues(false);
      });
  }, [selectedVillageId]);

  const handleGenerateDraft = async () => {
    if (!selectedIssueId && issues.length > 0) return;
    setGenerating(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const selected = issues.find((i) => String(i.id) === String(selectedIssueId));
      const cat = (selected?.category || 'bridge').toLowerCase();
      const sev = (selected?.severity || 'Critical');

      let team = 'Municipal Infrastructure Unit';
      let steps = [
        '1. Municipal structural engineer conducts on-site tension test.',
        '2. Install high-visibility safety barrier and detour notices.',
        '3. Inspect deadman anchor block for river scour or lateral drift.',
      ];
      let measures = 'Halt vehicular/pedestrian crossing until tension tests clear.';
      let unks = 'Subsurface geotechnical rock stability under flood runoff conditions.';

      if (cat.includes('bridge')) {
        team = 'Rapid Response Bridge Engineering Unit';
        steps = [
          '1. Calibrate deadman cable clamp tension with calibrated dynamometer.',
          '2. Inspect suspension wire rope strands for moisture rust or broken wires.',
          '3. Assess riverbed abutment scour depth following high-velocity monsoon runoff.',
          '4. Install safety netting and replace fractured timber deck planks.',
        ];
        measures = 'Temporary bamboo safety barrier; pedestrian access halted during heavy rain.';
        unks = 'Riverbed anchor scouring depth during peak night torrents.';
      } else if (cat.includes('road')) {
        team = 'Ward Disaster Management Committee & Heavy Equipment Unit';
        steps = [
          '1. Assess uphill slope stability for recurring sliding planes.',
          '2. Deploy backhoe loader to clear boulder slide debris.',
          '3. Erect gabion masonry retaining wall along downhill road edge.',
          '4. Clear culvert drainage channels to prevent surface water ponding.',
        ];
        measures = 'Single-lane tractor bypass maintained during dry morning hours.';
        unks = 'Pore-water pressure levels on upper forested hillside.';
      } else if (cat.includes('water')) {
        team = 'Municipal WASH Division & Water Users Committee';
        steps = [
          '1. Pressure-test HDPE intake transmission line.',
          '2. Replace damaged compression couplers at landslide crossing.',
          '3. Flush sedimentation tank and chlorinate distribution reservoir.',
        ];
        measures = 'Activate communal spring intake valve as emergency backup.';
        unks = 'Upstream source turbidity levels after cloudburst events.';
      }

      const planTitle = selected
        ? `Draft: Rapid Intervention for ${selected.title}`
        : `Draft: Infrastructure Maintenance Plan for ${villageName}`;

      setTitle(planTitle);
      setWard(selected?.ward ? `Ward ${selected.ward}` : villageWard);
      setPriority(sev.toLowerCase() === 'critical' ? 'Critical' : 'High');
      setResponsibleTeam(team);
      setTargetDays(sev.toLowerCase() === 'critical' ? 5 : 10);
      setDescription(selected?.description || `Priority infrastructure intervention in ${villageName}.`);
      setInspectionTasks(steps);
      setTemporaryMeasures(measures);
      setUnknowns(unks);

      setDraftPlan({
        issue: selected,
        team,
        steps,
        measures,
        unks,
      });
    } catch (err) {
      console.error('Failed to generate draft action plan:', err);
      setError('Could not synthesize draft action plan.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (selectedIssueId && issues.length > 0) {
      handleGenerateDraft();
    }
  }, [selectedIssueId]);

  const handleSavePlan = async (isSubmitForApproval = false) => {
    setSaving(true);
    setError(null);
    try {
      const today = new Date();
      const dueDate = new Date(today.getTime() + Number(targetDays) * 24 * 60 * 60 * 1000);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const res = await fetch('http://127.0.0.1:8000/api/action-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          village_id: Number(selectedVillageId),
          issue_id: selectedIssueId ? Number(selectedIssueId) : null,
          title: title,
          priority: priority,
          responsible_team: responsibleTeam,
          ward: ward,
          status: 'pending',
          progress_percentage: 0,
          target_completion_date: dueDateStr,
          description: description,
          notes: `Inspection Checklist:\n${inspectionTasks.join('\n')}\n\nTemporary Measures:\n${temporaryMeasures}\n\nField Uncertainties:\n${unknowns}\n\nWorkflow: ${isSubmitForApproval ? 'Submitted for Official Municipal Signoff' : 'Saved as Draft'}`,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Save failed with status ${res.status}`);
      }

      setSavedSuccess(true);
    } catch (err) {
      console.error('Failed to save action plan:', err);
      setError(err.message || 'Could not save action plan to municipal database.');
    } finally {
      setSaving(false);
    }
  };

  const selectedIssue = issues.find((i) => String(i.id) === String(selectedIssueId));
  const dedupedVillages = deduplicateVillages(villages);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#092d22', fontFamily: 'Georgia, serif' }}>
          Let's plan the next steps
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: '#556e62' }}>
          Prepare a practical, editable action plan with inspection tasks ready for authorized review in <strong>{villageName}</strong>.
        </p>
      </div>

      {/* Expandable Authorization Safeguard */}
      <details className="ai-details-toggle">
        <summary>
          <ShieldAlert size={14} color="#b45309" /> Municipal Authorization Safeguard
        </summary>
        <div style={{ marginTop: 8, fontSize: 12, color: '#274b39', lineHeight: 1.5 }}>
          Draft action plans generated by the AI are technical proposals. Official budget appropriation, contractor mobilization, and infrastructure safety certificates strictly require authorized municipal officer signoff.
        </div>
      </details>

      {/* Village & Issue Selector Card */}
      <Card style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            {/* Village Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
              <label style={{ fontSize: 10.5, color: '#687c73', fontWeight: 600 }}>SELECT VILLAGE CONTEXT</label>
              <select
                value={selectedVillageId || ''}
                onChange={(e) => setSelectedVillageId(Number(e.target.value))}
                style={{
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: '1px solid #c8d8cc',
                  fontSize: 12,
                  color: '#176342',
                  fontWeight: 600,
                  background: '#ffffff',
                }}
              >
                {dedupedVillages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {formatVillageLabel(v)}
                  </option>
                ))}
              </select>
            </div>

            {/* Issue Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 280 }}>
              <label style={{ fontSize: 10.5, color: '#687c73', fontWeight: 600 }}>
                SELECT REGISTERED DISRUPTION ISSUE ({issues.length} AVAILABLE)
              </label>
              {loadingIssues ? (
                <div style={{ padding: '7px 12px', fontSize: 12, color: '#687c73' }}>
                  <Loader2 size={13} className="spin" style={{ display: 'inline', marginRight: 6 }} />
                  Loading issues for {villageName}...
                </div>
              ) : issues.length > 0 ? (
                <select
                  value={selectedIssueId}
                  onChange={(e) => setSelectedIssueId(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 6,
                    border: '1px solid #c8d8cc',
                    fontSize: 12,
                    color: '#176342',
                    fontWeight: 600,
                    background: '#ffffff',
                  }}
                >
                  {issues.map((iss) => (
                    <option key={iss.id} value={iss.id}>
                      {iss.title} ({iss.tracking_code || `GP-${iss.id}`} · {iss.severity})
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: 12, color: '#b45309', fontWeight: 500, padding: '7px 0' }}>
                  No issues registered for this village.
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="button button--secondary"
            onClick={handleGenerateDraft}
            disabled={generating || (issues.length === 0 && !selectedIssueId)}
            style={{ fontSize: 12, padding: '7px 16px' }}
          >
            {generating ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />} Regenerate Suggested Draft
          </button>
        </div>
      </Card>

      {/* Empty State Banner if no issues */}
      {!loadingIssues && issues.length === 0 && (
        <div
          style={{
            background: '#fefce8',
            border: '1px solid #fef08a',
            borderRadius: 8,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 12.5,
            color: '#854d0e',
          }}
        >
          <div>
            <strong>No active disruption reports registered in {villageName}.</strong>
            <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#a16207' }}>
              Action plans are generated from verified community or municipal issue records. You can register an issue or select a different village.
            </p>
          </div>
          <button
            type="button"
            className="button button--primary"
            onClick={() => onNavigate && onNavigate('issues-alerts')}
            style={{ fontSize: 11.5, padding: '6px 14px', whiteSpace: 'nowrap' }}
          >
            Register Disruption Report <ArrowRight size={13} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', color: '#991b1b', fontSize: 12 }}>
          ⚠️ {error}
        </div>
      )}

      {savedSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 18px', color: '#166534', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <CheckCircle2 size={18} color="#15803d" /> Action Plan successfully persisted in municipal MySQL records for {villageName}!
          </span>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => onNavigate && onNavigate('action-plans')}
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            Open Action Plans Module <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Editable Action Plan Card */}
      {draftPlan && (
        <Card style={{ padding: 22 }}>
          <div style={{ borderBottom: '1px solid #edf0eb', paddingBottom: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#b45309', fontWeight: 700, background: '#fef3c7', padding: '3px 8px', borderRadius: 4 }}>
                DRAFT ACTION PLAN · EDITABLE MUNICIPAL WORKFLOW
              </span>
              <span style={{ fontSize: 11, color: '#687c73' }}>
                {villageName} {selectedIssue ? `· Issue #${selectedIssue.id} (${selectedIssue.tracking_code || `GP-${selectedIssue.id}`})` : ''}
              </span>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 10.5, color: '#687c73', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                PLAN TITLE
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 14, fontWeight: 700, color: '#176342' }}
              />
            </div>
          </div>

          {/* Form Fields Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 10.5, color: '#687c73', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                WARD ASSIGNMENT
              </label>
              <input
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10.5, color: '#687c73', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                PRIORITY TIER
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 12, fontWeight: 600 }}
              >
                <option value="Critical">Critical (Immediate Response)</option>
                <option value="High">High (48hr Response)</option>
                <option value="Medium">Medium (Scheduled)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 10.5, color: '#687c73', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                RESPONSIBLE UNIT / PERSONNEL
              </label>
              <input
                value={responsibleTeam}
                onChange={(e) => setResponsibleTeam(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10.5, color: '#687c73', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                TARGET COMPLETION (DAYS)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={targetDays}
                onChange={(e) => setTargetDays(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 12 }}
              />
            </div>
          </div>

          {/* Problem Summary & Evidence */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10.5, color: '#687c73', fontWeight: 600, display: 'block', marginBottom: 3 }}>
              PROBLEM SUMMARY & VERIFIED EVIDENCE
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 12, fontFamily: 'inherit' }}
            />
          </div>

          {/* Suggested Inspection Checklist */}
          <div style={{ background: '#fbfdfb', border: '1px solid #e1ebe2', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#176342', display: 'block', marginBottom: 8 }}>
              Technical Inspection Tasks & Verification Checklist:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {inspectionTasks.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: '#176342' }} />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Temporary Measures and Unknowns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 10.5, color: '#687c73', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                SUGGESTED TEMPORARY SAFETY MEASURES
              </label>
              <textarea
                rows={2}
                value={temporaryMeasures}
                onChange={(e) => setTemporaryMeasures(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 11.5, fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10.5, color: '#687c73', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                UNKNOWN FACTORS & FIELD VERIFICATION NEEDED
              </label>
              <textarea
                rows={2}
                value={unknowns}
                onChange={(e) => setUnknowns(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #c8d8cc', fontSize: 11.5, fontFamily: 'inherit' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #edf0eb' }}>
            <span style={{ fontSize: 11, color: '#687c73', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={14} color="#176342" /> Saves to {villageName} action plans with status: <code>pending</code>
            </span>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => handleSavePlan(false)}
                disabled={saving}
                style={{ fontSize: 12, padding: '8px 16px' }}
              >
                {saving ? <Loader2 size={13} className="spin" /> : <Save size={13} />} Save as Draft
              </button>

              <button
                type="button"
                className="button button--primary"
                onClick={() => handleSavePlan(true)}
                disabled={saving}
                style={{ fontSize: 12, padding: '8px 18px' }}
              >
                {saving ? <Loader2 size={13} className="spin" /> : <CheckCircle2 size={13} />} Submit for Human Signoff
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
