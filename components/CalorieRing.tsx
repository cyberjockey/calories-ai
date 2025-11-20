import React from 'react';

interface CalorieRingProps {
  current: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}

const CalorieRing: React.FC<CalorieRingProps> = ({ 
  current, 
  target, 
  size = 280, 
  strokeWidth = 20 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Cap percentage at 100 for the main ring, but we can show overage differently if needed
  const percentage = Math.min(100, Math.max(0, (current / target) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const isOverLimit = current > target;
  const ringColor = isOverLimit ? '#ef4444' : '#22c55e'; // Red if over, Green if good

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background Circle */}
      <svg width={size} height={size} className="transform -rotate-90 transition-all duration-500 ease-in-out">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e293b" /* Slate 800 */
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Center Text */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-6xl font-bold text-white tabular-nums tracking-tighter">
          {Math.round(target - current)}
        </span>
        <span className="text-slate-400 text-sm uppercase tracking-widest font-medium mt-1">
          Calories Left
        </span>
        <div className="mt-2 text-xs text-slate-500">
            Target: {target}
        </div>
      </div>
    </div>
  );
};

export default CalorieRing;