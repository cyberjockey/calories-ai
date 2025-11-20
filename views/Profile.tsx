import React from 'react';
import { UserGoals } from '../types';
import { Link2, LogOut } from 'lucide-react';
import { auth } from '../firebase';

interface ProfileProps {
  goals: UserGoals;
  setGoals: (goals: UserGoals) => void;
}

const Profile: React.FC<ProfileProps> = ({ goals, setGoals }) => {
  const handleChange = (key: keyof UserGoals, value: string | number) => {
    // Handle n8nUrl string vs number fields
    if (key === 'n8nUrl') {
        setGoals({ ...goals, [key]: value as string });
    } else {
        const num = parseInt(value as string) || 0;
        setGoals({ ...goals, [key]: num });
    }
  };

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <div className="w-full px-6 py-6 pb-24 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Your Profile</h1>
        <button 
            onClick={handleSignOut}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-full hover:bg-slate-800"
            title="Sign Out"
        >
            <LogOut size={20} />
        </button>
      </div>
      
      <div className="space-y-6">
        
        {/* Goals Section */}
        <div>
            <h2 className="text-lg font-semibold text-white mb-4">Daily Goals</h2>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mb-4">
                <label className="block text-slate-400 text-sm font-medium mb-2">Daily Calories</label>
                <div className="flex items-center bg-slate-900 rounded-xl px-4 border border-slate-700 focus-within:border-blue-500">
                    <input 
                        type="number" 
                        value={goals.calories}
                        onChange={(e) => handleChange('calories', e.target.value)}
                        className="w-full bg-transparent py-4 text-white font-bold text-lg outline-none"
                    />
                    <span className="text-slate-500 text-sm">kcal</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                    <label className="block text-red-400 text-xs font-bold mb-2 uppercase">Protein</label>
                    <input 
                        type="number" 
                        value={goals.protein}
                        onChange={(e) => handleChange('protein', e.target.value)}
                        className="w-full bg-slate-900 rounded-lg py-2 px-2 text-white text-center font-semibold border border-slate-700 outline-none focus:border-red-400"
                    />
                    <span className="block text-center text-xs text-slate-500 mt-1">grams</span>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                    <label className="block text-blue-400 text-xs font-bold mb-2 uppercase">Carbs</label>
                    <input 
                        type="number" 
                        value={goals.carbs}
                        onChange={(e) => handleChange('carbs', e.target.value)}
                        className="w-full bg-slate-900 rounded-lg py-2 px-2 text-white text-center font-semibold border border-slate-700 outline-none focus:border-blue-400"
                    />
                    <span className="block text-center text-xs text-slate-500 mt-1">grams</span>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                    <label className="block text-yellow-400 text-xs font-bold mb-2 uppercase">Fat</label>
                    <input 
                        type="number" 
                        value={goals.fat}
                        onChange={(e) => handleChange('fat', e.target.value)}
                        className="w-full bg-slate-900 rounded-lg py-2 px-2 text-white text-center font-semibold border border-slate-700 outline-none focus:border-yellow-400"
                    />
                    <span className="block text-center text-xs text-slate-500 mt-1">grams</span>
                </div>
            </div>
        </div>

        {/* Integrations Section */}
        <div>
            <h2 className="text-lg font-semibold text-white mb-4">Integrations</h2>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                    <Link2 size={16} className="text-blue-400" />
                    <label className="block text-slate-400 text-sm font-medium">n8n Webhook URL</label>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                    Automatically send logged meals to your workflow. Payload: <code className="bg-slate-900 px-1 rounded text-blue-200">{`{calories, protein, carbs, fat, notes}`}</code>
                </p>
                <input 
                    type="url" 
                    value={goals.n8nUrl || ''}
                    onChange={(e) => handleChange('n8nUrl', e.target.value)}
                    placeholder="https://your-n8n-instance.com/webhook/..."
                    className="w-full bg-slate-900 rounded-xl p-4 text-white text-sm border border-slate-700 focus:border-blue-500 outline-none placeholder:text-slate-600"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;