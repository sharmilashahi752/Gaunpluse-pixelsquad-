import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuditLogsPage() {
  const { token, isAdmin, activeMunicipality } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/admin/audit-logs', {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.summary?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (log.performed_by?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (log.action_type?.toLowerCase() || '').includes(search.toLowerCase());

    const matchesType = filterType === 'all' || log.action_type === filterType;
    return matchesSearch && matchesType;
  });

  if (!isAdmin) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          maxWidth: '520px',
          margin: '40px auto',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #d9e3db',
        }}
      >
        <ShieldAlert size={44} color="#a83228" style={{ marginBottom: '12px' }} />
        <h2 style={{ fontSize: '18px', color: '#172e25', margin: '0 0 8px 0' }}>Access Restricted</h2>
        <p style={{ fontSize: '13px', color: '#66786d', margin: 0 }}>
          Audit trail logs are restricted to authorized administrators.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gap: '20px' }}>
      {/* Header */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #d9e3db',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Activity size={20} color="#267153" />
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#172e25' }}>
              Municipal Audit Trail & Activity Logs
            </h1>
          </div>
          <span style={{ fontSize: '12.5px', color: '#66786d' }}>
            {activeMunicipality?.name || 'All Municipalities'} · Immutable operational activity log
          </span>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: '#f7f7f3',
            border: '1px solid #d9e3db',
            borderRadius: '7px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            color: '#172e25',
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #d9e3db',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#66786d' }}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action summary, user or actor..."
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              border: '1px solid #d9e3db',
              borderRadius: '6px',
              fontSize: '12.5px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={14} color="#66786d" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '7px 10px',
              border: '1px solid #d9e3db',
              borderRadius: '6px',
              fontSize: '12.5px',
              background: '#ffffff',
            }}
          >
            <option value="all">All Action Types</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="role_changed">Role Changed</option>
            <option value="ward_assigned">Ward Assigned</option>
            <option value="user_status_changed">User Status Changed</option>
            <option value="password_changed">Password Changed</option>
            <option value="issue_status_updated">Issue Status Updated</option>
          </select>
        </div>
      </div>

      {/* Audit Logs List */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #d9e3db',
          borderRadius: '12px',
          padding: '16px',
        }}
      >
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#66786d' }}>
            Loading audit records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#66786d' }}>
            No audit records found.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {filteredLogs.map((log) => {
              const formattedDate = log.created_at
                ? new Date(log.created_at).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : 'Just now';

              return (
                <div
                  key={log.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: '#f7f7f3',
                    border: '1px solid #e8ede8',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'grid', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: '#123D30',
                          color: '#ffffff',
                        }}
                      >
                        {log.action_type?.replace(/_/g, ' ')}
                      </span>
                      <strong style={{ fontSize: '13px', color: '#172e25' }}>{log.summary}</strong>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#66786d', display: 'flex', gap: '14px' }}>
                      <span><strong>Actor:</strong> {log.performed_by || 'System'}</span>
                      {log.entity_type && (
                        <span><strong>Target:</strong> {log.entity_type} #{log.entity_id}</span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11.5px',
                      color: '#66786d',
                    }}
                  >
                    <Clock size={13} />
                    <span>{formattedDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
