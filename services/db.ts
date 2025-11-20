
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  getDocs,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { FoodItem, UserGoals } from '../types';

const USERS_COLLECTION = 'users';
const DAILY_ENTRIES_SUBCOLLECTION = 'dailyEntries';

// --- Goals ---

export const getUserGoals = async (userId: string): Promise<UserGoals | null> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return (data as any)?.goals as UserGoals;
    }
    return null;
  } catch (error) {
    // Suppress permission errors silently or with warning to allow fallback to default goals
    console.warn("DB Read Error (getUserGoals) - using defaults:", error);
    return null;
  }
};

export const updateUserGoals = async (userId: string, goals: UserGoals) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(docRef, { goals }, { merge: true });
  } catch (error) {
    console.warn("DB Write Error (updateUserGoals):", error);
  }
};

// --- Logs ---

export const addFoodItemToDb = async (userId: string, item: FoodItem) => {
  try {
    // ALIGNMENT UPDATE: We use the item.id (generated in client) as the Firestore Document ID.
    // This ensures "item = dailyEntry" strictly, preventing duplicates and allowing direct reference.
    const docRef = doc(db, USERS_COLLECTION, userId, DAILY_ENTRIES_SUBCOLLECTION, item.id);
    
    await setDoc(docRef, {
      ...item,
      userId: userId, // Essential for Security Rules (request.resource.data.userId == request.auth.uid)
      timestamp: Timestamp.fromMillis(item.timestamp) 
    });
  } catch (error) {
    console.warn("DB Write Error (addFoodItemToDb):", error);
  }
};

export const deleteFoodItemFromDb = async (userId: string, itemId: string) => {
  try {
    // Delete the document from the dailyEntries subcollection
    const docRef = doc(db, USERS_COLLECTION, userId, DAILY_ENTRIES_SUBCOLLECTION, itemId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn("DB Delete Error (deleteFoodItemFromDb):", error);
  }
};

export const getFoodHistoryFromDb = async (userId: string): Promise<FoodItem[]> => {
  try {
    const logsRef = collection(db, USERS_COLLECTION, userId, DAILY_ENTRIES_SUBCOLLECTION);
    // Order by timestamp descending (newest first)
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Firestore Timestamp back to milliseconds number
      const ts = data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : (data.timestamp || Date.now());
      
      return {
        id: doc.id, // This should match item.id now
        name: data.name || 'Unknown',
        calories: Number(data.calories) || 0,
        protein: Number(data.protein) || 0,
        carbs: Number(data.carbs) || 0,
        fat: Number(data.fat) || 0,
        notes: data.notes || '',
        imageUrl: data.imageUrl,
        timestamp: ts
      } as FoodItem;
    });
  } catch (error) {
    console.error("DB Read Error (getFoodHistoryFromDb):", error);
    return [];
  }
};
