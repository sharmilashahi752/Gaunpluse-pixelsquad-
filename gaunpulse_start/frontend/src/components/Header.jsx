import { Bell, ChevronDown, Menu, Search } from 'lucide-react';

export default function Header({ title, onMenuClick }) {
  return (
    <header className="topbar">
      <div className="topbar__title">
        <button className="icon-button menu-button" type="button" onClick={onMenuClick} aria-label="Open navigation menu">
          <Menu size={21} />
        </button>
        <div>
          <span>Namuna Rural Municipality · Nepal</span>
          <strong>{title}</strong>
        </div>
      </div>

      <div className="topbar__actions">
        <label className="header-search">
          <span className="sr-only">Search demo workspace</span>
          <Search size={17} aria-hidden="true" />
          <input type="search" placeholder="Search workspace" />
        </label>
        <button className="icon-button notification-button" type="button" aria-label="Notifications, 3 unread">
          <Bell size={19} />
          <span aria-hidden="true">3</span>
        </button>
        <button className="profile-button" type="button" aria-label="Open profile menu">
          <span className="profile-button__avatar" aria-hidden="true">AS</span>
          <span className="profile-button__copy">
            <strong>Asha Shrestha</strong>
            <small>Municipal Planner</small>
          </span>
          <ChevronDown size={15} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
