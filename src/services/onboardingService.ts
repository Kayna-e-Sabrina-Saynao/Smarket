import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "../../firebaseConfig";
import { ONBOARDING_STORAGE_KEY } from "@/src/config/app";
import { updateUserAppPreferences } from "@/src/services/subscriptionService";

export const hasCompletedOnboardingLocally = async () => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    return value === "true";
  } catch {
    return false;
  }
};

export const syncOnboardingStatus = async (uid?: string | null) => {
  const localCompleted = await hasCompletedOnboardingLocally();

  if (localCompleted) {
    return true;
  }

  if (!uid) {
    return false;
  }

  try {
    const snapshot = await getDoc(doc(db, "users", uid));

    if (snapshot.exists() && snapshot.data().hasCompletedOnboarding === true) {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

export const completeOnboarding = async () => {
  await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");

  const uid = auth.currentUser?.uid;

  if (!uid) {
    return;
  }

  await setDoc(
    doc(db, "users", uid),
    {
      hasCompletedOnboarding: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await updateUserAppPreferences(uid, { hasCompletedOnboarding: true });
};
