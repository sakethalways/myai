import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700">
        <div className="bg-red-50 dark:bg-red-900/20 p-8 flex flex-col items-center text-center">
            <div className="bg-red-100 dark:bg-red-900/40 p-4 rounded-full text-red-600 dark:text-red-400 mb-5 shadow-sm border border-red-200 dark:border-red-900/50">
                <AlertTriangle size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Are you sure?</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-700 border-t border-slate-200 dark:border-slate-700">
            <button 
                onClick={onCancel}
                className="bg-white dark:bg-slate-800 p-4 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition active:bg-slate-100 dark:active:bg-slate-600 text-sm uppercase tracking-wide"
            >
                Cancel
            </button>
            <button 
                onClick={() => { onConfirm(); onCancel(); }}
                className="bg-white dark:bg-slate-800 p-4 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/30 transition active:bg-red-100 dark:active:bg-red-900/50 text-sm uppercase tracking-wide"
            >
                Yes, Delete
            </button>
        </div>
      </div>
    </div>
  );
};
