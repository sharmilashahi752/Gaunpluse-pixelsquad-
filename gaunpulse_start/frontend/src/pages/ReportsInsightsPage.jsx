import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  HelpCircle,
  Layers,
  LineChart,
  Loader2,
  MapPin,
  MapPinned,
  MessageSquare,
  Network,
  PieChart,
  Printer,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { Card, CardHeader, PageIntro, StatusBadge } from '../components/ui';
import { deduplicateVillages, formatVillageLabel } from '../utils/villageUtils';
import { cachedFetchJson } from '../utils/apiCache';
import { useVillageSelection } from '../context/VillageSelectionContext';

// Register Chart.js components
Chart.register(...registerables);

const API_BASE = 'http://127.0.0.1:8000/api';

export default function ReportsInsightsPage({ onNavigate }) {
  const { villages: globalVillages } = useVillageSelection();
  // -------------------------------------------------------------
  // Filter States
  // -------------------------------------------------------------
  const [municipality, setMunicipality] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [villageId, setVillageId] = useState('');
  const [dateRangePreset, setDateRangePreset] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [verificationStatus, setVerificationStatus] = useState('all');
  const [infrastructureType, setInfrastructureType] = useState('all');

  // Directory metadata
  const [villagesList, setVillagesList] = useState([]);
  const [municipalitiesList, setMunicipalitiesList] = useState([]);

  // Data States
  const [overview, setOverview] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [statusDistData, setStatusDistData] = useState(null);
  const [priorityData, setPriorityData] = useState(null);
  const [wardCompData, setWardCompData] = useState(null);
  const [infraConditionData, setInfraConditionData] = useState(null);
  const [simulationData, setSimulationData] = useState(null);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState('0'); // 0, 30, 60

  // AI Insights State
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Tabular records
  const [activeTableTab, setActiveTableTab] = useState('issues');
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [tableData, setTableData] = useState({ data: [], total: 0, current_page: 1, last_page: 1 });
  const [tableLoading, setTableLoading] = useState(false);

  // Chart Canvas References
  const categoryChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const statusChartRef = useRef(null);
  const priorityChartRef = useRef(null);
  const wardChartRef = useRef(null);
  const conditionChartRef = useRef(null);
  const actionPlanChartRef = useRef(null);
  const simulationChartRef = useRef(null);

  // Chart Instances
  const categoryInstance = useRef(null);
  const trendInstance = useRef(null);
  const statusInstance = useRef(null);
  const priorityInstance = useRef(null);
  const wardInstance = useRef(null);
  const conditionInstance = useRef(null);
  const actionPlanInstance = useRef(null);
  const simulationInstance = useRef(null);

  // -------------------------------------------------------------
  // Parse Initial URL Query Parameters
  // -------------------------------------------------------------
  useEffect(() => {
    const rawHash = window.location.hash || '';
    if (rawHash.includes('?')) {
      const queryStr = rawHash.split('?')[1];
      const params = new URLSearchParams(queryStr);
      if (params.get('municipality')) setMunicipality(params.get('municipality'));
      if (params.get('district')) setDistrict(params.get('district'));
      if (params.get('ward')) setWard(params.get('ward'));
      if (params.get('village_id')) setVillageId(params.get('village_id'));
      if (params.get('category')) setCategory(params.get('category'));
      if (params.get('status')) setStatus(params.get('status'));
      if (params.get('severity')) setSeverity(params.get('severity'));
      if (params.get('date_from')) setDateFrom(params.get('date_from'));
      if (params.get('date_to')) setDateTo(params.get('date_to'));
    }

    // Load directory of villages and municipalities from global context or cached fetch
    if (globalVillages && globalVillages.length > 0) {
      setVillagesList(globalVillages);
      const distinctMunis = Array.from(new Set(globalVillages.map((v) => v.municipality).filter(Boolean)));
      setMunicipalitiesList(distinctMunis);
    } else {
      cachedFetchJson(`${API_BASE}/villages`)
        .then((data) => {
          if (Array.isArray(data)) {
            setVillagesList(data);
            const distinctMunis = Array.from(new Set(data.map((v) => v.municipality).filter(Boolean)));
            setMunicipalitiesList(distinctMunis);
          }
        })
        .catch((e) => console.error('Failed to load directory:', e));
    }
  }, [globalVillages]);

  // -------------------------------------------------------------
  // Construct Query String for API requests
  // -------------------------------------------------------------
  const buildQueryString = useMemo(() => {
    const params = new URLSearchParams();
    if (municipality) params.set('municipality', municipality);
    if (district) params.set('district', district);
    if (ward) params.set('ward', ward);
    if (villageId) params.set('village_id', villageId);
    if (category && category !== 'all') params.set('category', category);
    if (status && status !== 'all') params.set('status', status);
    if (severity && severity !== 'all') params.set('severity', severity);
    if (verificationStatus && verificationStatus !== 'all') params.set('verification_status', verificationStatus);
    if (infrastructureType && infrastructureType !== 'all') params.set('infrastructure_type', infrastructureType);

    if (dateRangePreset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      params.set('date_from', d.toISOString().slice(0, 10));
    } else if (dateRangePreset === '90days') {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      params.set('date_from', d.toISOString().slice(0, 10));
    } else if (dateRangePreset === 'year') {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      params.set('date_from', d.toISOString().slice(0, 10));
    } else if (dateRangePreset === 'custom') {
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
    }

    return params.toString();
  }, [
    municipality,
    district,
    ward,
    villageId,
    category,
    status,
    severity,
    verificationStatus,
    infrastructureType,
    dateRangePreset,
    dateFrom,
    dateTo,
  ]);

  // Sync state to URL hash
  const syncUrlHash = () => {
    const qs = buildQueryString;
    window.location.hash = qs ? `/reports-insights?${qs}` : `/reports-insights`;
  };

  // -------------------------------------------------------------
  // Fetch All Reports Data from Laravel MySQL (Bundled & Cached)
  // -------------------------------------------------------------
  const applyBundleData = (bundle) => {
    if (!bundle) return;
    if (bundle.overview) setOverview(bundle.overview);
    if (bundle.categories) setCategoryData(bundle.categories);
    if (bundle.trends) setTrendData(bundle.trends);
    if (bundle.status_distribution) setStatusDistData(bundle.status_distribution);
    if (bundle.priorities) setPriorityData(bundle.priorities);
    if (bundle.ward_comparison) setWardCompData(bundle.ward_comparison);
    if (bundle.infrastructure_condition) setInfraConditionData(bundle.infrastructure_condition);
    if (bundle.simulations) setSimulationData(bundle.simulations);
    setLastUpdated(new Date());
  };

  const fetchAllReportData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else if (!overview) setLoading(true);

    const qs = buildQueryString ? `?${buildQueryString}` : '';

    try {
      const bundle = await cachedFetchJson(
        `${API_BASE}/reports/bundle${qs}`,
        {},
        {
          force: isManual,
          ttlMs: 45000,
          onBackgroundUpdate: (fresh) => {
            applyBundleData(fresh);
          },
        }
      );

      applyBundleData(bundle);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load initial data and on filter change
  useEffect(() => {
    fetchAllReportData();
    syncUrlHash();
  }, [buildQueryString]);

  // Auto-refresh timer
  useEffect(() => {
    const sec = parseInt(autoRefreshInterval, 10);
    if (!sec || sec <= 0) return;
    const interval = setInterval(() => {
      fetchAllReportData(true);
    }, sec * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, buildQueryString]);

  // -------------------------------------------------------------
  // Fetch Tabular Records
  // -------------------------------------------------------------
  const fetchTableRecords = async () => {
    setTableLoading(true);
    const qs = buildQueryString;
    const url = `${API_BASE}/reports/records?type=${activeTableTab}&page=${tablePage}&per_page=8&search=${encodeURIComponent(
      tableSearch
    )}${qs ? `&${qs}` : ''}`;
    try {
      const data = await cachedFetchJson(url, {}, {
        ttlMs: 30000,
        onBackgroundUpdate: (fresh) => {
          if (fresh) setTableData(fresh);
        },
      });
      setTableData(data);
    } catch (e) {
      console.error('Failed to fetch table records:', e);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchTableRecords();
  }, [activeTableTab, tablePage, tableSearch, buildQueryString]);

  // -------------------------------------------------------------
  // AI Insights Generation Handler
  // -------------------------------------------------------------
  const handleGenerateAiInsights = async () => {
    setAiLoading(true);
    setShowAiModal(true);
    try {
      const qs = buildQueryString;
      const res = await fetch(`${API_BASE}/reports/ai-insights${qs ? `?${qs}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setAiInsights(data);
    } catch (err) {
      console.error('AI Insights failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Export Handlers
  // -------------------------------------------------------------
  const handleExportCsv = () => {
    const qs = buildQueryString ? `?format=csv&${buildQueryString}` : '?format=csv';
    window.location.href = `${API_BASE}/reports/export${qs}`;
  };

  const handleExportJson = () => {
    const qs = buildQueryString ? `?format=json&${buildQueryString}` : '?format=json';
    window.location.href = `${API_BASE}/reports/export${qs}`;
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // Dependent Filter Handlers
  const handleMunicipalityChange = (e) => {
    const newMuni = e.target.value;
    setMunicipality(newMuni);
    if (villageId) {
      const v = villagesList.find((item) => String(item.id) === String(villageId));
      if (v && newMuni && v.municipality !== newMuni) {
        setVillageId('');
      }
    }
  };

  const handleVillageChange = (e) => {
    const newVid = e.target.value;
    setVillageId(newVid);
    if (newVid) {
      const v = villagesList.find((item) => String(item.id) === String(newVid));
      if (v) {
        if (v.municipality) setMunicipality(v.municipality);
        if (v.district) setDistrict(v.district);
        if (v.ward_no) setWard(String(v.ward_no));
      }
    }
  };

  // Active Filter Pills Calculation
  const activeFilters = useMemo(() => {
    const list = [];
    if (municipality) list.push({ key: 'municipality', label: `Municipality: ${municipality}`, clear: () => setMunicipality('') });
    if (villageId) {
      const v = villagesList.find((item) => String(item.id) === String(villageId));
      list.push({ key: 'village', label: `Village: ${v ? v.name : villageId}`, clear: () => setVillageId('') });
    }
    if (ward) list.push({ key: 'ward', label: `Ward: ${ward}`, clear: () => setWard('') });
    if (category && category !== 'all') list.push({ key: 'category', label: `Category: ${category.replace(/_/g, ' ')}`, clear: () => setCategory('all') });
    if (status && status !== 'all') list.push({ key: 'status', label: `Status: ${status.replace(/_/g, ' ')}`, clear: () => setStatus('all') });
    if (severity && severity !== 'all') list.push({ key: 'severity', label: `Severity: ${severity}`, clear: () => setSeverity('all') });
    if (verificationStatus && verificationStatus !== 'all') list.push({ key: 'verification', label: `Verification: ${verificationStatus.replace(/_/g, ' ')}`, clear: () => setVerificationStatus('all') });
    if (dateRangePreset && dateRangePreset !== 'all') list.push({ key: 'dateRange', label: `Date: ${dateRangePreset}`, clear: () => setDateRangePreset('all') });
    return list;
  }, [municipality, villageId, ward, category, status, severity, verificationStatus, dateRangePreset, villagesList]);

  // Chart Empty State Component
  const renderChartEmptyState = (label = 'No Data Available', icon = <BarChart3 size={28} />) => (
    <div className="chart-empty-state">
      {icon}
      <h4>{label}</h4>
      <p>No records match the current filter selection.</p>
      {activeFilters.length > 0 && (
        <button
          className="button button--secondary"
          type="button"
          onClick={handleResetFilters}
          style={{ fontSize: '11px', padding: '4px 10px', marginTop: '6px' }}
        >
          Reset Filters
        </button>
      )}
    </div>
  );

  // Reset Filters
  const handleResetFilters = () => {
    setMunicipality('');
    setDistrict('');
    setWard('');
    setVillageId('');
    setDateRangePreset('all');
    setDateFrom('');
    setDateTo('');
    setCategory('all');
    setStatus('all');
    setSeverity('all');
    setVerificationStatus('all');
    setInfrastructureType('all');
  };

  // -------------------------------------------------------------
  // Chart Rendering Effects (Chart.js 4.x)
  // -------------------------------------------------------------

  // Chart 1: Categories (Horizontal Bar)
  useEffect(() => {
    if (!categoryChartRef.current || !categoryData?.categories) return;
    if (categoryInstance.current) categoryInstance.current.destroy();

    const labels = categoryData.categories.map((c) => c.category);
    const counts = categoryData.categories.map((c) => c.count);

    categoryInstance.current = new Chart(categoryChartRef.current, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['No records'],
        datasets: [
          {
            label: 'Reported Issues',
            data: counts.length ? counts : [0],
            backgroundColor: '#176342',
            borderRadius: 6,
            barThickness: 18,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const total = categoryData.total || 1;
                const pct = Math.round((ctx.parsed.x / total) * 100);
                return `${pct}% of total issues`;
              },
            },
          },
        },
        scales: {
          x: { grid: { color: '#eef2ee' }, ticks: { precision: 0, font: { size: 11 } } },
          y: { grid: { display: false }, ticks: { font: { size: 11.5, weight: '600' } } },
        },
      },
    });
  }, [categoryData]);

  // Chart 2: Trends Timeline (Line Chart)
  useEffect(() => {
    if (!trendChartRef.current || !trendData?.timeline) return;
    if (trendInstance.current) trendInstance.current.destroy();

    const labels = trendData.timeline.map((t) => t.label);
    const submitted = trendData.timeline.map((t) => t.submitted);
    const resolved = trendData.timeline.map((t) => t.resolved);

    trendInstance.current = new Chart(trendChartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Submitted Issues',
            data: submitted,
            borderColor: '#e98535',
            backgroundColor: 'rgba(233, 133, 53, 0.1)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Resolved Issues',
            data: resolved,
            borderColor: '#176342',
            backgroundColor: 'rgba(23, 99, 66, 0.1)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11.5 } } },
        },
        scales: {
          x: { grid: { color: '#f0f4f1' }, ticks: { font: { size: 11 } } },
          y: { grid: { color: '#eef2ee' }, ticks: { precision: 0, font: { size: 11 } } },
        },
      },
    });
  }, [trendData]);

  // Chart 3: Status Distribution (Doughnut)
  useEffect(() => {
    if (!statusChartRef.current || !statusDistData?.distribution) return;
    if (statusInstance.current) statusInstance.current.destroy();

    const labels = statusDistData.distribution.map((s) => s.label);
    const data = statusDistData.distribution.map((s) => s.count);

    statusInstance.current = new Chart(statusChartRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: data.some((v) => v > 0) ? data : [1],
            backgroundColor: [
              '#3b82f6', // Reported
              '#eab308', // Under review
              '#10b981', // Verified
              '#f97316', // In progress
              '#176342', // Resolved
              '#ef4444', // Rejected
            ],
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
        },
      },
    });
  }, [statusDistData]);

  // Chart 4: Priority Breakdown (Bar)
  useEffect(() => {
    if (!priorityChartRef.current || !priorityData?.priorities) return;
    if (priorityInstance.current) priorityInstance.current.destroy();

    const labels = priorityData.priorities.map((p) => p.label);
    const data = priorityData.priorities.map((p) => p.count);

    priorityInstance.current = new Chart(priorityChartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Issues Count',
            data,
            backgroundColor: ['#c94b46', '#e98535', '#facc15', '#3aa273'],
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { grid: { color: '#eef2ee' }, ticks: { precision: 0, font: { size: 11 } } },
        },
      },
    });
  }, [priorityData]);

  // Chart 5: Ward Comparison (Grouped Bar)
  useEffect(() => {
    if (!wardChartRef.current || !wardCompData?.wards) return;
    if (wardInstance.current) wardInstance.current.destroy();

    const labels = wardCompData.wards.map((w) => w.ward);
    const totals = wardCompData.wards.map((w) => w.total_issues);
    const resolved = wardCompData.wards.map((w) => w.resolved_issues);

    wardInstance.current = new Chart(wardChartRef.current, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['No Wards'],
        datasets: [
          {
            label: 'Total Reports',
            data: totals.length ? totals : [0],
            backgroundColor: '#cbd5e1',
            borderRadius: 4,
          },
          {
            label: 'Resolved Issues',
            data: resolved.length ? resolved : [0],
            backgroundColor: '#176342',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { grid: { color: '#eef2ee' }, ticks: { precision: 0, font: { size: 11 } } },
        },
      },
    });
  }, [wardCompData]);

  // Chart 6: Infrastructure Condition & Verification
  useEffect(() => {
    if (!conditionChartRef.current || !infraConditionData?.conditions) return;
    if (conditionInstance.current) conditionInstance.current.destroy();

    const labels = infraConditionData.conditions.map((c) => c.label);
    const counts = infraConditionData.conditions.map((c) => c.count);

    conditionInstance.current = new Chart(conditionChartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Road & Bridge Edges',
            data: counts,
            backgroundColor: ['#176342', '#3aa273', '#facc15', '#ef4444', '#3b82f6'],
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10.5 } } },
          y: { grid: { color: '#eef2ee' }, ticks: { precision: 0, font: { size: 11 } } },
        },
      },
    });
  }, [infraConditionData]);

  // Chart 7: Action Plan Progress
  useEffect(() => {
    if (!actionPlanChartRef.current || !overview?.action_plans) return;
    if (actionPlanInstance.current) actionPlanInstance.current.destroy();

    const plans = overview.action_plans;
    actionPlanInstance.current = new Chart(actionPlanChartRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'In Progress', 'Draft', 'Overdue'],
        datasets: [
          {
            data: [plans.completed, plans.in_progress, plans.draft, plans.overdue],
            backgroundColor: ['#176342', '#3b82f6', '#94a3b8', '#ef4444'],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } } },
      },
    });
  }, [overview]);

  // Chart 8: Simulations Impact
  useEffect(() => {
    if (!simulationChartRef.current || !simulationData?.scenarios) return;
    if (simulationInstance.current) simulationInstance.current.destroy();

    const scenarios = simulationData.scenarios.slice(0, 6);
    const labels = scenarios.map((s, idx) => `Sim #${s.id} (${s.village})`);
    const isolated = scenarios.map((s) => s.isolated_settlements);
    const delays = scenarios.map((s) => s.max_delay_minutes);

    simulationInstance.current = new Chart(simulationChartRef.current, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['No Simulation Records'],
        datasets: [
          {
            label: 'Isolated Settlements (Count)',
            data: isolated.length ? isolated : [0],
            backgroundColor: '#c94b46',
            borderRadius: 4,
          },
          {
            label: 'Max Travel Delay (Mins)',
            data: delays.length ? delays : [0],
            backgroundColor: '#f59e0b',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10.5 } } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { grid: { color: '#eef2ee' }, ticks: { precision: 0, font: { size: 10.5 } } },
        },
      },
    });
  }, [simulationData]);

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  const kpis = overview?.kpis || {};
  const infra = overview?.infrastructure || {};
  const plans = overview?.action_plans || {};

  return (
    <div className="page-stack reports-page" style={{ paddingBottom: '60px' }}>
      {/* 1. Header & Actions */}
      <PageIntro
        title="Reports & Insights"
        description="Live decision-support intelligence aggregated directly from MySQL database tables, citizen reports, verified infrastructure assets, and NetworkX topological impact simulations."
        actions={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => fetchAllReportData(true)}
              disabled={refreshing}
              title="Refresh all metrics from MySQL"
            >
              <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={handleGenerateAiInsights}
              style={{ background: '#0d3829', borderColor: '#0d3829', color: '#fff' }}
            >
              <Sparkles size={15} /> Generate AI Insights
            </button>
            <div style={{ display: 'inline-flex', gap: '4px' }}>
              <button className="button button--secondary" type="button" onClick={handleExportCsv} title="Download CSV">
                <FileSpreadsheet size={15} /> CSV
              </button>
              <button className="button button--secondary" type="button" onClick={handleExportJson} title="Download JSON">
                <FileText size={15} /> JSON
              </button>
              <button className="button button--secondary" type="button" onClick={handlePrintPdf} title="Print or Save PDF">
                <Printer size={15} /> PDF
              </button>
            </div>
          </div>
        }
      />

      {/* Top fast loader bar */}
      {(loading || refreshing) && (
        <div
          style={{
            height: '3px',
            width: '100%',
            background: 'linear-gradient(90deg, #176342 0%, #34d399 50%, #176342 100%)',
            backgroundSize: '200% 100%',
            animation: 'fastLoadingShimmer 1s infinite linear',
            borderRadius: '2px',
            marginBottom: '4px',
          }}
        />
      )}

      {/* 2. Global Filter Toolbar (Phase 4) */}
      <Card className="filter-toolbar-card" style={{ padding: '16px 20px', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={17} style={{ color: '#176342' }} />
            <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700', color: '#092d22' }}>
              Global Report Scoping & Filters
            </h3>
            <span style={{ fontSize: '11px', background: '#eaf5ee', color: '#176342', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              Live MySQL Directory
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', color: '#687c73' }}>
            {lastUpdated && (
              <span>
                <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="auto-refresh-select">Auto-refresh:</label>
              <select
                id="auto-refresh-select"
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(e.target.value)}
                style={{ fontSize: '11.5px', padding: '3px 6px', borderRadius: '6px', border: '1px solid #dfe6df' }}
              >
                <option value="0">Off</option>
                <option value="30">Every 30s</option>
                <option value="60">Every 60s</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters Controls Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
          {/* Municipality */}
          <div>
            <label style={filterLabelStyle}>Municipality</label>
            <select
              value={municipality}
              onChange={handleMunicipalityChange}
              style={filterSelectStyle}
            >
              <option value="">All Municipalities</option>
              {municipalitiesList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Village */}
          <div>
            <label style={filterLabelStyle}>Village</label>
            <select value={villageId} onChange={handleVillageChange} style={filterSelectStyle}>
              <option value="">All Villages</option>
              {deduplicateVillages(villagesList)
                .filter((v) => !municipality || v.municipality === municipality)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {formatVillageLabel(v)}
                  </option>
                ))}
            </select>
          </div>

          {/* Ward */}
          <div>
            <label style={filterLabelStyle}>Ward Number</label>
            <select value={ward} onChange={(e) => setWard(e.target.value)} style={filterSelectStyle}>
              <option value="">All Wards</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((w) => (
                <option key={w} value={w}>
                  Ward {w}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Preset */}
          <div>
            <label style={filterLabelStyle}>Date Range</label>
            <select
              value={dateRangePreset}
              onChange={(e) => setDateRangePreset(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="all">All Time</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">Last 12 Months</option>
              <option value="custom">Custom Dates</option>
            </select>
          </div>

          {/* Issue Category */}
          <div>
            <label style={filterLabelStyle}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={filterSelectStyle}>
              <option value="all">All Categories</option>
              <option value="damaged_bridge">Damaged Bridge</option>
              <option value="damaged_road">Damaged Road</option>
              <option value="health_post_access">Health Post Access</option>
              <option value="school_access">School Access</option>
              <option value="water_supply">Water Supply</option>
            </select>
          </div>

          {/* Issue Status */}
          <div>
            <label style={filterLabelStyle}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={filterSelectStyle}>
              <option value="all">All Statuses</option>
              <option value="submitted">Reported / New</option>
              <option value="under_review">Under Review</option>
              <option value="verified">Verified</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label style={filterLabelStyle}>Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={filterSelectStyle}>
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Verification Status */}
          <div>
            <label style={filterLabelStyle}>Verification</label>
            <select
              value={verificationStatus}
              onChange={(e) => setVerificationStatus(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="all">All Verification</option>
              <option value="verified">Field Verified</option>
              <option value="imported">OSM Imported</option>
              <option value="pending_review">Pending Review</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers & Active Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
          {dateRangePreset === 'custom' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={dateInputStyle}
                placeholder="From date"
              />
              <span style={{ fontSize: '12px', color: '#687c73' }}>to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={dateInputStyle}
                placeholder="To date"
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button
              className="button button--secondary"
              type="button"
              onClick={handleResetFilters}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Reset Filters
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={() => fetchAllReportData(true)}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Active Filter Indicators (Pills) */}
        {activeFilters.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #eef2ee' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#687c73', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Active Filters:</span>
            {activeFilters.map((f) => (
              <span key={f.key} className="active-filter-pill">
                {f.label}
                <button type="button" onClick={f.clear} title="Remove filter">
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 6px',
                textDecoration: 'underline',
                marginLeft: 'auto',
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </Card>

      {/* Empty Results Alert Banner */}
      {Boolean(overview && kpis.active_issues?.count === 0 && kpis.community_reports?.total === 0 && (infra.total_edges ?? 0) === 0) && (
        <div
          style={{
            background: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginTop: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '13px', color: '#92400e' }}>
                {activeFilters.length > 0 ? 'No records match the selected filters.' : 'No reports or infrastructure recorded yet.'}
              </strong>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#b45309' }}>
                {activeFilters.length > 0 ? 'Try widening your filters or clearing geographic constraints.' : 'Import village infrastructure or report issues to populate reports.'}
              </p>
            </div>
          </div>
          {activeFilters.length > 0 && (
            <button className="button button--secondary" type="button" onClick={handleResetFilters} style={{ fontSize: '12px', padding: '6px 12px' }}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* 3. Executive KPI Metric Cards (Phase 3) - Responsive Flexbox */}
      <div className="report-kpi-grid">
        {/* KPI 1: Resolution Rate */}
        <Card className="report-kpi-card">
          <div className="report-kpi-card__topline">
            <span className="report-kpi-card__icon" style={{ background: '#eaf5ee', color: '#176342' }}>
              <CheckCircle2 size={16} />
            </span>
            <span className="report-kpi-card__badge" style={{ background: '#eaf5ee', color: '#176342' }}>Formula Verified</span>
          </div>
          <div className="report-kpi-card__body">
            <span className="report-kpi-card__label">Issues Resolved</span>
            <strong className="report-kpi-card__value">
              {loading && !overview ? (
                <span className="shimmer-placeholder" style={{ display: 'inline-block', width: '70px', height: '24px', background: '#e2e8f0', borderRadius: '4px' }} />
              ) : (
                kpis.resolution_rate?.formatted || (kpis.resolution_rate?.eligible_count === 0 ? 'No data' : '0%')
              )}
            </strong>
            <small className="report-kpi-card__desc">
              {kpis.resolution_rate?.resolved_count ?? 0} of {kpis.resolution_rate?.eligible_count ?? 0} eligible issues
            </small>
          </div>
        </Card>

        {/* KPI 2: Median Verification Time */}
        <Card className="report-kpi-card">
          <div className="report-kpi-card__topline">
            <span className="report-kpi-card__icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Clock size={16} />
            </span>
            <span className="report-kpi-card__badge" style={{ background: '#fef3c7', color: '#b45309' }}>Audit Trail</span>
          </div>
          <div className="report-kpi-card__body">
            <span className="report-kpi-card__label">Median Verification</span>
            <strong className="report-kpi-card__value">
              {loading && !overview ? (
                <span className="shimmer-placeholder" style={{ display: 'inline-block', width: '70px', height: '24px', background: '#e2e8f0', borderRadius: '4px' }} />
              ) : (
                kpis.median_verification?.formatted || 'Not available'
              )}
            </strong>
            <small className="report-kpi-card__desc">
              {kpis.median_verification?.verified_issues_count ?? 0} verified · {kpis.median_verification?.unverified_issues_count ?? 0} pending
            </small>
          </div>
        </Card>

        {/* KPI 3: Community Reports */}
        <Card className="report-kpi-card">
          <div className="report-kpi-card__topline">
            <span className="report-kpi-card__icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Users size={16} />
            </span>
            <span className="report-kpi-card__badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>Citizen Voices</span>
          </div>
          <div className="report-kpi-card__body">
            <span className="report-kpi-card__label">Community Reports</span>
            <strong className="report-kpi-card__value">
              {loading && !overview ? (
                <span className="shimmer-placeholder" style={{ display: 'inline-block', width: '50px', height: '24px', background: '#e2e8f0', borderRadius: '4px' }} />
              ) : (
                kpis.community_reports?.total ?? 0
              )}
            </strong>
            <small className="report-kpi-card__desc">
              {kpis.community_reports?.citizen_issue_reports ?? 0} citizen issues · {kpis.community_reports?.community_feedback_count ?? 0} voices
            </small>
          </div>
        </Card>

        {/* KPI 4: Active & Critical Issues */}
        <Card className="report-kpi-card">
          <div className="report-kpi-card__topline">
            <span className="report-kpi-card__icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <ShieldAlert size={16} />
            </span>
            <span className="report-kpi-card__badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>Live Workload</span>
          </div>
          <div className="report-kpi-card__body">
            <span className="report-kpi-card__label">Active Issues</span>
            <strong className="report-kpi-card__value">
              {loading && !overview ? (
                <span className="shimmer-placeholder" style={{ display: 'inline-block', width: '50px', height: '24px', background: '#e2e8f0', borderRadius: '4px' }} />
              ) : (
                kpis.active_issues?.count ?? 0
              )}
            </strong>
            <small className="report-kpi-card__desc" style={{ color: '#dc2626', fontWeight: 600 }}>
              {kpis.active_issues?.critical_count ?? 0} critical severity
            </small>
          </div>
        </Card>

        {/* KPI 5: Infrastructure Mapped */}
        <Card className="report-kpi-card">
          <div className="report-kpi-card__topline">
            <span className="report-kpi-card__icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <Network size={16} />
            </span>
            <span className="report-kpi-card__badge" style={{ background: '#f0fdf4', color: '#15803d' }}>OSM + Field</span>
          </div>
          <div className="report-kpi-card__body">
            <span className="report-kpi-card__label">Mapped Lifelines</span>
            <strong className="report-kpi-card__value">
              {(infra.total_edges ?? 0).toLocaleString()}
            </strong>
            <small className="report-kpi-card__desc">
              {infra.roads ?? 0} roads · {infra.bridges ?? 0} bridges · {infra.schools ?? 0} schools
            </small>
          </div>
        </Card>

        {/* KPI 6: Action Plan Execution */}
        <Card className="report-kpi-card">
          <div className="report-kpi-card__topline">
            <span className="report-kpi-card__icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <TrendingUp size={16} />
            </span>
            <span className="report-kpi-card__badge" style={{ background: '#f5f3ff', color: '#6d28d9' }}>Execution</span>
          </div>
          <div className="report-kpi-card__body">
            <span className="report-kpi-card__label">Action Plans</span>
            <strong className="report-kpi-card__value">
              {plans.total ?? 0} Plans
            </strong>
            <small className="report-kpi-card__desc">
              Avg {plans.average_progress ?? 0}% done · {plans.in_progress ?? 0} in progress
            </small>
          </div>
        </Card>
      </div>

      {/* 4. AI Insights Banner / Drawer Trigger (Phase 9) */}
      <Card
        style={{
          background: '#123d30',
          border: '1px solid #1d4d3e',
          color: '#ffffff',
          padding: '20px 24px',
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Sparkles size={18} style={{ color: '#4ade80' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#86efac' }}>
                GaunPulse Intelligence Agent
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
              Need an Executive Synthesis for the Municipal Council?
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#d1fae5', maxWidth: '780px' }}>
              Analyze active complaints, prioritize critical lifelines, and review ward response performance using factual MySQL aggregations and network simulations.
            </p>
          </div>

          <button
            type="button"
            className="button"
            onClick={handleGenerateAiInsights}
            style={{ background: '#ffffff', color: '#092d22', fontWeight: 700, padding: '10px 18px', fontSize: '13px' }}
          >
            <Sparkles size={16} style={{ color: '#176342' }} /> Generate AI Insights
          </button>
        </div>
      </Card>

      {/* 5. Advanced Visualizations Grid (Phase 5) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '18px', marginTop: '6px' }}>
        {/* Chart 1: Issue Categories Breakdown */}
        <Card>
          <CardHeader
            title="Reports by Infrastructure Category"
            description="Categorization of reported disruptions across roads, water points, bridges, and facilities."
          />
          <div style={{ height: '240px', position: 'relative' }}>
            {categoryData?.categories?.length > 0 && categoryData.total > 0 ? (
              <canvas ref={categoryChartRef} />
            ) : (
              renderChartEmptyState('No Categories Reported', <BarChart3 size={28} />)
            )}
          </div>
        </Card>

        {/* Chart 2: Report Trends Timeline */}
        <Card>
          <CardHeader
            title="Monthly Ingestion vs. Resolution Trends"
            description="Historical trend of citizen reports submitted versus successfully resolved lifelines."
          />
          <div style={{ height: '240px', position: 'relative' }}>
            {trendData?.timeline?.length > 0 && trendData.timeline.some((t) => (t.submitted || 0) > 0 || (t.resolved || 0) > 0) ? (
              <canvas ref={trendChartRef} />
            ) : (
              renderChartEmptyState('No Timeline Activity', <LineChart size={28} />)
            )}
          </div>
        </Card>

        {/* Chart 3: Issue Status Distribution */}
        <Card>
          <CardHeader
            title="Issue Status Lifecycle Distribution"
            description="Active distribution across reported, under review, verified, in progress, resolved, and rejected."
          />
          <div style={{ height: '230px', position: 'relative' }}>
            {statusDistData?.distribution?.length > 0 && statusDistData.total > 0 ? (
              <canvas ref={statusChartRef} />
            ) : (
              renderChartEmptyState('No Lifecycle Records', <PieChart size={28} />)
            )}
          </div>
        </Card>

        {/* Chart 4: Priority & Severity Breakdown */}
        <Card>
          <CardHeader
            title="Disruption Severity Breakdown"
            description="Recorded severity classifications informing rapid municipal deployment and contractor prioritization."
          />
          <div style={{ height: '230px', position: 'relative' }}>
            {priorityData?.priorities?.length > 0 && priorityData.total > 0 ? (
              <canvas ref={priorityChartRef} />
            ) : (
              renderChartEmptyState('No Disruption Classifications', <ShieldAlert size={28} />)
            )}
          </div>
        </Card>

        {/* Chart 5: Ward Benchmarking */}
        <Card>
          <CardHeader
            title="Ward Comparison & Resolution Rates"
            description="Municipal ward report volumes contrasted with verified resolution counts."
          />
          <div style={{ height: '230px', position: 'relative' }}>
            {wardCompData?.wards?.length > 0 && wardCompData.wards.some((w) => (w.total_issues || 0) > 0) ? (
              <canvas ref={wardChartRef} />
            ) : (
              renderChartEmptyState('No Ward Issues Found', <MapPin size={28} />)
            )}
          </div>
        </Card>

        {/* Chart 6: Infrastructure Condition */}
        <Card>
          <CardHeader
            title="Infrastructure Condition & Passability"
            description="Operational passability and verification status across registered road and bridge network edges."
          />
          <div style={{ height: '230px', position: 'relative' }}>
            {infraConditionData?.conditions?.length > 0 && infraConditionData.conditions.some((c) => (c.count || 0) > 0) ? (
              <canvas ref={conditionChartRef} />
            ) : (
              renderChartEmptyState('No Lifelines Mapped', <Network size={28} />)
            )}
          </div>
        </Card>

        {/* Chart 7: Action Plan Execution */}
        <Card>
          <CardHeader
            title="Action Plan Status & Progress"
            description="Tracking active repair milestones and task execution across municipal teams."
          />
          <div style={{ height: '230px', position: 'relative' }}>
            {overview?.action_plans && (overview.action_plans.total > 0 || overview.action_plans.in_progress > 0) ? (
              <canvas ref={actionPlanChartRef} />
            ) : (
              renderChartEmptyState('No Action Plans Active', <TrendingUp size={28} />)
            )}
          </div>
        </Card>

        {/* Chart 8: Service Accessibility Impact (Simulation) */}
        <Card>
          <CardHeader
            title="Simulated Accessibility Impact"
            description="Disruption scenario modeling showing isolated settlements and transit delays."
          />
          <div style={{ height: '230px', position: 'relative' }}>
            {simulationData?.scenarios?.length > 0 && simulationData.total_recorded_simulations > 0 ? (
              <canvas ref={simulationChartRef} />
            ) : (
              renderChartEmptyState('No Simulations Recorded', <Cpu size={28} />)
            )}
          </div>
        </Card>
      </div>

      {/* 6. Searchable, Paginated Detailed Tables (Phase 6) */}
      <Card style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: '0', fontSize: '17px', color: '#092d22' }}>Detailed Municipal Evidence Explorer</h2>
          </div>

          {/* Table Tab Selector */}
          <div style={{ display: 'flex', gap: '6px', background: '#f0f4f1', padding: '4px', borderRadius: '8px' }}>
            {[
              { id: 'issues', label: 'Issues & Disruptions' },
              { id: 'infrastructure_edges', label: 'Roads & Bridges' },
              { id: 'infrastructure_nodes', label: 'Facilities & Nodes' },
              { id: 'action_plans', label: 'Action Plans' },
              { id: 'community_feedback', label: 'Community Feedback' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTableTab(tab.id);
                  setTablePage(1);
                }}
                style={{
                  border: 'none',
                  background: activeTableTab === tab.id ? '#176342' : 'transparent',
                  color: activeTableTab === tab.id ? '#ffffff' : '#4b5563',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Search & Meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '10px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder={`Search ${activeTableTab}...`}
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setTablePage(1);
              }}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid #dfe6df',
              }}
            />
          </div>

          <span style={{ fontSize: '11.5px', color: '#687c73' }}>
            Showing {tableData?.data?.length || 0} of {tableData?.total || 0} records
          </span>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f8faf8', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                {activeTableTab === 'issues' && (
                  <>
                    <th style={thStyle}>Code</th>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Village</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Severity</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Reported At</th>
                  </>
                )}
                {activeTableTab === 'infrastructure_edges' && (
                  <>
                    <th style={thStyle}>Code</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Village</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Condition</th>
                    <th style={thStyle}>Verification</th>
                    <th style={thStyle}>Length</th>
                  </>
                )}
                {activeTableTab === 'infrastructure_nodes' && (
                  <>
                    <th style={thStyle}>Code</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Village</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Coordinates</th>
                    <th style={thStyle}>Verification</th>
                  </>
                )}
                {activeTableTab === 'action_plans' && (
                  <>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Village</th>
                    <th style={thStyle}>Responsible Team</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Progress</th>
                    <th style={thStyle}>Target Date</th>
                  </>
                )}
                {activeTableTab === 'community_feedback' && (
                  <>
                    <th style={thStyle}>Resident</th>
                    <th style={thStyle}>Ward</th>
                    <th style={thStyle}>Tag</th>
                    <th style={thStyle}>Message</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Submitted At</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                    <Loader2 size={18} className="spin" style={{ display: 'inline', marginRight: '6px' }} />
                    Loading records from MySQL...
                  </td>
                </tr>
              ) : !tableData?.data || tableData.data.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                    No records found matching current filters.
                  </td>
                </tr>
              ) : (
                tableData.data.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f1' }}>
                    {activeTableTab === 'issues' && (
                      <>
                        <td style={tdStyle}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#176342' }}>
                            {row.tracking_code}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <strong>{row.title}</strong>
                        </td>
                        <td style={tdStyle}>{row.village?.name || 'N/A'}</td>
                        <td style={tdStyle}>{row.category}</td>
                        <td style={tdStyle}>
                          <StatusBadge tone={row.severity === 'critical' ? 'red' : row.severity === 'high' ? 'orange' : 'green'}>
                            {row.severity}
                          </StatusBadge>
                        </td>
                        <td style={tdStyle}>
                          <StatusBadge tone={row.status === 'resolved' ? 'green' : row.status === 'in_progress' ? 'blue' : 'neutral'}>
                            {row.status}
                          </StatusBadge>
                        </td>
                        <td style={tdStyle}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}</td>
                      </>
                    )}
                    {activeTableTab === 'infrastructure_edges' && (
                      <>
                        <td style={tdStyle}><span style={{ fontFamily: 'monospace' }}>{row.edge_code || `edge_${row.id}`}</span></td>
                        <td style={tdStyle}><strong>{row.name}</strong></td>
                        <td style={tdStyle}>{row.village?.name || 'N/A'}</td>
                        <td style={tdStyle}>{row.infrastructure_type || 'road'}</td>
                        <td style={tdStyle}>
                          <StatusBadge tone={row.status === 'operational' ? 'green' : row.status === 'passable' ? 'yellow' : 'red'}>
                            {row.status}
                          </StatusBadge>
                        </td>
                        <td style={tdStyle}>{row.verification_status || 'imported'}</td>
                        <td style={tdStyle}>{row.length_meters ? `${row.length_meters}m` : 'N/A'}</td>
                      </>
                    )}
                    {activeTableTab === 'infrastructure_nodes' && (
                      <>
                        <td style={tdStyle}><span style={{ fontFamily: 'monospace' }}>{row.node_code || `node_${row.id}`}</span></td>
                        <td style={tdStyle}><strong>{row.name}</strong></td>
                        <td style={tdStyle}>{row.village?.name || 'N/A'}</td>
                        <td style={tdStyle}>{row.node_type || 'facility'}</td>
                        <td style={tdStyle}>
                          {parseFloat(row.latitude).toFixed(4)}°N, {parseFloat(row.longitude).toFixed(4)}°E
                        </td>
                        <td style={tdStyle}>{row.verification_status || 'imported'}</td>
                      </>
                    )}
                    {activeTableTab === 'action_plans' && (
                      <>
                        <td style={tdStyle}><strong>{row.title}</strong></td>
                        <td style={tdStyle}>{row.village?.name || 'N/A'}</td>
                        <td style={tdStyle}>{row.responsible_team || 'Municipal Team'}</td>
                        <td style={tdStyle}>
                          <StatusBadge tone={row.status === 'completed' ? 'green' : 'blue'}>
                            {row.status}
                          </StatusBadge>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                              <div style={{ width: `${row.progress_percentage || 0}%`, height: '100%', background: '#176342', borderRadius: '3px' }} />
                            </div>
                            <span>{row.progress_percentage || 0}%</span>
                          </div>
                        </td>
                        <td style={tdStyle}>{row.target_completion_date || 'N/A'}</td>
                      </>
                    )}
                    {activeTableTab === 'community_feedback' && (
                      <>
                        <td style={tdStyle}><strong>{row.resident_name || 'Resident'}</strong></td>
                        <td style={tdStyle}>Ward {row.ward || '1'}</td>
                        <td style={tdStyle}><span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{row.tag || 'general'}</span></td>
                        <td style={tdStyle}>{row.message}</td>
                        <td style={tdStyle}><StatusBadge tone="neutral">{row.status || 'received'}</StatusBadge></td>
                        <td style={tdStyle}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f1' }}>
          <span style={{ fontSize: '11.5px', color: '#687c73' }}>
            Page {tableData?.current_page || 1} of {tableData?.last_page || 1}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="button button--secondary"
              type="button"
              disabled={tablePage <= 1}
              onClick={() => setTablePage((p) => Math.max(1, p - 1))}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
            >
              Previous
            </button>
            <button
              className="button button--secondary"
              type="button"
              disabled={tablePage >= (tableData?.last_page || 1)}
              onClick={() => setTablePage((p) => p + 1)}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      {/* 7. AI Insights Modal / Explanation Drawer (Phase 9) */}
      {showAiModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(9, 45, 34, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#eaf5ee', color: '#176342', padding: '8px', borderRadius: '10px' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#092d22', fontWeight: 700 }}>
                    GaunPulse AI Evidence Insights
                  </h3>
                  <small style={{ color: '#687c73' }}>
                    Deterministic synthesis powered by verified MySQL records & NetworkX simulations
                  </small>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af' }}
              >
                <X size={20} />
              </button>
            </div>

            {aiLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Loader2 size={32} className="spin" style={{ color: '#176342', margin: '0 auto 12px' }} />
                <h4 style={{ margin: 0, fontSize: '15px', color: '#092d22' }}>Synthesizing Municipal Evidence...</h4>
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#687c73' }}>
                  Analyzing reported disruptions, resolution rates, and infrastructure graph dependencies.
                </p>
              </div>
            ) : aiInsights ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Executive Summary Box */}
                <div style={{ background: '#f8faf8', border: '1px solid #dfe6df', borderRadius: '10px', padding: '14px' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '13.5px', color: '#092d22', fontWeight: 700 }}>
                    Executive Overview
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#1f2937', lineHeight: 1.5 }}>
                    {aiInsights.executive_summary}
                  </p>
                </div>

                {/* Key Findings */}
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '13.5px', color: '#092d22', fontWeight: 700 }}>
                    Key Empirical Observations
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#374151', lineHeight: 1.6 }}>
                    {aiInsights.key_findings?.map((kf, idx) => (
                      <li key={idx}>{kf}</li>
                    ))}
                  </ul>
                </div>

                {/* Actionable Recommendations */}
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', padding: '14px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '13.5px', color: '#b45309', fontWeight: 700 }}>
                    Recommended Action Queue
                  </h4>
                  <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#92400e', lineHeight: 1.6 }}>
                    {aiInsights.recommended_priorities?.map((rec, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>
                        {rec}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Data Limitations */}
                <div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '12.5px', color: '#6b7280', fontWeight: 600 }}>
                    Data Constraints & Integrity Notes
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#9ca3af', lineHeight: 1.5 }}>
                    {aiInsights.data_limitations?.map((dl, idx) => (
                      <li key={idx}>{dl}</li>
                    ))}
                  </ul>
                </div>

                {/* Footnote citations */}
                <div style={{ paddingTop: '10px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af' }}>
                  <span>Source: MySQL 8.0 Primary Directory</span>
                  <span>Spatial Engine: OpenStreetMap + NetworkX</span>
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#687c73' }}>No insights available.</p>
            )}

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setShowAiModal(false)}
                style={{ fontSize: '12px', padding: '6px 16px' }}
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Style Constants for Uniformity
const filterLabelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: '#495a52',
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

const filterSelectStyle = {
  width: '100%',
  padding: '6px 8px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '12px',
  color: '#0f172a',
  background: '#ffffff',
};

const dateInputStyle = {
  padding: '5px 8px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '11.5px',
};

const kpiCardStyle = {
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  borderRadius: '12px',
  background: '#ffffff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  border: '1px solid #e7ebe7',
};

const kpiToplineStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px',
};

const iconBadgeStyle = {
  display: 'inline-flex',
  padding: '5px',
  borderRadius: '8px',
};

const kpiLabelStyle = {
  fontSize: '11.5px',
  fontWeight: 600,
  color: '#687c73',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
};

const thStyle = {
  padding: '10px 12px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#495a52',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

const tdStyle = {
  padding: '10px 12px',
  color: '#1f2937',
  verticalAlign: 'middle',
};
