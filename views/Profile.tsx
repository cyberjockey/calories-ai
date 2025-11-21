
import React from 'react';
import { UserGoals, SubscriptionStatus } from '../types';
import { LogOut, Zap, Crown, FileText } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { STRIPE_PAYMENT_LINK } from '../config';

interface ProfileProps {
  goals: UserGoals;
  setGoals: (goals: UserGoals) => void;
  subscriptionStatus: SubscriptionStatus;
  dailyUsage: number;
  uid: string;
}

const Profile: React.FC<ProfileProps> = ({ goals, setGoals, subscriptionStatus, dailyUsage, uid }) => {
  const handleChange = (key: keyof UserGoals, value: string) => {
    const num = parseInt(value) || 0;
    setGoals({ ...goals, [key]: num });
  };

  const handleSignOut = () => {
    signOut(auth);
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
        
        {/* Subscription Section */}
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 relative overflow-hidden">
            {subscriptionStatus === 'pro_plan' && (
                <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                    <Crown size={100} className="text-yellow-500" />
                </div>
            )}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h2 className="text-white font-bold text-lg">Subscription</h2>
                    <p className="text-slate-400 text-sm mt-1">
                        {subscriptionStatus === 'free_plan' ? 'Free Plan' : 'Pro Plan'}
                    </p>
                </div>
                {subscriptionStatus === 'pro_plan' ? (
                    <div className="bg-gradient-to-tr from-yellow-500 to-amber-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Crown size={12} fill="currentColor" />
                        PRO
                    </div>
                ) : (
                    <div className="bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                        FREE
                    </div>
                )}
            </div>

            {subscriptionStatus === 'free_plan' ? (
                <div className="relative z-10">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300">Daily Analyses</span>
                        <span className="text-white font-bold">{dailyUsage} / 3</span>
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${dailyUsage >= 3 ? 'bg-red-500' : 'bg-blue-500'}`} 
                            style={{ width: `${Math.min(100, (dailyUsage / 3) * 100)}%` }}
                        ></div>
                    </div>
                    <a 
                        href={`${STRIPE_PAYMENT_LINK}?client_reference_id=${uid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center w-full mt-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-bold text-sm shadow-lg shadow-blue-900/20"
                    >
                        Upgrade to Pro
                    </a>
                </div>
            ) : (
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                        <Zap size={16} fill="currentColor" />
                        <span className="font-bold">Unlimited Analyses</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-400 text-sm">
                        <FileText size={16} />
                        <span className="font-bold">Daily Reports Included</span>
                    </div>
                </div>
            )}
        </div>

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
      </div>
    </div>
  );
};

export default Profile;
