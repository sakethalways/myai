import { GoogleGenAI } from "@google/genai";
import { AppData, DailyEntry, Goal, ChatMessage } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not defined.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateWeeklyReport = async (data: AppData): Promise<string> => {
    const ai = getAI();
    if (!ai) return "API Key missing. Cannot generate report.";

    // Filter last 7 days of history
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const recentHistory: DailyEntry[] = [];
    let missedDays = 0;

    // Iterate efficiently
    for(let d = new Date(sevenDaysAgo); d <= today; d.setDate(d.getDate() + 1)){
        const dateStr = d.toISOString().split('T')[0];
        if(data.history[dateStr]) {
            recentHistory.push(data.history[dateStr]);
        } else {
            missedDays++;
        }
    }

    const prompt = `
    You are 'NeuroTrack', a dedicated AI Life Coach & Data Analyst. 
    Review the user's entire data context for the LAST 7 DAYS.

    USER IDENTITY: ${JSON.stringify(data.profile)}
    FULL GOALS PROTOCOL: ${JSON.stringify(data.goals)}
    WEEKLY ACTIVITY LOG (Last 7 Days): ${JSON.stringify(recentHistory)}
    MISSED LOGGING DAYS: ${missedDays}

    TASK: Generate a "Weekly Neural Audit" in Markdown.
    
    REQUIREMENTS:
    1. **Deep Dive**: Read specific Todo items and Journal entries from the log. Quote them if relevant.
    2. **Pattern Recognition**: Connect their daily actions (or lack thereof) to their stated Long Term Goals.
    3. **The Gap**: Highlight the discrepancy between their potential and their execution.
    4. **Tone**: Professional, analytical, encouraging, but strict about consistency.
    
    STRUCTURE:
    ## 🧠 Weekly Neural Audit
    ### 📊 Performance Metrics
    (Summarize completion rates, mood, and consistency)

    ### 🕵️ Observations & Insights
    (Analyze specific journal entries and tasks. Did they focus on the right things?)

    ### ⚠️ Inconsistency Alert
    (If missed days > 0, address why this happened. If 0, praise the streak.)

    ### 🚀 Next Week's Protocol
    (3 concrete, actionable adjustments based on this week's data)
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "No analysis generated.";
    } catch (error) {
        console.error("Gemini Error", error);
        return "Failed to generate report due to an error.";
    }
};

export const generateMonthlyReport = async (data: AppData): Promise<string> => {
    const ai = getAI();
    if (!ai) return "API Key missing.";

     const prompt = `
    You are 'NeuroTrack', a Strategic Performance AI.
    It is the end of the month. We need a comprehensive "Monthly System Review".

    FULL DATA STORAGE ACCESS:
    ${JSON.stringify(data)}

    TASK: Generate a high-level strategic review of the user's month.

    REQUIREMENTS:
    1. **Trajectory Analysis**: Are they actually closer to their 'Long Term' goals than they were 30 days ago? Use evidence from the logs.
    2. **Habit Formation**: What behaviors have solidified? What bad habits are creeping in?
    3. **Critical Feedback**: Be blunt. If they are wasting time on low-value tasks (check their Todos), tell them.
    4. **Tone**: High-performance coach.

    STRUCTURE:
    ## 📅 Monthly System Review
    ### 📈 Macro Trajectory
    (Are we winning or losing? Growth vs Stagnation)

    ### 💎 Key Victories
    (Highlight specific days or completed goals that were significant)

    ### 🛑 System Failures
    (Where did the user falter? Missed days, abandoned goals, poor mood patterns)

    ### 🔮 Strategic Pivot for Next Month
    (Redefine the approach. What needs to change in the Protocol?)
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Using pro for deeper reasoning on monthly data
            contents: prompt,
        });
        return response.text || "No analysis generated.";
    } catch (error) {
        console.error("Gemini Error", error);
        return "Failed to generate report.";
    }
};

export const chatWithAI = async (message: string, contextData: AppData, history: ChatMessage[]): Promise<string> => {
    const ai = getAI();
    if (!ai) return "I cannot access my neural core (API Key missing).";

    // Compress history to last 5 messages to save tokens but keep context
    const recentContext = history.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

    const systemPrompt = `
    You are 'NeuroTrack', a highly intelligent AI assistant embedded in a self-tracking application.
    You have direct access to the user's entire life data JSON.
    
    CURRENT USER DATA (Real-Time):
    ${JSON.stringify(contextData)}

    Your directive:
    1. Answer questions about the user's progress, goals, and consistency based on the DATA provided above.
    2. Be encouraging but analytical. Use data points to back up your statements (e.g., "You missed 3 days last week").
    3. If the user asks for advice, base it on their specific goals and recent journal entries.
    4. Keep responses concise and conversational.
    
    History of this conversation:
    ${recentContext}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: systemPrompt + `\n\nUSER QUERY: ${message}` }] }
            ]
        });
        return response.text || "I processed the data but could not formulate a verbal response.";
    } catch (error) {
        console.error("Chat Error", error);
        return "My neural pathways are currently congested. Please try again.";
    }
};

export const generateGoalMilestones = async (title: string, type: string): Promise<string[]> => {
    const ai = getAI();
    if (!ai) return ["Define clear objective", "Break down into steps", "Execute first step", "Review progress"];

    const prompt = `
    The user wants to achieve this goal: "${title}" which is a ${type} goal.
    Generate a JSON ARRAY of 4 to 6 concrete, actionable, short milestones (sub-tasks) to achieve this.
    Return ONLY the raw JSON array. Do not wrap in markdown code blocks.
    Example output: ["Step 1", "Step 2", "Step 3", "Step 4"]
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        let text = response.text?.trim() || "[]";
        // Cleanup if model wraps in code blocks
        if (text.startsWith("```json")) text = text.replace("```json", "").replace("```", "");
        if (text.startsWith("```")) text = text.replace("```", "").replace("```", "");
        
        return JSON.parse(text);
    } catch (error) {
        console.error("Milestone Gen Error", error);
        return ["Research requirements", "Create daily habit", "Track first week", "Evaluate results"];
    }
};