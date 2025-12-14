import React, { useState } from 'react';
import { Goal, Todo } from '../types';
import * as ai from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { Target, Calendar, CheckSquare, Trash2, Plus, ChevronDown, ChevronUp, Flag, Zap, Mountain, ArrowRight, LayoutList, Sparkles, Loader2, Edit2, X, Save } from 'lucide-react';

interface GoalsManagerProps {
  goals: Goal[];
  onUpdateGoals: (goals: Goal[]) => void;
  confirmAction: (message: string, onConfirm: () => void) => void;
}

const GoalsManager: React.FC<GoalsManagerProps> = ({ goals, onUpdateGoals, confirmAction }) => {
  const [newGoal, setNewGoal] = useState({ title: '', type: 'short-term', deadline: '' });
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.deadline) return;

    const goal: Goal = {
      id: uuidv4(),
      title: newGoal.title,
      description: '',
      type: newGoal.type as 'short-term' | 'long-term',
      deadline: newGoal.deadline,
      completed: false,
      progress: 0,
      tasks: []
    };

    onUpdateGoals([...goals, goal]);
    setNewGoal({ title: '', type: 'short-term', deadline: '' });
  };

  const handleAIPlan = async () => {
    if (!newGoal.title) return;
    setIsGeneratingPlan(true);

    try {
        const suggestedMilestones = await ai.generateGoalMilestones(newGoal.title, newGoal.type);
        
        // Convert strings to Todo objects
        const tasks: Todo[] = suggestedMilestones.map(text => ({
            id: uuidv4(),
            text,
            completed: false
        }));

        const goal: Goal = {
            id: uuidv4(),
            title: newGoal.title,
            description: '',
            type: newGoal.type as 'short-term' | 'long-term',
            deadline: newGoal.deadline || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // Default 30 days if no deadline
            completed: false,
            progress: 0,
            tasks: tasks
        };

        onUpdateGoals([...goals, goal]);
        setNewGoal({ title: '', type: 'short-term', deadline: '' });
        alert("Goal initialized with AI-generated milestones!");

    } catch (e) {
        console.error("Failed to generate plan");
        alert("AI could not generate a plan at this moment.");
    } finally {
        setIsGeneratingPlan(false);
    }
  };

  const updateGoal = (updatedGoal: Goal) => {
    onUpdateGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const deleteGoal = (id: string) => {
    confirmAction('Are you sure you want to delete this goal and all its associated milestones? This action is irreversible.', () => {
        onUpdateGoals(goals.filter(g => g.id !== id));
    });
  };

  const shortTermGoals = goals.filter(g => g.type === 'short-term');
  const longTermGoals = goals.filter(g => g.type === 'long-term');

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto bg-slate-50 dark:bg-slate-900">
      
      {/* Header / Add Section */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-slate-900 dark:bg-slate-800">
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
             <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3"></div>
        </div>

        <div className="relative z-10 p-6 md:p-8 lg:p-10">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
                <div className="bg-white/10 backdrop-blur-md p-2 md:p-3 rounded-2xl border border-white/10 text-indigo-300 dark:text-indigo-200">
                    <Target size={24} />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white dark:text-slate-100 tracking-tight">Protocol Initiation</h2>
                    <p className="text-indigo-200/80 dark:text-indigo-300/80 text-sm">Define your objectives and set the timeline for execution.</p>
                </div>
            </div>

            <form onSubmit={addGoal} className="bg-white/5 dark:bg-slate-900/60 backdrop-blur-sm border border-white/10 dark:border-slate-700 rounded-2xl p-4 md:p-6 flex flex-col lg:flex-row gap-4 md:gap-6 items-end shadow-xl">
                <div className="flex-1 w-full space-y-2">
                    <label className="text-xs font-bold text-indigo-300 dark:text-indigo-400 uppercase tracking-widest pl-1">Objective Title</label>
                    <input
                        type="text"
                        value={newGoal.title}
                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition font-medium"
                        placeholder="e.g., Run a Marathon, Learn Rust, Save $10k"
                    />
                </div>
                
                <div className="w-full lg:w-56 space-y-2">
                    <label className="text-xs font-bold text-indigo-300 dark:text-indigo-400 uppercase tracking-widest pl-1">Timeline Horizon</label>
                    <div className="relative">
                        <select
                            value={newGoal.type}
                            onChange={(e) => setNewGoal({...newGoal, type: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-900 dark:text-slate-100 appearance-none outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium cursor-pointer"
                        >
                            <option value="short-term">Short Term (Tactical)</option>
                            <option value="long-term">Long Term (Strategic)</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div className="w-full lg:w-48 space-y-2">
                    <label className="text-xs font-bold text-indigo-300 dark:text-indigo-400 uppercase tracking-widest pl-1">Deadline</label>
                    <input
                        type="date"
                        value={newGoal.deadline}
                        onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-sm"
                    />
                </div>

                <div className="flex gap-2 w-full lg:w-auto">
                    {/* Standard Init Button */}
                    <button 
                        type="submit" 
                        className="flex-1 lg:flex-none bg-indigo-600 hover:bg-indigo-500 dark:hover:bg-indigo-700 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Plus size={20} strokeWidth={3} />
                        <span className="hidden xl:inline">Initialize</span>
                    </button>

                    {/* AI Plan Button */}
                    {newGoal.title && (
                        <button 
                            type="button"
                            onClick={handleAIPlan}
                            disabled={isGeneratingPlan}
                            className="flex-1 lg:flex-none bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-pink-900/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Generate Milestones Automatically"
                        >
                            {isGeneratingPlan ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} fill="currentColor" />}
                            <span className="hidden xl:inline">AI Auto-Plan</span>
                        </button>
                    )}
                </div>
            </form>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        {/* Short Term Column */}
        <section className="space-y-6">
            <header className="flex items-center gap-3 border-b-2 border-slate-200/60 dark:border-slate-700/60 pb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Zap size={20} fill="currentColor" className="text-emerald-500 dark:text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tactical Targets</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Short Term Execution</p>
                </div>
                <div className="ml-auto bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold">
                    {shortTermGoals.length} Active
                </div>
            </header>

            <div className="space-y-4">
                {shortTermGoals.length === 0 && (
                    <EmptyState type="short" />
                )}
                {shortTermGoals.map(goal => (
                    <GoalCard 
                        key={goal.id} 
                        goal={goal} 
                        onUpdate={updateGoal} 
                        onDelete={() => deleteGoal(goal.id)} 
                        confirmAction={confirmAction}
                    />
                ))}
            </div>
        </section>

        {/* Long Term Column */}
        <section className="space-y-6">
            <header className="flex items-center gap-3 border-b-2 border-slate-200/60 dark:border-slate-700/60 pb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Mountain size={20} fill="currentColor" className="text-purple-500 dark:text-purple-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Strategic Vision</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Long Term Growth</p>
                </div>
                 <div className="ml-auto bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold">
                    {longTermGoals.length} Active
                </div>
            </header>

            <div className="space-y-4">
                {longTermGoals.length === 0 && (
                    <EmptyState type="long" />
                )}
                {longTermGoals.map(goal => (
                    <GoalCard 
                        key={goal.id} 
                        goal={goal} 
                        onUpdate={updateGoal} 
                        onDelete={() => deleteGoal(goal.id)} 
                        confirmAction={confirmAction}
                    />
                ))}
            </div>
        </section>

      </div>
    </div>
  );
};

const EmptyState = ({ type }: { type: 'short' | 'long' }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500">
        <div className="mb-4 bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm">
            {type === 'short' ? <Zap size={32} className="opacity-20" /> : <Mountain size={32} className="opacity-20" />}
        </div>
        <p className="font-medium">No {type === 'short' ? 'tactical targets' : 'strategic visions'} set.</p>
        <p className="text-xs opacity-70 mt-1">Initialize a new protocol above.</p>
    </div>
);

const GoalCard: React.FC<{ goal: Goal; onUpdate: (g: Goal) => void; onDelete: () => void; confirmAction: (msg: string, cb: () => void) => void }> = ({ goal, onUpdate, onDelete, confirmAction }) => {
    const [expanded, setExpanded] = useState(false);
    const [newTask, setNewTask] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: goal.title, deadline: goal.deadline, type: goal.type });

    const toggleComplete = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newState = !goal.completed;
        onUpdate({ 
            ...goal, 
            completed: newState, 
            progress: newState ? 100 : (goal.tasks.length > 0 ? (goal.tasks.filter(t=>t.completed).length / goal.tasks.length)*100 : 0)
        });
    };

    const addTask = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newTask.trim()) return;
        const task: Todo = { id: uuidv4(), text: newTask, completed: false };
        const updatedTasks = [...goal.tasks, task];
        // Recalc progress
        const completedCount = updatedTasks.filter(t => t.completed).length;
        const progress = updatedTasks.length > 0 ? (completedCount / updatedTasks.length) * 100 : 0;
        
        onUpdate({ ...goal, tasks: updatedTasks, progress });
        setNewTask('');
    };

    const toggleTask = (taskId: string) => {
        const updatedTasks = goal.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        const completedCount = updatedTasks.filter(t => t.completed).length;
        const progress = updatedTasks.length > 0 ? (completedCount / updatedTasks.length) * 100 : 0;
        onUpdate({ ...goal, tasks: updatedTasks, progress });
    };

    const deleteTask = (taskId: string) => {
        confirmAction("Are you sure you want to remove this milestone?", () => {
            const updatedTasks = goal.tasks.filter(t => t.id !== taskId);
            const completedCount = updatedTasks.filter(t => t.completed).length;
            const progress = updatedTasks.length > 0 ? (completedCount / updatedTasks.length) * 100 : 0;
            onUpdate({ ...goal, tasks: updatedTasks, progress });
        });
    };

    const saveEdit = (e: React.FormEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onUpdate({ ...goal, title: editForm.title, deadline: editForm.deadline, type: editForm.type as 'short-term' | 'long-term' });
        setIsEditing(false);
    };

    // Card Colors based on state
    const borderColor = goal.completed ? 'border-emerald-200 dark:border-emerald-800' : expanded ? 'border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-50 dark:ring-indigo-900/50' : 'border-slate-200 dark:border-slate-700';
    const bgColor = goal.completed ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : 'bg-white dark:bg-slate-800';

    if (isEditing) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-indigo-200 dark:border-indigo-700 p-5 shadow-lg relative z-20">
                <form onSubmit={saveEdit} className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Edit Title</label>
                        <input 
                            type="text" 
                            value={editForm.title}
                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                            className="w-full border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            autoFocus
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Deadline</label>
                            <input 
                                type="date" 
                                value={editForm.deadline}
                                onChange={(e) => setEditForm({...editForm, deadline: e.target.value})}
                                className="w-full border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm outline-none"
                            />
                        </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Type</label>
                            <select 
                                value={editForm.type}
                                onChange={(e) => setEditForm({...editForm, type: e.target.value as any})}
                                className="w-full border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm outline-none"
                            >
                                <option value="short-term">Short Term</option>
                                <option value="long-term">Long Term</option>
                            </select>
                        </div>
                     </div>
                     <div className="flex justify-end gap-2 pt-2">
                         <button 
                            type="button" 
                            onClick={() => setIsEditing(false)}
                            className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-bold"
                         >
                            Cancel
                         </button>
                         <button 
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center gap-2"
                         >
                            <Save size={14} /> Save Changes
                         </button>
                     </div>
                </form>
            </div>
        );
    }

    return (
        <div className={`group rounded-2xl border ${borderColor} ${bgColor} transition-all duration-300 shadow-sm hover:shadow-lg overflow-hidden`}>
            {/* Main Card Content */}
            <div className="p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex justify-between items-start gap-4">
                    
                    {/* Checkbox */}
                    <div className="mt-1">
                         <button 
                            onClick={toggleComplete}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                                goal.completed 
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/50' 
                                : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-transparent hover:border-indigo-400 dark:hover:border-indigo-500'
                            }`}
                         >
                            <CheckSquare size={14} fill="currentColor" />
                         </button>
                    </div>
                    
                    {/* Text & Meta */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                             <h4 className={`text-lg font-bold truncate pr-4 transition ${goal.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100 group-hover:text-indigo-900 dark:group-hover:text-indigo-300'}`}>
                                {goal.title}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                    goal.completed 
                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                                }`}>
                                    <Calendar size={12} /> {goal.deadline}
                                </span>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                                        goal.completed 
                                        ? 'bg-emerald-500' 
                                        : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                    }`} 
                                    style={{ width: `${Math.max(5, goal.progress)}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-8 text-right">{Math.round(goal.progress)}%</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-1">
                         <div className="flex gap-1">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                                className="p-2 text-slate-300 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition"
                                title="Edit Goal"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="p-2 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                title="Delete Goal"
                            >
                                <Trash2 size={16} />
                            </button>
                         </div>
                        <button className={`p-2 transition rounded-lg ${expanded ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400'}`}>
                            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Milestones / Subtasks */}
            {expanded && (
                <div className="bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 p-5 animate-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2">
                            <LayoutList size={14} /> Execution Milestones
                        </h5>
                        <span className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
                            {goal.tasks.filter(t=>t.completed).length} / {goal.tasks.length} Completed
                        </span>
                    </div>

                    <div className="space-y-3 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-700 ml-1">
                        {goal.tasks.map(task => (
                            <div key={task.id} className="relative pl-8 group/item">
                                {/* Connector Dot */}
                                <div className={`absolute left-[15px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 bg-white dark:bg-slate-800 z-10 transition ${
                                    task.completed ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600 group-hover/item:border-indigo-400 dark:group-hover/item:border-indigo-500'
                                }`}></div>

                                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition">
                                    <button 
                                        onClick={() => toggleTask(task.id)}
                                        className={`w-5 h-5 rounded border flex items-center justify-center transition flex-shrink-0 ${
                                            task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'
                                        }`}
                                    >
                                        {task.completed && <CheckSquare size={12} fill="currentColor" />}
                                    </button>
                                    <span className={`text-sm flex-1 font-medium ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                        {task.text}
                                    </span>
                                    <button 
                                        onClick={() => deleteTask(task.id)}
                                        className="text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition p-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={addTask} className="mt-4 pl-8 relative">
                         <div className="absolute left-[15px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 z-10"></div>
                         <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                placeholder="Add next milestone..."
                                className="flex-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-600/20 transition placeholder-slate-400 dark:placeholder-slate-500"
                            />
                            <button type="submit" className="bg-slate-900 dark:bg-slate-700 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl px-3 transition shadow-lg shadow-slate-200 dark:shadow-slate-900/50">
                                <Plus size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default GoalsManager;
