import React from 'react';
import { User, Phone, MapPin, Mail, ShieldCheck } from 'lucide-react';

export default function ProfilePage({ user, onLogout }) {
  if (!user) return null;

  return (
    <div className="citizen-page">
      <div className="citizen-page-heading">
        <div>
          <p>Citizen Identity</p>
          <h1>My Profile</h1>
          <span>Your verified citizen information registered with the GaunPulse municipal network.</span>
        </div>
      </div>

      <section className="citizen-card citizen-profile-card">
        <div className="citizen-avatar large">
          {user.name ? user.name.slice(0, 1).toUpperCase() : 'C'}
        </div>

        <div className="citizen-profile-info">
          <h2>{user.name}</h2>
          <span className="profile-badge">
            <ShieldCheck size={14} /> Verified Citizen Account
          </span>

          <div className="profile-details-grid">
            <article>
              <Mail size={16} />
              <div>
                <span>Email Address</span>
                <strong>{user.email}</strong>
              </div>
            </article>

            <article>
              <Phone size={16} />
              <div>
                <span>Contact Number</span>
                <strong>{user.contact_number || 'Not provided'}</strong>
              </div>
            </article>

            <article>
              <MapPin size={16} />
              <div>
                <span>Registered Ward</span>
                <strong>{user.ward_number ? `Ward ${user.ward_number}` : 'Dailekh District'}</strong>
              </div>
            </article>

            <article>
              <User size={16} />
              <div>
                <span>Account Role</span>
                <strong style={{ textTransform: 'capitalize' }}>{user.role || 'Citizen'}</strong>
              </div>
            </article>
          </div>

          <div className="profile-actions">
            <button type="button" className="citizen-secondary danger" onClick={onLogout}>
              Logout Citizen Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
