import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-dismiss after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-lg p-4 max-w-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 dark:bg-emerald-900 p-2 rounded-full text-emerald-600 dark:text-emerald-300">
            <CheckCircle size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-400 dark:text-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-200 transition"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
