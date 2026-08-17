import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";

import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { premiumColors, premiumRadius, premiumShadows } from "@/src/theme/premium-ui";

type PremiumFeatureModalProps = {
  visible: boolean;
  onClose: () => void;
  onViewPlans: () => void;
  title?: string;
  description?: string;
};

export function PremiumFeatureModal({
  visible,
  onClose,
  onViewPlans,
  title = "Recurso Premium",
  description = "Este recurso está disponível apenas no plano correspondente.",
}: PremiumFeatureModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PRO</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <PremiumButton label="Ver planos" onPress={onViewPlans} style={styles.primaryButton} />
          <PremiumButton secondary label="Agora nao" onPress={onClose} style={styles.secondaryButton} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.48)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: premiumColors.surface,
    borderRadius: premiumRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: premiumColors.border,
    boxShadow: premiumShadows.card,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: premiumColors.successSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  badgeText: {
    color: premiumColors.primary,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.6,
  },
  title: {
    color: premiumColors.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  description: {
    color: premiumColors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  primaryButton: {
    marginBottom: 10,
  },
  secondaryButton: {
  },
});
