import { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfileSettingsPage({ onNavigate }) {
  const { user, role, activeMunicipality, updateProfile, changePassword } = useAuth();

  // Profile fields state
  const [name, setName] = useState(user?.name || '');
  const [contactNumber, setContactNumber] = useState(user?.contact_number || '');
  const [language, setLanguage] = useState(user?.preferred_language || 'en');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    const res = await updateProfile({
      name,
      contact_number: contactNumber,
      preferred_language: language,
    });

    setSavingProfile(false);
    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } else {
      setProfileMsg({ type: 'error', text: res.message || 'Failed to update profile.' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setChangingPassword(true);
    setPasswordMsg(null);

    const res = await changePassword(currentPassword, newPassword, confirmPassword);
    setChangingPassword(false);

    if (res.success) {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully. Use your new password on your next login.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMsg({ type: 'error', text: res.message || 'Failed to update password.' });
    }
  };

  const getRoleDisplayName = (r) => {
    switch (r) {
      case 'system_admin':
        return 'System Administrator (National / Multi-Municipality)';
      case 'municipality_admin':
        return 'Municipality Administrator (Executive)';
      case 'ward_officer':
        return `Ward Technical Officer (Ward ${user?.ward_number || 1})`;
      default:
        return 'Citizen Resident';
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gap: '24px' }}>
      {/* Top Banner */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #d9e3db',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#123D30',
            color: '#ffffff',
            display: 'grid',
            placeItems: 'center',
            fontSize: '22px',
            fontWeight: 700,
          }}
        >
          {user?.name?.slice(0, 2).toUpperCase() || 'GP'}
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', color: '#172e25', fontWeight: 700 }}>
            {user?.name || 'Municipal Officer'}
          </h1>
          <p style={{ margin: '4px 0 8px 0', fontSize: '13px', color: '#66786d' }}>
            {user?.email || 'officer@gaunpulse.gov.np'}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                background: '#eef5f1',
                color: '#123D30',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={13} />
              {getRoleDisplayName(role)}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                background: '#f7f7f3',
                border: '1px solid #e4e8e4',
                color: '#415549',
                borderRadius: '6px',
                fontSize: '11.5px',
              }}
            >
              <Building2 size={13} />
              {activeMunicipality?.name || 'No municipality assigned'}
              {user?.ward_number ? ` · Ward ${user.ward_number}` : ''}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Profile Settings Card */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #d9e3db',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <h2 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: '#172e25', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={18} color="#267153" />
            Account & Profile Settings
          </h2>

          {profileMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                marginBottom: '16px',
                background: profileMsg.type === 'success' ? '#eef8f2' : '#fdf3f2',
                color: profileMsg.type === 'success' ? '#1b7340' : '#a83228',
                border: `1px solid ${profileMsg.type === 'success' ? '#c4e8d1' : '#f2c7c4'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {profileMsg.type === 'success' && <CheckCircle2 size={15} />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172e25', marginBottom: '5px' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #d9e3db',
                  borderRadius: '7px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172e25', marginBottom: '5px' }}>
                Email Address (Immutable)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #e4e8e4',
                  borderRadius: '7px',
                  fontSize: '13px',
                  background: '#f7f7f3',
                  color: '#66786d',
                  cursor: 'not-allowed',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172e25', marginBottom: '5px' }}>
                Official Contact Number
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+977 98XXXXXXXX"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #d9e3db',
                  borderRadius: '7px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172e25', marginBottom: '5px' }}>
                Preferred Platform Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #d9e3db',
                  borderRadius: '7px',
                  fontSize: '13px',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                }}
              >
                <option value="en">English (Official Operations)</option>
                <option value="ne">नेपाली (Nepali)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              style={{
                marginTop: '8px',
                padding: '10px 16px',
                background: '#123D30',
                color: '#ffffff',
                border: 'none',
                borderRadius: '7px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: savingProfile ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!savingProfile) e.currentTarget.style.background = '#236A50';
              }}
              onMouseLeave={(e) => {
                if (!savingProfile) e.currentTarget.style.background = '#123D30';
              }}
            >
              <Save size={14} />
              <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #d9e3db',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <h2 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: '#172e25', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={18} color="#267153" />
            Security & Password Change
          </h2>

          {passwordMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                marginBottom: '16px',
                background: passwordMsg.type === 'success' ? '#eef8f2' : '#fdf3f2',
                color: passwordMsg.type === 'success' ? '#1b7340' : '#a83228',
                border: `1px solid ${passwordMsg.type === 'success' ? '#c4e8d1' : '#f2c7c4'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {passwordMsg.type === 'success' && <CheckCircle2 size={15} />}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172e25', marginBottom: '5px' }}>
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #d9e3db',
                  borderRadius: '7px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172e25', marginBottom: '5px' }}>
                New Password (Minimum 8 characters)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #d9e3db',
                  borderRadius: '7px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172e25', marginBottom: '5px' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #d9e3db',
                  borderRadius: '7px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              style={{
                marginTop: '8px',
                padding: '10px 16px',
                background: '#123D30',
                color: '#ffffff',
                border: 'none',
                borderRadius: '7px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: changingPassword ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!changingPassword) e.currentTarget.style.background = '#236A50';
              }}
              onMouseLeave={(e) => {
                if (!changingPassword) e.currentTarget.style.background = '#123D30';
              }}
            >
              <Lock size={14} />
              <span>{changingPassword ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
