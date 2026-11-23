import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserManagementPage() {
  const { user: currentUser, token, isAdmin, isSystemAdmin, activeMunicipality } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedback, setFeedback] = useState(null);

  // Modals state
  const [wardModalUser, setWardModalUser] = useState(null);
  const [selectedWard, setSelectedWard] = useState(1);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('ward_officer');
  const [actionLoading, setActionLoading] = useState(false);

  // Available wards in active municipality
  const availableWards = useMemo(() => {
    const count = activeMunicipality?.ward_count || 5;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [activeMunicipality]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : (data.data || []));
      } else {
        const err = await res.json().catch(() => ({}));
        setFeedback({ type: 'error', text: err.message || 'Failed to load users.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Network error fetching users.' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Ward Assignment
  const handleAssignWard = async (e) => {
    e.preventDefault();
    if (!wardModalUser) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${wardModalUser.id}/assign-ward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ward_number: Number(selectedWard) }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', text: `Assigned ${wardModalUser.name} to Ward ${selectedWard}.` });
        setWardModalUser(null);
        fetchUsers();
      } else {
        setFeedback({ type: 'error', text: data.message || 'Failed to assign ward.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Role Change
  const handleChangeRole = async (e) => {
    e.preventDefault();
    if (!roleModalUser) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${roleModalUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', text: `Updated role for ${roleModalUser.name} to ${selectedRole}.` });
        setRoleModalUser(null);
        fetchUsers();
      } else {
        setFeedback({ type: 'error', text: data.message || 'Failed to change role.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Toggle Active
  const handleToggleActive = async (targetUser) => {
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/toggle-active`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        const nextStatus = data.user?.is_active ? 'activated' : 'deactivated';
        setFeedback({ type: 'success', text: `User ${targetUser.name} has been ${nextStatus}.` });
        fetchUsers();
      } else {
        setFeedback({ type: 'error', text: data.message || 'Action failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? u.is_active : !u.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

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
          User and staff management is restricted to authorized Municipality and System Administrators.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '20px' }}>
      {/* Header & Workspace Indicator */}
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
            <Users size={20} color="#267153" />
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#172e25' }}>
              Staff & User Management
            </h1>
          </div>
          <span style={{ fontSize: '12.5px', color: '#66786d' }}>
            {activeMunicipality?.name || 'All Municipalities'} · Role-based access control and ward assignments
          </span>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
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
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            background: feedback.type === 'success' ? '#eef8f2' : '#fdf3f2',
            color: feedback.type === 'success' ? '#1b7340' : '#a83228',
            border: `1px solid ${feedback.type === 'success' ? '#c4e8d1' : '#f2c7c4'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
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
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#66786d' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by officer name or email..."
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
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '7px 10px',
              border: '1px solid #d9e3db',
              borderRadius: '6px',
              fontSize: '12.5px',
              background: '#ffffff',
            }}
          >
            <option value="all">All Roles</option>
            <option value="system_admin">System Admin</option>
            <option value="municipality_admin">Municipality Admin</option>
            <option value="ward_officer">Ward Officer</option>
            <option value="citizen">Citizen</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '7px 10px',
              border: '1px solid #d9e3db',
              borderRadius: '6px',
              fontSize: '12.5px',
              background: '#ffffff',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #d9e3db',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f7f7f3', borderBottom: '1px solid #d9e3db' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#172e25' }}>User</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#172e25' }}>Role</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#172e25' }}>Municipality / Ward</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#172e25' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#172e25', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#66786d' }}>
                  Loading municipal users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#66786d' }}>
                  No users found matching current filter criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                const canEditRole = isSystemAdmin || (u.role !== 'system_admin' && !isCurrent);

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #eef2ee' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#172e25' }}>
                        {u.name} {isCurrent && <span style={{ fontSize: '11px', color: '#267153', fontWeight: 500 }}>(You)</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#66786d' }}>{u.email}</div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '5px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          background:
                            u.role === 'system_admin'
                              ? '#f3e8ff'
                              : u.role === 'municipality_admin'
                              ? '#e0f2fe'
                              : u.role === 'ward_officer'
                              ? '#eef5f1'
                              : '#f4f4f5',
                          color:
                            u.role === 'system_admin'
                              ? '#6b21a8'
                              : u.role === 'municipality_admin'
                              ? '#0369a1'
                              : u.role === 'ward_officer'
                              ? '#123D30'
                              : '#52525b',
                        }}
                      >
                        {u.role?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '12.5px', color: '#172e25' }}>
                        {u.municipality?.name || (u.municipality_id ? `Muni #${u.municipality_id}` : 'Global (All)')}
                      </div>
                      {u.ward_number ? (
                        <div style={{ fontSize: '11.5px', color: '#267153', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={11} /> Ward {u.ward_number}
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#88988e' }}>Unassigned to specific ward</div>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: u.is_active ? '#1b7340' : '#a83228',
                        }}
                      >
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: u.is_active ? '#1b7340' : '#a83228',
                          }}
                        />
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {canEditRole && (
                          <button
                            type="button"
                            onClick={() => {
                              setWardModalUser(u);
                              setSelectedWard(u.ward_number || 1);
                            }}
                            title="Assign to specific ward"
                            style={{
                              padding: '5px 9px',
                              background: '#f7f7f3',
                              border: '1px solid #d9e3db',
                              borderRadius: '5px',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            Assign Ward
                          </button>
                        )}

                        {canEditRole && (
                          <button
                            type="button"
                            onClick={() => {
                              setRoleModalUser(u);
                              setSelectedRole(u.role);
                            }}
                            title="Modify user role"
                            style={{
                              padding: '5px 9px',
                              background: '#f7f7f3',
                              border: '1px solid #d9e3db',
                              borderRadius: '5px',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            Role
                          </button>
                        )}

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            title={u.is_active ? 'Deactivate account' : 'Reactivate account'}
                            style={{
                              padding: '5px 9px',
                              background: u.is_active ? '#fdf3f2' : '#eef8f2',
                              border: `1px solid ${u.is_active ? '#f2c7c4' : '#c4e8d1'}`,
                              color: u.is_active ? '#a83228' : '#1b7340',
                              borderRadius: '5px',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Ward Assignment Modal */}
      {wardModalUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(18, 61, 48, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              border: '1px solid #d9e3db',
              boxShadow: '0 12px 30px rgba(18, 61, 48, 0.18)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ fontSize: '15px', color: '#172e25' }}>Assign Ward Officer</strong>
              <button
                type="button"
                onClick={() => setWardModalUser(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#66786d' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: '#66786d', margin: '0 0 16px 0' }}>
              Assign <strong>{wardModalUser.name}</strong> to manage infrastructure verification and issue resolution in a specific ward.
            </p>

            <form onSubmit={handleAssignWard} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172e25', marginBottom: '6px' }}>
                  Select Ward (Municipality: {activeMunicipality?.name || 'Local'})
                </label>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #d9e3db',
                    borderRadius: '7px',
                    fontSize: '13px',
                    background: '#ffffff',
                  }}
                >
                  {availableWards.map((w) => (
                    <option key={w} value={w}>
                      Ward {w}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setWardModalUser(null)}
                  style={{
                    padding: '8px 14px',
                    background: '#f7f7f3',
                    border: '1px solid #d9e3db',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '8px 16px',
                    background: '#123D30',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {actionLoading ? 'Saving...' : 'Confirm Ward Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {roleModalUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(18, 61, 48, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              border: '1px solid #d9e3db',
              boxShadow: '0 12px 30px rgba(18, 61, 48, 0.18)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ fontSize: '15px', color: '#172e25' }}>Modify User Role</strong>
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#66786d' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: '#66786d', margin: '0 0 16px 0' }}>
              Update access level for <strong>{roleModalUser.name}</strong>.
            </p>

            <form onSubmit={handleChangeRole} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172e25', marginBottom: '6px' }}>
                  Assign Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #d9e3db',
                    borderRadius: '7px',
                    fontSize: '13px',
                    background: '#ffffff',
                  }}
                >
                  {isSystemAdmin && (
                    <option value="system_admin">System Administrator (Global)</option>
                  )}
                  <option value="municipality_admin">Municipality Administrator</option>
                  <option value="ward_officer">Ward Technical Officer</option>
                  <option value="citizen">Citizen Resident</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRoleModalUser(null)}
                  style={{
                    padding: '8px 14px',
                    background: '#f7f7f3',
                    border: '1px solid #d9e3db',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '8px 16px',
                    background: '#123D30',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {actionLoading ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
