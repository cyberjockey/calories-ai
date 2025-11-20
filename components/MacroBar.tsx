import React from 'react';

interface MacroBarProps {
  label: string;
  current: number;
  total: number;
  color: string;
  unit?: string;
}

const MacroBar: React.FC<MacroBarProps> = ({ label, current, total, color, unit = 'g' }) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-1">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="text-sm font-bold text-white">
          {Math.round(current)} <span className="text-slate-500 text-xs font-normal">/ {total}{unit}</span>
        </span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div 
          className="h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%`, backgroundColor: color }}
        ></div>
      </div>
    </div>
  );
};

export default MacroBar;