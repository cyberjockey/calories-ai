
import React, { useState } from 'react';
import { FoodItem } from '../types';
import { X, Flame, Minus, Plus, Check, Pencil } from 'lucide-react';

interface FoodDetailModalProps {
  item: FoodItem;
  onClose: () => void;
  onUpdate: (item: FoodItem) => void;
  onDelete: (id: string) => void;
}

const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ item, onClose, onUpdate, onDelete }) => {
  const [multiplier, setMultiplier] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  
  // Editable states
  const [name, setName] = useState(item.name);
  const [notes, setNotes] = useState(item.notes || '');
  
  // Calculate display values based on multiplier
  // Note: If editing, we might want to allow manual macro entry, but for simplicity 
  // we keep the multiplier logic unless we are in full edit mode.
  // Here, multiplier scales the BASE values provided in `item`.
  const calories = Math.round(item.calories * multiplier);
  const protein = Math.round(item.protein * multiplier);
  const carbs = Math.round(item.carbs * multiplier);
  const fat = Math.round(item.fat * multiplier);

  const handleSave = () => {
    onUpdate({
      ...item,
      name,
      notes,
      calories,
      protein,
      carbs,
      fat
    });
    onClose();
  };

  const handleIncrement = () => setMultiplier(prev => Math.min(prev + 0.5, 5));
  const handleDecrement = () => setMultiplier(prev => Math.max(prev - 0.5, 0.5));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden pointer-events-auto animate-slide-up shadow-2xl border border-slate-800 max-h-[90vh] flex flex-col">
        
        {/* Image Header */}
        <div className="relative h-64 w-full bg-slate-800">
          {item.imageUrl ? (
            <img 
              src={item.imageUrl.startsWith('data:') ? item.imageUrl : `data:image/jpeg;base64,${item.imageUrl}`} 
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🍎</div>
          )}
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 backdrop-blur-md text-white p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Header & Quantity */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 mr-4">
               {isEditing ? (
                   <input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-slate-800 text-2xl font-bold text-white w-full rounded p-1 outline-none focus:ring-2 focus:ring-blue-500"
                   />
               ) : (
                   <h2 className="text-2xl font-bold text-white leading-tight">{name}</h2>
               )}
               <p className="text-slate-400 text-sm mt-1">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
            
            {/* Quantity Stepper */}
            <div className="flex items-center bg-slate-800 rounded-full p-1 border border-slate-700">
              <button onClick={handleDecrement} className="p-2 text-slate-400 hover:text-white transition-colors">
                <Minus size={16} />
              </button>
              <span className="w-8 text-center font-bold text-white">{multiplier}x</span>
              <button onClick={handleIncrement} className="p-2 text-slate-400 hover:text-white transition-colors">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Main Calorie Display */}
          <div className="bg-slate-800/50 rounded-2xl p-4 flex items-center justify-between border border-slate-700 mb-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/20 rounded-full text-orange-500">
                    <Flame size={24} fill="currentColor" />
                </div>
                <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Calories</span>
                    <div className="text-2xl font-bold text-white">{calories}</div>
                </div>
            </div>
            <div className="text-right">
                 {isEditing ? (
                     <button 
                        onClick={() => setIsEditing(false)} 
                        className="text-xs text-blue-400 font-bold flex items-center gap-1 hover:underline"
                     >
                        Save Name
                     </button>
                 ) : (
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="text-xs text-slate-500 flex items-center gap-1 hover:text-white transition-colors"
                    >
                        <Pencil size={12} /> Edit
                    </button>
                 )}
            </div>
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
                <div className="text-red-400 font-bold text-lg">{protein}g</div>
                <div className="text-slate-500 text-xs uppercase font-medium">Protein</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
                <div className="text-blue-400 font-bold text-lg">{carbs}g</div>
                <div className="text-slate-500 text-xs uppercase font-medium">Carbs</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
                <div className="text-yellow-400 font-bold text-lg">{fat}g</div>
                <div className="text-slate-500 text-xs uppercase font-medium">Fat</div>
            </div>
          </div>

          {/* Ingredients / Notes */}
          <div className="mb-8">
            <h3 className="text-white font-semibold mb-2">Notes / Ingredients</h3>
            {isEditing ? (
                <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-800 text-slate-300 text-sm rounded-xl p-3 min-h-[80px] outline-none focus:ring-2 focus:ring-blue-500"
                />
            ) : (
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                    <p className="text-slate-400 text-sm leading-relaxed">
                        {notes || "No notes available."}
                    </p>
                </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-auto">
             <button 
                onClick={() => onDelete(item.id)}
                className="flex-1 py-4 rounded-xl border border-slate-700 text-slate-400 font-semibold hover:bg-slate-800 hover:text-red-400 transition-colors"
             >
                Delete
             </button>
             <button 
                onClick={handleSave}
                className="flex-[2] py-4 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
             >
                <Check size={20} />
                Done
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetailModal;
