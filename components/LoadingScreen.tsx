import React from 'react';
import { BrainCircuit } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flex flex-col items-center gap-8 px-4">
        {/* Logo with Animation */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
            <BrainCircuit size={48} className="text-white sm:block" />
          </div>
          
          {/* Animated rings */}
          <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 border-r-violet-500 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
          <div className="absolute -inset-4 border-2 border-transparent border-b-indigo-400 border-l-violet-400 rounded-full animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}></div>
        </div>

        {/* Text Content */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            NeuroTrack
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm sm:text-base">Loading your dashboard...</p>
        </div>

        {/* Loading Dots */}
        <div className="flex gap-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>

        {/* Loading percentage (optional) */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Syncing your data...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
