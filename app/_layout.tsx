import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { View } from "react-native";
import "react-native-reanimated";

import { BudgetProvider } from "@/context/budget-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { auth } from "../firebaseConfig";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [usuario, setUsuario] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUsuario(authUser);
    });

    return unsubscribe;
  }, []);

  if (usuario === undefined) {
    return <View style={{ flex: 1, backgroundColor: "#f3f5f4" }} />;
  }

  return (
    // O provider envolve toda a navegacao para que qualquer tela acesse os dados do usuario logado.
    <BudgetProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack key={usuario ? "app" : "auth"} screenOptions={{ headerShown: false }}>
          {usuario ? (
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name="index" options={{ headerShown: false }} />
          )}
          <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </BudgetProvider>
  );
}
