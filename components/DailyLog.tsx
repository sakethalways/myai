import React, { useState, useEffect } from 'react';
import { DailyEntry, Todo, Goal } from '../types';
import { Plus, Trash2, CheckCircle, Circle, Save, Briefcase, Calendar, History, Clock, FileText, RotateCw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../services/storageService'; 

interface DailyLogProps {
  date: string;
  entry: DailyEntry;
  goals: Goal[];
  onSave: (entry: DailyEntry) => void;
  onDeleteEntry: (date: string) => void;
  history: Record<string, DailyEntry>;
  onChangeDate: (date: string) => void;
  confirmAction: (message: string, onConfirm: () => void) => void;
}

const DailyLog: React.FC<DailyLogProps> = ({ date, entry, goals, onSave, onDeleteEntry, history, onChangeDate, confirmAction }) => {
  // Initialize state with safety checks
  const [todos, setTodos] = useState<Todo[]>(entry.todos || []);
  const [journal, setJournal] = useState(entry.journal || '');
  const [newTodoText, setNewTodoText] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [repeatDaily, setRepeatDaily] = useState(entry.repeatDaily || false);
  const [isTogglingRepeat, setIsTogglingRepeat] = useState(false);
  const [repeatNotification, setRepeatNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Sync state when entry prop changes
  useEffect(() => {
    setTodos(entry.todos || []);
    setJournal(entry.journal || '');
    setRepeatDaily(entry.repeatDaily || false);
  }, [entry]);

  // Auto-dismiss notification after 3 seconds
  useEffect(() => {
    if (repeatNotification) {
      const timer = setTimeout(() => {
        setRepeatNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [repeatNotification]);

  // Load yesterday's repeat tasks on component mount if today's entry is new
  useEffect(() => {
    const loadRepeatTasks = async () => {
      if (todos.length === 0) { // Only if entry is empty
        const repeatTasks = await db.getYesterdayRepeatTasks();
        if (repeatTasks && repeatTasks.length > 0) {
          setTodos(repeatTasks);
        }
      }
    };
    
    loadRepeatTasks();
  }, [date]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const newTodo: Todo = {
      id: uuidv4(),
      text: newTodoText,
      completed: false,
      linkedGoalId: selectedGoalId || undefined
    };

    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);
    setNewTodoText('');
    // Auto-save todos immediately as they are "action items"
    saveData(updatedTodos, journal);
  };

  const toggleTodo = (id: string) => {
    const updatedTodos = todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTodos(updatedTodos);
    saveData(updatedTodos, journal);
  };

  const deleteTodo = (id: string) => {
    confirmAction("Do you really want to remove this task from your log?", () => {
        const updatedTodos = todos.filter(t => t.id !== id);
        setTodos(updatedTodos);
        saveData(updatedTodos, journal);
    });
  };

  const saveData = (currentTodos: Todo[], currentJournal: string) => {
    setIsSaving(true);
    const completedCount = currentTodos.filter(t => t.completed).length;
    onSave({
      ...entry,
      todos: currentTodos,
      journal: currentJournal,
      completedCount,
      totalCount: currentTodos.length,
      repeatDaily
    });
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleToggleRepeatDaily = async () => {
    setIsTogglingRepeat(true);
    try {
      const newRepeatStatus = !repeatDaily;
      const success = await db.updateRepeatDaily(date, newRepeatStatus);
      if (success) {
        setRepeatDaily(newRepeatStatus);
        // Show notification
        const message = newRepeatStatus
          ? '✅ Repeat enabled! Same tasks will appear tomorrow'
          : '⏹️ Repeat disabled! Tasks won\'t repeat anymore';
        setRepeatNotification({
          message,
          type: 'success'
        });
        // DON'T call onSave here - it triggers duplicate notifications
        // The repeat_daily flag is updated directly in database
      } else {
        setRepeatNotification({
          message: '❌ Failed to update repeat status',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Failed to toggle repeat daily:', error);
      setRepeatNotification({
        message: '❌ Error updating repeat status',
        type: 'error'
      });
    } finally {
      setIsTogglingRepeat(false);
    }
  };

  const handleManualSave = () => {
    saveData(todos, journal);
  };

  const handleMainDelete = () => {
      confirmAction(`Are you sure you want to delete this entire entry for ${date}? This cannot be undone.`, () => {
          onDeleteEntry(date);
      });
  };

  const activeGoals = goals.filter(g => !g.completed);
  const sortedHistoryDates = Object.keys(history).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="flex flex-col xl:flex-row gap-4 md:gap-8 h-full bg-white dark:bg-slate-900">
      
      {/* Repeat Notification Toast */}
      {repeatNotification && (
        <div className={`fixed top-4 right-4 left-4 md:left-auto md:top-6 md:right-6 px-4 py-3 rounded-lg font-bold text-sm shadow-lg animate-in slide-in-from-top-4 z-50 ${
          repeatNotification.type === 'success'
            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700'
            : 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
        }`}>
          {repeatNotification.message}
        </div>
      )}

      {/* LEFT: Task & Journal Area */}
        <div className="flex-1 flex flex-col gap-4 md:gap-6 overflow-hidden">
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
           <div className="flex items-center gap-2 md:gap-4">
             <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg text-indigo-600 dark:text-indigo-300">
               <Calendar size={20} />
             </div>
             <div>
               <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">{date}</h2>
               <p className="text-xs text-slate-500 dark:text-slate-400">Daily Log & Protocol</p>
             </div>
           </div>
           <div className="flex items-center gap-2 md:gap-3">
            {isSaving && <span className="text-xs text-indigo-500 dark:text-indigo-300 font-medium animate-pulse">Saving...</span>}
            <button
              onClick={handleMainDelete}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition"
              title="Delete this entire day's record"
            >
              <Trash2 size={18} />
            </button>
           </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-10">
            {/* Todo Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
                <h3 className="font-bold text-slate-700 dark:text-slate-100 flex items-center gap-2">
                  <CheckCircle size={16} className="text-indigo-500 dark:text-indigo-300" /> Daily Protocol
                </h3>
                <div className="flex items-center gap-2 sm:gap-3 ml-auto overflow-x-auto">
                  <span className="text-xs font-mono bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded whitespace-nowrap flex-shrink-0">
                    {todos.filter(t => t.completed).length} / {todos.length} Done
                  </span>
                  {/* Repeat Daily Toggle Button */}
                  <button
                    onClick={handleToggleRepeatDaily}
                    disabled={isTogglingRepeat}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-xs sm:text-sm transition whitespace-nowrap flex-shrink-0 ${
                      repeatDaily
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-800'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={repeatDaily ? 'Tasks will repeat daily' : 'Click to repeat daily'}
                  >
                    {isTogglingRepeat ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <RotateCw size={14} />
                    )}
                    <span>{repeatDaily ? 'Repeat ON' : 'Repeat OFF'}</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleAddTodo} className="mb-6 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTodoText}
                      onChange={(e) => setNewTodoText(e.target.value)}
                      placeholder="Add new task..."
                      className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button type="submit" className="bg-indigo-600 dark:bg-indigo-700 text-white p-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-800 transition shadow-md shadow-indigo-200 dark:shadow-none">
                      <Plus size={20} />
                    </button>
                  </div>
                  <select 
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 outline-none cursor-pointer"
                  >
                    <option value="">-- Align with Goal (Optional) --</option>
                    {activeGoals.map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </form>

                <div className="space-y-2">
                  {todos.length === 0 && <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-4 italic">No tasks set for today.</p>}
                  {todos.map(todo => (
                    <div key={todo.id} className="group flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-700 bg-white dark:bg-slate-900 transition shadow-sm hover:shadow-md">
                      <button onClick={() => toggleTodo(todo.id)} className="text-slate-300 dark:text-slate-600 hover:text-green-500 dark:hover:text-green-400 transition">
                        {todo.completed ? <CheckCircle className="text-green-500 dark:text-green-400 w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}> 
                        {todo.text}
                      </span>
                      {todo.linkedGoalId && (
                        <span title="Linked to Goal">
                          <Briefcase size={12} className="text-indigo-400 dark:text-indigo-300" />
                        </span>
                      )}
                      <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-300 transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                    </div>
                </div>
            </div>

            {/* Journal Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[300px] md:h-[350px]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 dark:text-slate-100 flex items-center gap-2">
                        <FileText size={16} className="text-pink-500" /> Neural Journal
                    </h3>
                    <button 
                        onClick={handleManualSave}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-md shadow-indigo-200 ${
                            isSaving 
                                ? 'bg-slate-400 text-slate-200 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                    >
                        <Save size={14} /> {isSaving ? 'Saving...' : 'Save Entry'}
                    </button>
                </div>
                <div className="flex-1 p-2 overflow-hidden">
                    <textarea
                        value={journal}
                        onChange={(e) => setJournal(e.target.value)}
                        placeholder="Record your thoughts, analysis, and observations here... (Remember to save!)"
                        className="w-full h-full p-4 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none outline-none text-base leading-relaxed overflow-y-auto"
                    ></textarea>
                </div>
            </div>
          </div>
      </div>

      {/* RIGHT: Archives Sidebar */}
      <div className="w-full xl:w-72 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-full max-h-[calc(100vh-120px)] flex flex-col">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center gap-2 sticky top-0">
                  <History size={16} className="text-slate-500 dark:text-slate-400" />
                  <h3 className="font-bold text-slate-700 dark:text-slate-100 text-sm uppercase tracking-wide">Recorded Archives</h3>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                  {sortedHistoryDates.length === 0 && (
                      <div className="text-center p-8 text-xs text-slate-400 dark:text-slate-500 italic">
                          No history recorded yet.<br/>Start tracking today!
                      </div>
                  )}
                  {sortedHistoryDates.map(d => (
                      <div 
                        key={d}
                        className={`w-full rounded-lg text-sm font-medium transition flex justify-between items-center group pr-2 select-none cursor-pointer ${
                            d === date ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-700 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent'
                        }`}
                        onClick={() => onChangeDate(d)}
                      >
                        <div className={`flex-1 px-4 py-3 flex items-center gap-2 ${d === date ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                              <Clock size={12} className={d === date ? 'text-indigo-400 dark:text-indigo-300' : 'text-slate-300 dark:text-slate-600'} />
                              {d}
                              {history[d].journal && <div className="w-1.5 h-1.5 rounded-full bg-pink-400 dark:bg-pink-500 shadow-[0_0_5px_rgba(244,114,182,0.5)] dark:shadow-[0_0_5px_rgba(236,72,153,0.5)]"></div>}
                        </div>
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                confirmAction(`Are you sure you want to delete the archive for ${d}?`, () => {
                                    onDeleteEntry(d); 
                                });
                            }}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition"
                            title="Delete Record"
                            type="button"
                        >
                            <Trash2 size={16} />
                        </button>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default DailyLog;
