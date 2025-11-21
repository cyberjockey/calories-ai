
import React, { useState } from 'react';
import { UserGoals, FoodItem, MacroNutrients } from '../types';
import CalorieRing from '../components/CalorieRing';
import FoodCard from '../components/FoodCard';
import FoodDetailModal from '../components/FoodDetailModal';

interface DashboardProps {
  goals: UserGoals;
  todayLog: FoodItem[];
  onDelete: (id: string) => void;
  onUpdateItem?: (item: FoodItem) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ goals, todayLog, onDelete, onUpdateItem }) => {
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);

  // Calculate totals
  const totals: MacroNutrients = todayLog.reduce((acc, item) => ({
    calories: acc.calories + item.calories,
    protein: acc.protein + item.protein,
    carbs: acc.carbs + item.carbs,
    fat: acc.fat + item.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <div className="flex flex-col items-center w-full pb-24 animate-fade-in">
      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Today</h1>
          <p className="text-slate-400 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
          AI
        </div>
      </header>

      {/* Main Ring */}
      <div className="mt-2 mb-8">
        <CalorieRing current={totals.calories} target={goals.calories} />
      </div>

      {/* Macros Grid */}
      <div className="w-full px-6 grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800/50 p-4 rounded-2xl flex flex-col items-center border border-slate-700/50 backdrop-blur-sm">
          <span className="text-red-400 font-bold text-xl">{Math.round(totals.protein)}g</span>
          <span className="text-slate-500 text-xs uppercase tracking-wider mt-1">Protein</span>
          <div className="w-full bg-slate-700 h-1 mt-3 rounded-full overflow-hidden">
             <div className="bg-red-400 h-full" style={{ width: `${Math.min(100, (totals.protein / goals.protein) * 100)}%` }}></div>
          </div>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-2xl flex flex-col items-center border border-slate-700/50 backdrop-blur-sm">
          <span className="text-blue-400 font-bold text-xl">{Math.round(totals.carbs)}g</span>
          <span className="text-slate-500 text-xs uppercase tracking-wider mt-1">Carbs</span>
          <div className="w-full bg-slate-700 h-1 mt-3 rounded-full overflow-hidden">
             <div className="bg-blue-400 h-full" style={{ width: `${Math.min(100, (totals.carbs / goals.carbs) * 100)}%` }}></div>
          </div>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-2xl flex flex-col items-center border border-slate-700/50 backdrop-blur-sm">
          <span className="text-yellow-400 font-bold text-xl">{Math.round(totals.fat)}g</span>
          <span className="text-slate-500 text-xs uppercase tracking-wider mt-1">Fat</span>
          <div className="w-full bg-slate-700 h-1 mt-3 rounded-full overflow-hidden">
             <div className="bg-yellow-400 h-full" style={{ width: `${Math.min(100, (totals.fat / goals.fat) * 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Food Log */}
      <div className="w-full px-4">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-lg font-semibold text-white">Logged Items</h2>
          <span className="text-xs text-slate-500">{todayLog.length} items</span>
        </div>
        
        {todayLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600 bg-slate-800/30 rounded-2xl border border-slate-800/50 dashed">
            <p>No meals logged yet.</p>
            <p className="text-sm mt-2">Tap the + button to start tracking.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayLog.map(item => (
              <FoodCard 
                key={item.id} 
                item={item} 
                onDelete={onDelete}
                onClick={setSelectedItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && onUpdateItem && (
        <FoodDetailModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onDelete={(id) => { onDelete(id); setSelectedItem(null); }}
            onUpdate={(updatedItem) => { onUpdateItem(updatedItem); setSelectedItem(null); }}
        />
      )}
    </div>
  );
};

export default Dashboard;
