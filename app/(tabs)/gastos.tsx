import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { CompraHistorico, useBudget } from "@/context/budget-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PremiumFeatureModal } from "@/src/components/PremiumFeatureModal";
import { PremiumLockedState } from "@/src/components/PremiumLockedState";
import { useSubscription } from "@/src/context/subscription-context";
import { canViewHistory, canViewStats } from "@/src/utils/planPermissions";

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
  const params = useLocalSearchParams<{ data?: string | string[]; success?: string | string[] }>();
  const { carregandoDados, historicoCompras, cicloAno } = useBudget();
  const { currentPlan, subscriptionLoading, isUltimate } = useSubscription();
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [premiumNoticeShown, setPremiumNoticeShown] = useState(false);
  const dataAtual = new Date();
  const mesAtual = dataAtual.getMonth();
  const dataSelecionada = Array.isArray(params.data) ? params.data[0] : params.data;
  const compraFinalizadaComSucesso = Array.isArray(params.success)
    ? params.success[0] === "1"
    : params.success === "1";
  const premiumBlocked =
    !canViewHistory(currentPlan, isUltimate) || !canViewStats(currentPlan, isUltimate);

  useEffect(() => {
    if (subscriptionLoading || premiumNoticeShown || !premiumBlocked) {
      return;
    }

    setPremiumModalVisible(true);
    setPremiumNoticeShown(true);
  }, [premiumBlocked, premiumNoticeShown, subscriptionLoading]);

  const comprasFiltradas = useMemo(
    () => {
      if (dataSelecionada) {
        return historicoCompras.filter((compra) => compra.data === dataSelecionada);
      }

      return historicoCompras.filter((compra) => {
        const [ano, mes] = compra.data.split("-").map(Number);
        return ano === cicloAno && mes - 1 === mesAtual;
      });
    },
    [cicloAno, dataSelecionada, historicoCompras, mesAtual]
  );

  const maiorCategoria = useMemo<{ nome: string; valor: number } | null>(() => {
    const acumulado = new Map<string, number>();

    comprasFiltradas.forEach((compra) => {
      compra.gastoPorCategoria.forEach((categoria) => {
        acumulado.set(
          categoria.nome,
          (acumulado.get(categoria.nome) ?? 0) + categoria.valor
        );
      });
    });

    let categoriaTop: { nome: string; valor: number } | null = null;

    acumulado.forEach((valor, nome) => {
      if (!categoriaTop || valor > categoriaTop.valor) {
        categoriaTop = { nome, valor };
      }
    });

    return categoriaTop;
  }, [comprasFiltradas]);

  const subtitulo = dataSelecionada
    ? formatarData(dataSelecionada)
    : `${MESES[mesAtual]} ${cicloAno}`;

  if (carregandoDados || subscriptionLoading) {
    return (
      <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Carregando compras do mes...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (premiumBlocked) {
    return (
      <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
        <PremiumLockedState
          title="Historico e estatisticas sao premium"
          description="No plano Gratis, voce continua usando sua lista principal. Para ver historico completo e estatisticas, escolha Pro ou Familia."
          onViewPlans={() => {
            setPremiumModalVisible(false);
            router.push("/(tabs)/planos");
          }}
        />
        <PremiumFeatureModal
          visible={premiumModalVisible}
          onClose={() => setPremiumModalVisible(false)}
          onViewPlans={() => {
            setPremiumModalVisible(false);
            router.push("/(tabs)/planos");
          }}
        />
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
          <Text style={styles.title}>
            {dataSelecionada ? "Compras do Dia" : "Compras do Mes"}
          </Text>
          <Text style={styles.subtitle}>{subtitulo}</Text>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push("/(tabs)/historico")}>
            <Text style={styles.historyButtonText}>Historico com calendario</Text>
          </TouchableOpacity>

          {dataSelecionada ? (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => router.replace("/(tabs)/gastos")}>
              <Text style={styles.clearFilterButtonText}>Voltar para o mes atual</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {compraFinalizadaComSucesso ? (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Compra finalizada com sucesso</Text>
            <Text style={styles.successText}>
              A compra foi guardada no historico e carregada nesta data.
            </Text>
          </View>
        ) : null}

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Compras registradas</Text>
          <Text style={styles.listSubtitle}>Toque em uma compra para ver os detalhes</Text>
        </View>

        {comprasFiltradas.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {dataSelecionada ? "Nenhuma compra nessa data" : "Nenhuma compra neste mes"}
            </Text>
            <Text style={styles.emptyText}>
              Finalize uma compra para ela aparecer aqui com resumo e historico.
            </Text>
          </View>
        ) : (
          comprasFiltradas.map((compra) => (
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
                  {compra.completedBy ? (
                    <Text style={styles.purchaseBuyer}>Compra realizada por {compra.completedBy}</Text>
                  ) : null}
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

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Resumo rapido</Text>
          <Text style={styles.tipText}>
            {maiorCategoria
              ? `A categoria que voce mais gasta e ${maiorCategoria.nome}, com ${formatarMoeda(maiorCategoria.valor)} neste periodo.`
              : "Conclua compras para ver qual categoria mais pesa no seu periodo selecionado."}
          </Text>
        </View>

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
  clearFilterButton: {
    marginTop: 10,
    backgroundColor: "#dce7e0",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  clearFilterButtonText: {
    color: "#2f5d45",
    fontWeight: "700",
  },
  listHeader: {
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  successCard: {
    backgroundColor: "#dce7e0",
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#b9d1c3",
  },
  successTitle: {
    color: "#2f5d45",
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 4,
  },
  successText: {
    color: "#5b6f64",
    lineHeight: 19,
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
  purchaseBuyer: {
    marginTop: 6,
    color: "#2f5d45",
    fontSize: 13,
    fontWeight: "600",
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
  tipCard: {
    backgroundColor: "#fff6dc",
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#d4a83d",
  },
  tipTitle: {
    color: "#2f5d45",
    fontWeight: "800",
    marginBottom: 6,
  },
  tipText: {
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
