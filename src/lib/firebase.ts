// Firebase 設定檔
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import type { User } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, orderBy, Timestamp } from "firebase/firestore";

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyBrhYIhoAfIqUGmtfBgIxaqSgpf6UUDIXE",
  authDomain: "lovart-ai-studio.firebaseapp.com",
  projectId: "lovart-ai-studio",
  storageBucket: "lovart-ai-studio.firebasestorage.app",
  messagingSenderId: "687479334406",
  appId: "1:687479334406:web:8609589f68e4339c0f4587",
  measurementId: "G-WE1T7V04N7"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

// ============ 用戶認證功能 ============

// 註冊新用戶
export async function registerUser(email: string, password: string, displayName: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // 設定用戶顯示名稱
  await updateProfile(userCredential.user, { displayName });

  // 在 Firestore 建立用戶資料
  await setDoc(doc(db, "users", userCredential.user.uid), {
    email,
    displayName,
    createdAt: Timestamp.now(),
    plan: "free"
  });

  return userCredential.user;
}

// 登入
export async function loginUser(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// 登出
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// 監聽用戶狀態變化
export function onUserStateChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// 取得當前用戶
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// ============ 圖片儲存功能 ============

export interface SavedImage {
  id: string;
  url: string;
  name: string;
  prompt?: string;
  createdAt: Date;
  userId: string;
}

// 上傳圖片到 Firebase Storage
export async function uploadImage(
  imageData: string | Blob,
  fileName: string,
  prompt?: string
): Promise<SavedImage> {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("請先登入才能儲存圖片");
  }

  // 產生唯一檔名
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}_${fileName}`;
  const storagePath = `images/${user.uid}/${uniqueFileName}`;
  const storageRef = ref(storage, storagePath);

  // 處理圖片資料
  let blob: Blob;
  if (typeof imageData === 'string') {
    // 如果是 base64 或 URL
    if (imageData.startsWith('data:')) {
      // Base64 轉 Blob
      const response = await fetch(imageData);
      blob = await response.blob();
    } else {
      // URL 轉 Blob
      const response = await fetch(imageData);
      blob = await response.blob();
    }
  } else {
    blob = imageData;
  }

  // 上傳到 Storage
  await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(storageRef);

  // 儲存圖片資訊到 Firestore
  const imageDoc = {
    url: downloadURL,
    name: fileName,
    prompt: prompt || "",
    storagePath,
    createdAt: Timestamp.now(),
    userId: user.uid
  };

  const docRef = doc(collection(db, "images"));
  await setDoc(docRef, imageDoc);

  return {
    id: docRef.id,
    url: downloadURL,
    name: fileName,
    prompt,
    createdAt: new Date(),
    userId: user.uid
  };
}

// 取得用戶的所有圖片
export async function getUserImages(): Promise<SavedImage[]> {
  const user = getCurrentUser();
  if (!user) {
    return [];
  }

  const q = query(
    collection(db, "images"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  const images: SavedImage[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    images.push({
      id: doc.id,
      url: data.url,
      name: data.name,
      prompt: data.prompt,
      createdAt: data.createdAt.toDate(),
      userId: data.userId
    });
  });

  return images;
}

// 刪除圖片
export async function deleteImage(imageId: string, storagePath?: string): Promise<void> {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("請先登入");
  }

  // 刪除 Firestore 記錄
  await deleteDoc(doc(db, "images", imageId));

  // 如果有 storage path，也刪除 Storage 中的檔案
  if (storagePath) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.warn("刪除 Storage 檔案失敗:", error);
    }
  }
}

// 取得用戶資料
export async function getUserProfile(userId: string) {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

// 更新用戶資料
export async function updateUserProfile(updates: { displayName?: string; photoURL?: string }) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("用戶未登入");
  }

  // 動態導入 updateProfile
  const { updateProfile } = await import("firebase/auth");

  await updateProfile(user, updates);

  // 同時更新 Firestore 中的用戶資料
  const userDocRef = doc(db, "users", user.uid);
  await setDoc(userDocRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  return user;
}

console.log("✅ Firebase 初始化成功");
