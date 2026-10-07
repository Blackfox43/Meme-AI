import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  increment,
  getDocFromServer,
  limit,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { Meme } from "./types";

// Silence transient backend retry noise in console
try {
  setLogLevel("error");
} catch (e) {}

// 1. Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// 3. Initialize Firestore with the provisioned database ID as required by Firebase Integration Skill
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Standard error handling as specified in Firebase Integration Skill
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. Test connection on boot as mandated by Firebase Skill
async function testConnection() {
  try {
    await getDoc(doc(db, "test", "connection"));
  } catch (error) {
    // Gracefully handled; client operates in offline mode until network connection completes
  }
}

// Defer test slightly so initial application mount and iframe initialization complete smoothly
if (typeof window !== "undefined") {
  setTimeout(() => {
    testConnection();
  }, 1000);
} else {
  testConnection();
}

// --- AUTH HELPER FUNCTIONS ---

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    // If popup was blocked or closed, rethrow with friendly message
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled.");
    }
    throw error;
  }
}

export async function loginAnonymously(): Promise<User | null> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    // If anonymous auth is disabled in project console, app operates seamlessly in guest mode
    if (error?.code !== "auth/admin-restricted-operation") {
      console.warn("Anonymous sign-in note:", error?.message || error);
    }
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// --- USER PROFILE CLOUD PERSISTENCE ---

export interface CloudUserProfile {
  uid: string;
  displayName?: string;
  username?: string;
  email?: string | null;
  photoURL?: string | null;
  points: number;
  isPro: boolean;
  completedChallenges: string[];
  updatedAt?: number;
}

/**
 * Recursively strips undefined fields from an object/array
 * to prevent Firestore "Function setDoc() called with invalid data. Unsupported field value: undefined" errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) return null as any;
  if (data === null || typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean as T;
}

export async function fetchUserProfile(uid: string): Promise<CloudUserProfile | null> {
  try {
    const userDocRef = doc(db, "users", uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as CloudUserProfile;
    }
    return null;
  } catch (err) {
    console.warn("User profile fetch note:", err);
    return null;
  }
}

export async function saveUserProfile(
  uidOrProfile: string | (Partial<CloudUserProfile> & { uid: string }),
  data?: Partial<CloudUserProfile>
): Promise<void> {
  try {
    let uid: string;
    let payload: Record<string, any>;

    if (typeof uidOrProfile === "string") {
      uid = uidOrProfile;
      payload = data || {};
    } else {
      uid = uidOrProfile.uid;
      payload = uidOrProfile;
    }

    if (!uid) return;

    const userDocRef = doc(db, "users", uid);
    const sanitized = sanitizeForFirestore({
      ...payload,
      uid,
      updatedAt: Date.now(),
    });

    await setDoc(userDocRef, sanitized, { merge: true });
  } catch (err) {
    console.warn("User profile save note:", err);
  }
}

// --- CLOUD FIRESTORE MEME REPOSITORY ---

export async function fetchMemesFromCloud(): Promise<Meme[]> {
  try {
    const memesCol = collection(db, "memes");
    const q = query(memesCol, orderBy("timestamp", "desc"), limit(100));
    const snapshot = await getDocs(q);
    const results: Meme[] = [];
    const seen = new Set<string>();
    snapshot.forEach((doc) => {
      const memeData = doc.data() as Meme;
      const id = doc.id || memeData.id;
      if (id && !seen.has(id)) {
        seen.add(id);
        results.push({ ...memeData, id });
      }
    });
    return results;
  } catch (err) {
    console.warn("Firestore fetch note:", err);
    return [];
  }
}

export function subscribeMemesFromCloud(callback: (memes: Meme[]) => void): () => void {
  try {
    const memesCol = collection(db, "memes");
    const q = query(memesCol, orderBy("timestamp", "desc"), limit(100));
    return onSnapshot(
      q,
      (snapshot) => {
        const results: Meme[] = [];
        const seen = new Set<string>();
        snapshot.forEach((doc) => {
          const memeData = doc.data() as Meme;
          const id = doc.id || memeData.id;
          if (id && !seen.has(id)) {
            seen.add(id);
            results.push({ ...memeData, id });
          }
        });
        if (results.length > 0) {
          callback(results);
        }
      },
      (error) => {
        console.warn("Real-time meme subscription warning:", error);
      }
    );
  } catch (err) {
    console.warn("Subscription note:", err);
    return () => {};
  }
}

export async function createMemeInCloud(meme: Meme): Promise<Meme> {
  try {
    const sanitized = sanitizeForFirestore(meme);
    const memeDocRef = doc(db, "memes", meme.id);
    await setDoc(memeDocRef, sanitized);
    return sanitized as Meme;
  } catch (err) {
    console.error("Error writing meme to Firestore:", err);
    throw err;
  }
}

export async function likeMemeInCloud(id: string): Promise<void> {
  try {
    const memeDocRef = doc(db, "memes", id);
    await setDoc(
      memeDocRef,
      {
        id,
        likes: increment(1),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Liking meme in cloud note:", err);
  }
}

export async function reactMemeInCloud(id: string, emoji: string): Promise<void> {
  try {
    const memeDocRef = doc(db, "memes", id);
    await setDoc(
      memeDocRef,
      {
        id,
        reactions: {
          [emoji]: increment(1),
        },
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Reacting to meme in cloud note:", err);
  }
}

export async function commentMemeInCloud(
  id: string,
  newComment: { id: string; author: string; text: string; timestamp: number }
): Promise<void> {
  try {
    const memeDocRef = doc(db, "memes", id);
    const snap = await getDoc(memeDocRef);
    if (snap.exists()) {
      const currentComments = snap.data().comments || [];
      await updateDoc(memeDocRef, {
        comments: [...currentComments, newComment],
      });
    } else {
      await setDoc(
        memeDocRef,
        {
          id,
          comments: [newComment],
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn("Commenting on meme in cloud note:", err);
  }
}

export async function deleteMemeInCloud(id: string): Promise<void> {
  try {
    const memeDocRef = doc(db, "memes", id);
    await deleteDoc(memeDocRef);
  } catch (err) {
    console.warn("Deleting meme in cloud note:", err);
  }
}
