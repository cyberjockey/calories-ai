import React, { useState, useEffect } from 'react';
import { View, FoodItem, UserGoals, DayLog } from './types';
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
  getUserGoals, 
  updateUserGoals, 
  addFoodItemToDb, 
  deleteFoodItemFromDb, 
  subscribeToTodaysLogs 
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
  const [history] = useState<DayLog[]>([]); // History logic needs full DB implementation, keeping empty for now or need new query

  // 1. Handle Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Handle Data Subscription (Only when user is logged in)
  useEffect(() => {
    if (!user) return;

    // Fetch initial goals
    getUserGoals(user.uid).then((fetchedGoals) => {
      if (fetchedGoals) {
        setGoals(fetchedGoals);
      } else {
        // Initialize default goals for new user
        updateUserGoals(user.uid, DEFAULT_GOALS);
      }
    });

    // Subscribe to today's logs
    const unsubscribeLogs = subscribeToTodaysLogs(user.uid, (items) => {
      setTodayLog(items);
    });

    return () => unsubscribeLogs();
  }, [user]);

  // Handlers
  const handleAddItems = async (newItems: FoodItem[]) => {
    if (!user) return;
    // Optimistically update or wait for subscription? 
    // Firestore subscription is fast, but we should add to DB here.
    for (const item of newItems) {
      await addFoodItemToDb(user.uid, item);
    }
    // Note: We don't manually setTodayLog here because the onSnapshot listener will do it for us.
  };

  const handleDeleteItem = async (id: string) => {
    if (!user) return;
    await deleteFoodItemFromDb(user.uid, id);
  };

  const handleUpdateGoals = async (newGoals: UserGoals) => {
    if (!user) return;
    setGoals(newGoals); // Optimistic update
    await updateUserGoals(user.uid, newGoals);
  };

  // Navigation Handler
  const handleNavChange = (view: View) => {
    setCurrentView(view);
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="h-screen w-full bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  // Login Screen
  if (!user) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard goals={goals} todayLog={todayLog} onDelete={handleDeleteItem} />;
      case View.HISTORY:
        return <History history={history} />;
      case View.PROFILE:
        return <Profile goals={goals} setGoals={handleUpdateGoals} />;
      case View.SCANNER:
        // Scanner overlay logic handled below
        return <Dashboard goals={goals} todayLog={todayLog} onDelete={handleDeleteItem} />; 
      default:
        return <Dashboard goals={goals} todayLog={todayLog} onDelete={handleDeleteItem} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex justify-center">
      <div className="w-full max-w-md relative shadow-2xl bg-slate-900 min-h-screen">
        
        {/* Main Content Area */}
        <main className="w-full h-full pt-safe-top">
          {renderView()}
        </main>

        {/* Scanner Modal Overlay */}
        {currentView === View.SCANNER && (
          <Scanner 
            onAddItems={handleAddItems} 
            onClose={() => setCurrentView(View.DASHBOARD)}
            n8nUrl={goals.n8nUrl} 
          />
        )}

        {/* Bottom Navigation */}
        <BottomNav currentView={currentView === View.SCANNER ? View.DASHBOARD : currentView} onChangeView={handleNavChange} />
        
      </div>
    </div>
  );
};

export default App;