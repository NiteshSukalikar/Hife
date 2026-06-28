import { auth } from "@/services/firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

let signInPromise = null;

export async function getCurrentUser() {
  if (auth.currentUser) return auth.currentUser;

  if (!signInPromise) {
    signInPromise = signInAnonymously(auth).finally(() => {
      signInPromise = null;
    });
  }

  const credential = await signInPromise;
  return credential.user;
}

export async function getCurrentUserId() {
  const user = await getCurrentUser();
  return user.uid;
}

export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
