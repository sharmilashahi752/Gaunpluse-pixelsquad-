import { useEffect, useState } from 'react';
import { ArrowRight, Bot, LockKeyhole, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
import { Card } from './ui';

export default function AIAgentPreview({ onOpenAgent }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/ai/insights?village_id=1')
      .then((res) => res.json())
      .then((data) => {
        setInsights(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Could not load AI insights:', err);
        setLoading(false);
      });
  }, []);

  return (
    <Card className="agent-preview">
      <div className="agent-preview__head">
        <span className="agent-preview__icon" style={{ background: '#176342', color: '#cbeaca' }}>
          <Bot size={22} aria-hidden="true" />
        </span>
        <div>
          <strong>GaunPulse AI Insights</strong>
          <span>Live Municipal Intelligence</span>
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Risk Alert */}
        <div style={{ background: '#fdf6ed', borderLeft: '3px solid #d97706', padding: '8px 12px', borderRadius: 6, fontSize: 11, color: '#92400e' }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <TriangleAlert size={13} /> Simulation Risk Alert:
          </strong>
          {insights?.simulation_risk_alert || 'Suspension Bridge B failure creates single point of failure for 20 households.'}
        </div>

        {/* Database Metric Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11, background: '#f6faf7', padding: '8px 12px', borderRadius: 6 }}>
          <div>
            <span style={{ color: '#687c73', display: 'block', fontSize: 11 }}>Top Disruption Category</span>
            <strong style={{ color: '#176342' }}>
              {insights?.frequent_category || 'Damaged Bridge'}
            </strong>
          </div>
          <div>
            <span style={{ color: '#687c73', display: 'block', fontSize: 11 }}>Critical Lifelines</span>
            <strong style={{ color: '#c0392b' }}>
              {insights?.metrics?.critical_disruptions ?? 3} Under Alert
            </strong>
          </div>
        </div>

        {/* Recommended Action */}
        <div style={{ fontSize: 11, color: '#324e41', lineHeight: 1.5, background: '#ffffff', border: '1px solid #ddeadb', padding: '8px 12px', borderRadius: 6 }}>
          <strong style={{ display: 'block', color: '#176342', marginBottom: 2 }}>Recommended Inspection:</strong>
          {insights?.recommended_action || 'Dispatch municipal bridge engineer to inspect anchor cables before monsoon.'}
        </div>
      </div>

      <div className="agent-preview__footer" style={{ marginTop: 14 }}>
        <span style={{ fontSize: 11, color: '#687c73', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ShieldCheck size={13} color="#176342" /> Human signoff required
        </span>
        <button className="text-button" type="button" onClick={onOpenAgent} style={{ fontWeight: 600 }}>
          Ask GaunPulse AI <ArrowRight size={15} />
        </button>
      </div>
    </Card>
  );
}
