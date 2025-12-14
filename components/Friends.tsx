import React, { useState, useEffect } from 'react';
import { Search, UserPlus, UserMinus, Flame, Target, CheckCircle2, Circle, ChevronRight, ArrowLeft, Mail, TrendingUp, Trophy, Calendar, Zap, AlertCircle, Eye, EyeOff } from 'lucide-react';
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
  const [connectingFriendId, setConnectingFriendId] = useState<string | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<FriendData | null>(null);
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [userName, setUserName] = useState<string>('You');

  // Load friends and user visibility status on component mount
  useEffect(() => {
    loadFriends();
    loadUserVisibility();
    loadUserName();
  }, []);

  // Auto-dismiss notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  const loadUserVisibility = async () => {
    try {
      const visibility = await db.getUserVisibility();
      setIsDiscoverable(visibility);
    } catch (error) {
      console.error('Failed to load visibility status:', error);
    }
  };

  const loadUserName = async () => {
    try {
      const name = await db.getUserName();
      if (name) setUserName(name);
    } catch (error) {
      console.error('Failed to load user name:', error);
    }
  };

  const toggleVisibility = async () => {
    const previousStatus = isDiscoverable;
    const newStatus = !previousStatus;
    
    // Optimistic update
    setIsDiscoverable(newStatus);
    setIsUpdatingVisibility(true);
    
    try {
      const success = await db.updateUserVisibility(newStatus);
      if (!success) {
        // Revert on failure
        setIsDiscoverable(previousStatus);
        setNotification({
          message: 'Failed to update visibility. Please try again.',
          type: 'error'
        });
        console.error('Failed to update visibility - reverted to previous state');
      } else {
        // Show success notification
        const displayName = userName !== 'You' ? userName : 'Your profile';
        const message = newStatus
          ? `${displayName} is now visible in search`
          : `${displayName} is now hidden from search`;
        setNotification({
          message,
          type: 'success'
        });
        console.log('Visibility updated to:', newStatus ? 'visible' : 'hidden');
      }
    } catch (error) {
      // Revert on error
      setIsDiscoverable(previousStatus);
      setNotification({
        message: 'Error updating visibility. Please try again.',
        type: 'error'
      });
      console.error('Failed to update visibility:', error);
    } finally {
      setIsUpdatingVisibility(false);
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
    setConnectingFriendId(friend.id);
    const success = await db.connectFriend(friend.id);
    if (success) {
      // Fetch fresh friend data after connection
      const freshFriendData = await db.getFriendDetails(friend.id);
      if (freshFriendData) {
        setConnectedIds(prev => new Set([...prev, friend.id]));
        setSearchResults(prev => prev.filter(r => r.id !== friend.id));
        setFriends(prev => {
          const updated = [...prev, freshFriendData];
          return updated.sort((a, b) => b.streak - a.streak);
        });
        setSearchQuery('');
      }
    }
    setConnectingFriendId(null);
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
        <div className="max-w-6xl mx-auto pb-8 sm:pb-12 px-2 md:px-3 py-4 sm:py-6 bg-slate-50 dark:bg-slate-900 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
        {/* Page Header */}
          <div className="mb-5 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-2.5 mb-1">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-2 sm:p-2.5 rounded-lg text-white shadow-lg">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-400 dark:to-indigo-500 bg-clip-text text-transparent">Friends</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 ml-8 sm:ml-10">Connect and compare progress with friends</p>
          </div>

          {/* Search & Discovery Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 sm:p-4 md:p-5 mb-5 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-3.5">
              <div className="bg-indigo-100 dark:bg-indigo-900 p-1.5 sm:p-2 rounded-lg text-indigo-600 dark:text-indigo-300">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">Discover Users</h2>
              
              {/* Visibility Toggle Button */}
              <button
                onClick={toggleVisibility}
                disabled={isUpdatingVisibility}
                className={`ml-auto flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition ${
                  isDiscoverable
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isDiscoverable ? 'You are visible to other users' : 'You are hidden from search results'}
              >
                {isUpdatingVisibility ? (
                  <>
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Updating...</span>
                  </>
                ) : isDiscoverable ? (
                  <>
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Visible</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Hidden</span>
                  </>
                )}
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-lg border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder-slate-500 dark:placeholder-slate-400"
              />
            </div>

            {/* Search Results Dropdown */}
            {searchQuery && (
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                {isSearching ? (
                  <div className="p-4 text-center">
                    <div className="inline-block">
                      <div className="w-5 h-5 border-2.5 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-xs">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-600">
                    {searchResults.map(friend => (
                      <div key={friend.id} className="p-3 hover:bg-white dark:hover:bg-slate-600 transition active:bg-indigo-50 dark:active:bg-slate-600 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {friend.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{friend.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{friend.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleConnect(friend)}
                          disabled={connectingFriendId === friend.id}
                          className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 whitespace-nowrap disabled:cursor-not-allowed"
                        >
                          {connectingFriendId === friend.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span className="hidden sm:inline">Adding...</span>
                            </>
                          ) : (
                            <>
                              <UserPlus size={12} />
                              <span className="hidden sm:inline">Add</span>
                              <span className="sm:hidden">+</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">No users found</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Try a different search</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Connected Friends Section */}
          {!isLoadingFriends && friends.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 sm:p-4 md:p-5">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 sm:p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">Your Friends</h2>
                <span className="ml-auto text-xs font-bold text-white bg-indigo-600 px-2.5 py-0.5 rounded-full">{friends.length}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                {friends.map((friend, index) => (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    // Added flex-col on mobile for better stacking on narrow screens
                    className="group text-left bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 hover:from-indigo-50 hover:to-indigo-100 dark:hover:from-slate-600 dark:hover:to-slate-700 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-slate-600 transition duration-300"
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
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base mb-0.5 truncate">{friend.name}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate mb-1.5 sm:mb-2">{friend.email}</p>
                        
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <Flame size={12} className="text-orange-500" />
                            <span className="font-bold text-slate-700 dark:text-slate-300">{friend.streak}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-indigo-600 dark:text-indigo-400" />
                            <span className="font-bold text-slate-700 dark:text-slate-300">{friend.todayTaskCount}</span>
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
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-3xl shadow-md border border-slate-200 dark:border-slate-700 p-8 sm:p-12 text-center">
              <div className="inline-block mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base">Loading your friends...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingFriends && friends.length === 0 && !searchQuery && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-xl sm:rounded-3xl shadow-md border border-indigo-200 dark:border-slate-700 p-8 sm:p-12 text-center">
              <div className="text-5xl sm:text-6xl mb-4">👥</div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 sm:mb-3">No Friends Yet</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 sm:mb-6 max-w-sm mx-auto">Start connecting with friends! Search above to discover other users and build your network.</p>
              <div className="inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-semibold">
                💡 Tip: Friends can see your progress and compare streaks!
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Detailed Friend View */
        <div className="max-w-6xl mx-auto pb-8 sm:pb-12 px-2 md:px-3 py-4 sm:py-6 bg-slate-50 dark:bg-slate-900 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => setSelectedFriend(null)}
            className="flex items-center gap-1.5 sm:gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold text-sm mb-3 sm:mb-4 transition group"
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
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-2 sm:p-2.5">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded text-orange-600 dark:text-orange-400 w-fit mb-1">
                <Flame size={14} />
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-0.5">Streak</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{selectedFriend.streak}</p>
              <p className={`text-xs font-semibold mt-0.5 ${getStreakComparison(selectedFriend.streak).color}`}>
                {getStreakComparison(selectedFriend.streak).text}
              </p>
            </div>

            {/* Tasks Card */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-2 sm:p-2.5">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-1.5 rounded text-indigo-600 dark:text-indigo-400 w-fit mb-1">
                <CheckCircle2 size={14} />
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-0.5">Tasks</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{selectedFriend.todayTaskCount}</p>
              <p className={`text-xs font-semibold mt-0.5 ${getTaskComparison(selectedFriend.todayTaskCount).color}`}>
                {getTaskComparison(selectedFriend.todayTaskCount).text}
              </p>
            </div>

            {/* ST Goals Card */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-2 sm:p-2.5">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded text-blue-600 dark:text-blue-400 w-fit mb-1">
                <Target size={14} />
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-0.5">S/T Goals</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{selectedFriend.activeShortTermGoals}</p>
            </div>

            {/* LT Goals Card */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-2 sm:p-2.5">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded text-purple-600 dark:text-purple-400 w-fit mb-1">
                <Target size={14} />
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-0.5">L/T Goals</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{selectedFriend.activeLongTermGoals}</p>
            </div>
          </div>

          {/* Comparison & Protocol Section - Stacks on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {/* Comparison Section - Takes full width on mobile */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5 order-2 lg:order-1">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-600 dark:text-amber-400">
                  <TrendingUp size={16} />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">Performance Comparison</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Streak Comparison */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 p-3 sm:p-4 rounded-lg border border-orange-200 dark:border-orange-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Streak</span>
                    <Flame className="text-orange-500" size={14} />
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-0.5">You</p>
                      <div className="w-full bg-white dark:bg-slate-700 rounded-full h-1.5">
                        <div 
                          className="bg-orange-500 h-1.5 rounded-full transition-all" 
                          style={{width: `${Math.min((userStreak / 30) * 100, 100)}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{userStreak} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-0.5">{selectedFriend.name}</p>
                      <div className="w-full bg-white dark:bg-slate-700 rounded-full h-1.5">
                        <div 
                          className="bg-orange-500 h-1.5 rounded-full transition-all" 
                          style={{width: `${Math.min((selectedFriend.streak / 30) * 100, 100)}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{selectedFriend.streak} days</p>
                    </div>
                  </div>
                </div>

                {/* Tasks Comparison */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/10 p-3 sm:p-4 rounded-lg border border-indigo-200 dark:border-indigo-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Tasks Completed Today</span>
                    <CheckCircle2 className="text-indigo-600 dark:text-indigo-400" size={14} />
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-0.5">You</p>
                      <div className="w-full bg-white dark:bg-slate-700 rounded-full h-1.5">
                        <div 
                          className="bg-indigo-600 h-1.5 rounded-full transition-all" 
                          style={{width: `${Math.min((userTodayTaskCount / 10) * 100, 100)}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{userTodayTaskCount} tasks</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-0.5">{selectedFriend.name}</p>
                      <div className="w-full bg-white dark:bg-slate-700 rounded-full h-1.5">
                        <div 
                          className="bg-indigo-600 h-1.5 rounded-full transition-all" 
                          style={{width: `${Math.min((selectedFriend.todayTaskCount / 10) * 100, 100)}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{selectedFriend.todayTaskCount} tasks</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Protocol - Takes full width on mobile, and moves to bottom */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5 order-1 lg:order-2">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-3">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Calendar size={16} />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">Today's Protocol</h2>
              </div>

              {selectedFriend.todayTasks && selectedFriend.todayTasks.length > 0 ? (
                <>
                  <div className="space-y-1.5 mb-3 max-h-56 overflow-y-auto custom-scrollbar">
                    {selectedFriend.todayTasks.map(task => (
                      <div key={task.id} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className="mt-0.5">
                          {task.completed ? (
                            <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Circle size={16} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                          )}
                        </div>
                        <span className={`text-xs flex-1 ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
                          {task.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Progress</span>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
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
                <div className="text-center py-6 bg-slate-50 dark:bg-slate-700 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                  <Zap className="w-7 h-7 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-600 dark:text-slate-400 font-medium text-xs">No tasks shared</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 left-6 sm:left-auto sm:w-96 p-4 rounded-lg shadow-lg border animate-in slide-in-from-bottom-5 transition-all duration-300 z-50 ${
          notification.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              notification.type === 'success' ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-red-600 dark:bg-red-400'
            }`}></div>
            <p className="font-medium text-sm flex-1">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="text-lg leading-none opacity-60 hover:opacity-100 transition"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Friends;