import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useBudget } from "@/context/budget-context";
import { AppSkeleton } from "@/src/components/AppSkeleton";
import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { useCycle } from "@/src/context/CycleContext";
import { premiumColors, premiumRadius, premiumShadows, premiumSpacing } from "@/src/theme/premium-ui";

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function DashboardScreen() {
  const router = useRouter();
  const { carregandoDados, historicoCompras, items, orcamentoRestante } = useBudget();
  const { currentMonth, currentYear, cycleLoading, cycleUpdating, getCurrentCycle } = useCycle();

  const comprasDoMes = useMemo(
    () =>
      historicoCompras.filter((compra) => {
        const [ano, mes] = compra.data.split("-").map(Number);
        return ano === currentYear && mes === currentMonth + 1;
      }),
    [currentMonth, currentYear, historicoCompras]
  );

  const gastoNoPeriodo = useMemo(
    () => comprasDoMes.reduce((total, compra) => total + compra.totalGasto, 0),
    [comprasDoMes]
  );

  const economia = Math.max(orcamentoRestante, 0);

  return (
    <PremiumScreen>
      <PremiumCard style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>{getCurrentCycle().fullLabel}</Text>
          </View>

          <View style={styles.iconCircle}>
            <MaterialIcons name="dashboard" size={24} color={premiumColors.primary} />
          </View>
        </View>

        {cycleUpdating ? (
          <View style={styles.loadingCycleRow}>
            <ActivityIndicator size="small" color={premiumColors.primary} />
            <Text style={styles.loadingCycleText}>Atualizando dados do ciclo...</Text>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <SummaryCard
            icon="payments"
            label="Gastou no ciclo"
            value={carregandoDados || cycleLoading ? null : formatarMoeda(gastoNoPeriodo)}
            highlight
          />
          <SummaryCard
            icon="savings"
            label="Economia"
            value={carregandoDados ? null : formatarMoeda(economia)}
          />
          <SummaryCard
            icon="shopping-bag"
            label="Compras realizadas"
            value={carregandoDados || cycleLoading ? null : String(comprasDoMes.length)}
          />
          <SummaryCard
            icon="playlist-add-check-circle"
            label="Itens ativos"
            value={carregandoDados || cycleLoading ? null : String(items.length)}
          />
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Leitura do momento</Text>
          <Text style={styles.tipText}>
            {gastoNoPeriodo > 0
              ? `Voce ja movimentou ${formatarMoeda(gastoNoPeriodo)} neste ciclo. Continue registrando suas compras para manter tudo organizado.`
              : "Assim que voce finalizar compras, este painel mostra o resumo do seu ciclo."}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <PremiumButton label="Ver gastos" onPress={() => router.push("/(tabs)/gastos")} style={styles.action} />
          <PremiumButton
            secondary
            label="Abrir orcamento"
            onPress={() => router.push("/(tabs)/home")}
            style={styles.action}
          />
        </View>
      </PremiumCard>
    </PremiumScreen>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  value: string | null;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.summaryCard, highlight && styles.summaryCardHighlight]}>
      <View style={[styles.summaryIcon, highlight && styles.summaryIconHighlight]}>
        <MaterialIcons
          name={icon}
          size={20}
          color={highlight ? premiumColors.surface : premiumColors.primary}
        />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      {value === null ? (
        <AppSkeleton height={28} width="70%" radius={10} />
      ) : (
        <Text style={styles.summaryValue}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: premiumSpacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: premiumColors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: premiumColors.textSecondary,
    marginTop: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: premiumColors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCycleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingCycleText: {
    color: premiumColors.textSecondary,
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    width: "48%",
    minHeight: 146,
    backgroundColor: premiumColors.surface,
    borderRadius: premiumRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: premiumColors.border,
    boxShadow: premiumShadows.card,
  },
  summaryCardHighlight: {
    backgroundColor: "#F0FDF4",
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: premiumColors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  summaryIconHighlight: {
    backgroundColor: premiumColors.primary,
  },
  summaryLabel: {
    color: premiumColors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  summaryValue: {
    color: premiumColors.text,
    fontWeight: "800",
    fontSize: 22,
  },
  tipCard: {
    borderRadius: premiumRadius.lg,
    backgroundColor: premiumColors.surfaceMuted,
    padding: 16,
  },
  tipTitle: {
    color: premiumColors.text,
    fontWeight: "800",
    marginBottom: 6,
  },
  tipText: {
    color: premiumColors.textSecondary,
    lineHeight: 21,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  action: {
    flex: 1,
  },
});
