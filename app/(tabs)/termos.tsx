import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { premiumColors, premiumSpacing } from "@/src/theme/premium-ui";

export default function TermosScreen() {
  const router = useRouter();

  return (
    <PremiumScreen scroll={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PremiumCard style={styles.card}>
          <View style={styles.topBar}>
            <PremiumButton secondary label="Voltar" onPress={() => router.back()} style={styles.topButton} />
            <View style={styles.titleBadge}>
              <MaterialIcons name="description" size={22} color={premiumColors.primary} />
            </View>
          </View>

          <Text style={styles.title}>Termos de Uso</Text>
          <Text style={styles.subtitle}>Regras simples para usar o SMARKET.</Text>

          <InfoBlock
            title="Uso pessoal"
            text="O app foi criado para organizacao de compras, listas e gastos. O uso deve respeitar a conta autenticada de cada usuario."
          />
          <InfoBlock
            title="Assinaturas"
            text="Planos Pro e Familia liberam recursos premium. Pagamentos reais poderao ser adicionados em atualizacoes futuras."
          />
          <InfoBlock
            title="Conteudo salvo"
            text="Voce e responsavel pelas informacoes inseridas nas listas, categorias, historicos e convites compartilhados."
          />
          <InfoBlock
            title="Atualizacoes"
            text="O SMARKET pode evoluir com novos ajustes de interface, correcoes e melhorias sem alterar o conceito principal do app."
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
