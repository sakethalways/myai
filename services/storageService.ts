import { AppData, DailyEntry, DEFAULT_DATA, Goal, Todo, UserProfile, AIAnalysis } from '../types';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';

const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};

// Simulates a backend connection to Supabase
export const getDB = async (): Promise<AppData> => {
  const userId = await getUserId();
  if (!userId) return DEFAULT_DATA;

  try {
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const profile: UserProfile = profileData ? {
      name: profileData.name || '',
      age: profileData.age || '',
      height: profileData.height || '',
      weight: profileData.weight || ''
    } : { name: '', age: '', height: '', weight: '' };

    // Fetch history
    const { data: historyData } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', userId);

    const history: Record<string, DailyEntry> = {};
    historyData?.forEach(entry => {
      history[entry.date] = {
        date: entry.date,
        timestamp: entry.timestamp,
        todos: entry.todos || [],
        journal: entry.journal || '',
        moodScore: entry.mood_score || 0,
        completedCount: entry.completed_count || 0,
        totalCount: entry.total_count || 0
      };
    });

    // Fetch goals
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    const goals: Goal[] = goalsData?.map(g => ({
      id: g.id,
      title: g.title,
      description: g.description || '',
      type: g.type,
      deadline: g.deadline,
      completed: g.completed,
      progress: g.progress,
      tasks: g.tasks || []
    })) || [];

    // Fetch analytics
    const { data: analyticsData } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('user_id', userId);

    const analytics: AIAnalysis[] = analyticsData?.map(a => ({
      id: a.id,
      date: a.date,
      type: a.type,
      content: a.content,
      read: a.read
    })) || [];

    return {
      profile,
      history,
      goals,
      analytics,
      version: 1
    };
  } catch (e) {
    console.error("Failed to load DB from Supabase", e);
    return DEFAULT_DATA;
  }
};

export const saveDB = async (data: AppData) => {
  const userId = await getUserId();
  if (!userId) return;

  try {
    // Upsert profile
    await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: data.profile.name,
        age: data.profile.age,
        height: data.profile.height,
        weight: data.profile.weight
      });

    // Upsert history
    const historyEntries = Object.values(data.history).map(entry => ({
      user_id: userId,
      date: entry.date,
      timestamp: entry.timestamp,
      todos: entry.todos,
      journal: entry.journal,
      mood_score: entry.moodScore,
      completed_count: entry.completedCount,
      total_count: entry.totalCount
    }));

    for (const entry of historyEntries) {
      await supabase
        .from('daily_entries')
        .upsert(entry, { onConflict: 'user_id,date' });
    }

    // Upsert goals
    const goalEntries = data.goals.map(goal => ({
      id: goal.id,
      user_id: userId,
      title: goal.title,
      description: goal.description,
      type: goal.type,
      deadline: goal.deadline,
      completed: goal.completed,
      progress: goal.progress,
      tasks: goal.tasks
    }));

    for (const goal of goalEntries) {
      await supabase
        .from('goals')
        .upsert(goal, { onConflict: 'id' });
    }

    // Upsert analytics
    const analyticsEntries = data.analytics.map(analysis => ({
      id: analysis.id,
      user_id: userId,
      date: analysis.date,
      type: analysis.type,
      content: analysis.content,
      read: analysis.read
    }));

    for (const analysis of analyticsEntries) {
      await supabase
        .from('ai_analyses')
        .upsert(analysis, { onConflict: 'id' });
    }
  } catch (e) {
    console.error("Failed to save DB to Supabase", e);
  }
};

export const resetDB = async (): Promise<AppData> => {
  const userId = await getUserId();
  if (!userId) return DEFAULT_DATA;

  try {
    await supabase.from('profiles').delete().eq('id', userId);
    await supabase.from('daily_entries').delete().eq('user_id', userId);
    await supabase.from('goals').delete().eq('user_id', userId);
    await supabase.from('ai_analyses').delete().eq('user_id', userId);
    await supabase.from('user_settings').delete().eq('user_id', userId);
    return DEFAULT_DATA;
  } catch (e) {
    console.error("Failed to reset DB", e);
    return DEFAULT_DATA;
  }
};

// --- Helper Functions ---

export const updateProfile = async (profile: UserProfile): Promise<AppData> => {
  const userId = await getUserId();
  if (!userId) return DEFAULT_DATA;

  await supabase
    .from('profiles')
    .upsert({
      id: userId,
      name: profile.name,
      age: profile.age,
      height: profile.height,
      weight: profile.weight
    });

  return await getDB();
};

export const getDayEntry = async (date: string): Promise<DailyEntry> => {
  const userId = await getUserId();
  if (!userId) return {
    date,
    timestamp: new Date().toISOString(),
    todos: [],
    journal: '',
    moodScore: 0,
    completedCount: 0,
    totalCount: 0
  };

  const { data } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (data) {
    return {
      date: data.date,
      timestamp: data.timestamp,
      todos: data.todos || [],
      journal: data.journal || '',
      moodScore: data.mood_score || 0,
      completedCount: data.completed_count || 0,
      totalCount: data.total_count || 0
    };
  }

  return {
    date,
    timestamp: new Date().toISOString(),
    todos: [],
    journal: '',
    moodScore: 0,
    completedCount: 0,
    totalCount: 0
  };
};

