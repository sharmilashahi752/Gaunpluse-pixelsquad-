import { CalendarDays, MoreHorizontal } from 'lucide-react';
import { priorityActions } from '../data/demoData';
import { Card, CardHeader, StatusBadge, TextButton } from './ui';

const priorityTones = { Critical: 'red', High: 'orange', Medium: 'green' };

export default function PriorityActionQueue({ onViewAll }) {
  return (
    <Card className="action-queue">
      <CardHeader
        eyebrow="Today’s focus"
        title="Priority action queue"
        description="Fictional tasks ranked by urgency and community impact."
        action={<TextButton onClick={onViewAll}>View plans</TextButton>}
      />
      <div className="action-list">
        {priorityActions.map((action) => (
          <article className="action-item" key={action.id}>
            <span className={`action-item__indicator action-item__indicator--${priorityTones[action.priority]}`} />
            <div className="action-item__content">
              <div>
                <span>{action.id}</span>
                <StatusBadge tone={priorityTones[action.priority]}>{action.priority}</StatusBadge>
              </div>
              <strong>{action.title}</strong>
              <small>{action.location}</small>
            </div>
            <span className="action-item__due"><CalendarDays size={14} />{action.due}</span>
            <button className="icon-button" type="button" aria-label={`More options for ${action.title}`}><MoreHorizontal size={18} /></button>
          </article>
        ))}
      </div>
    </Card>
  );
}
