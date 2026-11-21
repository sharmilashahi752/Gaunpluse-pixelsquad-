import { ArrowRight, Route, TriangleAlert } from 'lucide-react';
import { impactComparison } from '../data/demoData';
import { Card, CardHeader, DemoLabel, StatusBadge } from './ui';

export default function ImpactSimulationPreview({ onOpenSimulation }) {
  return (
    <Card className="simulation-card">
      <CardHeader
        eyebrow="What-if scenario"
        title="Impact simulation"
        description="Preview how one disruption could affect essential journeys."
        action={<DemoLabel compact />}
      />
      <div className="simulation-alert">
        <span><TriangleAlert size={18} aria-hidden="true" /></span>
        <div>
          <strong>Seti Bridge unavailable</strong>
          <small>Illustrative scenario · 20 households</small>
        </div>
        <StatusBadge tone="red">Critical</StatusBadge>
      </div>
      <div className="journey-list">
        {impactComparison.map((journey) => (
          <div className="journey-row" key={journey.label}>
            <span className="journey-row__icon"><Route size={17} aria-hidden="true" /></span>
            <div>
              <strong>{journey.label}</strong>
              <small>Estimated travel time</small>
            </div>
            <div className="journey-row__values">
              <span>{journey.before} min</span>
              <ArrowRight size={14} aria-hidden="true" />
              <strong>{journey.after} min</strong>
            </div>
          </div>
        ))}
      </div>
      <button className="button button--soft button--full" type="button" onClick={onOpenSimulation}>
        Review simulation workspace
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </Card>
  );
}