export const saveDayEntry = async (entry: DailyEntry): Promise<AppData> => {
  const userId = await getUserId();
  if (!userId) return DEFAULT_DATA;

  await supabase
    .from('daily_entries')
    .upsert({
      user_id: userId,
      date: entry.date,
      timestamp: entry.timestamp,
      todos: entry.todos,
      journal: entry.journal,
      mood_score: entry.moodScore,
      completed_count: entry.completedCount,
      total_count: entry.totalCount
    }, { onConflict: 'user_id,date' });

  return await getDB();
};

export const saveGoals = async (goals: Goal[]): Promise<AppData> => {
  const userId = await getUserId();
  if (!userId) return DEFAULT_DATA;

  // Delete existing goals
  await supabase.from('goals').delete().eq('user_id', userId);

  // Insert new goals
  const goalEntries = goals.map(goal => ({
    id: goal.id,
    user_id: userId,
    title: goal.title,
    description: goal.description,
    type: goal.type,
    deadline: goal.deadline,
    completed: goal.completed,
    progress: goal.progress,
    tasks: goal.tasks
  }));

  await supabase.from('goals').insert(goalEntries);

  return await getDB();
};

export const addAnalysis = async (analysis: AIAnalysis): Promise<AppData> => {
  const userId = await getUserId();
  if (!userId) return DEFAULT_DATA;

  await supabase
    .from('ai_analyses')
    .insert({
      id: analysis.id,
      user_id: userId,
      date: analysis.date,
      type: analysis.type,
      content: analysis.content,
      read: analysis.read
    });

  return await getDB();
};

// User settings functions for UI preferences
export const getUserSetting = async (key: string): Promise<string | null> => {
  const userId = await getUserId();
  if (!userId) return null;

  const { data } = await supabase
    .from('user_settings')
    .select('setting_value')
    .eq('user_id', userId)
    .eq('setting_key', key)
    .single();

  return data?.setting_value || null;
};

export const setUserSetting = async (key: string, value: string): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      setting_key: key,
      setting_value: value
    }, { onConflict: 'user_id,setting_key' });
};

export const exportData = async () => {
    try {
        const db = await getDB();
        
        // 1. Prepare Profile Sheet
        const profileData = [
            ["Metric", "Value"],
            ["Name", db.profile.name],
            ["Age", db.profile.age],
            ["Height (cm)", db.profile.height],
            ["Weight (kg)", db.profile.weight],
            ["App Version", db.version]
        ];

        // 2. Prepare History Sheet (Flattened)
        const historyHeaders = ["Date", "Total Tasks", "Completed Tasks", "Mood Score", "Journal Entry", "Tasks List"];
        const historyRows = Object.keys(db.history).sort().map(date => {
            const entry = db.history[date];
            const tasksSummary = entry.todos ? entry.todos.map(t => `[${t.completed ? 'x' : ' '}] ${t.text}`).join('; ') : "";
            return [
                date,
                entry.totalCount,
                entry.completedCount,
                entry.moodScore,
                entry.journal,
                tasksSummary
            ];
        });
        const historyData = [historyHeaders, ...historyRows];

        // 3. Prepare Goals Sheet
        const goalHeaders = ["Title", "Type", "Deadline", "Progress (%)", "Completed", "Milestones"];
        const goalRows = db.goals.map(g => {
            const milestones = g.tasks.map(t => `[${t.completed ? 'x' : ' '}] ${t.text}`).join('; ');
            return [
                g.title,
                g.type,
                g.deadline,
                Math.round(g.progress),
                g.completed ? "Yes" : "No",
                milestones
            ];
        });
        const goalsData = [goalHeaders, ...goalRows];

        // Create Workbook
        const wb = XLSX.utils.book_new();
        
        const wsProfile = XLSX.utils.aoa_to_sheet(profileData);
        XLSX.utils.book_append_sheet(wb, wsProfile, "Profile Identity");
        
        const wsHistory = XLSX.utils.aoa_to_sheet(historyData);
        XLSX.utils.book_append_sheet(wb, wsHistory, "Daily Logs");
        
        const wsGoals = XLSX.utils.aoa_to_sheet(goalsData);
        XLSX.utils.book_append_sheet(wb, wsGoals, "Goals Protocol");

        // Generate Excel File
        XLSX.writeFile(wb, `NeuroTrack_Export_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (e) {
        console.error("Export failed", e);
        // Fallback to JSON if XLSX fails
        const db = await getDB();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `neurotrack_backup_fallback_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        alert("Excel export failed (Library error). Downloaded JSON backup instead.");
    }
};