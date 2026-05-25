import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useBudget } from "@/context/budget-context";
import { AppSkeleton } from "@/src/components/AppSkeleton";

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function DashboardScreen() {
  const router = useRouter();
  const { carregandoDados, historicoCompras, items, orcamentoRestante, valorGasto } = useBudget();

  const comprasDoMes = useMemo(() => {
    const agora = new Date();
    const anoAtual = agora.getFullYear();
    const mesAtual = agora.getMonth() + 1;

    return historicoCompras.filter((compra) => {
      const [ano, mes] = compra.data.split("-").map(Number);
      return ano === anoAtual && mes === mesAtual;
    });
  }, [historicoCompras]);

  const economia = Math.max(orcamentoRestante, 0);

  return (
    <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Dashboard</Text>
              <Text style={styles.subtitle}>Seu resumo rapido do mes</Text>
            </View>

            <View style={styles.iconCircle}>
              <MaterialIcons name="dashboard" size={24} color="#2f5d45" />
            </View>
          </View>

          <View style={styles.statsGrid}>
            <SummaryCard
              icon="payments"
              label="Gastou este mes"
              value={carregandoDados ? null : formatarMoeda(valorGasto)}
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
              value={carregandoDados ? null : String(comprasDoMes.length)}
            />
            <SummaryCard
              icon="playlist-add-check-circle"
              label="Itens ativos"
              value={carregandoDados ? null : String(items.length)}
            />
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Leitura do momento</Text>
            <Text style={styles.tipText}>
              {valorGasto > 0
                ? `Voce ja movimentou ${formatarMoeda(valorGasto)} neste mes. Continue registrando suas compras para manter tudo organizado.`
                : "Assim que voce finalizar compras, este painel mostra o resumo do seu mes."}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.primaryAction} onPress={() => router.push("/(tabs)/gastos")}>
              <Text style={styles.primaryActionText}>Ver gastos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={() => router.push("/(tabs)/home")}>
              <Text style={styles.secondaryActionText}>Abrir orcamento</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
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
        <MaterialIcons name={icon} size={20} color={highlight ? "#fff" : "#2f5d45"} />
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
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  card: {
    backgroundColor: "#e9eceb",
    borderRadius: 30,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  title: {
    color: "#173428",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#607068",
    marginTop: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dce7e0",
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    width: "48%",
    minHeight: 146,
    backgroundColor: "#f5f8f6",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dce7e0",
  },
  summaryCardHighlight: {
    backgroundColor: "#eef8f1",
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#dce7e0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  summaryIconHighlight: {
    backgroundColor: "#2f5d45",
  },
  summaryLabel: {
    color: "#607068",
    lineHeight: 18,
    marginBottom: 8,
  },
  summaryValue: {
    color: "#173428",
    fontWeight: "800",
    fontSize: 22,
  },
  tipCard: {
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: "#dce7e0",
    padding: 16,
  },
  tipTitle: {
    color: "#173428",
    fontWeight: "800",
    marginBottom: 6,
  },
  tipText: {
    color: "#5b6e64",
    lineHeight: 21,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: "#2f5d45",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryActionText: {
    color: "#fff",
    fontWeight: "800",
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: "#dce7e0",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryActionText: {
    color: "#2f5d45",
    fontWeight: "800",
  },
});
