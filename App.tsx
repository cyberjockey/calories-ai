
import React, { useState, useEffect } from 'react';
import { View, FoodItem, UserGoals, DayLog, SubscriptionStatus } from './types';
import BottomNav from './components/BottomNav';
import Dashboard from './views/Dashboard';
import Scanner from './views/Scanner';
import History from './views/History';
import Profile from './views/Profile';
import Login from './views/Login';

// Firebase
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  getUserData, 
  updateUserGoals, 
  addFoodItemToDb, 
  deleteFoodItemFromDb,
  getFoodHistoryFromDb,
  incrementDailyAnalysisCount
} from './services/db';
import { Loader2 } from 'lucide-react';

const DEFAULT_GOALS: UserGoals = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fat: 70
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  // Data States
  const [todayLog, setTodayLog] = useState<FoodItem[]>([]);
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS);
  const [history, setHistory] = useState<DayLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('free_plan');
  const [dailyUsage, setDailyUsage] = useState(0);

  // 1. Handle Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Helper to process flat history data into DayLog[]
  const processHistoryData = (data: FoodItem[]): DayLog[] => {
    if (!Array.isArray(data)) return [];
    
    const grouped: Record<string, FoodItem[]> = {};
    
    data.forEach((item) => {
       const dateKey = new Date(item.timestamp).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
       if (!grouped[dateKey]) grouped[dateKey] = [];
       grouped[dateKey].push(item);
    });

    // Convert to DayLog
    return Object.keys(grouped).map(date => {
        const items = grouped[date];
        // Sort items within day by time descending
        items.sort((a, b) => b.timestamp - a.timestamp);

        const totals = items.reduce((acc, cur) => ({
            calories: acc.calories + cur.calories,
            protein: acc.protein + cur.protein,
            carbs: acc.carbs + cur.carbs,
            fat: acc.fat + cur.fat
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        
        return { date, items, totals };
    }).sort((a, b) => {
         // Sort days by the timestamp of their most recent item
         const timeA = a.items[0]?.timestamp || 0;
         const timeB = b.items[0]?.timestamp || 0;
         return timeB - timeA;
    });
  };

  const fetchHistory = async (uid: string) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const items = await getFoodHistoryFromDb(uid);
      const processedHistory = processHistoryData(items);
      setHistory(processedHistory);

      // Extract "Today's" data from history for the Dashboard
      const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      const todayEntry = processedHistory.find(day => day.date === todayStr);
      setTodayLog(todayEntry ? todayEntry.items : []);
    } catch (e) {
      console.error("History fetch error:", e);
      setHistoryError("Failed to load history from database.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // 2. Handle Data Fetching (Only when user is logged in)
  useEffect(() => {
    if (!user) return;

    // Fetch User Data (Goals, Subscription, Usage)
    getUserData(user.uid).then((data) => {
      if (data.goals) {
        setGoals(data.goals);
      } else {
        updateUserGoals(user.uid, DEFAULT_GOALS).catch(err => console.warn("Init goals failed", err));
      }
      setSubscriptionStatus(data.subscriptionStatus);
      setDailyUsage(data.dailyUsage);
    });

    // Fetch History on load
    fetchHistory(user.uid);
  }, [user]);

  // 3. Fetch History when switching to History view
  useEffect(() => {
    if (currentView === View.HISTORY && user) {
        fetchHistory(user.uid);
    }
  }, [currentView, user]);

  // Handlers
  const handleAddItems = async (newItems: FoodItem[]) => {
    if (!user) return;
    await Promise.all(newItems.map(item => addFoodItemToDb(user.uid, item)));
    fetchHistory(user.uid);
  };

  const handleAnalysisComplete = () => {
      if (user) {
          incrementDailyAnalysisCount(user.uid);
          setDailyUsage(prev => prev + 1);
      }
  };

  const handleDeleteItem = async (id: string) => {
    if (!user) return;
    await deleteFoodItemFromDb(user.uid, id);
    fetchHistory(user.uid);
  };

  const handleUpdateGoals = async (newGoals: UserGoals) => {
    if (!user) return;
    setGoals(newGoals);
    await updateUserGoals(user.uid, newGoals);
  };

  const handleNavChange = (view: View) => {
    if (view === View.HISTORY && currentView === View.HISTORY && user) {
         fetchHistory(user.uid);
    }
    setCurrentView(view);
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard goals={goals} todayLog={todayLog} onDelete={handleDeleteItem} />;
      case View.HISTORY:
        return (
            <History 
                history={history} 
                isLoading={historyLoading} 
                error={historyError} 
                onRetry={() => fetchHistory(user.uid)} 
                subscriptionStatus={subscriptionStatus}
                uid={user.uid}
            />
        );
      case View.PROFILE:
        return <Profile goals={goals} setGoals={handleUpdateGoals} subscriptionStatus={subscriptionStatus} dailyUsage={dailyUsage} uid={user.uid} />;
      case View.SCANNER:
        return <Dashboard goals={goals} todayLog={todayLog} onDelete={handleDeleteItem} />; 
      default:
        return <Dashboard goals={goals} todayLog={todayLog} onDelete={handleDeleteItem} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex justify-center">
      <div className="w-full max-w-md relative shadow-2xl bg-slate-900 min-h-screen">
        
        <main className="w-full h-full pt-safe-top">
          {renderView()}
        </main>

        {currentView === View.SCANNER && (
          <Scanner 
            onAddItems={handleAddItems} 
            onClose={() => setCurrentView(View.DASHBOARD)}
            uid={user.uid} 
            subscriptionStatus={subscriptionStatus}
            dailyUsage={dailyUsage}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        <BottomNav currentView={currentView === View.SCANNER ? View.DASHBOARD : currentView} onChangeView={handleNavChange} />
        
      </div>
    </div>
  );
};

export default App;
