import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
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
  premiumSpacing,
} from "@/src/theme/premium-ui";
import { canViewHistory } from "@/src/utils/planPermissions";

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

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
};

const formatarDataCurta = (data: Date | null, fallback: string) =>
  data ? data.toLocaleDateString("pt-BR") : formatarData(fallback);

export default function HistoricoScreen() {
  const router = useRouter();
  const { carregandoDados, historicoCompras } = useBudget();
  const { currentPlan, subscriptionLoading, isUltimate } = useSubscription();
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const {
    currentMonth,
    currentYear,
    cycleLoading,
    cycleUpdating,
    setCurrentMonth,
    setCurrentYear,
  } = useCycle();
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [premiumNoticeShown, setPremiumNoticeShown] = useState(false);
  const premiumBlocked = !canViewHistory(currentPlan, isUltimate);

  useEffect(() => {
    if (subscriptionLoading || premiumNoticeShown || !premiumBlocked) {
      return;
    }

    setPremiumModalVisible(true);
    setPremiumNoticeShown(true);
  }, [premiumBlocked, premiumNoticeShown, subscriptionLoading]);

  const comprasDoMes = useMemo(
    () =>
      historicoCompras.filter((compra) => {
        const [ano, mes] = compra.data.split("-").map(Number);
        return ano === currentYear && mes - 1 === currentMonth;
      }),
    [currentMonth, currentYear, historicoCompras]
  );

  const comprasDoDia = useMemo(() => {
    if (diaSelecionado === null) {
      return [];
    }

    return comprasDoMes.filter((compra) => Number(compra.data.split("-")[2]) === diaSelecionado);
  }, [comprasDoMes, diaSelecionado]);

  const diasComCompra = useMemo(
    () => new Set(comprasDoMes.map((compra) => Number(compra.data.split("-")[2]))),
    [comprasDoMes]
  );

  const diasNoMes = new Date(currentYear, currentMonth + 1, 0).getDate();
  const primeiroDiaSemana = new Date(currentYear, currentMonth, 1).getDay();

  const blocosCalendario = useMemo(() => {
    const blocos: { dia: number | null }[] = [];

    for (let indice = 0; indice < primeiroDiaSemana; indice += 1) {
      blocos.push({ dia: null });
    }

    for (let dia = 1; dia <= diasNoMes; dia += 1) {
      blocos.push({ dia });
    }

    return blocos;
  }, [diasNoMes, primeiroDiaSemana]);

  const mudarMes = async (direcao: "anterior" | "proximo") => {
    const novoMes = direcao === "anterior" ? currentMonth - 1 : currentMonth + 1;

    if (novoMes < 0) {
      await setCurrentYear(currentYear - 1);
      await setCurrentMonth(11);
      setDiaSelecionado(null);
      return;
    }

    if (novoMes > 11) {
      await setCurrentYear(currentYear + 1);
      await setCurrentMonth(0);
      setDiaSelecionado(null);
      return;
    }

    await setCurrentMonth(novoMes);
    setDiaSelecionado(null);
  };

  if (carregandoDados || subscriptionLoading || cycleLoading) {
    return (
      <PremiumScreen scroll={false}>
        <PremiumCard style={styles.loadingCard}>
          <ActivityIndicator size="small" color={premiumColors.primary} />
          <Text style={styles.loadingText}>Carregando historico...</Text>
        </PremiumCard>
      </PremiumScreen>
    );
  }

  if (premiumBlocked) {
    return (
      <PremiumScreen scroll={false}>
        <PremiumLockedState
          title="Historico avancado bloqueado"
          description="Esse calendario completo de compras fica disponivel nos planos Pro e Familia."
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PremiumCard style={styles.card}>
          <View style={styles.topBar}>
            <PremiumButton secondary label="Voltar" onPress={() => router.back()} style={styles.topButton} />
            <View style={styles.titleBadge}>
              <MaterialIcons name="calendar-month" size={20} color={premiumColors.primary} />
            </View>
          </View>

          <View style={styles.monthHeader}>
            <TouchableOpacity style={styles.monthNav} onPress={() => mudarMes("anterior")}>
              <MaterialIcons name="chevron-left" size={24} color={premiumColors.text} />
            </TouchableOpacity>

            <View style={styles.monthTitleBlock}>
              <Text style={styles.title}>Historico</Text>
              <Text style={styles.subtitle}>
                {MESES[currentMonth]} {currentYear}
              </Text>
            </View>

            <TouchableOpacity style={styles.monthNav} onPress={() => mudarMes("proximo")}>
              <MaterialIcons name="chevron-right" size={24} color={premiumColors.text} />
            </TouchableOpacity>
          </View>

          {cycleUpdating ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color={premiumColors.primary} />
              <Text style={styles.inlineLoadingText}>Atualizando calendario do ciclo...</Text>
            </View>
          ) : null}

          <View style={styles.weekRow}>
            {DIAS_SEMANA.map((dia, index) => (
              <Text key={`${dia}-${index}`} style={styles.weekLabel}>
                {dia}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {blocosCalendario.map((bloco, index) => {
              if (bloco.dia === null) {
                return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
              }

              const temCompra = diasComCompra.has(bloco.dia);
              const selecionado = diaSelecionado === bloco.dia;

              return (
                <TouchableOpacity
                  key={bloco.dia}
                  style={[styles.dayCell, selecionado && styles.dayCellActive]}
                  onPress={() => {
                    setDiaSelecionado(bloco.dia);

                    if (temCompra) {
                      router.push({
                        pathname: "/(tabs)/gastos",
                        params: {
                          data: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(bloco.dia).padStart(2, "0")}`,
                        },
                      });
                    }
                  }}>
                  <Text style={[styles.dayText, selecionado && styles.dayTextActive]}>{bloco.dia}</Text>
                  {temCompra ? <View style={styles.dayDot} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>
            {diaSelecionado === null
              ? "Selecione um dia"
              : `Compras de ${String(diaSelecionado).padStart(2, "0")}/${String(currentMonth + 1).padStart(2, "0")}/${currentYear}`}
          </Text>

          {diaSelecionado !== null && comprasDoDia.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma compra registrada nesse dia.</Text>
          ) : null}

          {comprasDoDia.map((compra: CompraHistorico) => (
            <PremiumCard key={compra.id} style={styles.purchaseRow}>
              <View style={styles.purchaseMainInfo}>
                <Text style={styles.purchaseName}>{compra.nome}</Text>
                <Text style={styles.purchaseDate}>{formatarData(compra.data)}</Text>
                {compra.completedBy ? (
                  <Text style={styles.purchaseBuyer}>
                    Compra realizada por {compra.completedBy} em{" "}
                    {formatarDataCurta(compra.completedAt ?? null, compra.data)}
                  </Text>
                ) : null}
              </View>

              <View style={styles.purchaseActions}>
                {compra.fotoNotaUri ? (
                  <PremiumButton
                    secondary
                    label="Ver nota"
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/nota/[id]",
                        params: { id: String(compra.id) },
                      })
                    }
                    style={styles.purchaseAction}
                  />
                ) : null}

                <PremiumButton
                  label="Detalhes"
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/compra/[id]",
                      params: { id: String(compra.id) },
                    })
                  }
                  style={styles.purchaseAction}
                />
              </View>
            </PremiumCard>
          ))}
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
  loadingCard: {
    width: "100%",
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: premiumColors.text,
    fontSize: 16,
    fontWeight: "600",
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: premiumColors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthTitleBlock: {
    alignItems: "center",
    gap: 4,
  },
  monthNav: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: premiumColors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: premiumColors.border,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: premiumColors.text,
  },
  subtitle: {
    color: premiumColors.textSecondary,
    fontSize: 15,
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
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekLabel: {
    width: "14.2%",
    textAlign: "center",
    color: premiumColors.textSecondary,
    fontWeight: "700",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  dayCellEmpty: {
    width: "14.2%",
    aspectRatio: 1,
    marginBottom: 8,
  },
  dayCell: {
    width: "14.2%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    marginBottom: 8,
    backgroundColor: premiumColors.surfaceMuted,
  },
  dayCellActive: {
    backgroundColor: premiumColors.primary,
  },
  dayText: {
    color: premiumColors.text,
    fontWeight: "700",
  },
  dayTextActive: {
    color: premiumColors.surface,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: premiumColors.primary,
    marginTop: 4,
  },
  sectionTitle: {
    color: premiumColors.text,
    fontWeight: "800",
    fontSize: 17,
    marginTop: 4,
  },
  emptyText: {
    color: premiumColors.textSecondary,
  },
  purchaseRow: {
    padding: 0,
    marginTop: 4,
  },
  purchaseMainInfo: {
    marginBottom: 14,
  },
  purchaseName: {
    color: premiumColors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  purchaseDate: {
    color: premiumColors.textSecondary,
    marginTop: 4,
    fontSize: 12,
  },
  purchaseBuyer: {
    color: premiumColors.primary,
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  purchaseActions: {
    flexDirection: "row",
    gap: 10,
  },
  purchaseAction: {
    flex: 1,
  },
});
