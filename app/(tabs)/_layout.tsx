import { Redirect, Tabs } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { premiumColors } from "@/src/theme/premium-ui";
import { auth } from "../../firebaseConfig";

export default function TabLayout() {
  const [usuario, setUsuario] = useState<User | null | undefined>(undefined);
  const insets = useSafeAreaInsets();
  const tabBarPaddingBottom = insets.bottom > 0 ? insets.bottom - 2 : 10;
  const tabBarHeight = 68 + tabBarPaddingBottom;

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
        tabBarActiveTintColor: premiumColors.primary,
        tabBarInactiveTintColor: premiumColors.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 4,
        },
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: premiumColors.surface,
          borderTopWidth: 0,
          boxShadow: "0 -10px 24px rgba(17,24,39,0.06)",
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: tabBarPaddingBottom,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 6,
          borderTopWidth: 3,
          borderTopColor: "transparent",
          marginHorizontal: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="gastos"
        options={{
          title: "Estatisticas",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Listas",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="square.grid.2x2.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
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
        name="ajuda"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="planos"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="convidar-familia"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="privacidade"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="termos"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="sobre"
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
        name="nota/[id]"
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
