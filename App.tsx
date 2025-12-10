import React, { useState, useEffect } from 'react';
import { BookOpen, User, Target, BrainCircuit, LayoutDashboard, Menu, X, Download, Zap, TrendingUp, CalendarCheck, Flame, Bot, Star, PartyPopper, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { AppData, DEFAULT_DATA, DailyEntry, AIAnalysis } from './types';
import * as db from './services/storageService';
import * as ai from './services/geminiService';
import { supabase } from './services/supabaseClient';
import Profile from './components/Profile';
import DailyLog from './components/DailyLog';
import GoalsManager from './components/GoalsManager';
import ChatAgent from './components/ChatAgent';
import Friends from './components/Friends';
import { MissedTasks } from './components/MissedTasks';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ProductivityChart, NeuralBalanceRadar, ActivityHeatmap, GoalCategoryChart } from './components/Charts';
import Auth from './components/Auth';
import Notification from './components/Notification';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  
  // New States for Celebration Popup
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'weekly' | 'monthly'>('weekly');

  // Success Notification State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Global Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({
      isOpen: false,
      message: '',
      onConfirm: () => {}
  });

  const triggerConfirm = (message: string, onConfirm: () => void) => {
      setConfirmModal({ isOpen: true, message, onConfirm });
  };

  const showSuccess = (message: string) => {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 3000);
  };

  const isProfileIncomplete = (profile: any) => {
    return !profile.name.trim() || !profile.age.trim() || !profile.height.trim() || !profile.weight.trim();
  };

  // Auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadData();
      } else {
        setData(DEFAULT_DATA);
        setDataLoaded(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle responsive sidebar state
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      setIsSidebarOpen(isDesktop);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadData = async () => {
    try {
      const loaded = await db.getDB();

      // --- VANISHING REPORT LOGIC ---
      // Strictly remove any analytics that are NOT from today.
      // This ensures reports vanish after the day ends.
      const todayStr = new Date().toISOString().split('T')[0];
      const cleanAnalytics = loaded.analytics.filter(a => a.date === todayStr);

      let cleanedData = loaded;
      if (cleanAnalytics.length !== loaded.analytics.length) {
          cleanedData = { ...loaded, analytics: cleanAnalytics };
          await db.saveDB(cleanedData); // Persist the cleanup
      }

      setData(cleanedData);
      setDataLoaded(true);
      setShowProfilePopup(isProfileIncomplete(cleanedData.profile));
      checkAndGenerateAnalysis(cleanedData, todayStr);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Keep default data on error to prevent app crash
      setData(DEFAULT_DATA);
      setDataLoaded(true);
      setShowProfilePopup(isProfileIncomplete(DEFAULT_DATA.profile));
    }
  };

  const checkAndGenerateAnalysis = async (currentData: AppData, dateStr: string) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday
    
    // Logic for month end: Check if tomorrow is day 1
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isMonthEnd = tomorrow.getDate() === 1;
    const isSunday = dayOfWeek === 0;

    if (!isSunday && !isMonthEnd) return;

    // Check if we already showed the popup today
    const popupKey = `neuro_popup_seen_${dateStr}`;
    const hasSeenPopup = await db.getUserSetting(popupKey);

    if (hasSeenPopup) return;

    // Determine type (Month end takes precedence if they coincide, or could show both, but let's simplify)
    const type: 'weekly' | 'monthly' = isMonthEnd ? 'monthly' : 'weekly';
    setCelebrationType(type);

    // Check if report already exists for today (maybe generated but popup dismissed)
    let report = currentData.analytics.find(a => a.date === dateStr && a.type === type);

    if (!report) {
        setIsGenerating(true);
        // We set the celebration modal to true immediately so user sees loading or "Generating..." context
        // But better to generate first then show the "Hurray" modal
        
        try {
            const reportText = type === 'monthly' 
                ? await ai.generateMonthlyReport(currentData) 
                : await ai.generateWeeklyReport(currentData);
            
            const newAnalysis: AIAnalysis = {
                id: uuidv4(),
                date: dateStr,
                type: type,
                content: reportText,
                read: false
            };
            
            await db.addAnalysis(newAnalysis);
            // Update local state
            const updatedData = { ...currentData, analytics: [...currentData.analytics, newAnalysis] };
            setData(updatedData);
            
            // Trigger Popup
            setShowCelebration(true);
            await db.setUserSetting(popupKey, 'true');
        } catch (e) {
            console.error("Auto-generation failed", e);
        } finally {
            setIsGenerating(false);
        }
    } else {
        // Report exists but popup wasn't marked as seen (maybe cleared cache), show popup
        setShowCelebration(true);
        await db.setUserSetting(popupKey, 'true');
    }
  };

  const handleDismissReport = () => {
    setAiReport(null);
  };

  const handleViewAnalysisFromCelebration = () => {
      setShowCelebration(false);
      // Find the report for today and show the standard report modal
      const todayStr = new Date().toISOString().split('T')[0];
      const report = data.analytics.find(a => a.date === todayStr);
      if (report) {
          setAiReport(report.content);
      } else {
          alert("Report generation seems to have failed. Please check back later.");
      }
  };

  const handleProfileSave = async (p: any) => {
    try {
      const updated = await db.updateProfile(p);
      setData(updated);
      setShowProfilePopup(false); // Hide popup when profile is completed
      showSuccess('Profile saved successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const handleResetData = async () => {
    try {
      const resetData = await db.resetDB();
      setData(resetData);
      setActiveTab('dashboard');
      setSelectedDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Failed to reset data:', error);
      alert('Failed to reset data. Please try again.');
    }
  };

  const handleDaySave = async (entry: DailyEntry) => {
    try {
      const updated = await db.saveDayEntry(entry);
      setData(updated);
      showSuccess('Entry saved successfully!');
    } catch (error) {
      console.error('Failed to save daily entry:', error);
      alert('Failed to save your entry. Please try again.');
    }
  };

  const handleDeleteEntry = async (date: string) => {
    const newHistory = { ...data.history };
    if (newHistory[date]) {
        delete newHistory[date];
        const updated = { ...data, history: newHistory };
        await db.saveDB(updated);
        setData(updated);
        
        if (selectedDate === date) {
            setSelectedDate(new Date().toISOString().split('T')[0]);
        }
    }
  };

  // Specific delete for missed tasks from history
  const handleDeleteMissedTask = async (date: string, todoId: string) => {
    const entry = data.history[date];
    if (!entry) return;

    const updatedTodos = entry.todos.filter(t => t.id !== todoId);
    
    // Recalculate stats
    const updatedEntry = {
        ...entry,
        todos: updatedTodos,
        totalCount: updatedTodos.length,
        completedCount: updatedTodos.filter(t => t.completed).length,
        timestamp: new Date().toISOString()
    };

    const newHistory = { ...data.history, [date]: updatedEntry };
    const updatedData = { ...data, history: newHistory };
    
    await db.saveDB(updatedData);
    setData(updatedData);
  };

  // Bulk delete for missed tasks for a specific day
  const handleClearMissedDay = async (date: string) => {
    const entry = data.history[date];
    if (!entry) return;

    // Keep only completed tasks
    const keptTodos = entry.todos.filter(t => t.completed);
    
    const updatedEntry = {
        ...entry,
        todos: keptTodos,
        totalCount: keptTodos.length, // total reduces as we remove tasks
        completedCount: keptTodos.length, // remaining tasks are all completed
        timestamp: new Date().toISOString()
    };

    const newHistory = { ...data.history, [date]: updatedEntry };
    const updatedData = { ...data, history: newHistory };
    
    await db.saveDB(updatedData);
    setData(updatedData);
  };

  const handleGoalsUpdate = async (goals: any) => {
    const updated = await db.saveGoals(goals);
    setData(updated);
  };

  const calculateStreak = () => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const entry = data.history[dateStr];
        
        const isComplete = entry && entry.totalCount > 0 && entry.completedCount === entry.totalCount;

        if (i === 0) {
            if (isComplete) streak++;
        } else {
            if (isComplete) streak++;
            else break;
        }
    }
    return streak;
  };

  const currentStreak = calculateStreak();
  const todayDate = new Date().toISOString().split('T')[0];

  const currentEntry = data.history[selectedDate] || {
    date: selectedDate,
    timestamp: new Date().toISOString(),
    todos: [],
    journal: '',
    moodScore: 0,
    completedCount: 0,
    totalCount: 0
  };

  const todayEntry = data.history[todayDate] || { todos: [], completedCount: 0, totalCount: 0 };
  const incompleteTodos = todayEntry.todos ? todayEntry.todos.filter(t => !t.completed).length : 0;

  const NAV_ITEMS = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'journal', label: 'Journal & Logs', icon: BookOpen },
      { id: 'goals', label: 'Goals & Protocol', icon: Target },
      { id: 'missed', label: 'Missed Protocol', icon: AlertTriangle },
      { id: 'chat', label: 'Neural Agent', icon: Bot },
      { id: 'friends', label: 'Connect Friends', icon: Users },
      { id: 'profile', label: 'Profile Identity', icon: User },
  ];

  const handleNavClick = (id: string) => {
      setActiveTab(id);
      if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
      }
  };

  const renderContent = () => {
      switch(activeTab) {
          case 'dashboard':
              return (
                <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
                    <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 rounded-3xl p-4 md:p-8 text-white shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                         <div className="flex flex-col md:flex-row gap-6 md:gap-8 relative z-10">
                             <div className="flex-1">
                                 <h2 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">Welcome Back, {data.profile.name || 'NeuroTrack User'}</h2>
                                 <p className="text-indigo-100 text-base md:text-lg mb-4 md:mb-6 max-w-xl">
                                     You have <span className="font-bold text-white bg-white/20 px-2 rounded">{incompleteTodos}</span> pending tasks on your protocol today. Consistency is the key to neural adaptation.
                                 </p>

                                 <div className="flex flex-wrap gap-3 md:gap-4">
                                     <div className="bg-white/10 backdrop-blur-md px-3 md:px-4 py-2 md:py-3 rounded-xl flex items-center gap-2 md:gap-3 border border-white/10 group hover:bg-orange-500/20 transition-colors">
                                         <div className="bg-orange-500/20 p-1.5 md:p-2 rounded-lg text-orange-300 group-hover:text-orange-100 group-hover:scale-110 transition-transform">
                                             <Flame size={18} fill={currentStreak > 0 ? "currentColor" : "none"} />
                                         </div>
                                         <div>
                                            <span className="block font-bold text-lg md:text-xl leading-none text-white">{currentStreak}</span>
                                            <span className="text-xs text-orange-100/70">Day Streak</span>
                                         </div>
                                     </div>

                                     <div className="bg-white/10 backdrop-blur-md px-3 md:px-4 py-2 md:py-3 rounded-xl flex items-center gap-2 md:gap-3 border border-white/10">
                                         <div className="bg-white/20 p-1.5 md:p-2 rounded-lg"><Target size={18} /></div>
                                         <div>
                                            <span className="block font-bold text-lg md:text-xl leading-none">{data.goals.filter(g => !g.completed).length}</span>
                                            <span className="text-xs text-indigo-200">Active Goals</span>
                                         </div>
                                     </div>
                                     <div className="bg-white/10 backdrop-blur-md px-3 md:px-4 py-2 md:py-3 rounded-xl flex items-center gap-2 md:gap-3 border border-white/10">
                                         <div className="bg-white/20 p-1.5 md:p-2 rounded-lg"><CalendarCheck size={18} /></div>
                                         <div>
                                            <span className="block font-bold text-lg md:text-xl leading-none">{Object.keys(data.history).length}</span>
                                            <span className="text-xs text-indigo-200">Days Logged</span>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             <div className="w-full md:w-80 bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-white/20">
                                 <h3 className="text-xs font-bold uppercase text-indigo-200 mb-3 flex items-center gap-2">
                                     <Zap size={14} className="text-yellow-300" /> Today's Focus
                                 </h3>
                                 <ul className="space-y-2">
                                     {todayEntry.todos && todayEntry.todos.slice(0, 3).map(t => (
                                         <li key={t.id} className="flex items-center gap-2 md:gap-3 text-sm text-white">
                                             <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${t.completed ? 'bg-emerald-400 border-emerald-400' : 'border-indigo-300'}`}>
                                                 {t.completed && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                             </div>
                                             <span className={`truncate ${t.completed ? 'opacity-50 line-through' : ''}`}>{t.text}</span>
                                         </li>
                                     ))}
                                     {(!todayEntry.todos || todayEntry.todos.length === 0) && (
                                         <li className="text-indigo-200 text-xs italic text-center py-4 border border-dashed border-indigo-400/30 rounded-lg">
                                             No tasks initialized.
                                         </li>
                                     )}
                                 </ul>
                                 {todayEntry.todos && todayEntry.todos.length > 3 && (
                                     <p className="text-xs text-indigo-200 mt-3 text-center">+ {todayEntry.todos.length - 3} more tasks</p>
                                 )}
                             </div>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <NeuralBalanceRadar data={data} />
                         <ProductivityChart history={data.history} />
                         <GoalCategoryChart goals={data.goals} type="short-term" color="indigo" />
                         <GoalCategoryChart goals={data.goals} type="long-term" color="purple" />
                    </div>

                    <div className="grid grid-cols-1">
                        <ActivityHeatmap history={data.history} />
                    </div>

                    {/* Profile Setup Popup */}
                    {showProfilePopup && activeTab === 'dashboard' && (
                        <div className="fixed top-4 right-4 bg-indigo-600 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg shadow-lg z-40 max-w-xs md:max-w-sm animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-start gap-3">
                                <div className="bg-indigo-500 p-2 rounded-lg flex-shrink-0">
                                    <User size={16} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium mb-1">Complete Your Profile</p>
                                    <p className="text-xs text-indigo-100 mb-3">Fill your details in Identity Configuration to personalize your experience.</p>
                                    <button 
                                        onClick={() => {
                                            setActiveTab('profile');
                                            setShowProfilePopup(false);
                                        }}
                                        className="text-xs bg-white text-indigo-600 px-3 py-1 rounded-md font-medium hover:bg-indigo-50 transition-colors"
                                    >
                                        Go to Profile →
                                    </button>
                                </div>
                                <button 
                                    onClick={() => setShowProfilePopup(false)}
                                    className="text-indigo-200 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
              );
          case 'journal':
              return (
                  <DailyLog 
                    key={selectedDate}
                    date={selectedDate}
                    entry={currentEntry}
                    goals={data.goals}
                    onSave={handleDaySave}
                    onDeleteEntry={handleDeleteEntry}
                    history={data.history}
                    onChangeDate={setSelectedDate}
                    confirmAction={triggerConfirm}
                  />
              );
          case 'goals':
              return <GoalsManager goals={data.goals} onUpdateGoals={handleGoalsUpdate} confirmAction={triggerConfirm} />;
          case 'missed':
              return <MissedTasks history={data.history} onDeleteTask={handleDeleteMissedTask} onClearDay={handleClearMissedDay} confirmAction={triggerConfirm} />;
          case 'chat':
              return <ChatAgent data={data} />;
          case 'friends':
              return <Friends userStreak={currentStreak} userTodayTaskCount={todayEntry.todos?.length || 0} confirmAction={triggerConfirm} />;
          case 'profile':
              return <Profile profile={data.profile} onSave={handleProfileSave} onResetData={handleResetData} confirmAction={triggerConfirm} />;
          default:
              return <div>Select a module</div>;
      }
  };

  if (!user) return <Auth onAuthSuccess={() => {}} />;

  return (
    <div className={`lg:flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 overflow-auto lg:overflow-hidden ${isSidebarOpen ? 'overflow-hidden' : ''}`}>

      {/* SIDEBAR */}
      <aside className={`bg-slate-900 text-white flex flex-col transition-all duration-300 relative border-r border-slate-800 z-30 ${
        // Mobile/Tablet: overlay mode (fixed positioning)
        // Desktop: inline mode (static positioning)
        isSidebarOpen
          ? 'fixed lg:static w-64 translate-x-0 h-screen lg:h-full'
          : 'fixed lg:static w-64 -translate-x-full lg:w-20 lg:translate-x-0 hidden lg:block h-screen lg:h-full'
      }`}>
        <div className="h-20 flex items-center justify-center border-b border-slate-800 relative bg-slate-950">
             <div className="flex items-center gap-3">
                 <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2 rounded-xl text-white shadow-lg shadow-indigo-900/50">
                    <BrainCircuit size={24} />
                 </div>
                 {isSidebarOpen && <span className="font-bold text-lg tracking-wide text-indigo-50">NeuroTrack</span>}
             </div>
        </div>

        <nav className="flex-1 py-8 px-3 space-y-2 overflow-y-auto custom-scrollbar">
            {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                            isActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                        title={!isSidebarOpen ? item.label : ''}
                    >
                        <item.icon size={22} className={`relative z-10 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}`} />
                        {isSidebarOpen && <span className="font-medium relative z-10">{item.label}</span>}
                    </button>
                )
            })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
            <button onClick={() => db.exportData()} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:bg-emerald-900/30 hover:text-emerald-400 transition ${!isSidebarOpen && 'justify-center'}`}>
                <Download size={20} />
                {isSidebarOpen && <span className="font-medium text-sm">Export Data</span>}
            </button>
            <button onClick={() => supabase.auth.signOut()} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition ${!isSidebarOpen && 'justify-center'}`}>
                <X size={20} />
                {isSidebarOpen && <span className="font-medium text-sm">Log Out</span>}
            </button>
        </div>

        <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-1/2 -right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-900/50 hover:bg-indigo-500 transition z-50 hidden md:flex ring-4 ring-slate-50"
        >
             {isSidebarOpen ? <Menu size={12} /> : <Menu size={12} />}
        </button>
      </aside>

      {/* Mobile/Tablet Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full bg-slate-50 relative custom-scrollbar overflow-y-auto lg:min-h-0">

         {/* Mobile/Tablet Header */}
         <div className="lg:hidden bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-20 border-b border-slate-200">
             <div className="font-bold text-indigo-900 flex items-center gap-2">
                 <BrainCircuit size={20} className="text-indigo-600" /> NeuroTrack
             </div>
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">
                 <Menu size={24} />
             </button>
         </div>

         <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pb-20 md:pb-8">
             {renderContent()}
         </div>
      </main>

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* SUCCESS NOTIFICATION */}
      <Notification
        message={successMessage || ''}
        isVisible={!!successMessage}
        onClose={() => setSuccessMessage(null)}
      />

      {/* CELEBRATION MODAL (POPUP) */}
      {showCelebration && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative text-center p-8">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
                  
                  <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-indigo-600">
                      <PartyPopper size={40} />
                  </div>

                  <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
                      {celebrationType === 'weekly' ? "Hurray! It's the Weekend!" : "Month End Complete!"}
                  </h2>
                  <p className="text-slate-500 mb-8">
                      Your neural data has been processed. The AI Agent has generated a complete {celebrationType === 'weekly' ? "Weekly Audit" : "Monthly Strategic Review"} for you.
                  </p>

                  <button 
                      onClick={handleViewAnalysisFromCelebration}
                      className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-200 hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                      <Zap size={20} fill="currentColor" className="text-yellow-300" />
                      Take a Look at Analysis
                  </button>
                  
                  <p className="text-[10px] text-slate-400 mt-4">
                      *This report will vanish automatically at the end of the day.
                  </p>
              </div>
          </div>
      )}

      {/* ANALYSIS REPORT MODAL */}
      {aiReport && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 flex justify-between items-center text-white">
                      <div className="flex items-center gap-3">
                          <div className="bg-white/20 p-2 rounded-lg"><BrainCircuit size={24} /></div>
                          <div>
                              <h2 className="text-xl font-bold">Neural Analysis Complete</h2>
                              <p className="text-indigo-200 text-xs">Automated Intelligence Report</p>
                          </div>
                      </div>
                      <button onClick={handleDismissReport} className="hover:bg-white/20 p-2 rounded-full transition">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-8 overflow-y-auto custom-scrollbar prose prose-slate max-w-none">
                      <ReactMarkdown>{aiReport}</ReactMarkdown>
                  </div>
                  <div className="p-5 bg-slate-50 border-t flex justify-end">
                      <button onClick={handleDismissReport} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center gap-2">
                          <CheckCircle size={18} />
                          Acknowledge & Continue
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Loading Overlay */}
      {isGenerating && !showCelebration && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center">
               <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
               <h2 className="text-2xl font-bold text-indigo-900 animate-pulse">Analyzing Neural Patterns...</h2>
               <p className="text-slate-500 mt-2">Generating personalized insights from your activity data.</p>
          </div>
      )}
    </div>
  );
}

