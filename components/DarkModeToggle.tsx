import React from 'react';
import { Moon, Sun } from 'lucide-react';

export default function DarkModeToggle({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (v: boolean) => void }) {
  return (
    <button
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-full p-2 transition bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-yellow-300"
      onClick={() => setDarkMode(!darkMode)}
      style={{ outline: 'none', border: 'none' }}
    >
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
