import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChartLine, FaBuilding, FaCreditCard, FaChartBar, FaEnvelope, FaCog, FaChevronLeft } from 'react-icons/fa';

/**
 * Platform Sidebar - Modern Gold & White Theme
 * Professional navigation for Platform Owner
 * Color scheme: Gold (#FFD700) and White (#FFFFFF)
 */
export default function PlatformSidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed, isLarge }) {
  const location = useLocation();

  const navigationItems = [
    { label: 'Dashboard', path: '/platform/dashboard', icon: FaChartLine },
    { label: 'Companies', path: '/platform/companies', icon: FaBuilding },
    { label: 'Subscriptions', path: '/platform/subscriptions', icon: FaCreditCard },
    { label: 'Payments', path: '/platform/payments', icon: FaCreditCard },
    { label: 'Analytics', path: '/platform/analytics', icon: FaChartBar },
    { label: 'Settings', path: '/platform/settings', icon: FaCog },
  ];

  const isActive = (path) => location.pathname === path;

  const SIDEBAR_EXPANDED = 260;
  const SIDEBAR_COLLAPSED = 80;

  const sidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <>
      {/* Overlay on mobile when sidebar is open */}
      {!isLarge && isOpen && (
        <div
          className="fixed inset-0 top-[60px] bg-black/40 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-300 overflow-y-auto overflow-x-hidden flex flex-col h-[calc(100vh-60px)] ${
          !isLarge ? (isOpen ? 'fixed left-0 top-[60px] w-64 z-40' : 'fixed -left-64 top-[60px] z-40') : 'relative'
        }`}
        style={{
          width: isLarge ? `${sidebarWidth}px` : undefined,
          transition: 'width 0.3s ease-in-out',
        }}
      >
        {/* Logo/Header Section with Toggle Button */}
        <div className="h-16 px-3 border-b border-gray-300 bg-white flex items-center justify-between gap-2 flex-shrink-0">
          {!isCollapsed && (
            <Link to="/platform/dashboard" className="flex items-center gap-2 font-bold text-sm hover:opacity-80 transition-opacity flex-1 min-w-0">
              <img src="/icons/result.png" alt="Logo" className="w-8 h-8 object-contain flex-shrink-0" />
              <span className="text-gray-800 truncate text-sm">Platform</span>
            </Link>
          )}
          {isCollapsed && (
            <Link to="/platform/dashboard" className="w-10 h-10 flex items-center justify-center font-bold text-xs hover:opacity-80 transition-opacity flex-1 flex-shrink-0">
              <img src="/icons/result.png" alt="Logo" className="w-8 h-8 object-contain" />
            </Link>
          )}

          {/* Collapse Toggle Button - Always visible on desktop */}
          {isLarge && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all flex-shrink-0"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <FaChevronLeft
                className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-xs font-semibold whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-sm hover:shadow-md'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Info Section */}
        {!isCollapsed && (
          <div className="px-3 py-3 border-t border-gray-300 bg-gray-50 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Version</p>
            <p className="text-xs font-bold text-gray-800 mt-0.5">1.0.0</p>
          </div>
        )}
      </aside>
    </>
  );
}

