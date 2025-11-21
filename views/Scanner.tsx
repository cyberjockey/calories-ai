
import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Loader2, Lock } from 'lucide-react';
import { analyzeFoodImage, analyzeFoodText, GeminiAnalysisResult, fileToGenerativePart } from '../services/geminiService';
import { Status, FoodItem, SubscriptionStatus } from '../types';
import { N8N_WEBHOOK_URL, STRIPE_PAYMENT_LINK } from '../config';

interface ScannerProps {
  onAddItems: (items: FoodItem[]) => void;
  onClose: () => void;
  uid: string;
  subscriptionStatus: SubscriptionStatus;
  dailyUsage: number;
  onAnalysisComplete: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ 
  onAddItems, 
  onClose, 
  uid, 
  subscriptionStatus, 
  dailyUsage, 
  onAnalysisComplete 
}) => {
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResult | null>(null);
  const [mode, setMode] = useState<'PHOTO' | 'TEXT'>('PHOTO');

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const FREE_LIMIT = 3;
  const isFree = subscriptionStatus === 'free_plan';
  const limitReached = isFree && dailyUsage >= FREE_LIMIT;

  useEffect(() => {
    console.log(`[Scanner] Daily Usage: ${dailyUsage}/${FREE_LIMIT}, Limit Reached: ${limitReached}`);
  }, [dailyUsage, limitReached]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToGenerativePart(file);
      setImageBase64(base64);
      setImagePreview(URL.createObjectURL(file));
      setStatus(Status.IDLE);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnalyze = async () => {
    if (limitReached) {
        console.warn("[Scanner] Analysis blocked: Limit reached");
        return;
    }
    if (mode === 'PHOTO' && !imageBase64) return;
    if (mode === 'TEXT' && !textInput.trim()) return;

    setStatus(Status.ANALYZING);

    try {
      let result: GeminiAnalysisResult;
      if (mode === 'PHOTO' && imageBase64) {
        result = await analyzeFoodImage(imageBase64, textInput);
      } else {
        result = await analyzeFoodText(textInput);
      }
      
      // Critical: Set result first
      setAnalysisResult(result);
      setStatus(Status.SUCCESS);
      
      // Increment usage ONCE per successful API call (upload), regardless of items found
      console.log("[Scanner] Analysis successful. Incrementing upload count.");
      onAnalysisComplete(); 
      
    } catch (error) {
      console.error(error);
      setStatus(Status.ERROR);
    }
  };

  const handleConfirm = async () => {
    if (!analysisResult) return;

    const newItems: FoodItem[] = analysisResult.foodItems.map(item => ({
      id: crypto.randomUUID(),
      name: item.name,
      notes: item.notes,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      timestamp: Date.now(),
      imageUrl: imageBase64 || undefined
    }));

    try {
        const targetUrl = N8N_WEBHOOK_URL;
        for (const item of newItems) {
            let finalNotes = item.notes || '';
            if (item.name && !finalNotes.toLowerCase().includes(item.name.toLowerCase())) {
                finalNotes = `${item.name} - ${finalNotes}`;
            }

            const payload = {
                uid: uid,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                notes: finalNotes
            };
            
            fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true
            }).catch(err => console.error("Failed to send item to N8N:", err));
        }
    } catch (err) {
        console.error("Error sending to n8n", err);
    }

    onAddItems(newItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-slate-900 border-b border-slate-800">
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
          <X size={24} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold text-white">Log Food</h2>
          {isFree && (
              <span className={`text-xs ${limitReached ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                  Free Plan: {dailyUsage}/{FREE_LIMIT} uploads today
              </span>
          )}
          {!isFree && <span className="text-xs text-green-400 font-bold">PRO Plan: Unlimited</span>}
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        
        {/* Limit Reached State */}
        {limitReached && status === Status.IDLE ? (
           <div className="flex flex-col items-center justify-center h-full w-full text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                 <Lock size={40} className="text-red-400" />
              </div>
              <div>
                  <h3 className="text-xl font-bold text-white">Daily Limit Reached</h3>
                  <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
                      You've used your {FREE_LIMIT} free uploads for today. Upgrade to Pro for unlimited access.
                  </p>
              </div>
           </div>
        ) : (
          <>
            {/* Mode Switcher */}
            {status === Status.IDLE && !imagePreview && (
               <div className="flex bg-slate-800 p-1 rounded-lg mb-8 w-full max-w-xs">
                 <button 
                   onClick={() => setMode('PHOTO')}
                   className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'PHOTO' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400'}`}
                 >
                   Photo
                 </button>
                 <button 
                   onClick={() => setMode('TEXT')}
                   className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'TEXT' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400'}`}
                 >
                   Text
                 </button>
               </div>
            )}

            {/* Image Preview Area */}
            {mode === 'PHOTO' && (
              <div className="w-full max-w-md mb-6">
                 {imagePreview ? (
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
                      <img src={imagePreview} alt="Food" className="w-full h-full object-cover" />
                      {status === Status.IDLE && (
                        <button 
                          onClick={() => { setImagePreview(null); setImageBase64(null); setAnalysisResult(null); }}
                          className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white hover:bg-black/70"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                 ) : (
                    status === Status.IDLE && (
                      <label className="flex flex-col items-center justify-center w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer">
                        <div className="p-4 bg-blue-500/10 rounded-full mb-4">
                          <Camera size={32} className="text-blue-500" />
                        </div>
                        <p className="text-slate-300 font-medium">Tap to upload photo</p>
                        <p className="text-slate-500 text-sm mt-1">Supports JPG, PNG</p>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                      </label>
                    )
                 )}
              </div>
            )}

            {/* Text Input */}
            {(mode === 'TEXT' || (mode === 'PHOTO' && imagePreview)) && status !== Status.SUCCESS && (
               <div className="w-full max-w-md mb-6">
                 <label className="block text-slate-400 text-sm font-medium mb-2">
                   {mode === 'PHOTO' ? 'Add details (optional)' : 'Describe your meal'}
                 </label>
                 <textarea
                   value={textInput}
                   onChange={(e) => setTextInput(e.target.value)}
                   placeholder={mode === 'PHOTO' ? "e.g., 'I ate half of this'" : "e.g., Grilled chicken salad with ranch dressing"}
                   className="w-full bg-slate-800 text-white rounded-xl p-4 border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none h-32"
                 />
               </div>
            )}
            
            {/* Analysis Results */}
            {status === Status.SUCCESS && analysisResult && (
              <div className="w-full max-w-md space-y-4 mb-20">
                 <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-3">
                    <Check className="text-green-500" size={20} />
                    <span className="text-green-400 font-medium">Analysis Complete</span>
                 </div>
                 
                 <h3 className="text-white font-semibold mt-4">Found Items:</h3>
                 {analysisResult.foodItems.map((item, idx) => (
                   <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                     <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-lg text-white">{item.name}</h4>
                       <span className="bg-slate-700 text-xs px-2 py-1 rounded text-slate-300">{item.calories} kcal</span>
                     </div>
                     <p className="text-slate-400 text-sm mb-3">{item.notes}</p>
                     <div className="flex gap-4 text-sm">
                       <div className="flex flex-col">
                         <span className="text-xs text-slate-500">Protein</span>
                         <span className="text-red-400 font-bold">{item.protein}g</span>
                       </div>
                       <div className="flex flex-col">
                         <span className="text-xs text-slate-500">Carbs</span>
                         <span className="text-blue-400 font-bold">{item.carbs}g</span>
                       </div>
                       <div className="flex flex-col">
                         <span className="text-xs text-slate-500">Fat</span>
                         <span className="text-yellow-400 font-bold">{item.fat}g</span>
                       </div>
                     </div>
                   </div>
                 ))}

                <button 
                  onClick={handleConfirm}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 mt-4"
                >
                  Save & Send
                </button>
              </div>
            )}

            {/* Error State */}
            {status === Status.ERROR && (
              <div className="text-center p-6 bg-red-500/10 rounded-xl border border-red-500/20 w-full max-w-md">
                <p className="text-red-400 mb-2">Something went wrong.</p>
                <button onClick={() => setStatus(Status.IDLE)} className="text-white underline text-sm">Try again</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Button Area */}
      {status !== Status.SUCCESS && !limitReached && (
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <button 
            disabled={status === Status.ANALYZING || (mode === 'PHOTO' && !imagePreview) || (mode === 'TEXT' && !textInput)}
            onClick={handleAnalyze}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${
              status === Status.ANALYZING 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : (mode === 'PHOTO' && !imagePreview) || (mode === 'TEXT' && !textInput)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 active:scale-95'
            }`}
          >
            {status === Status.ANALYZING ? (
              <>
                <Loader2 className="animate-spin" /> Analyzing...
              </>
            ) : (
              'Calculate Nutrition'
            )}
          </button>
        </div>
      )}

       {/* Upgrade Button when limit reached */}
       {limitReached && status === Status.IDLE && (
          <div className="p-4 bg-slate-900 border-t border-slate-800">
              <a 
                  href={`${STRIPE_PAYMENT_LINK}?client_reference_id=${uid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/20"
              >
                  Upgrade to PRO
              </a>
          </div>
       )}
    </div>
  );
};

export default Scanner;
