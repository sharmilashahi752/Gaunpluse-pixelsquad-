import React, { useEffect, useMemo, useState } from 'react';
import { citizenService } from './citizenApi';
import VoiceRecorder from './VoiceRecorder';
import ImageUploader from './ImageUploader';
import LocationPicker from './LocationPicker';
import { translations } from './citizenI18n';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Droplets,
  Edit3,
  FileText,
  HeartPulse,
  HelpCircle,
  MapPin,
  Mic,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Volume2,
  Waves,
  Zap,
} from 'lucide-react';

const CATEGORY_ICONS = {
  'Road Damage': MapPin,
  'Bridge Damage': Building2,
  'Drinking Water Supply': Droplets,
  'Water Pipeline': Droplets,
  'Drainage': Waves,
  'Street Light': Zap,
  'School Access / Building': BookOpen,
  'Health Facility Access': HeartPulse,
  'Landslide': AlertTriangle,
  'Flood Damage': Waves,
  'Public Building': Building2,
  'Other': HelpCircle,
};

export default function SubmitComplaint({ onNavigate, onViewComplaint, lang = 'ne' }) {
  const t = translations[lang] || translations.ne;

  // Wizard Step: 1 = Location, 2 = Details, 3 = Evidence, 4 = Review
  const [currentStep, setCurrentStep] = useState(1);

  // Master Location Catalog
  const [municipalities, setMunicipalities] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Search Filter for Municipalities
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

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
    estimated_households: '',
    lifeline_cutoff: false,
    citizen_urgency: 'high',
    latitude: '28.0',
    longitude: '84.0',
  });

  const [voice, setVoice] = useState(null);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [images, setImages] = useState([]);
  const [voiceLanguage, setVoiceLanguage] = useState(lang === 'en' ? 'en-US' : 'ne-NP');

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
        
        // Normalize provinces to safe array of { code, name, local_name }
        const rawProvinces = data.provinces || [];
        const normalizedProvinces = rawProvinces.map((p) => {
          if (typeof p === 'string') return { code: p, name: p, local_name: p };
          return {
            code: p.code || p.name || '',
            name: p.name || p.local_name || '',
            local_name: p.local_name || p.name || '',
          };
        });
        setProvinces(normalizedProvinces);

        // Normalize districts to array of strings
        const rawDistricts = data.districts || [];
        const normalizedDistricts = rawDistricts.map((d) => (typeof d === 'string' ? d : (d?.name || '')));
        setDistricts(normalizedDistricts);

        // Normalize categories
        const rawCategories = data.categories || [];
        const normalizedCategories = (rawCategories.length > 0 ? rawCategories : [
          'Road Damage',
          'Bridge Damage',
          'Drinking Water Supply',
          'Water Pipeline',
          'Drainage',
          'Street Light',
          'School Access / Building',
          'Health Facility Access',
          'Landslide',
          'Flood Damage',
          'Public Building',
          'Other',
        ]).map((c) => (typeof c === 'string' ? c : (c?.name || c?.title || '')));
        setCategories(normalizedCategories);

        if (munis.length > 0) {
          const firstMuni = munis[0];
          setSelectedProvince(firstMuni.province);
          setSelectedDistrict(firstMuni.district);
          setSelectedMunicipalityId(firstMuni.id);
          setSelectedWard(1);

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
    return (
      municipalities.find((m) => Number(m.id) === Number(selectedMunicipalityId)) ||
      municipalities[0] || { name: '', province: '', district: '', ward_count: 5 }
    );
  }, [municipalities, selectedMunicipalityId]);

  // Available wards in selected municipality
  const availableWards = useMemo(() => {
    const count = currentMunicipality?.ward_count || 5;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [currentMunicipality]);

  // Filtered districts by province
  const availableDistricts = useMemo(() => {
    if (!selectedProvince) return districts || [];
    const filteredMunis = (municipalities || []).filter((m) => {
      const mProv = m.province || '';
      return mProv === selectedProvince || mProv.toLowerCase() === String(selectedProvince).toLowerCase();
    });
    return Array.from(new Set(filteredMunis.map((m) => m.district).filter(Boolean)));
  }, [municipalities, selectedProvince, districts]);

  // Filtered municipalities by district
  const availableMunicipalities = useMemo(() => {
    if (!selectedDistrict) return municipalities || [];
    return (municipalities || []).filter((m) => {
      const mDist = m.district || '';
      return mDist === selectedDistrict || mDist.toLowerCase() === String(selectedDistrict).toLowerCase();
    });
  }, [municipalities, selectedDistrict]);

  // Instant Municipality Search Handler
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const q = query.toLowerCase().trim();
    const matches = municipalities
      .filter((m) => {
        const nameEn = (m.name || '').toLowerCase();
        const nameNe = (m.name_ne || '').toLowerCase();
        const dist = (m.district || '').toLowerCase();
        return nameEn.includes(q) || nameNe.includes(q) || dist.includes(q);
      })
      .slice(0, 6);
    setSearchResults(matches);
  };

  const selectSearchedMunicipality = (muni) => {
    setSelectedMunicipalityId(muni.id);
    setSelectedDistrict(muni.district);
    setSelectedProvince(muni.province);
    setSelectedWard(1);
    setSearchQuery('');
    setSearchResults([]);

    setForm((prev) => ({
      ...prev,
      village_id: '',
      settlement_name: '',
      latitude: muni.center_lat ? String(muni.center_lat) : prev.latitude,
      longitude: muni.center_lng ? String(muni.center_lng) : prev.longitude,
    }));
  };

  // Handle Municipality Switch
  const handleMunicipalityChange = (muniId) => {
    const muni = municipalities.find((m) => Number(m.id) === Number(muniId));
    if (!muni) return;

    setSelectedMunicipalityId(muni.id);
    setSelectedDistrict(muni.district);
    setSelectedProvince(muni.province);
    setSelectedWard(1);

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

  // Step Navigations with Validation
  const goToStep = (stepNumber) => {
    setError('');
    // Step 1 Validation
    if (currentStep === 1 && stepNumber > 1) {
      if (!selectedMunicipalityId) {
        setError(t.errMunicipalityRequired || 'Please select a municipality.');
        return;
      }
      if (!selectedWard) {
        setError(t.errWardRequired || 'Please select a ward number.');
        return;
      }
      if (!form.village_id || form.village_id === 'other') {
        if (!form.settlement_name || form.settlement_name.trim().length < 2) {
          setError(t.errSettlementRequired || 'Please enter your settlement or tole name (at least 2 characters).');
          return;
        }
      }
    }

    // Step 2 Validation
    if (currentStep === 2 && stepNumber > 2) {
      if (!form.category) {
        setError(t.errCategoryRequired || 'Please select an infrastructure category.');
        return;
      }
      if (form.category === 'Other' && (!form.custom_category || form.custom_category.trim().length < 2)) {
        setError(t.customCategoryLabel || 'Please specify the custom category.');
        return;
      }
      if (!form.title || form.title.trim().length < 5) {
        setError(t.errTitleRequired || 'Please enter a clear title (at least 5 characters).');
        return;
      }
      if (
        (!form.description || form.description.trim().length < 10) &&
        !speechTranscript &&
        !voice
      ) {
        setError(t.errDescriptionRequired || 'Please provide a description, voice recording, or transcription.');
        return;
      }
    }

    setCurrentStep(stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Submission Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return; // Prevent double submission
    setError('');

    // Final integrity checks
    if (!form.category) {
      goToStep(2);
      setError(t.errCategoryRequired);
      return;
    }
    if (!form.title || form.title.trim().length < 5) {
      goToStep(2);
      setError(t.errTitleRequired);
      return;
    }
    if (!form.village_id && (!form.settlement_name || form.settlement_name.trim().length < 2)) {
      goToStep(1);
      setError(t.errSettlementRequired);
      return;
    }

    setLoading(true);
    setSubmittedComplaint(null);

    const data = new FormData();
    data.append('title', form.title.trim());
    data.append('category', form.category);
    if (form.custom_category) data.append('custom_category', form.custom_category.trim());
    if (form.description) data.append('description', form.description.trim());
    if (speechTranscript) data.append('speech_transcript', speechTranscript.trim());
    data.append('transcript_language', voiceLanguage);
    if (form.contact_number) data.append('contact_number', form.contact_number.trim());
    data.append('municipality_id', String(selectedMunicipalityId));
    data.append('ward_number', String(selectedWard));
    if (form.village_id && form.village_id !== 'other') data.append('village_id', String(form.village_id));
    if (form.settlement_name) data.append('settlement_name', form.settlement_name.trim());
    if (form.latitude) data.append('latitude', String(form.latitude));
    if (form.longitude) data.append('longitude', String(form.longitude));

    // Urgency and households
    if (form.citizen_urgency) data.append('citizen_urgency', form.citizen_urgency);
    if (form.estimated_households) data.append('estimated_households', String(form.estimated_households));
    data.append('lifeline_cutoff', form.lifeline_cutoff ? '1' : '0');

    images.forEach((img) => data.append('images[]', img));
    if (voice) data.append('voice_recording', voice);

    try {
      const response = await citizenService.submitComplaint(data);
      setSubmittedComplaint(response.complaint);
      // Reset form fields
      setForm({
        title: '',
        category: '',
        custom_category: '',
        village_id: '',
        settlement_name: '',
        description: '',
        contact_number: '',
        estimated_households: '',
        lifeline_cutoff: false,
        citizen_urgency: 'high',
        latitude: currentMunicipality?.center_lat ? String(currentMunicipality.center_lat) : '28.0',
        longitude: currentMunicipality?.center_lng ? String(currentMunicipality.center_lng) : '84.0',
      });
      setVoice(null);
      setSpeechTranscript('');
      setImages([]);
      setCurrentStep(1);
    } catch (requestError) {
      const resData = requestError.response?.data;
      const errors = resData?.errors;
      const msg = errors
        ? Object.values(errors).flat().join(' ')
        : resData?.message || t.errGeneral || 'Submission failed. Please check the fields and retry.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Selected Village Name Helper
  const selectedVillageName = useMemo(() => {
    if (form.village_id && form.village_id !== 'other') {
      const v = villages.find((item) => Number(item.id) === Number(form.village_id));
      return v ? v.name : '';
    }
    return form.settlement_name ? `${form.settlement_name} (${t.unregisteredSettlementLabel || 'Settlement'})` : '';
  }, [form.village_id, form.settlement_name, villages, t]);

  // Selected Category Translation Helper
  const getCategoryLabel = (cat) => {
    const keyMap = {
      'Road Damage': t.cat_road_damage,
      'Bridge Damage': t.cat_bridge_damage,
      'Drinking Water Supply': t.cat_drinking_water,
      'Water Pipeline': t.cat_water_pipeline,
      'Drainage': t.cat_drainage,
      'Street Light': t.cat_street_light,
      'School Access / Building': t.cat_school_infrastructure,
      'Health Facility Access': t.cat_health_facility,
      'Landslide': t.cat_landslide,
      'Flood Damage': t.cat_flood_damage,
      'Public Building': t.cat_public_building,
      'Other': t.cat_other,
    };
    return keyMap[cat] || cat;
  };

  return (
    <div className="citizen-page">
      {/* Wizard Header Banner */}
      <div className="citizen-page-heading">
        <div>
          <p>{t.brandSubtitle || 'Citizen Service Portal'}</p>
          <h1>{t.reportIncident || 'Report Incident'}</h1>
          <span>
            {lang === 'ne'
              ? 'ग्रामीण सडक, पुल, खानेपानी, पहिरो तथा आपतकालीन समस्याहरू वडा इन्जिनियरिङ शाखालाई सिधै रिपोर्ट गर्नुहोस्।'
              : 'Directly inform municipal engineering staff and ward officers about broken roads, washed out bridges, pipeline failures, or trail hazards.'}
          </span>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL / SCREEN */}
      {submittedComplaint && (
        <section className="citizen-card success-banner-card" style={{ marginBottom: '24px', border: '2px solid #267153' }}>
          <div className="success-banner-content" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ background: '#e6f4ea', padding: '12px', borderRadius: '50%', color: '#137333', flexShrink: 0 }}>
              <CheckCircle2 size={40} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#123D30', fontWeight: 800 }}>
                {t.successTitle || 'Report Successfully Lodged!'}
              </h2>
              <div style={{ margin: '8px 0 14px 0', fontSize: '14px', color: '#2b3f33', lineHeight: '1.6' }}>
                {t.successTracking || 'Municipal Tracking Reference:'}{' '}
                <strong
                  className="tracking-code-pill"
                  style={{
                    background: '#123D30',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    letterSpacing: '0.5px',
                    fontSize: '15px',
                    display: 'inline-block',
                    margin: '0 4px',
                  }}
                >
                  {submittedComplaint.complaint_number}
                </strong>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: '#415549', lineHeight: '1.5' }}>
                {t.successMessage ||
                  'Your report has been queued for on-site verification by ward technical officers. You will receive notifications as municipal engineers review and act upon your report.'}
              </p>

              {/* Three-step Verification Timeline */}
              <div
                style={{
                  background: '#f4f8f5',
                  border: '1px solid #d4e7da',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  marginBottom: '18px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#123D30', marginBottom: '8px' }}>
                  {lang === 'ne' ? 'नगरपालिका प्रमाणीकरण प्रक्रिया:' : 'Municipal Verification Timeline:'}
                </div>
                <div style={{ display: 'grid', gap: '8px', fontSize: '12.5px', color: '#314e3f' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#267153' }} />
                    <span>{t.timelineSubmitted}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#b45309' }} />
                    <span>{t.timelineVerification}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748b' }} />
                    <span>{t.timelineAction}</span>
                  </div>
                </div>
              </div>

              <div className="success-banner-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
                    gap: '8px',
                    padding: '10px 20px',
                    background: '#123D30',
                    color: '#fff',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <FileText size={16} />
                  <span>{t.trackReportBtn || 'Track This Report'}</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className="citizen-secondary"
                  onClick={() => setSubmittedComplaint(null)}
                  style={{
                    padding: '10px 18px',
                    background: '#ffffff',
                    border: '1px solid #d9e3db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#2d3f34',
                  }}
                >
                  {t.fileAnotherBtn || 'File Another Report'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4-STEP WIZARD PROGRESS BAR */}
      <div className="wizard-stepper-container" style={{ marginBottom: '24px' }}>
        <div
          className="wizard-stepper"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            background: '#ffffff',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid #e1ebe4',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {[
            { step: 1, title: t.step1Title, icon: MapPin },
            { step: 2, title: t.step2Title, icon: Building2 },
            { step: 3, title: t.step3Title, icon: Camera },
            { step: 4, title: t.step4Title, icon: ShieldCheck },
          ].map(({ step, title, icon: Icon }) => {
            const isActive = currentStep === step;
            const isCompleted = currentStep > step;

            return (
              <button
                key={step}
                type="button"
                onClick={() => goToStep(step)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: isActive ? '2px solid #267153' : '1px solid transparent',
                  background: isActive ? '#f0f7f3' : isCompleted ? '#f9fcf9' : '#f8faf9',
                  color: isActive ? '#123D30' : isCompleted ? '#267153' : '#65776c',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  minHeight: '48px',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isActive ? '#123D30' : isCompleted ? '#267153' : '#d2ded7',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : step}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: isActive ? 700 : 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ERROR NOTICE BANNER */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fdf3f2',
            border: '1px solid #f2c7c4',
            borderRadius: '8px',
            color: '#a83228',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Incident Location Selection */}
      {currentStep === 1 && (
        <section className="citizen-card form-section" style={{ display: 'grid', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <MapPin size={20} color="#267153" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#123D30' }}>
                {t.step1Title}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#55695d' }}>
              {t.step1Subtitle}
            </p>
          </div>

          {/* Instant Municipality Search Box */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#2d3f34', marginBottom: '6px' }}>
              {lang === 'ne' ? 'छिटो खोज्नुहोस् (Fast Search)' : 'Quick Search Municipality'}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', color: '#73877b' }} />
              <input
                type="text"
                placeholder={t.searchMunicipalityPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '8px',
                  border: '1px solid #c8d8ce',
                  fontSize: '14px',
                  background: '#fafcfa',
                }}
              />
            </div>

            {/* Instant Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #bfd3c7',
                  borderRadius: '8px',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  marginTop: '4px',
                  overflow: 'hidden',
                }}
              >
                {searchResults.map((muni) => (
                  <button
                    key={muni.id}
                    type="button"
                    onClick={() => selectSearchedMunicipality(muni)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #eef3f0',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f2f8f4')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <strong style={{ color: '#123D30', fontSize: '13.5px' }}>
                        {muni.name} {muni.name_ne ? `(${muni.name_ne})` : ''}
                      </strong>
                      <div style={{ fontSize: '12px', color: '#687d71' }}>
                        {muni.district}, {muni.province}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', background: '#e1ede6', padding: '3px 8px', borderRadius: '4px', color: '#1b5a3e' }}>
                      {muni.ward_count} Wards
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location Hierarchy Grid */}
          <div className="citizen-form-grid">
            {/* Province Selector */}
            <label>
              {t.province}
              <select
                value={selectedProvince}
                onChange={(e) => {
                  const p = e.target.value;
                  setSelectedProvince(p);
                  const matchingMunis = municipalities.filter((m) => {
                    const mProv = m.province || '';
                    return mProv === p || mProv.toLowerCase() === p.toLowerCase();
                  });
                  if (matchingMunis.length > 0) {
                    handleMunicipalityChange(matchingMunis[0].id);
                  }
                }}
              >
                {provinces.map((p, idx) => {
                  const pName = typeof p === 'string' ? p : (p?.name || p?.local_name || '');
                  const pKey = typeof p === 'string' ? p : (p?.code || p?.name || idx);
                  const pLabel = typeof p === 'string'
                    ? p
                    : (lang === 'ne' && p?.local_name ? `${p.local_name} (${p.name})` : (p?.name || p?.local_name || ''));
                  return (
                    <option key={pKey} value={pName}>
                      {pLabel}
                    </option>
                  );
                })}
              </select>
            </label>

            {/* District Selector */}
            <label>
              {t.district}
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  const d = e.target.value;
                  setSelectedDistrict(d);
                  const matchingMunis = municipalities.filter((m) => {
                    const mDist = m.district || '';
                    return mDist === d || mDist.toLowerCase() === d.toLowerCase();
                  });
                  if (matchingMunis.length > 0) {
                    handleMunicipalityChange(matchingMunis[0].id);
                  }
                }}
              >
                {availableDistricts.map((d, idx) => {
                  const dName = typeof d === 'string' ? d : (d?.name || '');
                  return (
                    <option key={dName || idx} value={dName}>
                      {dName}
                    </option>
                  );
                })}
              </select>
            </label>

            {/* Municipality Selector */}
            <label>
              {t.municipality}
              <select
                required
                value={selectedMunicipalityId}
                onChange={(e) => handleMunicipalityChange(e.target.value)}
              >
                {availableMunicipalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.name_ne ? `(${m.name_ne})` : ''} — {m.district}
                  </option>
                ))}
              </select>
            </label>

            {/* Ward Selector */}
            <label>
              {t.ward}
              <select
                required
                value={selectedWard}
                onChange={(e) => setSelectedWard(Number(e.target.value))}
              >
                {availableWards.map((w) => (
                  <option key={w} value={w}>
                    {lang === 'ne' ? `वडा नं. ${w}` : `Ward ${w}`}
                  </option>
                ))}
              </select>
            </label>

            {/* Village Selector */}
            <label>
              {t.village}
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
                  <option value="other">{t.noRegisteredVillage}</option>
                )}
                <option value="other">{t.otherSettlementOption}</option>
              </select>
            </label>

            {/* Unregistered Settlement Fallback */}
            {(!form.village_id || form.village_id === 'other') && (
              <label>
                {t.unregisteredSettlementLabel}
                <input
                  type="text"
                  required
                  placeholder={t.unregisteredSettlementPlaceholder}
                  value={form.settlement_name}
                  onChange={(e) => updateField('settlement_name', e.target.value)}
                />
                <small
                  style={{
                    color: '#854d0e',
                    display: 'block',
                    marginTop: '4px',
                    background: '#fefce8',
                    padding: '6px 10px',
                    borderRadius: '5px',
                    border: '1px solid #fef08a',
                    fontSize: '11.5px',
                    lineHeight: '1.4',
                  }}
                >
                  {t.unregisteredNotice}
                </small>
              </label>
            )}
          </div>

          {/* Interactive Map Pin Selector */}
          <div>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ fontSize: '14px', color: '#123D30' }}>{t.mapHeading}</strong>
              <div style={{ fontSize: '12px', color: '#55695d' }}>{t.mapSubheading}</div>
            </div>
            <LocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              lang={lang}
              onChange={(lat, lng) => setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
            />
          </div>

          {/* Step 1 Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="button"
              className="citizen-primary"
              onClick={() => goToStep(2)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#123D30',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>{t.nextStep}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {/* STEP 2: Incident Details */}
      {currentStep === 2 && (
        <section className="citizen-card form-section" style={{ display: 'grid', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Building2 size={20} color="#267153" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#123D30' }}>
                {t.step2Title}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#55695d' }}>
              {t.step2Subtitle}
            </p>
          </div>

          {/* Problem Category Card Grid */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#123D30', marginBottom: '10px' }}>
              {t.problemCategory}
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: '10px',
              }}
            >
              {categories.map((cat) => {
                const isSelected = form.category === cat;
                const IconComponent = CATEGORY_ICONS[cat] || HelpCircle;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateField('category', cat)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '14px 10px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #267153' : '1px solid #dbe6df',
                      background: isSelected ? '#edf6f1' : '#ffffff',
                      color: isSelected ? '#123D30' : '#33443b',
                      cursor: 'pointer',
                      textAlign: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease',
                      minHeight: '84px',
                    }}
                  >
                    <IconComponent size={22} color={isSelected ? '#123D30' : '#456153'} />
                    <span style={{ fontSize: '12.5px', fontWeight: isSelected ? 700 : 500 }}>
                      {getCategoryLabel(cat)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Category input if "Other" is chosen */}
          {form.category === 'Other' && (
            <label>
              {t.customCategoryLabel}
              <input
                required
                type="text"
                placeholder={t.customCategoryPlaceholder}
                value={form.custom_category}
                onChange={(e) => updateField('custom_category', e.target.value)}
              />
            </label>
          )}

          {/* Title and Description */}
          <div className="citizen-form-grid">
            <label className="wide">
              {t.reportTitle}
              <input
                required
                type="text"
                maxLength={255}
                placeholder={t.reportTitlePlaceholder}
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </label>

            <label className="wide">
              {t.description}
              <textarea
                rows={4}
                placeholder={t.descriptionPlaceholder}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </label>
          </div>

          {/* Urgency Indicator Cards */}
          <div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#123D30' }}>
                {t.urgencyLabel}
              </label>
              <span style={{ fontSize: '11.5px', color: '#63796d' }}>{t.urgencyDisclaimer}</span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px',
              }}
            >
              {[
                { id: 'critical', label: t.urgencyCritical, color: '#b91c1c', bg: '#fef2f2' },
                { id: 'high', label: t.urgencyHigh, color: '#c2410c', bg: '#fff7ed' },
                { id: 'medium', label: t.urgencyMedium, color: '#854d0e', bg: '#fefce8' },
                { id: 'low', label: t.urgencyLow, color: '#15803d', bg: '#f0fdf4' },
              ].map(({ id, label, color, bg }) => {
                const isSelected = form.citizen_urgency === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => updateField('citizen_urgency', id)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSelected ? `2px solid ${color}` : '1px solid #dce5df',
                      background: isSelected ? bg : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                      <strong style={{ fontSize: '13px', color: '#1a2e24', textTransform: 'capitalize' }}>
                        {id}
                      </strong>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#4d6155', lineHeight: '1.4' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Impact and Lifeline Cutoff Checkbox */}
          <div className="citizen-form-grid">
            <label>
              {t.estimatedHouseholds}
              <input
                type="number"
                min="0"
                placeholder={t.householdsPlaceholder}
                value={form.estimated_households}
                onChange={(e) => updateField('estimated_households', e.target.value)}
              />
            </label>

            <label>
              {t.contactNumber}
              <input
                type="tel"
                placeholder={t.contactPlaceholder}
                value={form.contact_number}
                onChange={(e) => updateField('contact_number', e.target.value)}
              />
            </label>

            <div className="wide" style={{ marginTop: '6px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '10px 14px',
                  background: '#fcfdfb',
                  border: '1px solid #dce7df',
                  borderRadius: '8px',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.lifeline_cutoff}
                  onChange={(e) => updateField('lifeline_cutoff', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#852822' }}>
                  {t.criticalLifelineCutoff}
                </span>
              </label>
            </div>
          </div>

          {/* Step 2 Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <button
              type="button"
              className="citizen-secondary"
              onClick={() => goToStep(1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: '#ffffff',
                border: '1px solid #d9e3db',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span>{t.previousStep}</span>
            </button>
            <button
              type="button"
              className="citizen-primary"
              onClick={() => goToStep(3)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#123D30',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>{t.nextStep}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {/* STEP 3: Add Evidence */}
      {currentStep === 3 && (
        <section className="citizen-card form-section" style={{ display: 'grid', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Camera size={20} color="#267153" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#123D30' }}>
                {t.step3Title}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#55695d' }}>
              {t.step3Subtitle}
            </p>
          </div>

          {/* Photo Evidence Upload */}
          <div>
            <div style={{ marginBottom: '10px' }}>
              <strong style={{ fontSize: '14px', color: '#123D30' }}>{t.photosHeading}</strong>
              <div style={{ fontSize: '12px', color: '#55695d' }}>{t.photosSubheading}</div>
            </div>
            <ImageUploader images={images} onChange={setImages} />
          </div>

          {/* Voice Recording & Speech-to-Text */}
          <div>
            <div style={{ marginBottom: '10px' }}>
              <strong style={{ fontSize: '14px', color: '#123D30' }}>{t.voiceHeading}</strong>
              <div style={{ fontSize: '12px', color: '#55695d' }}>{t.voiceSubheading}</div>
            </div>
            <VoiceRecorder
              language={voiceLanguage}
              onLanguageChange={setVoiceLanguage}
              onRecording={setVoice}
              onTranscript={(text) => {
                setSpeechTranscript(text);
                updateField('description', form.description ? `${form.description}\n\n[Transcript]: ${text}` : text);
              }}
              onSpeechTextChange={(text) => setSpeechTranscript(text)}
            />
          </div>

          {/* Step 3 Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <button
              type="button"
              className="citizen-secondary"
              onClick={() => goToStep(2)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: '#ffffff',
                border: '1px solid #d9e3db',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span>{t.previousStep}</span>
            </button>
            <button
              type="button"
              className="citizen-primary"
              onClick={() => goToStep(4)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#123D30',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>{t.nextStep}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {/* STEP 4: Review & Submit */}
      {currentStep === 4 && (
        <section className="citizen-card form-section" style={{ display: 'grid', gap: '22px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldCheck size={20} color="#267153" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#123D30' }}>
                {t.step4Title}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#55695d' }}>
              {t.reviewSubheading}
            </p>
          </div>

          {/* Section 1: Location Summary */}
          <div
            style={{
              background: '#f8fbf9',
              border: '1px solid #d6e4dc',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#123D30' }}>
                <MapPin size={16} color="#267153" />
                <span>{t.locationSummary}</span>
              </div>
              <button
                type="button"
                onClick={() => goToStep(1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: '#267153',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Edit3 size={13} />
                <span>{t.editStep}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#667a6e', display: 'block', fontSize: '11.5px' }}>{t.province}:</span>
                <strong>{selectedProvince}</strong>
              </div>
              <div>
                <span style={{ color: '#667a6e', display: 'block', fontSize: '11.5px' }}>{t.district}:</span>
                <strong>{selectedDistrict}</strong>
              </div>
              <div>
                <span style={{ color: '#667a6e', display: 'block', fontSize: '11.5px' }}>{t.municipality}:</span>
                <strong>
                  {currentMunicipality.name} {currentMunicipality.name_ne ? `(${currentMunicipality.name_ne})` : ''}
                </strong>
              </div>
              <div>
                <span style={{ color: '#667a6e', display: 'block', fontSize: '11.5px' }}>{t.ward}:</span>
                <strong>Ward {selectedWard}</strong>
              </div>
              <div>
                <span style={{ color: '#667a6e', display: 'block', fontSize: '11.5px' }}>{t.village}:</span>
                <strong>{selectedVillageName || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#667a6e', display: 'block', fontSize: '11.5px' }}>Coordinates:</span>
                <code>{form.latitude}, {form.longitude}</code>
              </div>
            </div>
          </div>

          {/* Section 2: Incident Summary */}
          <div
            style={{
              background: '#f8fbf9',
              border: '1px solid #d6e4dc',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#123D30' }}>
                <Building2 size={16} color="#267153" />
                <span>{t.incidentSummary}</span>
              </div>
              <button
                type="button"
                onClick={() => goToStep(2)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: '#267153',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Edit3 size={13} />
                <span>{t.editStep}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#667a6e', fontSize: '11.5px', display: 'block' }}>{t.problemCategory}:</span>
                <strong>{getCategoryLabel(form.category)} {form.custom_category ? `(${form.custom_category})` : ''}</strong>
              </div>
              <div>
                <span style={{ color: '#667a6e', fontSize: '11.5px', display: 'block' }}>{t.reportTitle}:</span>
                <strong style={{ fontSize: '14px', color: '#123D30' }}>{form.title}</strong>
              </div>
              {form.description && (
                <div>
                  <span style={{ color: '#667a6e', fontSize: '11.5px', display: 'block' }}>{t.description}:</span>
                  <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e1e9e3', whiteSpace: 'pre-line', fontSize: '12.5px' }}>
                    {form.description}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
                <div>
                  <span style={{ color: '#667a6e', fontSize: '11.5px', display: 'block' }}>Urgency:</span>
                  <span style={{ textTransform: 'capitalize', fontWeight: 700, color: form.citizen_urgency === 'critical' ? '#b91c1c' : '#c2410c' }}>
                    {form.citizen_urgency}
                  </span>
                </div>
                {form.estimated_households && (
                  <div>
                    <span style={{ color: '#667a6e', fontSize: '11.5px', display: 'block' }}>Affected Households:</span>
                    <strong>{form.estimated_households}</strong>
                  </div>
                )}
                {form.lifeline_cutoff && (
                  <div>
                    <span style={{ color: '#667a6e', fontSize: '11.5px', display: 'block' }}>Lifeline Status:</span>
                    <strong style={{ color: '#b91c1c' }}>Cut Off</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Evidence Summary */}
          <div
            style={{
              background: '#f8fbf9',
              border: '1px solid #d6e4dc',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#123D30' }}>
                <Camera size={16} color="#267153" />
                <span>{t.evidenceSummary}</span>
              </div>
              <button
                type="button"
                onClick={() => goToStep(3)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: '#267153',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Edit3 size={13} />
                <span>{t.editStep}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Camera size={16} color="#55695d" />
                <span>
                  {images.length > 0 ? `${images.length} ${t.photosCount}` : t.noPhotosAttached}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Volume2 size={16} color="#55695d" />
                <span>{voice ? t.audioAttached : t.noAudioAttached}</span>
              </div>
              {speechTranscript && (
                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e1e9e3' }}>
                  <span style={{ color: '#667a6e', fontSize: '11px', display: 'block', marginBottom: '2px' }}>
                    {t.speechTranscriptionLabel}
                  </span>
                  <p style={{ margin: 0, fontSize: '12px', fontStyle: 'italic', color: '#1e382b' }}>
                    "{speechTranscript}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Step 4 Actions: Final Submit */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <button
              type="button"
              className="citizen-secondary"
              onClick={() => goToStep(3)}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: '#ffffff',
                border: '1px solid #d9e3db',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span>{t.previousStep}</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              style={{
                padding: '13px 28px',
                background: '#123D30',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 3px 8px rgba(18, 61, 48, 0.28)',
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={17} className="spin" />
                  <span>{t.submitting}</span>
                </>
              ) : (
                <>
                  <Send size={17} />
                  <span>{t.submitReport}</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
