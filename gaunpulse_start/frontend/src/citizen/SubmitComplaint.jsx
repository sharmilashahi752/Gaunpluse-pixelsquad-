import React, { useEffect, useMemo, useState } from 'react';
import { citizenService } from './citizenApi';
import VoiceRecorder from './VoiceRecorder';
import ImageUploader from './ImageUploader';
import LocationPicker from './LocationPicker';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  HelpCircle,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';

export default function SubmitComplaint({ onNavigate, onViewComplaint }) {
  // Master Location Catalog
  const [municipalities, setMunicipalities] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Dependent Selections
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState('');
  const [selectedWard, setSelectedWard] = useState(1);
  const [villages, setVillages] = useState([]);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Form Fields
  const [form, setForm] = useState({
    title: '',
    category: '',
    custom_category: '',
    village_id: '',
    settlement_name: '',
    description: '',
    contact_number: '',
    latitude: '',
    longitude: '',
  });

  const [voice, setVoice] = useState(null);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [images, setImages] = useState([]);
  const [language, setLanguage] = useState('ne-NP');

  const [loading, setLoading] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [error, setError] = useState('');

  // 1. Initial Load: Fetch Municipalities and Hierarchy
  useEffect(() => {
    let isMounted = true;
    citizenService
      .getLocations()
      .then((data) => {
        if (!isMounted) return;
        const munis = data.municipalities || [];
        setMunicipalities(munis);
        setProvinces(data.provinces || []);
        setDistricts(data.districts || []);
        setCategories(data.categories || []);

        if (munis.length > 0) {
          const firstMuni = munis[0];
          setSelectedProvince(firstMuni.province);
          setSelectedDistrict(firstMuni.district);
          setSelectedMunicipalityId(firstMuni.id);
          setSelectedWard(1);

          // Center coordinates
          setForm((prev) => ({
            ...prev,
            latitude: firstMuni.center_lat ? String(firstMuni.center_lat) : '28.0',
            longitude: firstMuni.center_lng ? String(firstMuni.center_lng) : '84.0',
          }));
        }
      })
      .catch((err) => {
        console.error('Failed to load location directory:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingLocations(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Villages whenever Municipality or Ward changes
  useEffect(() => {
    if (!selectedMunicipalityId) return;

    setLoadingVillages(true);
    citizenService
      .getLocations({
        municipality_id: selectedMunicipalityId,
        ward_number: selectedWard,
      })
      .then((data) => {
        const list = data.villages || [];
        setVillages(list);
        if (list.length > 0) {
          setForm((prev) => ({
            ...prev,
            village_id: list[0].id,
            latitude: String(list[0].latitude || prev.latitude),
            longitude: String(list[0].longitude || prev.longitude),
          }));
        } else {
          // No village in this ward -> fallback to unregistered settlement
          setForm((prev) => ({
            ...prev,
            village_id: '',
          }));
        }
      })
      .catch((err) => {
        console.warn('Failed to load villages for ward:', err);
      })
      .finally(() => {
        setLoadingVillages(false);
      });
  }, [selectedMunicipalityId, selectedWard]);

  // Current active municipality object
  const currentMunicipality = useMemo(() => {
    return municipalities.find((m) => Number(m.id) === Number(selectedMunicipalityId)) || municipalities[0];
  }, [municipalities, selectedMunicipalityId]);

  // Available wards in selected municipality
  const availableWards = useMemo(() => {
    const count = currentMunicipality?.ward_count || 5;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [currentMunicipality]);

  // Filtered districts by province
  const availableDistricts = useMemo(() => {
    if (!selectedProvince) return districts;
    const filteredMunis = municipalities.filter((m) => m.province === selectedProvince);
    return Array.from(new Set(filteredMunis.map((m) => m.district)));
  }, [municipalities, selectedProvince, districts]);

  // Filtered municipalities by district
  const availableMunicipalities = useMemo(() => {
    if (!selectedDistrict) return municipalities;
    return municipalities.filter((m) => m.district === selectedDistrict);
  }, [municipalities, selectedDistrict]);

  // Handle Municipality Switch
  const handleMunicipalityChange = (muniId) => {
    const muni = municipalities.find((m) => Number(m.id) === Number(muniId));
    if (!muni) return;

    setSelectedMunicipalityId(muni.id);
    setSelectedDistrict(muni.district);
    setSelectedProvince(muni.province);
    setSelectedWard(1);

    // Reset dependent coordinates & village
    setForm((prev) => ({
      ...prev,
      village_id: '',
      settlement_name: '',
      latitude: muni.center_lat ? String(muni.center_lat) : '28.0',
      longitude: muni.center_lng ? String(muni.center_lng) : '84.0',
    }));
  };

  // Handle Village Switch
  const handleVillageChange = (villageId) => {
    if (!villageId || villageId === 'other') {
      setForm((prev) => ({ ...prev, village_id: '' }));
      return;
    }
    const found = villages.find((v) => Number(v.id) === Number(villageId));
    if (found) {
      setForm((prev) => ({
        ...prev,
        village_id: found.id,
        latitude: String(found.latitude || prev.latitude),
        longitude: String(found.longitude || prev.longitude),
      }));
    }
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Require settlement name if village is not selected
    if (!form.village_id || form.village_id === 'other') {
      if (!form.settlement_name || form.settlement_name.trim().length < 2) {
        setError('Please provide your settlement, tole, or village name (कम्तीमा २ अक्षरको बस्ती वा टोलको नाम अनिवार्य छ)।');
        return;
      }
    }

    setLoading(true);
    setSubmittedComplaint(null);

    const data = new FormData();
    data.append('title', form.title);
    data.append('category', form.category);
    if (form.custom_category) data.append('custom_category', form.custom_category);
    if (form.description) data.append('description', form.description);
    if (speechTranscript) data.append('speech_transcript', speechTranscript);
    if (language) data.append('transcript_language', language);
    if (form.contact_number) data.append('contact_number', form.contact_number);
    data.append('municipality_id', String(selectedMunicipalityId));
    data.append('ward_number', String(selectedWard));
    if (form.village_id && form.village_id !== 'other') data.append('village_id', String(form.village_id));
    if (form.settlement_name) data.append('settlement_name', form.settlement_name.trim());
    if (form.latitude) data.append('latitude', String(form.latitude));
    if (form.longitude) data.append('longitude', String(form.longitude));

    images.forEach((img) => data.append('images[]', img));
    if (voice) data.append('voice_recording', voice);

    try {
      const response = await citizenService.submitComplaint(data);
      setSubmittedComplaint(response.complaint);
      setForm({
        title: '',
        category: '',
        custom_category: '',
        village_id: '',
        settlement_name: '',
        description: '',
        contact_number: '',
        latitude: currentMunicipality?.center_lat ? String(currentMunicipality.center_lat) : '',
        longitude: currentMunicipality?.center_lng ? String(currentMunicipality.center_lng) : '',
      });
      setVoice(null);
      setSpeechTranscript('');
      setImages([]);
    } catch (requestError) {
      const resData = requestError.response?.data;
      const errors = resData?.errors;
      const msg = errors
        ? Object.values(errors).flat().join(' ')
        : resData?.message || 'The complaint could not be submitted. Please check the fields and retry.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="citizen-page">
      <div className="citizen-page-heading">
        <div>
          <p>Citizen Infrastructure Reporting Form (नागरिक उजुरी फारम)</p>
          <h1>Report Damaged Infrastructure</h1>
          <span>
            Directly inform municipal engineering staff and ward officers about broken roads, washed out bridges, pipeline failures, or trail hazards.
          </span>
        </div>
      </div>

      {/* Success Confirmation Banner */}
      {submittedComplaint && (
        <section className="citizen-card success-banner-card" style={{ marginBottom: '24px' }}>
          <div className="success-banner-content">
            <CheckCircle2 size={36} className="success-icon" color="#1b7340" />
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#123D30', fontWeight: 700 }}>
                Report Successfully Lodged! (उजुरी दर्ता भयो)
              </h3>
              <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#415549', lineHeight: '1.5' }}>
                Your report has been logged under Tracking Code:{' '}
                <strong className="tracking-code-pill" style={{ background: '#123D30', color: '#fff', padding: '3px 9px', borderRadius: '5px' }}>
                  {submittedComplaint.complaint_number}
                </strong>
                . It has been routed to the <strong>Ward {submittedComplaint.ward_number}</strong> municipal triage queue for engineering verification.
              </p>
              <div className="success-banner-actions" style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="citizen-primary"
                  onClick={() => {
                    onViewComplaint?.(submittedComplaint.id);
                    onNavigate?.('complaints');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: '#123D30',
                    color: '#fff',
                    borderRadius: '7px',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>Track Complaint Progress</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className="citizen-secondary"
                  onClick={() => setSubmittedComplaint(null)}
                  style={{
                    padding: '8px 14px',
                    background: '#f7f7f3',
                    border: '1px solid #d9e3db',
                    borderRadius: '7px',
                    cursor: 'pointer',
                  }}
                >
                  File Another Report
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <form className="complaint-form" onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
        {/* STEP 1: Incident Location Selection */}
        <section className="citizen-card form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <MapPin size={18} color="#267153" />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#172e25' }}>
              1. Incident Location (घटनास्थल)
            </h2>
          </div>

          <div className="citizen-form-grid">
            {/* Province Selector */}
            <label>
              Province (प्रदेश)
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  const matchingMunis = municipalities.filter((m) => m.province === e.target.value);
                  if (matchingMunis.length > 0) {
                    handleMunicipalityChange(matchingMunis[0].id);
                  }
                }}
              >
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            {/* District Selector */}
            <label>
              District (जिल्ला)
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  const matchingMunis = municipalities.filter((m) => m.district === e.target.value);
                  if (matchingMunis.length > 0) {
                    handleMunicipalityChange(matchingMunis[0].id);
                  }
                }}
              >
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            {/* Municipality Selector */}
            <label>
              Municipality / Rural Municipality (पालिका) *
              <select
                required
                value={selectedMunicipalityId}
                onChange={(e) => handleMunicipalityChange(e.target.value)}
              >
                {availableMunicipalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.district})
                  </option>
                ))}
              </select>
            </label>

            {/* Ward Selector */}
            <label>
              Ward Number (वडा नं.) *
              <select
                required
                value={selectedWard}
                onChange={(e) => setSelectedWard(Number(e.target.value))}
              >
                {availableWards.map((w) => (
                  <option key={w} value={w}>
                    Ward {w} (वडा {w})
                  </option>
                ))}
              </select>
            </label>

            {/* Village Selector */}
            <label>
              Registered Village / Settlement (गाउँ / बस्ती)
              <select
                value={form.village_id || 'other'}
                onChange={(e) => handleVillageChange(e.target.value)}
                disabled={loadingVillages}
              >
                {villages.length > 0 ? (
                  villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))
                ) : (
                  <option value="other">No registered village in Ward {selectedWard} (दर्ता भएको गाउँ छैन)</option>
                )}
                <option value="other">+ Other / Unregistered Settlement (+ अन्य / नयाँ बस्ती)</option>
              </select>
            </label>

            {/* Unregistered Settlement Fallback */}
            {(!form.village_id || form.village_id === 'other') && (
              <label>
                Settlement / Tole Name (बस्ती वा टोलको नाम) *
                <input
                  type="text"
                  required
                  placeholder="e.g., Besi Tole, Khola Gaun, Upper Ridge, Simkhet"
                  value={form.settlement_name}
                  onChange={(e) => updateField('settlement_name', e.target.value)}
                />
                {villages.length === 0 && (
                  <small style={{ color: '#854d0e', display: 'block', marginTop: '4px', background: '#fefce8', padding: '4px 8px', borderRadius: '4px', border: '1px solid #fef08a' }}>
                    Ward {selectedWard} has no pre-registered villages. Your entered settlement will be submitted for municipal review.
                  </small>
                )}
              </label>
            )}
          </div>
        </section>

        {/* STEP 2: Incident Details */}
        <section className="citizen-card form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Building2 size={18} color="#267153" />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#172e25' }}>
              2. What Happened? (घटना विवरण)
            </h2>
          </div>

          <div className="citizen-form-grid">
            <label className="wide">
              Report Title (उजुरीको शीर्षक) *
              <input
                required
                maxLength={255}
                placeholder="e.g., Landslide blocked trail connecting school to Besi Tole"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </label>

            <label>
              Problem Category (समस्याको प्रकार) *
              <select
                required
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            {form.category === 'Other' && (
              <label>
                Specify Custom Category *
                <input
                  required
                  placeholder="e.g., Retaining wall foundation scour"
                  value={form.custom_category}
                  onChange={(e) => updateField('custom_category', e.target.value)}
                />
              </label>
            )}

            <label>
              Citizen Contact Number (सम्पर्क नम्बर - Optional)
              <input
                type="tel"
                placeholder="+977-98XXXXXXXX"
                value={form.contact_number}
                onChange={(e) => updateField('contact_number', e.target.value)}
              />
            </label>

            <label className="wide">
              Detailed Description & Community Impact (विस्तृत विवरण)
              <textarea
                rows={4}
                placeholder="Explain what is damaged, which households or school children are impacted, and any emergency safety hazards..."
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* STEP 3: Voice Message & Speech-to-Text */}
        <section className="citizen-card form-section">
          <div style={{ marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#172e25' }}>
              3. Voice Message & Audio (आवाज सन्देश तथा लेखाइ)
            </h2>
          </div>

          <VoiceRecorder
            language={language}
            onLanguageChange={setLanguage}
            onRecording={setVoice}
            onTranscript={(text) => {
              setSpeechTranscript(text);
              updateField('description', form.description ? `${form.description}\n\n[Transcript]: ${text}` : text);
            }}
            onSpeechTextChange={(text) => setSpeechTranscript(text)}
          />
        </section>

        {/* STEP 4: Photo Evidence Upload */}
        <section className="citizen-card form-section">
          <h2 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 700, color: '#172e25' }}>
            4. Photo Evidence (तस्बिर प्रमाण)
          </h2>
          <ImageUploader images={images} onChange={setImages} />
        </section>

        {/* STEP 5: GPS Location Pin */}
        <section className="citizen-card form-section">
          <h2 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 700, color: '#172e25' }}>
            5. Exact GPS Location (नक्सामा स्थान)
          </h2>
          <LocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(latitude, longitude) => setForm((prev) => ({ ...prev, latitude, longitude }))}
          />
        </section>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fdf3f2',
              border: '1px solid #f2c7c4',
              borderRadius: '8px',
              color: '#a83228',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <button
            type="button"
            className="citizen-secondary"
            disabled={loading}
            onClick={() => {
              if (window.confirm('Clear this form?')) {
                setForm({
                  title: '',
                  category: '',
                  custom_category: '',
                  village_id: '',
                  settlement_name: '',
                  description: '',
                  contact_number: '',
                  latitude: currentMunicipality?.center_lat ? String(currentMunicipality.center_lat) : '',
                  longitude: currentMunicipality?.center_lng ? String(currentMunicipality.center_lng) : '',
                });
                setImages([]);
                setVoice(null);
                setSpeechTranscript('');
              }
            }}
            style={{
              padding: '10px 18px',
              background: '#f7f7f3',
              border: '1px solid #d9e3db',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Clear Form
          </button>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px 24px',
              background: '#123D30',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(18, 61, 48, 0.25)',
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="spin" />
                <span>Submitting Report...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>Submit Infrastructure Report (उजुरी पेश गर्नुहोस्)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
