import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { premiumColors, premiumRadius, premiumShadows, premiumSpacing } from "@/src/theme/premium-ui";

export function PremiumCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "center",
    backgroundColor: premiumColors.surface,
    borderRadius: premiumRadius.xl,
    padding: premiumSpacing.sm,
    borderWidth: 1,
    borderColor: premiumColors.border,
    boxShadow: premiumShadows.card,
  },
});
