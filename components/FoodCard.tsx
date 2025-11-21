
import React from 'react';
import { FoodItem } from '../types';
import { Trash2 } from 'lucide-react';

interface FoodCardProps {
  item: FoodItem;
  onDelete: (id: string) => void;
  onClick?: (item: FoodItem) => void;
}

const FoodCard: React.FC<FoodCardProps> = ({ item, onDelete, onClick }) => {
  return (
    <div 
        onClick={() => onClick?.(item)}
        className={`bg-slate-800/50 rounded-xl p-4 flex items-center gap-4 mb-3 border border-slate-700/50 ${onClick ? 'cursor-pointer hover:bg-slate-800 transition-colors' : ''}`}
    >
        {item.imageUrl ? (
            <img 
                src={item.imageUrl.startsWith('data:') ? item.imageUrl : `data:image/jpeg;base64,${item.imageUrl}`} 
                alt={item.name} 
                className="w-16 h-16 rounded-lg object-cover bg-slate-700 shrink-0"
            />
        ) : (
            <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center text-2xl shrink-0">
                🍎
            </div>
        )}
      
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium truncate">{item.name}</h4>
        <p className="text-slate-400 text-xs truncate">{item.notes || 'No notes'}</p>
        <div className="flex gap-3 mt-1 text-xs text-slate-400">
            <span className="text-green-400 font-bold">{Math.round(item.calories)} cal</span>
            <span>P: {Math.round(item.protein)}g</span>
            <span>C: {Math.round(item.carbs)}g</span>
            <span>F: {Math.round(item.fat)}g</span>
        </div>
      </div>

      <button 
        onClick={(e) => {
            e.stopPropagation(); // Prevent opening modal when clicking delete
            onDelete(item.id);
        }}
        className="p-2 text-slate-500 hover:text-red-400 transition-colors shrink-0"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default FoodCard;
