import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { User, Mail, Lock, Eye, EyeOff, BrainCircuit, Info, X, Target, Calendar, BarChart3, Bot, Shield, Zap, TrendingUp } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAbout, setShowAbout] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setError('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 flex items-center justify-center p-4 relative">
      {/* Developer Info - Top Right */}
      <div className="absolute top-4 right-4 text-slate-300 text-xs text-right z-10">
        <div className="hidden lg:flex justify-center mb-2">
          <img 
            src="/Black and White Minimalist Simple Illustrated  Brain Tech Logo_20251206_204714_0000.png" 
            alt="NeuroTrack AI Logo" 
            className="w-16 h-16 object-contain rounded-xl"
          />
        </div>
        <div className="font-medium">Saketh Muthyapuwar</div>
        <div className="text-slate-400">9550574212</div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 sm:mx-auto overflow-hidden min-h-0">
        <div className="bg-slate-900 p-4 sm:p-6 text-center text-white relative">
          <button
            onClick={() => setShowAbout(true)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="About Us"
          >
            <Info size={20} />
          </button>
          <div className="bg-gradient-to-tr from-cyan-500 to-blue-500 p-3 rounded-2xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
            <BrainCircuit size={24} />
          </div>
          <h1 className="text-2xl font-bold mb-2">NeuroTrack AI</h1>
          <p className="text-slate-300 text-sm">Your AI-powered productivity companion</p>
        </div>

        <div className="p-6">
          <div className="flex mb-6 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                !isSignUp ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                isSignUp ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-2.5 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Log In'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-4">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-600 font-medium hover:underline"
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>

      {/* About Us Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-sm sm:max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <BrainCircuit size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">About NeuroTrack AI</h2>
                  <p className="text-indigo-200 text-sm">Your AI-powered productivity companion</p>
                </div>
              </div>
              <button
                onClick={() => setShowAbout(false)}
                className="hover:bg-white/20 p-2 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
              <div className="space-y-8">
                {/* What is NeuroTrack AI */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                      <BrainCircuit size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">What is NeuroTrack AI?</h3>
                      <p className="text-slate-600 leading-relaxed">
                        NeuroTrack AI is an intelligent productivity and habit-tracking application that combines
                        neuroscience-inspired design with cutting-edge AI technology. It helps users build sustainable
                        habits, achieve their goals, and maintain consistent productivity through personalized insights
                        and automated analysis.
                      </p>
                    </div>
                  </div>
                </div>

                {/* How it Works */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-100">
                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                      <Target size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">How It Works</h3>
                      <p className="text-slate-600 leading-relaxed mb-4">
                        Track your daily activities, set meaningful goals, and let our AI analyze your patterns to provide
                        personalized recommendations and insights.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <Calendar size={18} className="text-emerald-500" />
                          <span className="text-sm text-slate-700">Daily logging & journaling</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <BarChart3 size={18} className="text-emerald-500" />
                          <span className="text-sm text-slate-700">Progress visualization</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Bot size={18} className="text-emerald-500" />
                          <span className="text-sm text-slate-700">Automated weekly/monthly AI reports</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <TrendingUp size={18} className="text-emerald-500" />
                          <span className="text-sm text-slate-700">Habit streak tracking</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Features */}
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <Zap className="text-yellow-500" />
                    Key Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                          <Target size={20} />
                        </div>
                        <h4 className="font-bold text-slate-800">Goal Management</h4>
                      </div>
                      <p className="text-slate-600 text-sm">
                        Set short-term and long-term goals with AI-generated milestones and progress tracking.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                          <Calendar size={20} />
                        </div>
                        <h4 className="font-bold text-slate-800">Daily Logging</h4>
                      </div>
                      <p className="text-slate-600 text-sm">
                        Log tasks, journal entries, and mood scores to build comprehensive activity records.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-cyan-100 p-2 rounded-lg text-cyan-600">
                          <Bot size={20} />
                        </div>
                        <h4 className="font-bold text-slate-800">AI Analysis</h4>
                      </div>
                      <p className="text-slate-600 text-sm">
                        <strong>Automated weekly & monthly reports</strong> generated every Sunday and month-end with personalized insights, pattern recognition, and actionable recommendations based on your activity data.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600">
                          <BarChart3 size={20} />
                        </div>
                        <h4 className="font-bold text-slate-800">Data Visualization</h4>
                      </div>
                      <p className="text-slate-600 text-sm">
                        Interactive charts and heatmaps to visualize productivity patterns and trends.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <Shield size={20} />
                        </div>
                        <h4 className="font-bold text-slate-800">Privacy First</h4>
                      </div>
                      <p className="text-slate-600 text-sm">
                        Your data is securely stored and only accessible to you. No third-party sharing.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-pink-100 p-2 rounded-lg text-pink-600">
                          <TrendingUp size={20} />
                        </div>
                        <h4 className="font-bold text-slate-800">Streak Tracking</h4>
                      </div>
                      <p className="text-slate-600 text-sm">
                        Build and maintain productivity streaks with visual progress indicators.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Why Choose NeuroTrack */}
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-6 rounded-2xl border border-violet-100">
                  <div className="flex items-start gap-4">
                    <div className="bg-violet-100 p-3 rounded-xl text-violet-600">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Why Choose NeuroTrack AI?</h3>
                      <ul className="text-slate-600 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-violet-500 mt-1">•</span>
                          <span>Science-backed habit formation techniques</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-violet-500 mt-1">•</span>
                          <span>Automated AI coaching with weekly and monthly personalized reports</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-violet-500 mt-1">•</span>
                          <span>Real-time data synchronization across devices</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-violet-500 mt-1">•</span>
                          <span>Beautiful, intuitive interface designed for daily use</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-violet-500 mt-1">•</span>
                          <span>Comprehensive analytics to understand your productivity patterns</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;