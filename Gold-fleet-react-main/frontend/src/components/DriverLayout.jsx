import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { FaSignOutAlt, FaClipboardCheck, FaHome, FaEnvelope } from 'react-icons/fa';

export default function DriverLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Ensure only drivers can access this layout
  useEffect(() => {
    if (user && user.role !== 'driver') {
      navigate('/main', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen w-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-yellow-600">Gold Fleet</span>
            </div>
            {/* Navigation Links */}
            <nav className="hidden md:flex gap-6 ml-8">
              <button
                onClick={() => navigate('/driver/dashboard')}
                className="flex items-center gap-2 text-gray-700 hover:text-yellow-600 font-medium transition"
              >
                <FaHome /> Dashboard
              </button>
              <button
                onClick={() => navigate('/driver/maintenance')}
                className="flex items-center gap-2 text-gray-700 hover:text-yellow-600 font-medium transition"
              >
                <FaClipboardCheck /> Maintenance
              </button>
              <button
                onClick={() => navigate('/driver/messages')}
                className="flex items-center gap-2 text-gray-700 hover:text-yellow-600 font-medium transition"
              >
                <FaEnvelope /> Messages
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}