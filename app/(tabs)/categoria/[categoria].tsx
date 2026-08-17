import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Categoria, useBudget } from "@/context/budget-context";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { premiumColors, premiumRadius, premiumSpacing } from "@/src/theme/premium-ui";

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function CategoriaDetalheScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoria?: string }>();
  // A rota dinamica chega como string; aqui convertemos para o tipo usado pelo contexto.
  const categoria = (params.categoria ?? "Mercado") as Categoria;
  const { carregandoDados, listarItensPorCategoria, totalCategoria } = useBudget();
  const itens = listarItensPorCategoria(categoria);
  const total = totalCategoria(categoria);

  if (carregandoDados) {
    return (
      <PremiumScreen>
        <View style={styles.centerCard}>
          <Text style={styles.centerText}>Carregando categoria...</Text>
        </View>
      </PremiumScreen>
    );
  }

  return (
    <PremiumScreen scroll={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <PremiumCard style={styles.card}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{categoria}</Text>
          <Text style={styles.subtitle}>Detalhes do que foi gasto nessa categoria</Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total da categoria</Text>
            <Text style={styles.summaryValue}>{formatarMoeda(total)}</Text>
          </View>

          {itens.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhum item encontrado nesta categoria.</Text>
            </View>
          ) : (
            itens.map((item) => (
              <View key={item.id} style={styles.item}>
                <View>
                  <Text style={styles.itemName}>{item.nome}</Text>
                  <Text style={styles.itemMeta}>
                    {item.quantidade} x {formatarMoeda(item.valorUnitario)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  {formatarMoeda(item.quantidade * item.valorUnitario)}
                </Text>
              </View>
            ))
          )}
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
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: premiumRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  backButtonText: {
    color: premiumColors.text,
    fontWeight: "700",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: premiumColors.text,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: premiumColors.textSecondary,
    marginTop: 6,
    marginBottom: 8,
  },
  summaryBox: {
    backgroundColor: premiumColors.successSoft,
    borderRadius: premiumRadius.md,
    padding: 16,
    alignItems: "center",
    marginBottom: 4,
  },
  summaryLabel: {
    color: premiumColors.textSecondary,
    fontWeight: "600",
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: "800",
    color: premiumColors.primary,
  },
  item: {
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: premiumRadius.sm,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: premiumColors.text,
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 12,
    color: premiumColors.textSecondary,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: "800",
    color: premiumColors.text,
  },
  emptyState: {
    paddingVertical: 30,
    alignItems: "center",
  },
  emptyText: {
    color: premiumColors.textSecondary,
    textAlign: "center",
  },
  centerCard: {
    flex: 1,
    margin: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: premiumColors.surface,
    borderRadius: premiumRadius.lg,
    borderWidth: 1,
    borderColor: premiumColors.border,
  },
  centerText: {
    color: premiumColors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
