export enum View {
  DASHBOARD = 'DASHBOARD',
  SCANNER = 'SCANNER',
  HISTORY = 'HISTORY',
  PROFILE = 'PROFILE'
}

export interface MacroNutrients {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

export interface FoodItem extends MacroNutrients {
  id: string;
  name: string;
  notes?: string; // Replaced description with notes per request
  timestamp: number;
  imageUrl?: string; // Base64 or URL
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  items: FoodItem[];
  totals: MacroNutrients;
}

export interface UserGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  n8nUrl?: string; // Added for N8N integration
}

export enum Status {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}