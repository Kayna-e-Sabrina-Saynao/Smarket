import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import "react-native-reanimated";

import { BudgetProvider } from "@/context/budget-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CycleProvider } from "@/src/context/CycleContext";
import { SubscriptionProvider } from "@/src/context/subscription-context";
import { identifyAnalyticsUser } from "@/src/services/analyticsService";
import { syncOnboardingStatus } from "@/src/services/onboardingService";
import { auth } from "../firebaseConfig";
import OnboardingScreen from "./onboarding";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [usuario, setUsuario] = useState<User | null | undefined>(undefined);
  const [onboardingConcluido, setOnboardingConcluido] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const styleId = "smarket-web-reset";
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      html, body, #root, body > div {
        width: 100%;
        max-width: 100%;
        min-height: 100%;
        margin: 0;
        padding: 0;
        overflow-x: hidden;
        background: #f3f5f4;
        -webkit-overflow-scrolling: touch;
      }

      *, *::before, *::after {
        box-sizing: border-box;
      }
    `;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUsuario(authUser);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let ativo = true;

    const carregarOnboarding = async () => {
      const status = await syncOnboardingStatus(usuario?.uid);

      if (ativo) {
        setOnboardingConcluido(status);
      }
    };

    carregarOnboarding();

    return () => {
      ativo = false;
    };
  }, [usuario?.uid]);

  useEffect(() => {
    if (!usuario) {
      return;
    }

    identifyAnalyticsUser(usuario.uid).catch(() => undefined);
  }, [usuario]);

  if (usuario === undefined || onboardingConcluido === undefined) {
    return <View style={{ flex: 1, backgroundColor: "#f3f5f4" }} />;
  }

  return (
    // O provider envolve toda a navegacao para que qualquer tela acesse os dados do usuario logado.
    <SubscriptionProvider>
      <CycleProvider>
        <BudgetProvider>
          <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            {!onboardingConcluido ? (
              <OnboardingScreen onComplete={() => setOnboardingConcluido(true)} />
            ) : (
              <Stack key={usuario ? "app" : "auth"} screenOptions={{ headerShown: false }}>
                {usuario ? (
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                ) : (
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                )}
              </Stack>
            )}
            <StatusBar style="auto" />
          </ThemeProvider>
        </BudgetProvider>
      </CycleProvider>
    </SubscriptionProvider>
  );
}
