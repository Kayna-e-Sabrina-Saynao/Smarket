import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  SMARKET_APP_DESCRIPTION,
  SMARKET_APP_NAME,
  SMARKET_APP_VERSION,
} from "@/src/config/app";
import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { premiumColors, premiumSpacing } from "@/src/theme/premium-ui";

export default function SobreScreen() {
  const router = useRouter();

  return (
    <PremiumScreen scroll={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PremiumCard style={styles.card}>
          <View style={styles.topBar}>
            <PremiumButton secondary label="Voltar" onPress={() => router.back()} style={styles.topButton} />
            <View style={styles.titleBadge}>
              <MaterialIcons name="shopping-bag" size={22} color={premiumColors.primary} />
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.title}>{SMARKET_APP_NAME}</Text>
            <Text style={styles.version}>Versao {SMARKET_APP_VERSION}</Text>
            <Text style={styles.description}>{SMARKET_APP_DESCRIPTION}</Text>
          </View>

          <InfoBlock
            title="Proposta"
            text="Um app simples para organizar compras, acompanhar gastos e compartilhar listas sem complicacao."
          />
          <InfoBlock
            title="Tecnologia"
            text="Construido com React Native, Expo, Firebase Authentication e Firestore para sincronizacao segura."
          />
          <InfoBlock
            title="Pronto para crescer"
            text="A base de assinatura, onboarding, historico, familia e analytics ja fica pronta para a publicacao na Play Store."
          />
        </PremiumCard>
      </ScrollView>
    </PremiumScreen>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <Text style={styles.blockText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: premiumSpacing.lg,
  },
  card: {
    gap: premiumSpacing.sm,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topButton: {
    minWidth: 108,
  },
  titleBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: premiumColors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    color: premiumColors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  version: {
    color: premiumColors.textSecondary,
    marginTop: 6,
    fontWeight: "700",
  },
  description: {
    color: premiumColors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 21,
  },
  block: {
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: premiumSpacing.sm,
    padding: 16,
  },
  blockTitle: {
    color: premiumColors.text,
    fontWeight: "800",
    marginBottom: 6,
  },
  blockText: {
    color: premiumColors.textSecondary,
    lineHeight: 21,
  },
});
