import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { View } from "react-native";
import "react-native-reanimated";

import { BudgetProvider } from "@/context/budget-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SubscriptionProvider } from "@/src/context/subscription-context";
import { identifyAnalyticsUser } from "@/src/services/analyticsService";
import { syncOnboardingStatus } from "@/src/services/onboardingService";
import { requestNotificationsPermission } from "@/src/services/notificationService";
import { updateUserAppPreferences } from "@/src/services/subscriptionService";
import { auth } from "../firebaseConfig";
import OnboardingScreen from "./onboarding";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [usuario, setUsuario] = useState<User | null | undefined>(undefined);
  const [onboardingConcluido, setOnboardingConcluido] = useState<boolean | undefined>(undefined);

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

  useEffect(() => {
    if (!usuario || onboardingConcluido !== true) {
      return;
    }

    requestNotificationsPermission()
      .then((granted) =>
        updateUserAppPreferences(usuario.uid, {
          notificationsEnabled: granted,
        })
      )
      .catch(() => undefined);
  }, [onboardingConcluido, usuario]);

  if (usuario === undefined || onboardingConcluido === undefined) {
    return <View style={{ flex: 1, backgroundColor: "#f3f5f4" }} />;
  }

  return (
    // O provider envolve toda a navegacao para que qualquer tela acesse os dados do usuario logado.
    <SubscriptionProvider>
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
              <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
            </Stack>
          )}
          <StatusBar style="auto" />
        </ThemeProvider>
      </BudgetProvider>
    </SubscriptionProvider>
  );
}
