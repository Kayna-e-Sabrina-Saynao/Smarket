import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  setPersistence,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configuracao do projeto Firebase usada por autenticacao e banco de dados.
const firebaseConfig = {
  apiKey: "AIzaSyCkgt_a36ifSwsxqbkvJHo4I7TY2nPoXIA",
  authDomain: "smarket-efee5.firebaseapp.com",
  projectId: "smarket-efee5",
  storageBucket: "smarket-efee5.firebasestorage.app",
  messagingSenderId: "243702084810",
  appId: "1:243702084810:web:f0646bd405b6e24aa03033",
  measurementId: "G-7QLV8RE0HQ"
};

const app = initializeApp(firebaseConfig);

// `auth` controla login, registro e logout.
export const auth = (() => {
  try {
    if (Platform.OS === "web") {
      const authWeb = initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
      setPersistence(authWeb, browserLocalPersistence).catch(() => {
        return;
      });
      return authWeb;
    }

    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    const authPadrao = getAuth(app);

    if (Platform.OS === "web") {
      setPersistence(authPadrao, browserLocalPersistence).catch(() => {
        return;
      });
    }

    return authPadrao;
  }
})();
// `db` centraliza o acesso ao Firestore em todo o app.
export const db =
  Platform.OS === "web"
    ? initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      })
    : getFirestore(app);

export const functions = getFunctions(app, "us-central1");
