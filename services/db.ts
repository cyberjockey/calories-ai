
import { db, auth } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection,
  query,
  getDocs,
  Timestamp,
  increment,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { FoodItem, UserGoals, SubscriptionStatus } from '../types';
import { FIREBASE_CONFIG } from '../config';

const USERS_COLLECTION = 'users';
const DAILY_ENTRIES_SUBCOLLECTION = 'dailyEntries';

// Helper for consistent local date string YYYY-MM-DD
export const getTodayDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Goals & Subscription ---

export const getUserData = async (userId: string): Promise<{ 
  goals: UserGoals | null, 
  subscriptionStatus: SubscriptionStatus,
  dailyUsage: number 
}> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Subscription Status
      const rawStatus = data.subscriptionStatus;
      const subscriptionStatus: SubscriptionStatus = (rawStatus === 'pro_plan' || rawStatus === 'free_plan') 
        ? rawStatus 
        : 'free_plan';

      // Daily Usage Logic
      const today = getTodayDateString();
      let dailyUsage = 0;
      
      const rawCount = data.analysesToday;
      const countNumber = Number(rawCount);

      if (data.lastAnalysisDate === today && !isNaN(countNumber)) {
        dailyUsage = countNumber;
      }

      return {
        goals: (data.goals as UserGoals) || null,
        subscriptionStatus,
        dailyUsage
      };
    }
    
    // Default if user doc doesn't exist yet
    return { goals: null, subscriptionStatus: 'free_plan', dailyUsage: 0 };
  } catch (error) {
    console.warn("DB Read Error (getUserData) - using defaults:", error);
    return { goals: null, subscriptionStatus: 'free_plan', dailyUsage: 0 };
  }
};

export const subscribeToUserData = (userId: string, onUpdate: (data: { 
  goals: UserGoals | null, 
  subscriptionStatus: SubscriptionStatus,
  dailyUsage: number 
}) => void) => {
  const docRef = doc(db, USERS_COLLECTION, userId);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Subscription Status
      const rawStatus = data.subscriptionStatus;
      const subscriptionStatus: SubscriptionStatus = (rawStatus === 'pro_plan' || rawStatus === 'free_plan') 
        ? rawStatus 
        : 'free_plan';

      // Daily Usage Logic
      const today = getTodayDateString();
      let dailyUsage = 0;
      
      // Robustly handle analysesToday: cast to Number to handle strings from manual DB edits
      const rawCount = data.analysesToday;
      const countNumber = Number(rawCount);

      if (data.lastAnalysisDate === today && !isNaN(countNumber)) {
        dailyUsage = countNumber;
      } else {
        if (data.lastAnalysisDate && data.lastAnalysisDate !== today) {
            console.log(`[CaloriesAI] Daily usage reset. Local Date: ${today}, DB Date: ${data.lastAnalysisDate}`);
        }
      }

      onUpdate({
        goals: (data.goals as UserGoals) || null,
        subscriptionStatus,
        dailyUsage
      });
    } else {
      // Default if user doc doesn't exist yet
      onUpdate({ goals: null, subscriptionStatus: 'free_plan', dailyUsage: 0 });
    }
  }, (error) => {
    console.error("Real-time user data listener error:", error);
  });
};

export const getUserGoals = async (userId: string): Promise<UserGoals | null> => {
    const data = await getUserData(userId);
    return data.goals;
};

export const updateUserGoals = async (userId: string, goals: UserGoals) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(docRef, { goals }, { merge: true });
  } catch (error) {
    console.warn("DB Write Error (updateUserGoals):", error);
  }
};

// --- Usage Metrics ---

export const incrementDailyAnalysisCount = async (userId: string) => {
    try {
        const today = getTodayDateString();
        const docRef = doc(db, USERS_COLLECTION, userId);
        
        await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(docRef);
            
            if (!sfDoc.exists()) {
                // Initialize if doesn't exist
                transaction.set(docRef, { analysesToday: 1, lastAnalysisDate: today }, { merge: true });
            } else {
                const data = sfDoc.data();
                // Check if the date stored matches today's date
                if (data.lastAnalysisDate === today) {
                    const current = Number(data.analysesToday) || 0;
                    transaction.update(docRef, { analysesToday: current + 1 });
                } else {
                    // It's a new day (or first time), reset to 1
                    transaction.update(docRef, { analysesToday: 1, lastAnalysisDate: today });
                }
            }
        });
    } catch (error) {
         console.warn("DB Transaction Error (incrementDailyAnalysisCount):", error);
    }
}

// --- Logs ---

export const addFoodItemToDb = async (userId: string, item: FoodItem) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId, DAILY_ENTRIES_SUBCOLLECTION, item.id);
    
    await setDoc(docRef, {
      ...item,
      userId: userId, 
      timestamp: Timestamp.fromMillis(item.timestamp) 
    });
  } catch (error) {
    console.warn("DB Write Error (addFoodItemToDb):", error);
  }
};

export const deleteFoodItemFromDb = async (userId: string, itemId: string) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId, DAILY_ENTRIES_SUBCOLLECTION, itemId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn("DB Delete Error (deleteFoodItemFromDb):", error);
  }
};

export const getFoodHistoryFromDb = async (userId: string): Promise<FoodItem[]> => {
  try {
    const entriesRef = collection(db, USERS_COLLECTION, userId, DAILY_ENTRIES_SUBCOLLECTION);
    const q = query(entriesRef);
    const querySnapshot = await getDocs(q);

    const items: FoodItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp to millis
      const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp;
      
      items.push({
        ...data,
        id: doc.id,
        timestamp: timestamp
      } as FoodItem);
    });
    
    return items;
  } catch (error) {
    console.error("DB Read Error (getFoodHistoryFromDb):", error);
    throw error;
  }
};
