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
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="bg-red-50 p-8 flex flex-col items-center text-center">
            <div className="bg-red-100 p-4 rounded-full text-red-600 mb-5 shadow-sm border border-red-200">
                <AlertTriangle size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Are you sure?</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-200 border-t border-slate-200">
            <button 
                onClick={onCancel}
                className="bg-white p-4 text-slate-600 font-bold hover:bg-slate-50 transition active:bg-slate-100 text-sm uppercase tracking-wide"
            >
                Cancel
            </button>
            <button 
                onClick={() => { onConfirm(); onCancel(); }}
                className="bg-white p-4 text-red-600 font-bold hover:bg-red-50 transition active:bg-red-100 text-sm uppercase tracking-wide"
            >
                Yes, Delete
            </button>
        </div>
      </div>
    </div>
  );
};
