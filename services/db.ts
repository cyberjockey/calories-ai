
import { db, auth } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  Timestamp,
  increment
} from 'firebase/firestore';
import { FoodItem, UserGoals, SubscriptionStatus } from '../types';
import { FIREBASE_CONFIG } from '../config';

const USERS_COLLECTION = 'users';
const DAILY_ENTRIES_SUBCOLLECTION = 'dailyEntries';

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
      // We check if 'lastAnalysisDate' matches today. If not, usage is 0.
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      let dailyUsage = 0;
      
      if (data.lastAnalysisDate === today) {
        dailyUsage = data.analysesToday || 0;
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
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const docRef = doc(db, USERS_COLLECTION, userId);
        
        // We need to read first to check the date, or use a smart update.
        // Simple read-modify-write pattern is sufficient here.
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.lastAnalysisDate === today) {
                // Same day, just increment
                await setDoc(docRef, { analysesToday: increment(1) }, { merge: true });
            } else {
                // New day, reset to 1 and update date
                await setDoc(docRef, { analysesToday: 1, lastAnalysisDate: today }, { merge: true });
            }
        } else {
            // Initialize doc
            await setDoc(docRef, { analysesToday: 1, lastAnalysisDate: today }, { merge: true });
        }
    } catch (error) {
         console.warn("DB Write Error (incrementDailyAnalysisCount):", error);
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
    const currentUser = auth.currentUser;
    if (!currentUser) {
        return [];
    }
    
    const token = await currentUser.getIdToken();
    const projectId = FIREBASE_CONFIG.projectId;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/dailyEntries?pageSize=300`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        console.error(`Firestore REST API Error: ${response.status} ${response.statusText}`);
        return [];
    }

    const data = await response.json();
    
    if (!data.documents || !Array.isArray(data.documents)) {
        return [];
    }

    return data.documents.map((doc: any) => {
        const fields = doc.fields || {};
        const id = doc.name.split('/').pop();

        const getString = (f: any) => f?.stringValue || '';
        const getNumber = (f: any) => Number(f?.integerValue || f?.doubleValue || 0);

        let timestamp = Date.now();
        if (fields.timestamp?.timestampValue) {
            timestamp = new Date(fields.timestamp.timestampValue).getTime();
        } else if (fields.timestamp?.integerValue) {
            timestamp = Number(fields.timestamp.integerValue);
        }

        return {
            id: id,
            name: getString(fields.name) || 'Unknown',
            calories: getNumber(fields.calories),
            protein: getNumber(fields.protein),
            carbs: getNumber(fields.carbs),
            fat: getNumber(fields.fat),
            notes: getString(fields.notes),
            imageUrl: getString(fields.imageUrl) || undefined,
            timestamp: timestamp
        } as FoodItem;
    });

  } catch (error) {
    console.error("DB Read Error (REST API):", error);
    return [];
  }
};
