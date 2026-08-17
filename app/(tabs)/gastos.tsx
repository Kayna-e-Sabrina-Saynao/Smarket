import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CompraHistorico, useBudget } from "@/context/budget-context";
import { PremiumFeatureModal } from "@/src/components/PremiumFeatureModal";
import { PremiumLockedState } from "@/src/components/PremiumLockedState";
import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { useCycle } from "@/src/context/CycleContext";
import { useSubscription } from "@/src/context/subscription-context";
import {
  premiumColors,
  premiumRadius,
  premiumShadows,
  premiumSpacing,
} from "@/src/theme/premium-ui";
import { canViewHistory, canViewStats } from "@/src/utils/planPermissions";

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
  const { carregandoDados, historicoCompras } = useBudget();
  const { currentPlan, subscriptionLoading, isUltimate } = useSubscription();
  const { currentMonth, currentYear, cycleLoading, cycleUpdating, getCurrentCycle } = useCycle();
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [premiumNoticeShown, setPremiumNoticeShown] = useState(false);
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

  const comprasFiltradas = useMemo(() => {
    if (dataSelecionada) {
      return historicoCompras.filter((compra) => compra.data === dataSelecionada);
    }

    return historicoCompras.filter((compra) => {
      const [ano, mes] = compra.data.split("-").map(Number);
      return ano === currentYear && mes - 1 === currentMonth;
    });
  }, [currentMonth, currentYear, dataSelecionada, historicoCompras]);

  const maiorCategoria = useMemo<{ nome: string; valor: number } | null>(() => {
    const acumulado = new Map<string, number>();

    comprasFiltradas.forEach((compra) => {
      compra.gastoPorCategoria.forEach((categoria) => {
        acumulado.set(categoria.nome, (acumulado.get(categoria.nome) ?? 0) + categoria.valor);
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

  const subtitulo = dataSelecionada ? formatarData(dataSelecionada) : getCurrentCycle().fullLabel;

  if (carregandoDados || subscriptionLoading || cycleLoading) {
    return (
      <PremiumScreen scroll={false}>
        <PremiumCard style={styles.loadingCard}>
          <ActivityIndicator size="small" color={premiumColors.primary} />
          <Text style={styles.loadingText}>Carregando compras do periodo...</Text>
        </PremiumCard>
      </PremiumScreen>
    );
  }

  if (premiumBlocked) {
    return (
      <PremiumScreen scroll={false}>
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
      </PremiumScreen>
    );
  }

  return (
    <PremiumScreen scroll={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <PremiumCard style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerBadge}>
              <MaterialIcons name="query-stats" size={22} color={premiumColors.primary} />
            </View>

            <TouchableOpacity style={styles.calendarLink} onPress={() => router.push("/(tabs)/historico")}>
              <MaterialIcons name="calendar-month" size={18} color={premiumColors.primary} />
              <Text style={styles.calendarLinkText}>Calendario</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{dataSelecionada ? "Compras do Dia" : "Compras do Mes"}</Text>
          <Text style={styles.subtitle}>{subtitulo}</Text>

          {cycleUpdating && !dataSelecionada ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color={premiumColors.primary} />
              <Text style={styles.inlineLoadingText}>Atualizando periodo selecionado...</Text>
            </View>
          ) : null}

          <View style={styles.headerActions}>
            <PremiumButton
              label="Historico com calendario"
              onPress={() => router.push("/(tabs)/historico")}
              style={styles.actionButton}
            />
            {dataSelecionada ? (
              <PremiumButton
                secondary
                label="Voltar para o mes atual"
                onPress={() => router.replace("/(tabs)/gastos")}
                style={styles.actionButton}
              />
            ) : null}
          </View>
        </PremiumCard>

        {compraFinalizadaComSucesso ? (
          <PremiumCard style={styles.successCard}>
            <View style={styles.successIcon}>
              <MaterialIcons name="check-circle" size={20} color={premiumColors.primary} />
            </View>
            <View style={styles.successContent}>
              <Text style={styles.successTitle}>Compra finalizada com sucesso</Text>
              <Text style={styles.successText}>
                A compra foi guardada no historico e carregada nesta data.
              </Text>
            </View>
          </PremiumCard>
        ) : null}

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Compras registradas</Text>
          <Text style={styles.listSubtitle}>Toque em uma compra para ver os detalhes</Text>
        </View>

        {comprasFiltradas.length === 0 ? (
          <PremiumCard style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="shopping-bag" size={22} color={premiumColors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {dataSelecionada ? "Nenhuma compra nessa data" : "Nenhuma compra neste mes"}
            </Text>
            <Text style={styles.emptyText}>
              Finalize uma compra para ela aparecer aqui com resumo e historico.
            </Text>
          </PremiumCard>
        ) : (
          comprasFiltradas.map((compra) => (
            <TouchableOpacity
              key={compra.id}
              style={styles.purchaseCard}
              activeOpacity={0.9}
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

        <PremiumCard style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <MaterialIcons name="insights" size={20} color={premiumColors.primary} />
          </View>
          <Text style={styles.tipTitle}>Resumo rapido</Text>
          <Text style={styles.tipText}>
            {maiorCategoria
              ? `A categoria que voce mais gasta e ${maiorCategoria.nome}, com ${formatarMoeda(maiorCategoria.valor)} neste periodo.`
              : "Conclua compras para ver qual categoria mais pesa no seu periodo selecionado."}
          </Text>
        </PremiumCard>
      </ScrollView>
    </PremiumScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: premiumSpacing.lg,
    gap: premiumSpacing.sm,
  },
  loadingCard: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 180,
  },
  loadingText: {
    color: premiumColors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  headerCard: {
    gap: premiumSpacing.sm,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: premiumColors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: premiumRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  calendarLinkText: {
    color: premiumColors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  title: {
    color: premiumColors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: premiumColors.textSecondary,
    fontSize: 15,
    marginTop: -8,
  },
  inlineLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineLoadingText: {
    color: premiumColors.textSecondary,
    fontSize: 13,
  },
  headerActions: {
    gap: 12,
  },
  actionButton: {
    width: "100%",
  },
  successCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: premiumColors.successSoft,
    borderColor: "#BBF7D0",
  },
  successIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: premiumColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  successContent: {
    flex: 1,
  },
  successTitle: {
    color: premiumColors.text,
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 4,
  },
  successText: {
    color: premiumColors.textSecondary,
    lineHeight: 20,
  },
  listHeader: {
    paddingHorizontal: 4,
    marginTop: 4,
  },
  listTitle: {
    color: premiumColors.text,
    fontWeight: "800",
    fontSize: 19,
  },
  listSubtitle: {
    color: premiumColors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  emptyCard: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 28,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: premiumColors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: premiumColors.text,
    fontWeight: "800",
    fontSize: 18,
    textAlign: "center",
  },
  emptyText: {
    color: premiumColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  purchaseCard: {
    backgroundColor: premiumColors.surface,
    borderRadius: premiumRadius.lg,
    padding: premiumSpacing.sm,
    borderWidth: 1,
    borderColor: premiumColors.border,
    boxShadow: premiumShadows.card,
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: "800",
    color: premiumColors.text,
  },
  purchaseDate: {
    marginTop: 4,
    color: premiumColors.textSecondary,
    fontSize: 13,
  },
  purchaseBuyer: {
    marginTop: 8,
    color: premiumColors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  purchaseTotal: {
    color: premiumColors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  statPill: {
    flex: 1,
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: premiumRadius.md,
    padding: 12,
  },
  statLabel: {
    color: premiumColors.textSecondary,
    fontSize: 12,
    marginBottom: 5,
  },
  statValue: {
    color: premiumColors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  categorySummaryLabel: {
    marginTop: 16,
    color: premiumColors.text,
    fontWeight: "700",
    marginBottom: 6,
  },
  categorySummaryText: {
    color: premiumColors.textSecondary,
    lineHeight: 20,
  },
  tipCard: {
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  tipIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: premiumColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: {
    color: premiumColors.text,
    fontWeight: "800",
  },
  tipText: {
    color: premiumColors.textSecondary,
    lineHeight: 21,
  },
});
