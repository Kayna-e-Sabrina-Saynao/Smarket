import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { completeOnboarding } from "@/src/services/onboardingService";

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
    <LinearGradient colors={["#73b48b", "#2f5d45"]} style={styles.container}>
      <View style={styles.card}>
        <View style={styles.skipRow}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>{isLastStep ? "Finalizar" : "Pular"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <View style={styles.illustrationCircle}>
            <View style={styles.illustrationBadge}>
              <MaterialIcons name={currentStep.icon} size={58} color="#2f5d45" />
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

        <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
          <Text style={styles.primaryButtonText}>
            {saving ? "Preparando..." : isLastStep ? "Comecar" : "Continuar"}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#eef3ef",
    borderRadius: 32,
    padding: 24,
    minHeight: "82%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
    justifyContent: "space-between",
  },
  skipRow: {
    alignItems: "flex-end",
  },
  skipButton: {
    backgroundColor: "#dbe7df",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  skipText: {
    color: "#335d47",
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
    backgroundColor: "#dff3e3",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  illustrationBadge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#f7fbf8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2f5d45",
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
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  listLineWide: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#bdd9c3",
  },
  listLineMedium: {
    width: "76%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "#d3e7d7",
  },
  listLineShort: {
    width: "58%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "#d3e7d7",
  },
  title: {
    marginTop: 24,
    color: "#173428",
    fontSize: 30,
    lineHeight: 36,
    textAlign: "center",
    fontWeight: "800",
  },
  description: {
    marginTop: 14,
    color: "#607068",
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
    backgroundColor: "#c5d4cb",
  },
  dotActive: {
    width: 28,
    backgroundColor: "#2f5d45",
  },
  primaryButton: {
    backgroundColor: "#2f5d45",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 30,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});
