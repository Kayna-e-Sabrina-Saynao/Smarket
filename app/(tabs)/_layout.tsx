import { Redirect, Tabs } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { auth } from "../../firebaseConfig";

export default function TabLayout() {
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

  if (usuario === null) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Orcamento",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="gastos"
        options={{
          title: "Gastos",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="on-market"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="finalizar-compra"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="compra/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="categoria/[categoria]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
