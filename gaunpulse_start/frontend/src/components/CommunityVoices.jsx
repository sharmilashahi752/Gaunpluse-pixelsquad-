import { useEffect, useState } from 'react';
import { Check, MessageCircleMore, Quote } from 'lucide-react';
import { voices as fallbackVoices } from '../data/demoData';
import { Card, CardHeader, LiveLabel, StatusBadge, TextButton } from './ui';

export default function CommunityVoices({ onViewAll, full = false }) {
  const [voices, setVoices] = useState([]);

  const loadFeedback = () => {
    fetch('http://127.0.0.1:8000/api/feedback')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setVoices(data.slice(0, full ? 20 : 3));
        }
      })
      .catch((err) => console.error('Failed to load community voices:', err));
  };

  useEffect(() => {
    loadFeedback();
  }, [full]);

  const handleAcknowledge = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/feedback/${id}/acknowledge`, {
        method: 'PATCH',
        headers: { Accept: 'application/json' },
      });
      loadFeedback();
    } catch (err) {
      console.error('Error acknowledging voice:', err);
    }
  };

  const items = voices.length > 0 ? voices : fallbackVoices;

  return (
    <Card className={`voices-card ${full ? 'voices-card--full' : ''}`}>
      <CardHeader
        eyebrow="From the community"
        title="Community voices"
        description="Recent observations submitted by village residents and field volunteers."
        action={
          full ? (
            <LiveLabel text="Resident Stream" compact />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LiveLabel text="Community Submissions" compact />
              <TextButton onClick={onViewAll}>View all voices</TextButton>
            </div>
          )
        }
      />
      <div className="voice-list">
        {items.map((voice) => {
          const initials = (voice.resident_name || voice.name || 'CR')
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('');
          const isAck = voice.status === 'acknowledged';

          return (
            <article className="voice-item" key={voice.id}>
              <span className="voice-item__avatar" aria-hidden="true">
                {voice.initials || initials}
              </span>
              <div className="voice-item__body">
                <div className="voice-item__meta">
                  <div>
                    <strong>{voice.resident_name || voice.name}</strong>
                    <span>
                      {voice.ward} · {voice.time || (voice.created_at ? new Date(voice.created_at).toLocaleDateString() : 'Recent')}
                    </span>
                  </div>
                  <StatusBadge tone="green">{voice.tag}</StatusBadge>
                </div>
                <p>
                  <Quote size={15} aria-hidden="true" />
                  {voice.message}
                </p>
                {voice.status && (
                  <div style={{ marginTop: '4px' }}>
                    {!isAck ? (
                      <button
                        className="voice-item__reply"
                        type="button"
                        onClick={() => handleAcknowledge(voice.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <MessageCircleMore size={14} /> Acknowledge report
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#176342', fontWeight: 'bold' }}>
                        ✓ Acknowledged
                      </span>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </Card>
  );
}
