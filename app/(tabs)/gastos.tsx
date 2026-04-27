import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { CompraHistorico, useBudget } from "@/context/budget-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
};

const gastoCategoriasTexto = (compra: CompraHistorico) =>
  compra.gastoPorCategoria
    .slice(0, 3)
    .map((categoria) => `${categoria.nome}: ${formatarMoeda(categoria.valor)}`)
    .join(" • ");

export default function Gastos() {
  const router = useRouter();
  const { carregandoDados, historicoCompras, cicloAno } = useBudget();
  const dataAtual = new Date();
  const mesAtual = dataAtual.getMonth();

  const comprasMesAtual = useMemo(
    () =>
      historicoCompras.filter((compra) => {
        const [ano, mes] = compra.data.split("-").map(Number);
        return ano === cicloAno && mes - 1 === mesAtual;
      }),
    [cicloAno, historicoCompras, mesAtual]
  );

  if (carregandoDados) {
    return (
      <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Carregando compras do mes...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.headerIcon}>
            <IconSymbol name="chart.bar.fill" size={24} color="#2f5d45" />
          </View>
          <Text style={styles.title}>Compras do Mes</Text>
          <Text style={styles.subtitle}>
            {MESES[mesAtual]} {cicloAno}
          </Text>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push("/(tabs)/historico")}>
            <Text style={styles.historyButtonText}>Historico com calendario</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Compras registradas</Text>
          <Text style={styles.listSubtitle}>Toque em uma compra para ver os detalhes</Text>
        </View>

        {comprasMesAtual.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhuma compra neste mes</Text>
            <Text style={styles.emptyText}>
              Finalize uma compra para ela aparecer aqui com resumo e historico.
            </Text>
          </View>
        ) : (
          comprasMesAtual.map((compra) => (
            <TouchableOpacity
              key={compra.id}
              style={styles.purchaseCard}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/compra/[id]",
                  params: { id: String(compra.id) },
                })
              }>
              <View style={styles.purchaseHeader}>
                <View style={styles.purchaseTitleArea}>
                  <Text style={styles.purchaseName}>{compra.nome}</Text>
                  <Text style={styles.purchaseDate}>{formatarData(compra.data)}</Text>
                </View>
                <Text style={styles.purchaseTotal}>{formatarMoeda(compra.totalGasto)}</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statLabel}>Media diaria</Text>
                  <Text style={styles.statValue}>{formatarMoeda(compra.mediaDiaria)}</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statLabel}>Categorias ativas</Text>
                  <Text style={styles.statValue}>{compra.categoriasAtivas}</Text>
                </View>
              </View>

              <Text style={styles.categorySummaryLabel}>Gasto por categoria</Text>
              <Text style={styles.categorySummaryText}>{gastoCategoriasTexto(compra)}</Text>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: "#e9eceb",
    margin: 20,
    marginTop: 40,
    padding: 25,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerIcon: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2f5d45",
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginTop: 5,
    fontSize: 14,
    marginBottom: 18,
  },
  historyButton: {
    backgroundColor: "#2f5d45",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  historyButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  listHeader: {
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  listSubtitle: {
    fontSize: 12,
    color: "#d3dcd7",
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: "#e9eceb",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#2f5d45",
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 8,
  },
  emptyText: {
    color: "#6c7a73",
    textAlign: "center",
    lineHeight: 20,
  },
  purchaseCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  purchaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  purchaseTitleArea: {
    flex: 1,
  },
  purchaseName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2f5d45",
  },
  purchaseDate: {
    marginTop: 4,
    color: "#66766d",
    fontSize: 13,
  },
  purchaseTotal: {
    color: "#2f5d45",
    fontWeight: "800",
    fontSize: 15,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  statPill: {
    flex: 1,
    backgroundColor: "#eef3f0",
    borderRadius: 14,
    padding: 12,
  },
  statLabel: {
    color: "#6a7a72",
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: "#2f5d45",
    fontWeight: "700",
    fontSize: 14,
  },
  categorySummaryLabel: {
    marginTop: 14,
    color: "#486756",
    fontWeight: "700",
    marginBottom: 6,
  },
  categorySummaryText: {
    color: "#5f6f66",
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
  loadingCard: {
    flex: 1,
    margin: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e9eceb",
    borderRadius: 24,
  },
  loadingText: {
    color: "#2f5d45",
    fontSize: 16,
    fontWeight: "600",
  },
});
