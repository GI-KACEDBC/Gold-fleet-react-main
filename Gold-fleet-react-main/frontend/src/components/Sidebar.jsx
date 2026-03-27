import { useLocation, Link } from 'react-router-dom';

export default function Sidebar({ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, isLarge, sidebarWidth }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const navigationSections = [
    {
      title: 'Dashboard',
      items: [
        { label: 'Main Dashboard', path: '/main' },
        { label: 'Map Dashboard', path: '/map' },
      ],
    },
    {
      title: 'Fleet Management',
      items: [
        { label: 'Vehicles', path: '/vehicles' },
        { label: 'Drivers', path: '/drivers' },
        { label: 'Trips', path: '/trips' },
      ],
    },
    {
      title: 'Maintenance Workflow',
      items: [
        { label: 'Inspections', path: '/inspections' },
        { label: 'Issues', path: '/issues' },
        { label: 'Services', path: '/services' },
      ],
    },
    {
      title: 'Financial',
      items: [
        { label: 'Expenses', path: '/expenses' },
        { label: 'Fuel Fill-ups', path: '/fuel-fillups' },
      ],
    },
    {
      title: 'Planning',
      items: [
        { label: 'Reminders', path: '/reminders' },
      ],
    },
  ];

  const getIcon = (label) => {
    const iconProps = 'w-5 h-5';

    const icons = {
      'Main Dashboard': (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" /></svg>
      ),
      'Map Dashboard': (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5-2V7l5 2 5-2 5 2v11l-5-2-5 2z" /></svg>
      ),
      'Messages': (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
      ),
      'Vehicles': (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13l1-7h16l1 7M5 13v6m14-6v6M7 19h.01M17 19h.01" /></svg>
      ),
      'Drivers': (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M12 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
      ),
      'Trips': (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" /></svg>
      ),
      'Services': (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v2m4.2 1.2l1.4 1.4M21 12h-2M17.6 18.8l1.4-1.4M12 21v-2M6.6 18.8l-1.4-1.4M3 12h2M6.6 5.2L5.2 6.6" /></svg>
      ),
      'Inspections': (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      ),
      'Issues': (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
      ),
      'Expenses': (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2M12 4v2M12 20v-2" /></svg>
      ),
      'Fuel Fill-ups': (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h2v10a2 2 0 002 2h8a2 2 0 002-2V7h2M7 7V4h10v3" /></svg>
      ),
      'Reminders': (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
      ),
    };

    return icons[label] || (
      <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
    );
  };

  // Toggle behavior: on large screens, toggle collapse/expand
  // On small screens, toggle open/close
  const handleToggle = () => {
    if (isLarge) {
      // Desktop: collapse/expand
      setSidebarCollapsed(!sidebarCollapsed);
    } else {
      // Mobile: open/close
      setSidebarOpen(!sidebarOpen);
    }
  };

  return (
    <>
      {/* Backdrop for small screens when the sidebar is open */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      <aside
        className={`fixed left-0 z-50 flex flex-col bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white top-16 ${
          isLarge ? 'translate-x-0' : sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          height: 'calc(100vh - 64px)',
          width: sidebarCollapsed ? '80px' : '260px',
          transition: 'transform 300ms ease, width 300ms ease',
          willChange: 'width'
        }}
      >
      {/* Sidebar header: user info and collapse toggle - always visible on desktop */}
      {isLarge && (
        <div className="flex items-center justify-between h-16 px-2 border-b border-white/10 bg-gradient-to-r from-gray-800 to-gray-900">
          {!sidebarCollapsed && (
            <div className="leading-snug flex items-center min-w-0 mx-2">
              {/* avatar placeholder */}
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-sm font-semibold flex-shrink-0">G</div>
              <div className="flex flex-col ml-3 min-w-0">
                <span className="font-semibold text-sm text-white truncate">Gold Fleet</span>
                <span className="text-xs text-gray-400">v1.0</span>
              </div>
            </div>
          )}

          {/* Collapse/expand toggle button */}
          <button
            onClick={handleToggle}
            className="text-gray-400 hover:text-yellow-400 transition-colors p-2 rounded-lg flex items-center justify-center flex-shrink-0"
            aria-label="Toggle sidebar"
            title={sidebarCollapsed ? "Expand" : "Collapse"}
          >
            {sidebarCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.707 15.707a1 1 0 0 0 1.414-1.414L8.414 11l3.707-3.707a1 1 0 1 0-1.414-1.414L5 10.586a1 1 0 0 0 0 1.414l5.707 5.707z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.293 8.293a1 1 0 0 1 1.414-1.414L19 11.586a1 1 0 0 1 0 1.414l-4.293 4.293a1 1 0 1 1-1.414-1.414L16.586 12l-3.293-3.293z"/>
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Mobile header with only collapse button */}
      {!isLarge && sidebarOpen && (
        <div className="flex items-center justify-between h-16 px-3 border-b border-white/10 bg-gradient-to-r from-gray-800 to-gray-900 flex-shrink-0">
          <span className="font-semibold text-white truncate text-sm flex-1">Navigation</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg flex-shrink-0 ml-2"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4 px-1">
        <ul className="space-y-1">
          {navigationSections.map((section, idx) => (
            <li key={idx}>
              <span className={`px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide block ${sidebarCollapsed ? 'hidden' : ''}`}>
                {section.title}
              </span>
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => !isLarge && setSidebarOpen(false)}
                  className={`flex items-center gap-3 ${sidebarCollapsed ? 'px-2 py-3 justify-center' : 'px-3 py-2'} rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-yellow-500/20 text-yellow-400 border-l-2 border-yellow-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="flex-shrink-0 text-gray-300">{getIcon(item.label)}</div>
                  <span className={`text-sm font-medium ${sidebarCollapsed ? 'hidden' : ''}`}>{item.label}</span>
                </Link>
              ))}
            </li>
          ))}
        </ul>
      </nav>

      {/* footer block removed as requested */}
    </aside>
    </>
  );
}
