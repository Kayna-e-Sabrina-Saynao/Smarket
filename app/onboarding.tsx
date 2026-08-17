import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { completeOnboarding } from "@/src/services/onboardingService";
import { premiumColors, premiumRadius, premiumSpacing } from "@/src/theme/premium-ui";

const STEPS = [
  {
    title: "Organize suas compras sem complicacao",
    description: "Crie listas rapidas e organize tudo em segundos.",
    icon: "shopping-cart" as const,
  },
  {
    title: "Compartilhe com quem importa",
    description: "Convide familiares para acompanhar e atualizar listas.",
    icon: "groups" as const,
  },
  {
    title: "Acompanhe seus gastos",
    description: "Veja seus gastos e organize melhor suas compras.",
    icon: "insights" as const,
  },
];

export default function OnboardingScreen({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const currentStep = useMemo(() => STEPS[stepIndex], [stepIndex]);
  const isLastStep = stepIndex === STEPS.length - 1;

  const handleContinue = async () => {
    if (!isLastStep) {
      setStepIndex((current) => current + 1);
      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);

    try {
      await completeOnboarding();
      if (onComplete) {
        onComplete();
        return;
      }

      router.replace("/");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!isLastStep) {
      setStepIndex(STEPS.length - 1);
      return;
    }

    await handleContinue();
  };

  return (
    <PremiumScreen scroll={false}>
      <View style={styles.wrapper}>
        <PremiumCard style={styles.card}>
          <View style={styles.skipRow}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>{isLastStep ? "Finalizar" : "Pular"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hero}>
            <View style={styles.illustrationCircle}>
              <View style={styles.illustrationBadge}>
                <MaterialIcons name={currentStep.icon} size={58} color={premiumColors.primary} />
              </View>

              <View style={styles.illustrationCard}>
                <View style={styles.listLineWide} />
                <View style={styles.listLineMedium} />
                <View style={styles.listLineShort} />
              </View>
            </View>
          </View>

          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.description}>{currentStep.description}</Text>

          <View style={styles.pagination}>
            {STEPS.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === stepIndex && styles.dotActive]}
              />
            ))}
          </View>

          <PremiumButton
            label={saving ? "Preparando..." : isLastStep ? "Comecar" : "Continuar"}
            onPress={handleContinue}
            disabled={saving}
            style={styles.primaryButton}
          />
        </PremiumCard>
      </View>
    </PremiumScreen>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    padding: premiumSpacing.sm,
  },
  card: {
    minHeight: "82%",
    justifyContent: "space-between",
    gap: 0,
    padding: premiumSpacing.md,
  },
  skipRow: {
    alignItems: "flex-end",
  },
  skipButton: {
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: premiumRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  skipText: {
    color: premiumColors.textSecondary,
    fontWeight: "700",
  },
  hero: {
    alignItems: "center",
    marginTop: 18,
  },
  illustrationCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: premiumColors.successSoft,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  illustrationBadge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: premiumColors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: premiumColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  illustrationCard: {
    position: "absolute",
    bottom: 22,
    right: 18,
    width: 92,
    backgroundColor: premiumColors.surface,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  listLineWide: {
    height: 8,
    borderRadius: premiumRadius.pill,
    backgroundColor: premiumColors.primarySecondary,
  },
  listLineMedium: {
    width: "76%",
    height: 8,
    borderRadius: premiumRadius.pill,
    backgroundColor: premiumColors.successSoft,
  },
  listLineShort: {
    width: "58%",
    height: 8,
    borderRadius: premiumRadius.pill,
    backgroundColor: premiumColors.successSoft,
  },
  title: {
    marginTop: 24,
    color: premiumColors.text,
    fontSize: 30,
    lineHeight: 36,
    textAlign: "center",
    fontWeight: "800",
  },
  description: {
    marginTop: 14,
    color: premiumColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    fontSize: 16,
    paddingHorizontal: 12,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 28,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: premiumColors.border,
  },
  dotActive: {
    width: 28,
    backgroundColor: premiumColors.primary,
  },
  primaryButton: {
    marginTop: 30,
  },
});
