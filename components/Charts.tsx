import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { DailyEntry, Goal, AppData } from '../types';

interface ChartProps {
  history: Record<string, DailyEntry>;
  goals?: Goal[];
}

// Vibrant palette
const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6'];

// Helper to detect dark mode
const isDarkMode = () => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
};

// Tooltip style helper
const getTooltipStyle = () => {
  const isDark = isDarkMode();
  return {
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    color: isDark ? '#e2e8f0' : '#1e293b'
  };
};

// Grid stroke helper
const getGridStroke = () => {
  return isDarkMode() ? '#475569' : '#f1f5f9';
};

// XAxis/YAxis tick color helper
const getAxisTickColor = () => {
  return isDarkMode() ? '#94a3b8' : '#94a3b8';
};

export const ProductivityChart: React.FC<ChartProps> = ({ history }) => {
  const data = Object.keys(history).sort().map(date => {
    const entry = history[date];
    const percentage = entry.totalCount > 0 ? (entry.completedCount / entry.totalCount) * 100 : 0;
    return {
      date,
      productivity: Math.round(percentage),
      mood: entry.moodScore || 5
    };
  });

  const displayData = data.slice(-14); // Last 14 entries

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-64 sm:h-80 flex flex-col min-w-0">
      <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400"></span> Neural Growth Trend
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={getGridStroke()} vertical={false} />
            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(val) => val.slice(5)} axisLine={false} tickLine={false} />
            <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
            <Tooltip 
                contentStyle={getTooltipStyle()}
            />
            <Line type="monotone" dataKey="productivity" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1', strokeWidth: 0}} activeDot={{ r: 6 }} name="Focus %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const NeuralBalanceRadar: React.FC<{ data: AppData }> = ({ data }) => {
    // Calculate metrics
    const historyKeys = Object.keys(data.history);
    const totalDays = historyKeys.length;
    const last7Days = historyKeys.sort().slice(-7);
    
    // 1. Consistency (0-100)
    const consistency = totalDays > 0 ? Math.min(100, (last7Days.length / 7) * 100) : 0;
    
    // 2. Completion Rate
    let totalTasks = 0;
    let completedTasks = 0;
    last7Days.forEach(k => {
        totalTasks += data.history[k].totalCount;
        completedTasks += data.history[k].completedCount;
    });
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // 3. Goal Focus (Active vs Completed)
    const totalGoals = data.goals.length;
    const completedGoals = data.goals.filter(g => g.completed).length;
    const goalScore = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    // 4. Mental Load (Dynamic based on task volume)
    // Scale: 0 tasks = 0 load. 10+ tasks = 100 load.
    const mentalLoad = totalTasks === 0 ? 0 : Math.min(100, (totalTasks / 10) * 100);

    // 5. Journaling Habit
    let journalCount = 0;
    last7Days.forEach(k => {
        if (data.history[k].journal && data.history[k].journal.length > 10) journalCount++;
    });
    const journalingScore = (journalCount / 7) * 100;

    const chartData = [
        { subject: 'Consistency', A: Math.round(consistency), fullMark: 100 },
        { subject: 'Task Focus', A: Math.round(completionRate), fullMark: 100 },
        { subject: 'Goal Reach', A: Math.round(goalScore), fullMark: 100 },
        { subject: 'Journaling', A: Math.round(journalingScore), fullMark: 100 }, 
        { subject: 'Mental Load', A: Math.round(mentalLoad), fullMark: 100 }, 
    ];

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center h-64 sm:h-80 min-w-0">
             <h3 className="text-sm font-bold uppercase tracking-wider text-purple-500 dark:text-purple-400 mb-2 w-full text-left flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400"></span> Cognitive Balance
             </h3>
             <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Current Status"
                        dataKey="A"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="#8b5cf6"
                        fillOpacity={0.4}
                    />
                    <Tooltip contentStyle={getTooltipStyle()} />
                    </RadarChart>
                </ResponsiveContainer>
             </div>
        </div>
    );
};

