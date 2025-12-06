import React, { useState, useRef, useEffect } from 'react';
import { AppData, ChatMessage } from '../types';
import * as ai from '../services/geminiService';
import { Send, Bot, User, Sparkles, StopCircle, RefreshCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

interface ChatAgentProps {
    data: AppData;
}

const ChatAgent: React.FC<ChatAgentProps> = ({ data }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'init',
            role: 'model',
            text: `Greetings, ${data.profile.name || 'User'}. I am your Neural Agent. I have analyzed your ${Object.keys(data.history).length} logged days and ${data.goals.length} active goals. How can I assist your optimization today?`,
            timestamp: new Date().toISOString()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMsg: ChatMessage = {
            id: uuidv4(),
            role: 'user',
            text: input,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Pass the CURRENT data state to the AI
            const responseText = await ai.chatWithAI(userMsg.text, data, messages);
            
            const aiMsg: ChatMessage = {
                id: uuidv4(),
                role: 'model',
                text: responseText,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: ChatMessage = {
                id: uuidv4(),
                role: 'model',
                text: "I encountered a processing error. Please retry.",
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-slate-900 p-3 md:p-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="bg-gradient-to-tr from-cyan-500 to-blue-500 p-2 rounded-lg text-white shadow-lg shadow-cyan-500/20">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-base md:text-lg leading-tight">Neural Agent</h2>
                        <p className="text-cyan-200/60 text-xs">Real-time Data Access Active</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <span className="flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75 ${isTyping ? 'bg-cyan-400' : 'bg-emerald-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isTyping ? 'bg-cyan-500' : 'bg-emerald-500'}`}></span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{isTyping ? 'PROCESSING' : 'ONLINE'}</span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-2 md:p-4 lg:p-6 space-y-3 md:space-y-6 bg-slate-50 custom-scrollbar">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'model' && (
                             <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-900 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-1">
                                <Bot size={14} className="md:w-4 md:h-4" />
                            </div>
                        )}

                        <div className={`max-w-[90%] sm:max-w-[90%] md:max-w-[75%] lg:max-w-[70%] rounded-2xl p-2 md:p-4 shadow-sm ${
                            msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                        }`}>
                            <div className="prose prose-xs max-w-none dark:prose-invert break-words text-xs md:text-sm">
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                            <div className={`text-[8px] md:text-[10px] mt-1 md:mt-2 opacity-50 ${msg.role === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                                <User size={14} className="md:w-4 md:h-4" />
                            </div>
                        )}
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3 md:gap-4">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-900 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-1">
                             <Bot size={14} className="md:w-4 md:h-4" />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 md:p-4 rounded-bl-sm flex items-center gap-2">
                             <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-slate-400 rounded-full animate-bounce"></div>
                             <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                             <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-2 md:p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSend} className="relative flex items-center gap-2 md:gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your progress, consistency, or goals..."
                        className="flex-1 bg-slate-100 text-slate-900 border-none rounded-xl px-3 md:px-5 py-2.5 md:py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition placeholder-slate-400 text-sm md:text-base"
                        disabled={isTyping}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className={`p-3 md:p-4 rounded-xl transition flex items-center justify-center shadow-lg ${
                            !input.trim() || isTyping
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                        }`}
                    >
                        {isTyping ? <RefreshCcw size={18} className="md:w-5 md:h-5 animate-spin" /> : <Send size={18} className="md:w-5 md:h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatAgent;