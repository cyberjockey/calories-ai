import React from 'react';
import { View } from '../types';
import { Home, PlusCircle, History, User } from 'lucide-react';

interface BottomNavProps {
  currentView: View;
  onChangeView: (view: View) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView }) => {
  const navItems = [
    { view: View.DASHBOARD, icon: Home, label: 'Home' },
    { view: View.SCANNER, icon: PlusCircle, label: 'Log', primary: true },
    { view: View.HISTORY, icon: History, label: 'History' },
    { view: View.PROFILE, icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 pb-safe-area">
      <div className="flex justify-around items-center h-16 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;
          
          if (item.primary) {
            return (
              <button
                key={item.view}
                onClick={() => onChangeView(item.view)}
                className="relative -top-5 bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-transform active:scale-95"
              >
                <Icon size={28} strokeWidth={2.5} />
              </button>
            );
          }

          return (
            <button
              key={item.view}
              onClick={() => onChangeView(item.view)}
              className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${
                isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;