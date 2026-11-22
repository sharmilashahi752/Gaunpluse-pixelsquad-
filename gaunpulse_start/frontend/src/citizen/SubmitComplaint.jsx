import React, { useEffect, useState } from 'react';
import { citizenService } from './citizenApi';
import VoiceRecorder from './VoiceRecorder';
import ImageUploader from './ImageUploader';
import LocationPicker from './LocationPicker';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function SubmitComplaint({ onNavigate, onViewComplaint }) {
  const [locations, setLocations] = useState({
    municipality: 'Dailekh Municipality',
    villages: [],
    categories: [],
  });

  const [form, setForm] = useState({
    title: '',
    category: '',
    custom_category: '',
    description: '',
    contact_number: '',
    village_id: '',
    ward_number: '',
    latitude: '',
    longitude: '',
  });

  const [voice, setVoice] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('en-NP');

  useEffect(() => {
    citizenService.getLocations().then((data) => {
      setLocations(data);
      if (data.villages && data.villages.length > 0) {
        // Find Mahabu or first village
        const defaultVillage = data.villages.find((v) => v.name.toLowerCase().includes('mahabu')) || data.villages[0];
        if (defaultVillage) {
          setForm((prev) => ({
            ...prev,
            village_id: defaultVillage.id,
            ward_number: defaultVillage.ward_number || 1,
            latitude: defaultVillage.latitude || 28.9242,
            longitude: defaultVillage.longitude || 81.7125,
          }));
        }
      }
    });
  }, []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleVillageChange(villageId) {
    const selected = locations.villages.find((v) => String(v.id) === String(villageId));
    setForm((current) => ({
      ...current,
      village_id: villageId,
      ward_number: selected?.ward_number || current.ward_number,
      latitude: selected?.latitude ? String(selected.latitude) : current.latitude,
      longitude: selected?.longitude ? String(selected.longitude) : current.longitude,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setSubmittedComplaint(null);
    setError('');

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        data.append(key, value);
      }
    });
    images.forEach((image) => data.append('images[]', image));
    if (voice) data.append('voice_recording', voice);

    try {
      const response = await citizenService.submitComplaint(data);
      setSubmittedComplaint(response.complaint);
      setForm({
        title: '',
        category: '',
        custom_category: '',
        description: '',
        contact_number: '',
        village_id: locations.villages[0]?.id || '',
        ward_number: locations.villages[0]?.ward_number || '1',
        latitude: '',
        longitude: '',
      });
      setVoice(null);
      setImages([]);
    } catch (requestError) {
      const errors = requestError.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors).flat().join(' ')
          : requestError.response?.data?.message || 'The complaint could not be submitted. Please check the fields and retry.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="citizen-page">
      <div className="citizen-page-heading">
        <div>
          <p>Citizen Reporting Form</p>
          <h1>Report Damaged Infrastructure</h1>
          <span>Notify municipality engineers and ward leadership about road washouts, broken bridges, or water pipe leaks.</span>
        </div>
      </div>

      {submittedComplaint && (
        <section className="citizen-card success-banner-card">
          <div className="success-banner-content">
            <CheckCircle2 size={32} className="success-icon" />
            <div>
              <h3>Report Successfully Lodged!</h3>
              <p>
                Your complaint has been submitted under tracking ID{' '}
                <strong className="tracking-code-pill">{submittedComplaint.complaint_number}</strong>. It has been automatically routed to the municipal decision board and the local engineering response unit.
              </p>
              <div className="success-banner-actions">
                <button
                  type="button"
                  className="citizen-primary"
                  onClick={() => {
                    onViewComplaint?.(submittedComplaint.id);
                    onNavigate?.('complaints');
                  }}
                >
                  Track Complaint Progress <ArrowRight size={14} />
                </button>
                <button type="button" className="citizen-secondary" onClick={() => setSubmittedComplaint(null)}>
                  File Another Issue
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <form className="complaint-form" onSubmit={submit}>
        <section className="citizen-card form-section">
          <h2>1. Incident Information</h2>
          <div className="citizen-form-grid">
            <label className="wide">
              Report Title *
              <input
                required
                maxLength={255}
                placeholder="e.g., Road landslide blocking access to ward school"
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
              />
            </label>

            <label>
              Problem Category *
              <select
                required
                value={form.category}
                onChange={(event) => updateField('category', event.target.value)}
              >
                <option value="">Select Category</option>
                {locations.categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            {form.category === 'Other' && (
              <label>
                Specify Custom Category *
                <input
                  required
                  placeholder="e.g., Retaining wall crack"
                  value={form.custom_category}
                  onChange={(event) => updateField('custom_category', event.target.value)}
                />
              </label>
            )}

            <label>
              Municipality
              <input value={locations.municipality || 'Dailekh Municipality'} readOnly />
            </label>

            <label>
              Village / Settlement *
              <select
                required
                value={form.village_id}
                onChange={(event) => handleVillageChange(event.target.value)}
              >
                <option value="">Select Village</option>
                {locations.villages.map((village) => (
                  <option key={village.id} value={village.id}>
                    {village.name} {village.ward_number ? `(Ward ${village.ward_number})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Ward Number
              <input
                type="number"
                min="1"
                max="33"
                value={form.ward_number}
                onChange={(event) => updateField('ward_number', event.target.value)}
              />
            </label>

            <label>
              Citizen Contact Number (Optional)
              <input
                placeholder="+977-98..."
                value={form.contact_number}
                onChange={(event) => updateField('contact_number', event.target.value)}
              />
            </label>

            <label className="wide">
              Detailed Description & Observed Impact
              <textarea
                rows="5"
                placeholder="Describe how the damage occurred, how many households are cut off, or safety risks..."
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
              />
            </label>

            <div className="wide speech-bar-wrapper">
              <div className="speech-bar-heading">
                <label>Audio Language</label>
                <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                  <option value="en-NP">English (Nepal)</option>
                  <option value="ne-NP">Nepali (नेपाली)</option>
                </select>
              </div>
              <VoiceRecorder
                language={language}
                onRecording={setVoice}
                onTranscript={(text) =>
                  updateField('description', `${form.description}${form.description ? ' ' : ''}${text}`)
                }
              />
            </div>
          </div>
        </section>

        <section className="citizen-card form-section">
          <h2>2. Photo Evidence</h2>
          <ImageUploader images={images} onChange={setImages} />
        </section>

        <section className="citizen-card form-section">
          <h2>3. Exact GPS Location</h2>
          <LocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(latitude, longitude) => setForm((current) => ({ ...current, latitude, longitude }))}
          />
        </section>

        {error && (
          <p className="citizen-message error">
            <AlertCircle size={16} /> {error}
          </p>
        )}

        <div className="complaint-form-actions">
          <button
            type="button"
            className="citizen-secondary"
            onClick={() => {
              if (window.confirm('Clear all form fields?')) {
                setForm({
                  title: '',
                  category: '',
                  custom_category: '',
                  description: '',
                  contact_number: '',
                  village_id: '',
                  ward_number: '',
                  latitude: '',
                  longitude: '',
                });
                setImages([]);
                setVoice(null);
              }
            }}
            disabled={loading}
          >
            Clear Form
          </button>
          <button type="submit" className="citizen-primary submit-btn-large" disabled={loading}>
            {loading ? 'Submitting Report...' : 'Submit Infrastructure Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
