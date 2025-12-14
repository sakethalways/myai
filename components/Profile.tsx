import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Save, User, AlertTriangle, Trash2 } from 'lucide-react';

interface ProfileProps {
  profile: UserProfile;
  onSave: (p: UserProfile) => void;
  onResetData: () => void;
  confirmAction: (message: string, onConfirm: () => void) => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, onSave, onResetData, confirmAction }) => {
  const [form, setForm] = useState<UserProfile>(profile);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(form);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
      confirmAction("WARNING: You are about to erase ALL data. This includes all journals, goals, history, and profile settings. This action is PERMANENT and cannot be undone.", () => {
          onResetData();
      });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8 bg-slate-50 dark:bg-slate-900 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
        {/* Profile Form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-8">
        <div className="flex items-center gap-3 mb-6 md:mb-8 text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg text-indigo-600 dark:text-indigo-300">
                <User className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold">Identity Configuration</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Full Designation (Name)</label>
            <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                placeholder="Enter your name"
            />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Age (Years)</label>
                <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-indigo-500 dark:focus:border-indigo-600 outline-none transition"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Height (cm)</label>
                <input
                type="number"
                name="height"
                value={form.height}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-indigo-500 dark:focus:border-indigo-600 outline-none transition"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Weight (kg)</label>
                <input
                type="number"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-indigo-500 dark:focus:border-indigo-600 outline-none transition"
                />
            </div>
            </div>

            <div className="flex justify-end pt-6">
            <button
                type="submit"
                disabled={!isDirty || isSaving}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition shadow-lg ${
                (!isDirty || isSaving)
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                }`}
            >
                <Save className="w-5 h-5" />
                {isSaving ? 'Saving...' : 'Save Profile Data'}
            </button>
            </div>
        </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl shadow-sm border border-red-100 dark:border-red-800/50 p-8">
            <div className="flex items-center gap-3 mb-4 text-red-800 dark:text-red-300">
                <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-lg text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Danger Zone</h3>
            </div>
            <p className="text-red-600/80 dark:text-red-300/70 mb-6 text-sm">
                Resetting the application will permanently delete all your tracked data, including journals, goals, history, and profile settings. This action cannot be undone.
            </p>
            <div className="flex justify-end">
                <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-600 dark:hover:bg-red-600 hover:text-white dark:hover:text-white transition shadow-sm hover:shadow-red-200 dark:hover:shadow-red-900/50"
                >
                    <Trash2 size={18} />
                    Reset All Data
                </button>
            </div>
        </div>
    </div>
  );
};

export default Profile;
