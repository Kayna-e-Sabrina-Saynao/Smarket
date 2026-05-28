import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { premiumColors, premiumSpacing } from "@/src/theme/premium-ui";

type PremiumLockedStateProps = {
  title: string;
  description: string;
  onViewPlans: () => void;
};

export function PremiumLockedState({
  title,
  description,
  onViewPlans,
}: PremiumLockedStateProps) {
  return (
    <PremiumCard style={styles.card}>
      <View style={styles.lockBadge}>
        <Text style={styles.lockBadgeText}>Premium</Text>
      </View>
      <View style={styles.iconBubble}>
        <MaterialIcons name="workspace-premium" size={24} color={premiumColors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <PremiumButton label="Ver planos" onPress={onViewPlans} />
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    gap: premiumSpacing.sm,
  },
  lockBadge: {
    alignSelf: "flex-start",
    backgroundColor: premiumColors.successSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  lockBadgeText: {
    color: premiumColors.primary,
    fontWeight: "800",
    fontSize: 12,
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: premiumColors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: premiumColors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  description: {
    color: premiumColors.textSecondary,
    lineHeight: 22,
  },
});
