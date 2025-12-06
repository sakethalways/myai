export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  linkedGoalId?: string; // Optional link to a short/long term goal
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'short-term' | 'long-term';
  deadline: string; // ISO Date
  completed: boolean;
  progress: number; // 0-100
  tasks: Todo[]; // Sub-tasks specifically for this goal
}

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO Timestamp of last update
  todos: Todo[];
  journal: string;
  moodScore: number; // Calculated or user input (1-10)
  completedCount: number;
  totalCount: number;
}

export interface UserProfile {
  name: string;
  age: string; // string to handle empty input easily, convert to number for logic
  height: string; // cm
  weight: string; // kg
}

export interface AIAnalysis {
  id: string;
  date: string;
  type: 'weekly' | 'monthly';
  content: string; // Markdown content from Gemini
  read: boolean;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: string;
}

// The "Neural" JSON Store
export interface AppData {
  profile: UserProfile;
  history: Record<string, DailyEntry>; // Key is YYYY-MM-DD
  goals: Goal[];
  analytics: AIAnalysis[];
  version: number;
}

export const DEFAULT_DATA: AppData = {
  profile: { name: '', age: '', height: '', weight: '' },
  history: {},
  goals: [],
  analytics: [],
  version: 1,
};