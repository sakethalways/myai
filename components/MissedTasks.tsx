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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="bg-red-100 p-2 md:p-3 rounded-2xl text-red-600">
                <AlertTriangle size={24} />
            </div>
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Missed Protocol</h2>
                <p className="text-slate-500 text-sm md:text-base">Analysis of unexecuted tasks from previous cycles.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Left: Risk Chart & Stats */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Total Missed Tasks</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-red-600">{totalMissed}</span>
                        <span className="text-xs text-red-400">cumulative</span>
                    </div>
                </div>
                <MissedTaskRiskChart history={history} />
            </div>

            {/* Right: The List */}
            <div className="lg:col-span-2 space-y-6">
                {missedEntries.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-emerald-200 shadow-sm">
                        <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Zero Missed Tasks</h3>
                        <p className="text-emerald-600/80">Outstanding consistency. You have cleared all past protocols.</p>
                    </div>
                ) : (
                    <>
                        {missedEntries.map(entry => (
                            <div key={entry.date} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition hover:shadow-md">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg text-red-500 border border-red-100 shadow-sm">
                                            <CalendarX size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-700">{entry.date}</h3>
                                        </div>
                                        <span className="text-xs font-mono bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 ml-2">
                                            {entry.todos.length} Missed
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            confirmAction(`Are you sure you want to clear all ${entry.todos.length} missed tasks for ${entry.date}?`, () => {
                                                onClearDay(entry.date);
                                            });
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition self-start md:self-auto"
                                    >
                                        <Trash2 size={14} /> Clear Day
                                    </button>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {entry.todos.map(todo => (
                                        <div key={todo.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition">
                                            <span className="text-slate-600 text-sm font-medium">{todo.text}</span>
                                            <button 
                                                onClick={() => {
                                                    confirmAction("Remove this missed task record?", () => {
                                                        onDeleteTask(entry.date, todo.id);
                                                    });
                                                }}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
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
