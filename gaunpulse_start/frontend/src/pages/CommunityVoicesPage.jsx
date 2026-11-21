import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Heart,
  Loader2,
  MessageCircleMore,
  MessageSquareText,
  Plus,
  Quote,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Card, CardHeader, FeatureNotice, LiveLabel, PageIntro, StatusBadge } from '../components/ui';

const TAGS = ['Safety', 'Water access', 'Roads', 'School access', 'Health', 'General'];

export default function CommunityVoicesPage() {
  const [voices, setVoices] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterTag, setFilterTag] = useState('');

  const [formData, setFormData] = useState({
    resident_name: '',
    ward: 'Ward 4 resident',
    message: '',
    tag: 'Safety',
    village_id: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [resVoices, resVillages] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/feedback'),
        fetch('http://127.0.0.1:8000/api/villages'),
      ]);
      const dataVoices = await resVoices.json();
      const dataVillages = await resVillages.json();

      setVoices(Array.isArray(dataVoices) ? dataVoices : []);
      setVillages(dataVillages || []);
      if (dataVillages.length > 0 && !formData.village_id) {
        setFormData((prev) => ({ ...prev, village_id: dataVillages[0].id }));
      }
    } catch (err) {
      console.error('Failed to load community feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          resident_name: '',
          ward: 'Ward 4 resident',
          message: '',
          tag: 'Safety',
          village_id: villages[0]?.id || '',
        });
        loadData();
      }
    } catch (err) {
      console.error('Error submitting voice:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/feedback/${id}/acknowledge`, {
        method: 'PATCH',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Error acknowledging voice:', err);
    }
  };

  const filteredVoices = filterTag
    ? voices.filter((v) => v.tag === filterTag)
    : voices;

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Participatory Insight"
        title="Community Voices"
        description="Listen to observations shared by village residents, volunteer observers, and ward leaders. Persists to the municipal database."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="button button--secondary" type="button" onClick={loadData}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={() => setShowModal(true)}
            >
              <MessageSquareText size={16} /> Record a Voice
            </button>
          </div>
        }
      />

      <FeatureNotice title="Civic Feedback Pipeline" icon={ShieldCheck}>
        Community submissions are stored securely in MySQL with ward attribution. Municipal officers can review and officially acknowledge local reports.
      </FeatureNotice>

      {/* Filter by Tag */}
      <Card>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#176342', marginRight: '6px' }}>Filter by Topic:</span>
          <button
            type="button"
            className={`button ${!filterTag ? 'button--primary' : 'button--secondary'}`}
            style={{ padding: '5px 12px', fontSize: '11.5px' }}
            onClick={() => setFilterTag('')}
          >
            All Voices ({voices.length})
          </button>
          {TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`button ${filterTag === tag ? 'button--primary' : 'button--secondary'}`}
              style={{ padding: '5px 12px', fontSize: '11.5px' }}
              onClick={() => setFilterTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </Card>

      {/* Voices List */}
      <Card className="voices-card voices-card--full">
        <CardHeader
          eyebrow="Community Observation Stream"
          title={`Verified Resident Feedback (${filteredVoices.length})`}
          description="Local testimonies helping target municipal infrastructure priorities."
          action={<LiveLabel text="Live Resident Feed" compact />}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#687c73' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
            Loading resident voices...
          </div>
        ) : filteredVoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: '#687c73' }}>
            <p>No community feedback found for this filter.</p>
          </div>
        ) : (
          <div className="voice-list">
            {filteredVoices.map((voice) => {
              const initials = (voice.resident_name || 'CR')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('');
              const isAcknowledged = voice.status === 'acknowledged';

              return (
                <article className="voice-item" key={voice.id}>
                  <span className="voice-item__avatar" aria-hidden="true">
                    {initials}
                  </span>
                  <div className="voice-item__body" style={{ width: '100%' }}>
                    <div className="voice-item__meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{voice.resident_name}</strong>
                        <span>{voice.ward} · {new Date(voice.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <StatusBadge tone="green">{voice.tag}</StatusBadge>
                        <StatusBadge tone={isAcknowledged ? 'green' : 'orange'}>
                          {isAcknowledged ? 'Acknowledged' : 'Pending Review'}
                        </StatusBadge>
                      </div>
                    </div>
                    <p style={{ margin: '8px 0' }}>
                      <Quote size={15} aria-hidden="true" />
                      {voice.message}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      {voice.village && (
                        <small style={{ color: '#687c73' }}>📍 {voice.village.name}</small>
                      )}
                      {!isAcknowledged ? (
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
                          ✓ Acknowledged by Municipality
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>

      {/* RECORD VOICE MODAL */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(9, 45, 34, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1px solid #dfe6df',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #dfe6df', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#092d22' }}>Record Community Observation</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="form-stack">
              <div>
                <label style={{ fontWeight: 'bold' }}>Resident Name (or pseudonym)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Karki"
                  value={formData.resident_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, resident_name: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontWeight: 'bold' }}>Ward / Affiliation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ward 4 resident"
                    value={formData.ward}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ward: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 'bold' }}>Topic / Tag</label>
                  <select
                    value={formData.tag}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tag: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                  >
                    {TAGS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 'bold' }}>Observation / Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="What is happening on the ground? (e.g. water pipeline pressure dropped, footbridge planks loose)..."
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Save Observation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
