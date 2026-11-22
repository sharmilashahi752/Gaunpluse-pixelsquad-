import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { priorityActions as fallbackActions } from '../data/demoData';
import { Card, CardHeader, StatusBadge, TextButton } from './ui';

const priorityTones = {
  Critical: 'red',
  High: 'orange',
  Medium: 'green',
  Low: 'default',
  critical: 'red',
  high: 'orange',
  medium: 'green',
  low: 'default',
};

export default function PriorityActionQueue({ onViewAll }) {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/action-plans')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data.slice(0, 4));
        }
      })
      .catch((err) => console.error('Failed to load priority plans:', err));
  }, []);

  const items = plans.length > 0
    ? plans.map((p) => ({
        id: `ACT-${p.id}`,
        title: p.title,
        location: `${p.ward || 'Ward 4'} · ${p.responsible_team || 'Infrastructure'}`,
        priority: p.priority || 'High',
        due: p.target_completion_date ? new Date(p.target_completion_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `${p.progress_percentage}% done`,
      }))
    : fallbackActions;

  return (
    <Card className="action-queue">
      <CardHeader
        title="Priority action queue"
        description="Active repair and intervention plans stored in the municipal database."
        action={<TextButton onClick={onViewAll}>View all plans</TextButton>}
      />
      <div className="action-list">
        {items.map((action) => (
          <article className="action-item" key={action.id}>
            <span className={`action-item__indicator action-item__indicator--${priorityTones[action.priority] || 'orange'}`} />
            <div className="action-item__content">
              <div>
                <span>{action.id}</span>
                <StatusBadge tone={priorityTones[action.priority] || 'orange'}>{action.priority}</StatusBadge>
              </div>
              <strong>{action.title}</strong>
              <small>{action.location}</small>
            </div>
            <span className="action-item__due">
              <CalendarDays size={14} />
              {action.due}
            </span>
          </article>
        ))}
      </div>
    </Card>
  );
}
