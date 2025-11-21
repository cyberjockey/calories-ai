
import React, { useMemo } from 'react';
import { DayLog, SubscriptionStatus, UserGoals, FoodItem } from '../types';
import { Loader2, RefreshCw, WifiOff, Lock, Crown, Flame, Trophy, TrendingUp } from 'lucide-react';
import { STRIPE_PAYMENT_LINK } from '../config';
import AnalyticsChart from '../components/AnalyticsChart';
import FoodCard from '../components/FoodCard';

interface HistoryProps {
  history: DayLog[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  subscriptionStatus: SubscriptionStatus;
  uid: string;
  goals: UserGoals;
  onDelete?: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ history, isLoading, error, onRetry, subscriptionStatus, uid, goals, onDelete }) => {
  
  // Calculate Streak
  const currentStreak = useMemo(() => {
    if (!history || history.length === 0) return 0;
    
    // Sort days descending (newest first)
    // history is already sorted by db service but let's be safe
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Check if we have an entry for today or yesterday to keep streak alive
    const lastEntryDate = new Date(sortedHistory[0].date);
    lastEntryDate.setHours(0,0,0,0);
    
    const diffTime = Math.abs(today.getTime() - lastEntryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays > 1) return 0; // Streak broken

    streak = 1;
    for (let i = 0; i < sortedHistory.length - 1; i++) {
        const curr = new Date(sortedHistory[i].date);
        const next = new Date(sortedHistory[i+1].date);
        const dTime = Math.abs(curr.getTime() - next.getTime());
        const dDays = Math.ceil(dTime / (1000 * 60 * 60 * 24));
        
        if (dDays === 1) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
  }, [history]);

  // Prepare Chart Data (Last 7 days)
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dataPoints = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        const shortDay = days[d.getDay()];
        
        const log = history.find(h => h.date === dateStr);
        dataPoints.push({
            label: shortDay,
            value: log ? log.totals.calories : 0
        });
    }
    return dataPoints;
  }, [history]);

  if (subscriptionStatus !== 'pro_plan') {
     return (
        <div className="w-full px-4 py-6 pb-24 animate-fade-in flex flex-col items-center justify-center h-[80vh]">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center mb-6 shadow-xl border border-slate-700">
                <Lock size={40} className="text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 text-center">Analytics Locked</h2>
            <p className="text-slate-400 text-center max-w-xs mb-8 leading-relaxed">
                Upgrade to <span className="text-white font-semibold">Pro Plan</span> to unlock detailed progress tracking, analytics, and history.
            </p>
            
            <a 
                href={`${STRIPE_PAYMENT_LINK}?client_reference_id=${uid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-purple-600/20 hover:scale-105 transition-transform"
            >
                <Crown size={20} fill="currentColor" />
                Upgrade to Pro
            </a>
        </div>
     );
  }

  return (
    <div className="w-full px-4 py-6 pb-24 animate-fade-in">
      <div className="flex justify-between items-center mb-6 pl-2">
        <h1 className="text-2xl font-bold text-white">Progress</h1>
        {onRetry && !isLoading && (
            <button onClick={onRetry} className="text-slate-400 hover:text-white p-2">
                <RefreshCw size={18} />
            </button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
          <p>Loading analytics...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-auto text-slate-500 bg-slate-800/30 rounded-xl border border-red-500/20 p-6 text-center mx-2">
          <WifiOff size={48} className="mb-4 text-red-400" />
          <p className="text-red-300 font-medium mb-2">Connection Failed</p>
          <p className="text-xs text-slate-400 mb-4">{error}</p>
          {onRetry && (
            <button 
                onClick={onRetry}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            >
                Try Again
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Top Widgets */}
          <div className="grid grid-cols-2 gap-4">
              {/* Streak Widget */}
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500">
                        <Flame size={20} fill="currentColor" />
                      </div>
                  </div>
                  <div className="text-3xl font-bold text-white">{currentStreak}</div>
                  <div className="text-sm text-slate-400">Day Streak</div>
              </div>

              {/* Average Widget (Simplified) */}
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                        <TrendingUp size={20} />
                      </div>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {history.length > 0 ? Math.round(history.reduce((acc, day) => acc + day.totals.calories, 0) / history.length) : 0}
                  </div>
                  <div className="text-sm text-slate-400">Avg Calories</div>
              </div>
          </div>

          {/* Chart Section */}
          <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-white">Goal Progress</h3>
                  <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                      Last 7 Days
                  </div>
              </div>
              
              {/* Custom Chart */}
              <AnalyticsChart data={chartData} goal={goals.calories} />
          </div>

          {/* History List */}
          <div>
              <h3 className="text-lg font-semibold text-white mb-4 px-1">History Log</h3>
              {history.length === 0 ? (
                <div className="text-center py-10 text-slate-500 bg-slate-800/30 rounded-xl dashed border border-slate-700/50">
                    No logs found.
                </div>
              ) : (
                <div className="space-y-4">
                    {history.map((day) => (
                        <div key={day.date} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-white font-medium">{day.date}</h3>
                                <span className={`text-sm font-bold ${day.totals.calories > goals.calories ? 'text-red-400' : 'text-green-400'}`}>
                                    {day.totals.calories} / {goals.calories} kcal
                                </span>
                            </div>
                            {/* Macro Bar */}
                            <div className="flex h-2 bg-slate-900 rounded-full overflow-hidden mb-3">
                                <div className="bg-red-400" style={{ width: `${(day.totals.protein / (day.totals.protein + day.totals.carbs + day.totals.fat || 1)) * 100}%` }} />
                                <div className="bg-blue-400" style={{ width: `${(day.totals.carbs / (day.totals.protein + day.totals.carbs + day.totals.fat || 1)) * 100}%` }} />
                                <div className="bg-yellow-400" style={{ width: `${(day.totals.fat / (day.totals.protein + day.totals.carbs + day.totals.fat || 1)) * 100}%` }} />
                            </div>
                            
                            {/* Collapsed Items Hint or Expand logic could go here, for now just summary */}
                            <div className="flex gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> {day.totals.protein}g Protein</span>
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> {day.totals.carbs}g Carbs</span>
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div> {day.totals.fat}g Fat</span>
                            </div>
                        </div>
                    ))}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