export const ActivityHeatmap: React.FC<{ history: Record<string, DailyEntry> }> = ({ history }) => {
    const [view, setView] = useState<'week' | 'month' | 'year'>('week');

    const generateData = () => {
        const today = new Date();
        const data = [];
        let daysToGenerate = 365;

        if (view === 'week') daysToGenerate = 7;
        if (view === 'month') daysToGenerate = 30;

        for(let i = daysToGenerate - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const entry = history[dateStr];
            let intensity = 0;
            
            if (entry) {
                const ratio = entry.totalCount > 0 ? entry.completedCount / entry.totalCount : 0;
                if (entry.totalCount > 0) {
                     if (ratio === 1) intensity = 4;
                     else if (ratio > 0.6) intensity = 3;
                     else if (ratio > 0.3) intensity = 2;
                     else intensity = 1;
                } else if (entry.journal) {
                    intensity = 1; // Just journaling counts as mild activity
                }
            }

            data.push({ date: dateStr, intensity });
        }
        return data;
    };

    const getDateRange = () => {
        const today = new Date();
        let startDate = new Date(today);
        
        if (view === 'week') {
            startDate.setDate(today.getDate() - 6);
        } else if (view === 'month') {
            startDate.setDate(today.getDate() - 29);
        }
        // For year, it's 365 days
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        if (view === 'week') {
            const startMonth = monthNames[startDate.getMonth()];
            const startDay = startDate.getDate();
            const endMonth = monthNames[today.getMonth()];
            const endDay = today.getDate();
            
            if (startMonth === endMonth) {
                return `Last 7 Days: ${startMonth} ${startDay}-${endDay}`;
            } else {
                return `Last 7 Days: ${startMonth} ${startDay} - ${endMonth} ${endDay}`;
            }
        } else if (view === 'month') {
            const month = monthNames[today.getMonth()];
            return `This Month: ${month} ${today.getFullYear()}`;
        } else {
            const startYear = startDate.getFullYear();
            const endYear = today.getFullYear();
            if (startYear === endYear) {
                return `This Year: ${endYear}`;
            } else {
                return `Year View: ${startYear} - ${endYear}`;
            }
        }
    };

    const heatmapData = generateData();

    const getColor = (intensity: number) => {
        switch(intensity) {
            case 0: return 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600';
            case 1: return 'bg-emerald-200 dark:bg-emerald-900/40 hover:bg-emerald-300 dark:hover:bg-emerald-900/60';
            case 2: return 'bg-emerald-300 dark:bg-emerald-800/50 hover:bg-emerald-400 dark:hover:bg-emerald-700/60';
            case 3: return 'bg-emerald-500 dark:bg-emerald-600/70 hover:bg-emerald-600 dark:hover:bg-emerald-600/90';
            case 4: return 'bg-emerald-700 dark:bg-emerald-500 shadow-sm shadow-emerald-500/50 hover:bg-emerald-800 dark:hover:bg-emerald-400';
            default: return 'bg-slate-100 dark:bg-slate-700';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 col-span-1 lg:col-span-2 min-w-0">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span> Consistency Map
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 ml-4">{getDateRange()}</p>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 self-start sm:self-auto">
                        {['week', 'month', 'year'].map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v as any)}
                                className={`px-2 py-1 text-xs font-bold rounded-md transition capitalize ${
                                    view === v ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    <p>← Older &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Newer →</p>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5 justify-start">
                {heatmapData.map((d) => (
                    <div 
                        key={d.date} 
                        title={`${d.date}: Level ${d.intensity}`}
                        className={`${view === 'year' ? 'w-2.5 h-2.5' : view === 'month' ? 'w-8 h-8' : 'w-10 h-10'} rounded-sm ${getColor(d.intensity)} transition hover:scale-110 cursor-pointer border border-white dark:border-slate-700`}
                    />
                ))}
            </div>
            <div className="flex justify-end mt-4 gap-2 text-[10px] text-slate-400 dark:text-slate-500 items-center">
                <span>Dormant</span>
                <div className="w-2 h-2 rounded bg-slate-100 dark:bg-slate-700"></div>
                <div className="w-2 h-2 rounded bg-emerald-300 dark:bg-emerald-800/50"></div>
                <div className="w-2 h-2 rounded bg-emerald-700 dark:bg-emerald-500"></div>
                <span>Peak</span>
            </div>
        </div>
    );
};

export const GoalCategoryChart: React.FC<{ goals: Goal[], type: 'short-term' | 'long-term', color: string }> = ({ goals, type, color }) => {
    const filteredGoals = goals.filter(g => g.type === type);
    
    // Prepare Data: Each goal is a bar.
    // Stacks: 'Completed Milestones' vs 'Remaining Milestones'.
    // If a goal has 0 tasks, it counts as 1 unit.
    const data = filteredGoals.map(g => {
        const totalTasks = g.tasks.length;
        
        // If goal is fully marked complete, show full bar
        if (g.completed) {
             return {
                name: g.title.length > 15 ? g.title.substring(0, 15) + '..' : g.title,
                fullTitle: g.title,
                Completed: totalTasks === 0 ? 1 : totalTasks,
                Remaining: 0
            };
        }

        // If goal has no subtasks and is not complete, it's 1 unit remaining
        if (totalTasks === 0) {
            return {
                name: g.title.length > 15 ? g.title.substring(0, 15) + '..' : g.title,
                fullTitle: g.title,
                Completed: 0,
                Remaining: 1
            };
        }
        
        // Normal case: Calculate based on milestones
        const completedTasks = g.tasks.filter(t => t.completed).length;
        return {
            name: g.title.length > 15 ? g.title.substring(0, 15) + '..' : g.title,
            fullTitle: g.title,
            Completed: completedTasks,
            Remaining: totalTasks - completedTasks
        };
    });

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-64 sm:h-80 flex flex-col min-w-0">
            <h3 className={`text-sm font-bold uppercase tracking-wider ${color === 'indigo' ? 'text-indigo-500 dark:text-indigo-400' : 'text-purple-500 dark:text-purple-400'} mb-2 flex items-center gap-2`}>
                <span className={`w-2 h-2 rounded-full ${color === 'indigo' ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-purple-500 dark:bg-purple-400'}`}></span>
                {type === 'short-term' ? 'Tactical Execution' : 'Strategic Roadmap'}
            </h3>
            <div className="flex-1 w-full min-h-0">
                {data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-300 dark:text-slate-500 text-xs italic">
                        No active {type.replace('-', ' ')} goals
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                            barSize={30}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={getGridStroke()} />
                            <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} interval={0} />
                            <YAxis tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip 
                                cursor={{fill: isDarkMode() ? '#f1f5f9' : '#f8fafc'}}
                                contentStyle={getTooltipStyle()}
                                formatter={(value: number, name: string) => [value, name === 'Completed' ? 'Milestones Done' : 'Remaining']}
                                labelFormatter={(label, payload) => {
                                    if (payload && payload.length > 0) {
                                        return payload[0].payload.fullTitle;
                                    }
                                    return label;
                                }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}}/>
                            <Bar dataKey="Remaining" stackId="a" fill="#94a3b8" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Completed" stackId="a" fill={color === 'indigo' ? '#6366f1' : '#a855f7'} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export const MissedTaskRiskChart: React.FC<{ history: Record<string, DailyEntry> }> = ({ history }) => {
    const generateRiskData = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const dates = Object.keys(history).filter(d => d < todayStr).sort().slice(-14); // Last 14 days excluding today
        
        return dates.map(date => {
            const entry = history[date];
            const missedCount = entry.todos ? entry.todos.filter(t => !t.completed).length : 0;
            return {
                date,
                missed: missedCount
            };
        });
    };

    const data = generateRiskData();

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-64 sm:h-80 flex flex-col min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 dark:text-red-400 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400"></span> Inconsistency Risk
            </h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorMissed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(val) => val.slice(5)} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={getTooltipStyle()} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={getGridStroke()} />
                        <Area type="monotone" dataKey="missed" stroke="#ef4444" fillOpacity={1} fill="url(#colorMissed)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};