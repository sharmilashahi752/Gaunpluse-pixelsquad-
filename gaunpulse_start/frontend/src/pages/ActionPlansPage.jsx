import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Filter,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { Card, CardHeader, EmptyState, FeatureNotice, PageIntro, StatusBadge } from '../components/ui';
import { deduplicateVillages, formatVillageLabel } from '../utils/villageUtils';
import { useVillageSelection } from '../context/VillageSelectionContext';
import { cachedFetchJson, invalidateApiCache } from '../utils/apiCache';

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'on_hold', label: 'On Hold' },
];

const priorityTones = {
  Critical: 'red',
  High: 'orange',
  Medium: 'green',
  Low: 'default',
};

const statusTones = {
  pending: 'default',
  in_progress: 'orange',
  completed: 'green',
  delayed: 'red',
  on_hold: 'default',
};

export default function ActionPlansPage() {
  const { villages: contextVillages } = useVillageSelection();
  const [plans, setPlans] = useState([]);
  const [villages, setVillages] = useState(contextVillages || []);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync villages from context
  useEffect(() => {
    if (contextVillages && contextVillages.length > 0) {
      setVillages(contextVillages);
    }
  }, [contextVillages]);

  // Filters
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [updatingProgressPlan, setUpdatingProgressPlan] = useState(null);
  const [progressVal, setProgressVal] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    village_id: '',
    issue_id: '',
    title: '',
    description: '',
    ward: 'Ward 4',
    priority: 'High',
    responsible_team: 'Municipal Infrastructure Unit',
    start_date: new Date().toISOString().slice(0, 10),
    target_completion_date: '',
    status: 'in_progress',
    progress_percentage: 10,
    notes: '',
  });

  // Load plans, villages, and issues with caching
  const loadData = async (force = false) => {
    if (plans.length === 0) setLoading(true);
    try {
      const [dataPlans, dataVillages, dataIssues] = await Promise.all([
        cachedFetchJson('/api/action-plans', {}, {
          force,
          ttlMs: 45000,
          onBackgroundUpdate: (fresh) => {
            if (Array.isArray(fresh)) setPlans(fresh);
          },
        }),
        contextVillages && contextVillages.length > 0
          ? Promise.resolve(contextVillages)
          : cachedFetchJson('/api/villages', {}, { ttlMs: 120000 }),
        cachedFetchJson('/api/issues', {}, {
          force,
          ttlMs: 45000,
          onBackgroundUpdate: (fresh) => {
            if (fresh) setIssues(fresh.data || fresh || []);
          },
        }),
      ]);

      const planList = Array.isArray(dataPlans) ? dataPlans : [];
      const villageList = Array.isArray(dataVillages) ? dataVillages : [];
      const issueList = dataIssues.data || dataIssues || [];

      setPlans(planList);
      setVillages(villageList);
      setIssues(issueList);

      if (villageList.length > 0 && !formData.village_id) {
        setFormData((prev) => ({ ...prev, village_id: villageList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load action plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save or Update Plan
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    const isEdit = Boolean(editingPlan);
    const url = isEdit
      ? `/api/action-plans/${editingPlan.id}`
      : '/api/action-plans';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const payload = {
        ...formData,
        issue_id: formData.issue_id || null,
        progress_percentage: Number(formData.progress_percentage),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save action plan.');
      }

      setShowCreateModal(false);
      setEditingPlan(null);
      invalidateApiCache('api/action-plans');
      invalidateApiCache('api/dashboard');
      invalidateApiCache('api/reports');
      loadData(true);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Progress Update
  const handleSaveProgress = async () => {
    if (!updatingProgressPlan) return;
    try {
      const res = await fetch(`/api/action-plans/${updatingProgressPlan.id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ progress_percentage: Number(progressVal) }),
      });
      if (res.ok) {
        setUpdatingProgressPlan(null);
        invalidateApiCache('api/action-plans');
        invalidateApiCache('api/dashboard');
        invalidateApiCache('api/reports');
        loadData(true);
      }
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  // Delete Plan
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this municipal action plan?')) return;
    try {
      await fetch(`/api/action-plans/${id}`, { method: 'DELETE' });
      invalidateApiCache('api/action-plans');
      invalidateApiCache('api/dashboard');
      invalidateApiCache('api/reports');
      loadData(true);
    } catch (err) {
      console.error('Error deleting action plan:', err);
    }
  };

  // Open Edit
  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      village_id: plan.village_id,
      issue_id: plan.issue_id || '',
      title: plan.title,
      description: plan.description || '',
      ward: plan.ward || 'Ward 4',
      priority: plan.priority || 'High',
      responsible_team: plan.responsible_team || 'Municipal Infrastructure Unit',
      start_date: plan.start_date ? plan.start_date.slice(0, 10) : '',
      target_completion_date: plan.target_completion_date ? plan.target_completion_date.slice(0, 10) : '',
      status: plan.status || 'in_progress',
      progress_percentage: plan.progress_percentage || 0,
      notes: plan.notes || '',
    });
    setModalError(null);
    setShowCreateModal(true);
  };

  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.responsible_team || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.ward || '').toLowerCase().includes(search.toLowerCase());
    const matchesPriority = !filterPriority || p.priority === filterPriority;
    const matchesStatus = !filterStatus || p.status === filterStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="page-stack">
      <PageIntro
        title="Infrastructure Action Plans"
        description="Track repair execution, resource allocation, and progress tracking for verified infrastructure disruptions. All records persist to MySQL."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="button button--secondary" type="button" onClick={loadData}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={() => {
                setEditingPlan(null);
                setFormData({
                  village_id: villages[0]?.id || 1,
                  issue_id: '',
                  title: '',
                  description: '',
                  ward: 'Ward 4',
                  priority: 'High',
                  responsible_team: 'Municipal Infrastructure Unit',
                  start_date: new Date().toISOString().slice(0, 10),
                  target_completion_date: '',
                  status: 'in_progress',
                  progress_percentage: 10,
                  notes: '',
                });
                setModalError(null);
                setShowCreateModal(true);
              }}
            >
              <Plus size={16} /> Add New Action Plan
            </button>
          </div>
        }
      />

      <FeatureNotice title="Live Action Plan Engine" icon={CheckCircle2}>
        Directly connected to MySQL. Adjust progress percentages, update status milestones, or draft new intervention plans.
      </FeatureNotice>

      {/* Filters */}
      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', padding: '0 12px', border: '1px solid var(--border)' }}>
            <Search size={15} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search by action title, team, or ward..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '9px 10px', width: '100%', fontSize: '13px', outline: 'none', color: 'var(--text-primary)' }}
            />
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '12.5px', color: 'var(--text-primary)' }}
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '12.5px', color: 'var(--text-primary)' }}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Action Plans Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
          Loading action plans from MySQL...
        </div>
      ) : filteredPlans.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No action plans found"
          description="Create a new municipal infrastructure action plan to schedule repair works and track progress."
          action={
            <button
              className="button button--primary"
              type="button"
              onClick={() => {
                setEditingPlan(null);
                setFormData({
                  village_id: villages[0]?.id || 1,
                  issue_id: '',
                  title: '',
                  description: '',
                  ward: 'Ward 4',
                  priority: 'High',
                  responsible_team: 'Municipal Infrastructure Unit',
                  start_date: new Date().toISOString().slice(0, 10),
                  target_completion_date: '',
                  status: 'in_progress',
                  progress_percentage: 10,
                  notes: '',
                });
                setModalError(null);
                setShowCreateModal(true);
              }}
            >
              <Plus size={15} /> Add Action Plan
            </button>
          }
        />
      ) : (
        <div className="plan-grid">
          {filteredPlans.map((plan) => (
            <Card className="plan-card" key={plan.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="plan-card__top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <StatusBadge tone={priorityTones[plan.priority]}>{plan.priority}</StatusBadge>
                    <StatusBadge tone={statusTones[plan.status]}>{(plan.status || '').replace('_', ' ')}</StatusBadge>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="icon-button"
                      type="button"
                      title="Edit Plan"
                      onClick={() => handleOpenEdit(plan)}
                    >
                      <Edit2 size={14} color="#176342" />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      title="Delete Plan"
                      onClick={() => handleDelete(plan.id)}
                    >
                      <Trash2 size={14} color="#c94b46" />
                    </button>
                  </div>
                </div>

                <h3 style={{ margin: '0 0 6px', color: '#092d22', fontSize: '16px' }}>{plan.title}</h3>
                <p style={{ margin: '0 0 10px', fontSize: '12.5px', color: '#687c73' }}>
                  <strong>{plan.responsible_team}</strong> · {plan.ward}
                </p>

                {plan.description && (
                  <p style={{ margin: '0 0 12px', fontSize: '12.5px', color: '#19392f', lineHeight: '1.4' }}>
                    {plan.description}
                  </p>
                )}

                {plan.issue && (
                  <div style={{ padding: '6px 10px', background: '#f6f5ed', borderRadius: '6px', fontSize: '11px', color: '#176342', marginBottom: '12px' }}>
                    🔗 <strong>Linked Issue:</strong> {plan.issue.title} ({plan.issue.category})
                  </div>
                )}
              </div>

              <div>
                {/* Progress Bar & Quick Adjust */}
                <div style={{ marginTop: '12px' }}>
                  <div className="progress-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>Execution Progress</span>
                    <strong>{plan.progress_percentage}%</strong>
                  </div>
                  <div className="progress-track" style={{ height: '8px', background: '#dfe6df', borderRadius: '99px', overflow: 'hidden' }}>
                    <span
                      style={{
                        display: 'block',
                        height: '100%',
                        width: `${plan.progress_percentage}%`,
                        background: plan.progress_percentage === 100 ? '#248157' : '#176342',
                        borderRadius: '99px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                <div className="plan-card__footer" style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #dfe6df', paddingTop: '10px' }}>
                  <span style={{ fontSize: '11.5px', color: '#687c73' }}>
                    Due: {plan.target_completion_date ? new Date(plan.target_completion_date).toLocaleDateString() : 'Unscheduled'}
                  </span>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => {
                      setUpdatingProgressPlan(plan);
                      setProgressVal(plan.progress_percentage);
                    }}
                    style={{ fontSize: '12px', fontWeight: 'bold' }}
                  >
                    Adjust progress <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* QUICK PROGRESS SLIDER MODAL */}
      {updatingProgressPlan && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>Update Progress</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setUpdatingProgressPlan(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {updatingProgressPlan.title}
            </p>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>Progress: {progressVal}%</span>
                {progressVal === 100 && <StatusBadge tone="green">Will Mark Completed</StatusBadge>}
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressVal}
                onChange={(e) => setProgressVal(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary-green)' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setUpdatingProgressPlan(null)}
              >
                Cancel
              </button>
              <button
                className="button button--primary"
                type="button"
                onClick={handleSaveProgress}
              >
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ACTION PLAN MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>{editingPlan ? 'Edit Action Plan' : 'Add New Action Plan'}</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div style={{ padding: '12px 14px', background: 'var(--danger-bg)', border: '1px solid rgba(198,79,69,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '12.5px', marginBottom: '16px' }}>
                <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="form-stack">
              <div>
                <label htmlFor="plan-title" style={{ fontWeight: 'bold' }}>Action Plan Title *</label>
                <input
                  id="plan-title"
                  type="text"
                  required
                  placeholder="e.g. Seti Suspension Bridge Rapid Anchor Cable Repair"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label htmlFor="plan-village" style={{ fontWeight: 'bold' }}>Village *</label>
                  <select
                    id="plan-village"
                    required
                    value={formData.village_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, village_id: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                  >
                    {deduplicateVillages(villages).map((v) => (
                      <option key={v.id} value={v.id}>
                        {formatVillageLabel(v)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="plan-ward" style={{ fontWeight: 'bold' }}>Ward *</label>
                  <input
                    id="plan-ward"
                    type="text"
                    required
                    placeholder="e.g. Ward 4"
                    value={formData.ward}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ward: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="plan-issue" style={{ fontWeight: 'bold' }}>Link to Verified Infrastructure Issue (Optional)</label>
                <select
                  id="plan-issue"
                  value={formData.issue_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, issue_id: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                >
                  <option value="">-- No specific issue linked --</option>
                  {issues.map((iss) => (
                    <option key={iss.id} value={iss.id}>
                      {iss.tracking_code || `GP-${iss.id}`} · {iss.title} ({iss.severity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="plan-desc" style={{ fontWeight: 'bold' }}>Plan Scope & Description</label>
                <textarea
                  id="plan-desc"
                  rows={3}
                  placeholder="Details of materials, equipment, labor, and safety protocols..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label htmlFor="plan-priority" style={{ fontWeight: 'bold' }}>Priority *</label>
                  <select
                    id="plan-priority"
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="plan-team" style={{ fontWeight: 'bold' }}>Responsible Person / Team *</label>
                  <input
                    id="plan-team"
                    type="text"
                    required
                    placeholder="e.g. Municipal Engineering Division"
                    value={formData.responsible_team}
                    onChange={(e) => setFormData((prev) => ({ ...prev, responsible_team: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="plan-status" style={{ fontWeight: 'bold' }}>Status *</label>
                  <select
                    id="plan-status"
                    required
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="plan-progress" style={{ fontWeight: 'bold' }}>Progress ({formData.progress_percentage}%)</label>
                  <input
                    id="plan-progress"
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.progress_percentage}
                    onChange={(e) => setFormData((prev) => ({ ...prev, progress_percentage: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                  />
                </div>

                <div>
                  <label htmlFor="plan-due" style={{ fontWeight: 'bold' }}>Target Completion</label>
                  <input
                    id="plan-due"
                    type="date"
                    value={formData.target_completion_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, target_completion_date: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="plan-notes" style={{ fontWeight: 'bold' }}>Notes / Resource Tracking</label>
                <input
                  id="plan-notes"
                  type="text"
                  placeholder="e.g. Budget approved under Ward 4 emergency reserve fund"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Saving to Database...
                    </>
                  ) : editingPlan ? (
                    'Save Changes'
                  ) : (
                    'Create Action Plan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
