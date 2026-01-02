import React from 'react';
import { DailyEntry, AppData } from '../types';
import { MissedTaskRiskChart } from './Charts';
import { AlertTriangle, Trash2, CalendarX, CheckCircle2 } from 'lucide-react';

interface MissedTasksProps {
  history: Record<string, DailyEntry>;
  onDeleteTask: (date: string, todoId: string) => void;
  onClearDay: (date: string) => void;
  confirmAction: (message: string, onConfirm: () => void) => void;
}

export const MissedTasks: React.FC<MissedTasksProps> = ({ history, onDeleteTask, onClearDay, confirmAction }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Calculate missed tasks: Dates strictly before today with uncompleted todos
  const missedEntries = Object.keys(history)
    .filter(date => date < todayStr)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map(date => {
        const entry = history[date];
        const missedTodos = entry.todos ? entry.todos.filter(t => !t.completed) : [];
        return {
            date,
            todos: missedTodos
        };
    })
    .filter(entry => entry.todos.length > 0);

  const totalMissed = missedEntries.reduce((acc, curr) => acc + curr.todos.length, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6 md:space-y-8 animate-in fade-in duration-500 bg-slate-50 dark:bg-slate-900 -mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-start sm:items-center gap-2 sm:gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="bg-red-100 dark:bg-red-900/30 p-1.5 sm:p-2 md:p-3 rounded-2xl text-red-600 dark:text-red-400 flex-shrink-0">
                <AlertTriangle size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">Missed Protocol</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm md:text-base">Analysis of unexecuted tasks from previous cycles.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {/* Left: Risk Chart & Stats */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Total Missed Tasks</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-extrabold text-red-600 dark:text-red-400">{totalMissed}</span>
                        <span className="text-[10px] sm:text-xs text-red-400 dark:text-red-500">cumulative</span>
                    </div>
                </div>
                <MissedTaskRiskChart history={history} />
            </div>

            {/* Right: The List */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-5 md:space-y-6">
                {missedEntries.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 md:p-12 text-center border border-dashed border-emerald-200 dark:border-emerald-900/50 shadow-sm">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={32} className="sm:w-10 sm:h-10" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Zero Missed Tasks</h3>
                        <p className="text-xs sm:text-sm md:text-base text-emerald-600 dark:text-emerald-400/80">Outstanding consistency. You have cleared all past protocols.</p>
                    </div>
                ) : (
                    <>
                        {missedEntries.map(entry => (
                            <div key={entry.date} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition hover:shadow-md">
                                {/* Fixed header with proper mobile button sizing */}
                                <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                        <div className="bg-white dark:bg-slate-800 p-1.5 sm:p-2 rounded-lg text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/50 shadow-sm flex-shrink-0">
                                            <CalendarX size={16} className="sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-700 dark:text-slate-100 text-sm sm:text-base truncate">{entry.date}</h3>
                                        </div>
                                        <span className="text-[10px] sm:text-xs font-mono bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/50 flex-shrink-0">
                                            {entry.todos.length} Missed
                                        </span>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => {
                                                confirmAction(`Are you sure you want to clear all ${entry.todos.length} missed tasks for ${entry.date}?`, () => {
                                                    onClearDay(entry.date);
                                                });
                                            }}
                                            className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-600 dark:hover:bg-red-900/40 hover:text-white dark:hover:text-red-200 transition w-full sm:w-auto"
                                        >
                                            <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                            <span>Clear Day</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-50 dark:divide-slate-700">
                                    {entry.todos.map(todo => (
                                        <div key={todo.id} className="p-3 sm:p-4 flex items-center justify-between gap-2 group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                            <span className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium flex-1 min-w-0 break-words">{todo.text}</span>
                                            <button 
                                                onClick={() => {
                                                    confirmAction("Remove this missed task record?", () => {
                                                        onDeleteTask(entry.date, todo.id);
                                                    });
                                                }}
                                                className="h-8 w-8 flex items-center justify-center text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                title="Dismiss/Delete from record"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    </div>
  );
};