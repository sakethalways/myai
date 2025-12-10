import React, { useState, useEffect } from 'react';
import { Search, UserPlus, UserMinus, Flame, Target, CheckCircle2, Circle, ChevronRight, ArrowLeft, Mail, TrendingUp, Trophy, Calendar, Zap, AlertCircle } from 'lucide-react';
import * as db from '../services/storageService';

interface FriendData {
  id: string;
  name: string;
  email: string;
  streak: number;
  todayTaskCount: number;
  todayTasks: Array<{ id: string; text: string; completed: boolean }>;
  activeShortTermGoals: number;
  activeLongTermGoals: number;
}

interface FriendsProps {
  userStreak: number;
  userTodayTaskCount: number;
  confirmAction: (message: string, onConfirm: () => void) => void;
}

const Friends: React.FC<FriendsProps> = ({ userStreak, userTodayTaskCount, confirmAction }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendData[]>([]);
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<FriendData | null>(null);

  // Load friends on component mount
  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    setIsLoadingFriends(true);
    try {
      const friendsList = await db.getFriends();
      setFriends(friendsList);
      setConnectedIds(new Set(friendsList.map(f => f.id)));
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await db.searchUsers(query);
      // Results are already filtered in the service function
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConnect = async (friend: FriendData) => {
    const success = await db.connectFriend(friend.id);
    if (success) {
      setConnectedIds(prev => new Set([...prev, friend.id]));
      setSearchResults(prev => prev.filter(r => r.id !== friend.id));
      setFriends(prev => {
        const updated = [...prev, friend];
        return updated.sort((a, b) => b.streak - a.streak);
      });
      setSearchQuery('');
    }
  };

  const handleDisconnect = (friend: FriendData) => {
    confirmAction(`Are you sure you want to disconnect from ${friend.name}?`, async () => {
      const success = await db.disconnectFriend(friend.id);
      if (success) {
        setFriends(prev => prev.filter(f => f.id !== friend.id));
        setConnectedIds(prev => {
          const updated = new Set(prev);
          updated.delete(friend.id);
          return updated;
        });
        // If the user is currently viewing this friend's details, take them back to the list
        if (selectedFriend && selectedFriend.id === friend.id) {
            setSelectedFriend(null);
        }
      }
    });
  };

  const getStreakComparison = (friendStreak: number) => {
    const diff = userStreak - friendStreak;
    if (diff > 0) return { text: `You're ${diff} days ahead`, color: 'text-emerald-600' };
    if (diff < 0) return { text: `${Math.abs(diff)} days behind`, color: 'text-orange-600' };
    return { text: 'Same streak', color: 'text-slate-600' };
  };

  const getTaskComparison = (friendTasks: number) => {
    const diff = userTodayTaskCount - friendTasks;
    if (diff > 0) return { text: `You completed ${diff} more`, color: 'text-emerald-600' };
    if (diff < 0) return { text: `${Math.abs(diff)} fewer tasks`, color: 'text-orange-600' };
    return { text: 'Same tasks', color: 'text-slate-600' };
  };

  return (
    <>
      {/* Main Friends List View */}
      {!selectedFriend ? (
        <div className="max-w-6xl mx-auto pb-8 sm:pb-12 px-2 md:px-3 py-4 sm:py-6">
        {/* Page Header */}
          <div className="mb-5 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-2.5 mb-1">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-2 sm:p-2.5 rounded-lg text-white shadow-lg">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">Friends</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 ml-8 sm:ml-10">Connect and compare progress with friends</p>
          </div>

          {/* Search & Discovery Section */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 md:p-5 mb-5 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-3.5">
              <div className="bg-indigo-100 p-1.5 sm:p-2 rounded-lg text-indigo-600">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-800">Discover Users</h2>
            </div>

            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 text-slate-900 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Search Results Dropdown */}
            {searchQuery && (
              <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                {isSearching ? (
                  <div className="p-4 text-center">
                    <div className="inline-block">
                      <div className="w-5 h-5 border-2.5 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-slate-500 mt-1.5 text-xs">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-200">
                    {searchResults.map(friend => (
                      <div key={friend.id} className="p-3 hover:bg-white transition active:bg-indigo-50 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {friend.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">{friend.name}</p>
                            <p className="text-xs text-slate-500 truncate">{friend.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleConnect(friend)}
                          className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 whitespace-nowrap"
                        >
                          <UserPlus size={12} />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 font-medium text-sm">No users found</p>
                    <p className="text-xs text-slate-500 mt-0.5">Try a different search</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Connected Friends Section */}
          {!isLoadingFriends && friends.length > 0 && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 md:p-5">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-lg text-emerald-600">
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-800">Your Friends</h2>
                <span className="ml-auto text-xs font-bold text-white bg-indigo-600 px-2.5 py-0.5 rounded-full">{friends.length}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                {friends.map((friend, index) => (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    // Added flex-col on mobile for better stacking on narrow screens
                    className="group text-left bg-gradient-to-br from-slate-50 to-slate-100 hover:from-indigo-50 hover:to-indigo-100 p-3 sm:p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                        {index === 0 && (
                          <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-amber-900 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold border-2 border-white">
                            🔥
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-0.5 truncate">{friend.name}</h3>
                        <p className="text-xs text-slate-600 truncate mb-1.5 sm:mb-2">{friend.email}</p>
                        
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <Flame size={12} className="text-orange-500" />
                            <span className="font-bold text-slate-700">{friend.streak}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-indigo-600" />
                            <span className="font-bold text-slate-700">{friend.todayTaskCount}</span>
                          </div>
                          <div className="ml-auto text-indigo-600 group-hover:translate-x-0.5 transition">
                            <ChevronRight size={14} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoadingFriends && (
            <div className="bg-white rounded-xl sm:rounded-3xl shadow-md border border-slate-200 p-8 sm:p-12 text-center">
              <div className="inline-block mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-600 font-medium text-sm sm:text-base">Loading your friends...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingFriends && friends.length === 0 && !searchQuery && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl sm:rounded-3xl shadow-md border border-indigo-200 p-8 sm:p-12 text-center">
              <div className="text-5xl sm:text-6xl mb-4">👥</div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2 sm:mb-3">No Friends Yet</h3>
              <p className="text-sm text-slate-600 mb-5 sm:mb-6 max-w-sm mx-auto">Start connecting with friends! Search above to discover other users and build your network.</p>
              <div className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
                💡 Tip: Friends can see your progress and compare streaks!
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Detailed Friend View */
        <div className="max-w-6xl mx-auto pb-8 sm:pb-12 px-2 md:px-3 py-4 sm:py-6">
          {/* Back Button */}
          <button
            onClick={() => setSelectedFriend(null)}
            className="flex items-center gap-1.5 sm:gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-sm mb-3 sm:mb-4 transition group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition" />
            Back
          </button>

          {/* Friend Header Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl sm:rounded-2xl shadow-md border border-indigo-400 p-4 sm:p-5 mb-5 sm:mb-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-xl flex items-center justify-center font-bold text-2xl sm:text-3xl flex-shrink-0 backdrop-blur-sm">
                {selectedFriend.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1 truncate">{selectedFriend.name}</h1>
                <div className="flex items-center gap-1.5 sm:gap-2 text-indigo-100 mb-3 text-sm">
                  <Mail size={14} />
                  <span className="truncate">{selectedFriend.email}</span>
                </div>
                <button
                  onClick={() => handleDisconnect(selectedFriend)}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition"
                >
                  <UserMinus size={14} />
                  Disconnect
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid - Optimized for 2 columns on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 mb-5 sm:mb-6">
            {/* Streak Card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 sm:p-2.5">
              <div className="bg-orange-100 p-1.5 rounded text-orange-600 w-fit mb-1">
                <Flame size={14} />
              </div>
              <p className="text-xs font-bold text-slate-600 uppercase mb-0.5">Streak</p>
              <p className="text-xl font-bold text-slate-800">{selectedFriend.streak}</p>
              <p className={`text-xs font-semibold mt-0.5 ${getStreakComparison(selectedFriend.streak).color}`}>
                {getStreakComparison(selectedFriend.streak).text}
              </p>
            </div>

            {/* Tasks Card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 sm:p-2.5">
              <div className="bg-indigo-100 p-1.5 rounded text-indigo-600 w-fit mb-1">
                <CheckCircle2 size={14} />
              </div>
              <p className="text-xs font-bold text-slate-600 uppercase mb-0.5">Tasks</p>
              <p className="text-xl font-bold text-slate-800">{selectedFriend.todayTaskCount}</p>
              <p className={`text-xs font-semibold mt-0.5 ${getTaskComparison(selectedFriend.todayTaskCount).color}`}>
                {getTaskComparison(selectedFriend.todayTaskCount).text}
              </p>
            </div>

            {/* ST Goals Card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 sm:p-2.5">
              <div className="bg-blue-100 p-1.5 rounded text-blue-600 w-fit mb-1">
                <Target size={14} />
              </div>
              <p className="text-xs font-bold text-slate-600 uppercase mb-0.5">S/T Goals</p>
              <p className="text-xl font-bold text-slate-800">{selectedFriend.activeShortTermGoals}</p>
            </div>

            {/* LT Goals Card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 sm:p-2.5">
              <div className="bg-purple-100 p-1.5 rounded text-purple-600 w-fit mb-1">
                <Target size={14} />
              </div>
              <p className="text-xs font-bold text-slate-600 uppercase mb-0.5">L/T Goals</p>
              <p className="text-xl font-bold text-slate-800">{selectedFriend.activeLongTermGoals}</p>
            </div>
          </div>

          {/* Comparison & Protocol Section - Stacks on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {/* Comparison Section - Takes full width on mobile */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 order-2 lg:order-1">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                  <TrendingUp size={16} />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800">Performance Comparison</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Streak Comparison */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 sm:p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-800 text-sm">Streak</span>
                    <Flame className="text-orange-500" size={14} />
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <p className="text-xs text-slate-600 font-semibold mb-0.5">You</p>
                      <div className="w-full bg-white rounded-full h-1.5">
                        <div 
                          className="bg-orange-500 h-1.5 rounded-full transition-all" 
                          style={{width: `${Math.min((userStreak / 30) * 100, 100)}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{userStreak} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-semibold mb-0.5">{selectedFriend.name}</p>
                      <div className="w-full bg-white rounded-full h-1.5">
                        <div 
                          className="bg-orange-500 h-1.5 rounded-full transition-all" 
                          style={{width: `${Math.min((selectedFriend.streak / 30) * 100, 100)}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{selectedFriend.streak} days</p>
                    </div>
                  </div>
                </div>

                {/* Tasks Comparison */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 sm:p-4 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-800 text-sm">Tasks Completed Today</span>
                    <CheckCircle2 className="text-indigo-600" size={14} />
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <p className="text-xs text-slate-600 font-semibold mb-0.5">You</p>
                      <div className="w-full bg-white rounded-full h-1.5">
                        <div 
                          className="bg-indigo-600 h-1.5 rounded-full transition-all" 
                          style={{width: `${Math.min((userTodayTaskCount / 10) * 100, 100)}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{userTodayTaskCount} tasks</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-semibold mb-0.5">{selectedFriend.name}</p>
                      <div className="w-full bg-white rounded-full h-1.5">
                        <div 
                          className="bg-indigo-600 h-1.5 rounded-full transition-all" 
                          style={{width: `${Math.min((selectedFriend.todayTaskCount / 10) * 100, 100)}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{selectedFriend.todayTaskCount} tasks</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Protocol - Takes full width on mobile, and moves to bottom */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 order-1 lg:order-2">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-3">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                  <Calendar size={16} />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800">Today's Protocol</h2>
              </div>

              {selectedFriend.todayTasks && selectedFriend.todayTasks.length > 0 ? (
                <>
                  <div className="space-y-1.5 mb-3 max-h-56 overflow-y-auto custom-scrollbar">
                    {selectedFriend.todayTasks.map(task => (
                      <div key={task.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                        <div className="mt-0.5">
                          {task.completed ? (
                            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Circle size={16} className="text-slate-300 flex-shrink-0" />
                          )}
                        </div>
                        <span className={`text-xs flex-1 ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                          {task.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">Progress</span>
                      <span className="text-xs font-bold text-emerald-700">
                        {selectedFriend.todayTasks.filter(t => t.completed).length}/{selectedFriend.todayTasks.length}
                      </span>
                    </div>
                    <div className="w-full bg-white rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all" 
                        style={{width: `${(selectedFriend.todayTasks.filter(t => t.completed).length / selectedFriend.todayTasks.length) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                  <Zap className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 font-medium text-xs">No tasks shared</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Friends;