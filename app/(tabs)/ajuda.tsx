import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { premiumColors, premiumSpacing } from "@/src/theme/premium-ui";

export default function AjudaScreen() {
  const router = useRouter();

  return (
    <PremiumScreen scroll={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PremiumCard style={styles.card}>
          <View style={styles.topBar}>
            <PremiumButton secondary label="Voltar" onPress={() => router.back()} style={styles.topButton} />
            <View style={styles.titleBadge}>
              <MaterialIcons name="help-outline" size={22} color={premiumColors.primary} />
            </View>
          </View>

          <Text style={styles.title}>Como usar</Text>
          <Text style={styles.subtitle}>Guia rapido para o fluxo do app</Text>

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>1. Adicione itens</Text>
            <Text style={styles.tipText}>Use o botao `+` para montar sua lista de compras.</Text>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>2. Va para On Market</Text>
            <Text style={styles.tipText}>
              Marque os itens comprados e informe o valor unitario quando estiver no mercado.
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>3. Finalize a compra</Text>
            <Text style={styles.tipText}>
              Em Orcamento, use `Finalizar Compra` para guardar tudo no historico.
            </Text>
          </View>
        </PremiumCard>
      </ScrollView>
    </PremiumScreen>
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
    fontSize: 30,
    fontWeight: "800",
    color: premiumColors.text,
  },
  subtitle: {
    color: premiumColors.textSecondary,
    marginTop: -10,
  },
  tipCard: {
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: 24,
    padding: 18,
  },
  tipTitle: {
    color: premiumColors.text,
    fontWeight: "800",
    marginBottom: 6,
    fontSize: 15,
  },
  tipText: {
    color: premiumColors.textSecondary,
    lineHeight: 20,
  },
});
