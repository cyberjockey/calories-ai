import React from 'react';
import { DayLog } from '../types';
import { Calendar } from 'lucide-react';

interface HistoryProps {
  history: DayLog[];
}

const History: React.FC<HistoryProps> = ({ history }) => {
  // Simple charts can be complex, let's do a list summary for now
  return (
    <div className="w-full px-4 py-6 pb-24 animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6 pl-2">History</h1>
      
      {history.length === 0 ? (
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