import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc,
  orderBy,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { FoodItem, UserGoals } from '../types';

const USERS_COLLECTION = 'users';
const LOGS_COLLECTION = 'logs';

// --- Goals ---

export const getUserGoals = async (userId: string): Promise<UserGoals | null> => {
  const docRef = doc(db, USERS_COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return (data as any)?.goals as UserGoals;
  }
  return null;
};

export const updateUserGoals = async (userId: string, goals: UserGoals) => {
  const docRef = doc(db, USERS_COLLECTION, userId);
  // Merge true to preserve other user data if any
  await setDoc(docRef, { goals }, { merge: true });
};

// --- Logs ---

export const addFoodItemToDb = async (userId: string, item: FoodItem) => {
  const logsRef = collection(db, USERS_COLLECTION, userId, LOGS_COLLECTION);
  // Ensure we save standard JS primitives
  await addDoc(logsRef, {
    ...item,
    timestamp: Timestamp.fromMillis(item.timestamp) // Convert to Firestore Timestamp
  });
};

export const deleteFoodItemFromDb = async (userId: string, itemId: string) => {
  const docRef = doc(db, USERS_COLLECTION, userId, LOGS_COLLECTION, itemId);
  await deleteDoc(docRef);
};

// Subscribe to logs for a specific day (or simply most recent for now)
export const subscribeToTodaysLogs = (userId: string, callback: (items: FoodItem[]) => void) => {
  const logsRef = collection(db, USERS_COLLECTION, userId, LOGS_COLLECTION);
  
  // Calculate start of today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startTimestamp = Timestamp.fromDate(startOfDay);

  const q = query(
    logsRef,
    where('timestamp', '>=', startTimestamp),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const items: FoodItem[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        ...data,
        id: doc.id,
        // Convert Firestore Timestamp back to millis number for the app
        timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now()
      } as FoodItem);
    });
    callback(items);
  });
};