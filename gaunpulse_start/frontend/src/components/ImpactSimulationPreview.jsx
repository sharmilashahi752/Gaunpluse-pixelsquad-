import { useEffect, useState } from 'react';
import { ArrowRight, Route, TriangleAlert } from 'lucide-react';
import { impactComparison as fallbackJourneys } from '../data/demoData';
import { Card, CardHeader, DemoLabel, StatusBadge } from './ui';

export default function ImpactSimulationPreview({ onOpenSimulation }) {
  const [latestSim, setLatestSim] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/simulations')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLatestSim(data[0]);
        }
      })
      .catch((err) => {
        // Fallback gracefully to demoData
      });
  }, []);

  const result = latestSim?.result;
  const blockedEdgeName = result?.blocked_edges_info?.[0]?.name || 'Seti Bridge';
  const affectedHouseholds = result?.affected_households ?? 20;

  // Extract journey comparisons from real simulation result or fallback
  let journeys = [];
  if (result?.access_comparisons && result.access_comparisons.length > 0) {
    const schoolComp = result.access_comparisons.find((c) => c.facility_type === 'school');
    const healthComp = result.access_comparisons.find((c) => c.facility_type === 'health_post');
    if (schoolComp) {
      journeys.push({
        label: `${schoolComp.facility} (${schoolComp.settlement})`,
        before: schoolComp.before_minutes ?? 18,
        after: schoolComp.after_minutes !== null ? `${schoolComp.after_minutes} min` : 'Isolated (No Path)',
      });
    }
    if (healthComp) {
      journeys.push({
        label: `${healthComp.facility} (${healthComp.settlement})`,
        before: healthComp.before_minutes ?? 19,
        after: healthComp.after_minutes !== null ? `${healthComp.after_minutes} min` : 'Isolated (No Path)',
      });
    }
  }

  if (journeys.length === 0) {
    journeys = fallbackJourneys.map((j) => ({
      label: j.label,
      before: `${j.before} min`,
      after: `${j.after} min`,
    }));
  }

  return (
    <Card className="simulation-card">
      <CardHeader
        eyebrow="What-if scenario"
        title="Impact simulation"
        description="Calculated live from NetworkX graph shortest-path engine."
        action={<DemoLabel compact />}
      />
      <div className="simulation-alert">
        <span><TriangleAlert size={18} aria-hidden="true" /></span>
        <div>
          <strong>{blockedEdgeName} unavailable</strong>
          <small>Calculated scenario · {affectedHouseholds} households impacted</small>
        </div>
        <StatusBadge tone="red">Critical</StatusBadge>
      </div>
      <div className="journey-list">
        {journeys.map((journey) => (
          <div className="journey-row" key={journey.label}>
            <span className="journey-row__icon"><Route size={17} aria-hidden="true" /></span>
            <div>
              <strong>{journey.label}</strong>
              <small>Estimated travel time</small>
            </div>
            <div className="journey-row__values">
              <span>{typeof journey.before === 'number' ? `${journey.before} min` : journey.before}</span>
              <ArrowRight size={14} aria-hidden="true" />
              <strong>{typeof journey.after === 'number' ? `${journey.after} min` : journey.after}</strong>
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
