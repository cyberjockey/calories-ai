
import { db, auth } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  Timestamp 
} from 'firebase/firestore';
import { FoodItem, UserGoals } from '../types';
import { FIREBASE_CONFIG } from '../config';

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
    // Use Firestore REST API as requested
    // URL: https://firestore.googleapis.com/v1/projects/calories-ai-68330/databases/(default)/documents/users/uid/dailyEntries/

    const currentUser = auth.currentUser;
    if (!currentUser) {
        // If auth isn't ready, we can't fetch securely
        return [];
    }
    
    const token = await currentUser.getIdToken();
    const projectId = FIREBASE_CONFIG.projectId;
    
    // We add pageSize to ensure we capture a good amount of history, as the default page size is small.
    // Using the exact path structure requested.
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/dailyEntries?pageSize=300`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        // Log error but return empty to avoid crashing UI
        console.error(`Firestore REST API Error: ${response.status} ${response.statusText}`);
        return [];
    }

    const data = await response.json();
    
    // If collection is empty, 'documents' key is missing
    if (!data.documents || !Array.isArray(data.documents)) {
        return [];
    }

    return data.documents.map((doc: any) => {
        const fields = doc.fields || {};
        const id = doc.name.split('/').pop(); // Extract ID from the resource path

        // Helper to extract typed values from Firestore REST JSON structure
        // e.g. { stringValue: "Apple" } or { integerValue: "100" }
        const getString = (f: any) => f?.stringValue || '';
        const getNumber = (f: any) => Number(f?.integerValue || f?.doubleValue || 0);

        // Timestamp handling:
        // If saved via SDK Timestamp.fromMillis, it appears as timestampValue (ISO string)
        // If saved as number, it appears as integerValue.
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
