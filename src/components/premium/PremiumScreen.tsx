import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { premiumColors, premiumSpacing } from "@/src/theme/premium-ui";

type PremiumScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export function PremiumScreen({
  children,
  scroll = true,
  contentContainerStyle,
  style,
}: PremiumScreenProps) {
  const content = scroll ? (
    <ScrollView
      style={styles.scrollView}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentContainerStyle]}>{children}</View>
  );

  return (
    <LinearGradient
      colors={[premiumColors.background, "#F0FDF4"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}>
      <View pointerEvents="none" style={styles.orbTop} />
      <View pointerEvents="none" style={styles.orbBottom} />
      {content}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    backgroundColor: premiumColors.background,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    maxWidth: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
    maxWidth: "100%",
    paddingTop: premiumSpacing.sm,
    paddingHorizontal: premiumSpacing.sm,
    paddingBottom: premiumSpacing.lg + 84,
  },
  content: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    maxWidth: "100%",
    paddingTop: premiumSpacing.sm,
    paddingHorizontal: premiumSpacing.sm,
    paddingBottom: premiumSpacing.lg + 84,
  },
  orbTop: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(74,222,128,0.12)",
  },
  orbBottom: {
    position: "absolute",
    bottom: -90,
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(34,197,94,0.08)",
  },
});
