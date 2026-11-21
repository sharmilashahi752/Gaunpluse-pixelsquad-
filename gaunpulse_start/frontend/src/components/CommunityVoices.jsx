import { MessageCircleMore, Quote } from 'lucide-react';
import { voices } from '../data/demoData';
import { Card, CardHeader, DemoLabel, StatusBadge, TextButton } from './ui';

export default function CommunityVoices({ onViewAll, full = false }) {
  return (
    <Card className={`voices-card ${full ? 'voices-card--full' : ''}`}>
      <CardHeader
        eyebrow="From the community"
        title="Community voices"
        description="Recent fictional reports shared by local residents and volunteers."
        action={full ? <DemoLabel compact /> : <TextButton onClick={onViewAll}>View all voices</TextButton>}
      />
      <div className="voice-list">
        {voices.map((voice) => (
          <article className="voice-item" key={voice.id}>
            <span className="voice-item__avatar" aria-hidden="true">{voice.initials}</span>
            <div className="voice-item__body">
              <div className="voice-item__meta">
                <div><strong>{voice.name}</strong><span>{voice.ward} · {voice.time}</span></div>
                <StatusBadge tone="green">{voice.tag}</StatusBadge>
              </div>
              <p><Quote size={15} aria-hidden="true" />{voice.message}</p>
              <button className="voice-item__reply" type="button"><MessageCircleMore size={14} /> Acknowledge report</button>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
