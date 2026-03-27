import React, { useEffect } from 'react';
import { FaEnvelope, FaTimes, FaCheckCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

/**
 * Toast Notification Component
 * Displays responsive popup notifications at the top of the page
 */
export default function Toast({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose, 
  positionX = 'right',
  count = null,
  show = true
}) {
  useEffect(() => {
    if ((!message && !count) || !show) return;

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, count, duration, onClose, show]);

  if ((!message && !count) || !show) return null;

  const icons = {
    success: <FaCheckCircle className="w-3 h-3" />,
    error: <FaExclamationTriangle className="w-3 h-3" />,
    info: <FaInfoCircle className="w-3 h-3" />,
    message: <FaEnvelope className="w-3 h-3" />,
  };

  const colors = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      text: 'text-green-800'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      text: 'text-red-800'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-800'
    },
    message: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      text: 'text-yellow-800'
    },
    gold: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-400',
      icon: 'text-yellow-700',
      text: 'text-yellow-900'
    }
  };

  const style = colors[type] || colors.info;
  const positionClass = positionX === 'left' ? 'left-4' : 'right-4';

  return (
    <div
      className={`fixed top-28 ${positionClass} z-50 max-w-xs w-fit 
        ${style.bg} border ${style.border} rounded-lg shadow-lg p-1 px-2
        animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <div className="flex items-center gap-1">
        <div className={`flex-shrink-0 ${style.icon}`}>
          {icons[type] || icons.info}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`${style.text} font-semibold text-xs truncate`}>
            {count ? `${count} New ${count === 1 ? 'Message' : 'Messages'}` : message}
          </div>
          {!count && message && (
            <p className={`${style.text} text-xs`}>
              {message}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${style.icon} hover:opacity-70 transition-opacity`}
        >
          <FaTimes className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
