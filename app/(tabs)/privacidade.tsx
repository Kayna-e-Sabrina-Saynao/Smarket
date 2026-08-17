import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { premiumColors, premiumSpacing } from "@/src/theme/premium-ui";

export default function PrivacidadeScreen() {
  const router = useRouter();

  return (
    <PremiumScreen scroll={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PremiumCard style={styles.card}>
          <View style={styles.topBar}>
            <PremiumButton secondary label="Voltar" onPress={() => router.back()} style={styles.topButton} />
            <View style={styles.titleBadge}>
              <MaterialIcons name="verified-user" size={22} color={premiumColors.primary} />
            </View>
          </View>

          <Text style={styles.title}>Politica de Privacidade</Text>
          <Text style={styles.subtitle}>Como o SMARKET protege seus dados.</Text>

          <InfoBlock
            title="Dados usados"
            text="Email, listas, historico, configuracoes e plano atual sao armazenados para sincronizar sua conta entre dispositivos."
          />
          <InfoBlock
            title="Finalidade"
            text="Esses dados servem para organizar compras, manter backup automatico e permitir recursos de assinatura do app."
          />
          <InfoBlock
            title="Compartilhamento"
            text="O SMARKET nao vende seus dados. Informacoes so sao compartilhadas quando voce usa recursos de familia ou convite."
          />
          <InfoBlock
            title="Controle"
            text="Voce pode sair da conta a qualquer momento. Seus dados permanecem vinculados ao seu login para restauracao futura."
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
  title: {
    color: premiumColors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: premiumColors.textSecondary,
    marginTop: -10,
    lineHeight: 20,
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
