
import React from 'react';
import { DayLog, SubscriptionStatus } from '../types';
import { Calendar, Loader2, RefreshCw, WifiOff, Lock, Crown } from 'lucide-react';
import { STRIPE_PAYMENT_LINK } from '../config';

interface HistoryProps {
  history: DayLog[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  subscriptionStatus: SubscriptionStatus;
  uid: string;
}

const History: React.FC<HistoryProps> = ({ history, isLoading, error, onRetry, subscriptionStatus, uid }) => {
  
  if (subscriptionStatus !== 'pro_plan') {
     return (
        <div className="w-full px-4 py-6 pb-24 animate-fade-in flex flex-col items-center justify-center h-[80vh]">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center mb-6 shadow-xl border border-slate-700">
                <Lock size={40} className="text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 text-center">History is Locked</h2>
            <p className="text-slate-400 text-center max-w-xs mb-8 leading-relaxed">
                Upgrade to <span className="text-white font-semibold">Pro Plan</span> to unlock your full nutritional history and detailed daily logs.
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
        <h1 className="text-2xl font-bold text-white">History</h1>
        {onRetry && !isLoading && (
            <button onClick={onRetry} className="text-slate-400 hover:text-white p-2">
                <RefreshCw size={18} />
            </button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
          <p>Fetching history...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-auto text-slate-500 bg-slate-800/30 rounded-xl border border-red-500/20 p-6 text-center mx-2">
          <WifiOff size={48} className="mb-4 text-red-400" />
          <p className="text-red-300 font-medium mb-2">Connection Failed</p>
          <p className="text-xs text-slate-400 mb-4">{error}</p>
          
          {error.includes('Test webhook') || error.includes('test') ? (
             <div className="mb-4 bg-slate-800/80 p-3 rounded-lg">
                 <p className="text-xs text-yellow-500">
                    ⚠️ You are using a <strong>Test URL</strong>. 
                    Make sure you pressed <strong>"Execute"</strong> in N8N before refreshing.
                 </p>
             </div>
          ) : null}

          {onRetry && (
            <button 
                onClick={onRetry}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            >
                Try Again
            </button>
          )}
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <Calendar size={48} className="mb-4 opacity-20" />
          <p>No history available yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((day) => (
             <div key={day.date} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-medium">{day.date}</h3>
                    <span className="text-slate-400 text-sm">{day.totals.calories} kcal</span>
                </div>
                <div className="flex h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="bg-red-400" style={{ width: `${(day.totals.protein / (day.totals.protein + day.totals.carbs + day.totals.fat)) * 100}%` }} />
                    <div className="bg-blue-400" style={{ width: `${(day.totals.carbs / (day.totals.protein + day.totals.carbs + day.totals.fat)) * 100}%` }} />
                    <div className="bg-yellow-400" style={{ width: `${(day.totals.fat / (day.totals.protein + day.totals.carbs + day.totals.fat)) * 100}%` }} />
                </div>
                <div className="flex gap-4 mt-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> {day.totals.protein}g P</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> {day.totals.carbs}g C</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> {day.totals.fat}g F</div>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
