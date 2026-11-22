import React from 'react';
import { User, Phone, MapPin, Mail, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export default function ProfilePage({ user, onLogout, lang = 'ne' }) {
  const isNe = lang === 'ne';

  if (!user) {
    return (
      <div className="citizen-page">
        <div className="citizen-page-heading">
          <div>
            <p>{isNe ? 'नागरिक पहिचान' : 'Citizen Identity'}</p>
            <h1>{isNe ? 'मेरो प्रोफाइल' : 'My Profile'}</h1>
          </div>
        </div>

        <section className="citizen-card citizen-profile-card" style={{ textAlign: 'center', padding: '36px' }}>
          <AlertCircle size={44} color="#d97706" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '18px', color: '#92400e', marginBottom: '8px' }}>
            {isNe ? 'नागरिक विवरण लोड हुन सकेन' : 'No Citizen Profile Loaded'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
            {isNe
              ? 'कृपया पुनः प्रवेश गर्नुहोस् वा पृष्ठ पुनः लोड गर्नुहोस्।'
              : 'Your verified session details could not be found. Please log in again.'}
          </p>
          <button
            type="button"
            className="citizen-primary"
            onClick={onLogout}
            style={{
              padding: '9px 18px',
              background: '#123D30',
              color: '#ffffff',
              borderRadius: '7px',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isNe ? 'लगइन पृष्ठमा जानुहोस्' : 'Return to Login'}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="citizen-page">
      <div className="citizen-page-heading">
        <div>
          <p>{isNe ? 'नागरिक पहिचान' : 'Citizen Identity'}</p>
          <h1>{isNe ? 'मेरो प्रोफाइल' : 'My Profile'}</h1>
          <span>
            {isNe
              ? 'गाउँपल्स नगरपालिका नेटवर्कमा दर्ता भएको तपाईंको प्रमाणित नागरिक विवरण।'
              : 'Your verified citizen information registered with the GaunPulse municipal network.'}
          </span>
        </div>
      </div>

      <section className="citizen-card citizen-profile-card">
        <div className="citizen-avatar large">
          {user.name ? user.name.slice(0, 1).toUpperCase() : 'C'}
        </div>

        <div className="citizen-profile-info">
          <h2>{user.name}</h2>
          <span className="profile-badge">
            <ShieldCheck size={14} /> {isNe ? 'प्रमाणित नागरिक खाता' : 'Verified Citizen Account'}
          </span>

          <div className="profile-details-grid">
            <article>
              <Mail size={16} />
              <div>
                <span>{isNe ? 'इमेल ठेगाना' : 'Email Address'}</span>
                <strong>{user.email}</strong>
              </div>
            </article>

            <article>
              <Phone size={16} />
              <div>
                <span>{isNe ? 'सम्पर्क फोन' : 'Contact Number'}</span>
                <strong>{user.contact_number || (isNe ? 'उपलब्ध छैन' : 'Not provided')}</strong>
              </div>
            </article>

            <article>
              <MapPin size={16} />
              <div>
                <span>{isNe ? 'दर्ता भएको वडा' : 'Registered Ward'}</span>
                <strong>
                  {user.ward_number ? `${isNe ? 'वडा' : 'Ward'} ${user.ward_number}` : (isNe ? 'दैलेख जिल्ला' : 'Dailekh District')}
                </strong>
              </div>
            </article>

            <article>
              <User size={16} />
              <div>
                <span>{isNe ? 'खाताको भूमिका' : 'Account Role'}</span>
                <strong style={{ textTransform: 'capitalize' }}>
                  {user.role === 'citizen' ? (isNe ? 'नागरिक (Citizen)' : 'Citizen') : user.role || 'Citizen'}
                </strong>
              </div>
            </article>
          </div>

          <div className="profile-actions">
            <button type="button" className="citizen-secondary danger" onClick={onLogout}>
              {isNe ? 'खाताबाट बाहिरिनुहोस् (Logout)' : 'Logout Citizen Account'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
