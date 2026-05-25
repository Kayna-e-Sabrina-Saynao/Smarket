import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { CompraHistorico, useBudget } from "@/context/budget-context";
import { PremiumFeatureModal } from "@/src/components/PremiumFeatureModal";
import { PremiumLockedState } from "@/src/components/PremiumLockedState";
import { useSubscription } from "@/src/context/subscription-context";
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
  data
    ? data.toLocaleDateString("pt-BR")
    : formatarData(fallback);

export default function HistoricoScreen() {
  const router = useRouter();
  const { carregandoDados, historicoCompras, cicloAno, iniciarNovoCiclo } = useBudget();
  const { currentPlan, subscriptionLoading, isUltimate } = useSubscription();
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const [anoVisualizado, setAnoVisualizado] = useState(cicloAno);
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
        return ano === anoVisualizado && mes - 1 === mesSelecionado;
      }),
    [anoVisualizado, historicoCompras, mesSelecionado]
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

  const diasNoMes = new Date(anoVisualizado, mesSelecionado + 1, 0).getDate();
  const primeiroDiaSemana = new Date(anoVisualizado, mesSelecionado, 1).getDay();

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

  const mudarMes = (direcao: "anterior" | "proximo") => {
    if (direcao === "anterior") {
      if (mesSelecionado === 0) {
        return;
      }

      setMesSelecionado((estadoAtual) => estadoAtual - 1);
      setDiaSelecionado(null);
      return;
    }

    if (mesSelecionado === 11) {
      const proximoAno = anoVisualizado + 1;
      iniciarNovoCiclo(proximoAno);
      setAnoVisualizado(proximoAno);
      setMesSelecionado(0);
      setDiaSelecionado(null);
      return;
    }

    setMesSelecionado((estadoAtual) => estadoAtual + 1);
    setDiaSelecionado(null);
  };

  if (carregandoDados || subscriptionLoading) {
    return (
      <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Carregando historico...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (premiumBlocked) {
    return (
      <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
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
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.monthHeader}>
            <TouchableOpacity style={styles.monthNav} onPress={() => mudarMes("anterior")}>
              <Text style={styles.monthNavText}>{"<"}</Text>
            </TouchableOpacity>

            <View>
              <Text style={styles.title}>Historico</Text>
              <Text style={styles.subtitle}>
                {MESES[mesSelecionado]} {anoVisualizado}
              </Text>
            </View>

            <TouchableOpacity style={styles.monthNav} onPress={() => mudarMes("proximo")}>
              <Text style={styles.monthNavText}>{">"}</Text>
            </TouchableOpacity>
          </View>

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
                return <View key={`empty-${index}`} style={styles.dayCell} />;
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
                          data: `${anoVisualizado}-${String(mesSelecionado + 1).padStart(2, "0")}-${String(bloco.dia).padStart(2, "0")}`,
                        },
                      });
                    }
                  }}>
                  <Text style={[styles.dayText, selecionado && styles.dayTextActive]}>
                    {bloco.dia}
                  </Text>
                  {temCompra ? <View style={styles.dayDot} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>
            {diaSelecionado === null
              ? "Selecione um dia"
              : `Compras de ${String(diaSelecionado).padStart(2, "0")}/${String(
                  mesSelecionado + 1
                ).padStart(2, "0")}/${anoVisualizado}`}
          </Text>

          {diaSelecionado !== null && comprasDoDia.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma compra registrada nesse dia.</Text>
          ) : null}

          {comprasDoDia.map((compra: CompraHistorico) => (
            <View key={compra.id} style={styles.purchaseRow}>
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
                  <TouchableOpacity
                    style={styles.purchaseActionSecondary}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/nota/[id]",
                        params: { id: String(compra.id) },
                      })
                    }>
                    <Text style={styles.purchaseActionSecondaryText}>Ver nota</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={styles.purchaseActionPrimary}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/compra/[id]",
                      params: { id: String(compra.id) },
                    })
                  }>
                  <Text style={styles.purchaseActionPrimaryText}>Detalhes</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#e9eceb",
    borderRadius: 30,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#d7dfda",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  backButtonText: {
    color: "#3f5d4d",
    fontWeight: "700",
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  monthNav: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#d7dfda",
    alignItems: "center",
    justifyContent: "center",
  },
  monthNavText: {
    color: "#2f5d45",
    fontWeight: "800",
    fontSize: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2f5d45",
  },
  subtitle: {
    textAlign: "center",
    color: "#66766d",
    marginTop: 4,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weekLabel: {
    width: "14.2%",
    textAlign: "center",
    color: "#617168",
    fontWeight: "700",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 22,
  },
  dayCell: {
    width: "14.2%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    marginBottom: 6,
  },
  dayCellActive: {
    backgroundColor: "#2f5d45",
  },
  dayText: {
    color: "#34443c",
    fontWeight: "600",
  },
  dayTextActive: {
    color: "#fff",
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e17055",
    marginTop: 4,
  },
  sectionTitle: {
    color: "#2f5d45",
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 12,
  },
  emptyText: {
    color: "#6c7a73",
    marginBottom: 8,
  },
  purchaseRow: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  purchaseMainInfo: {
    marginBottom: 12,
  },
  purchaseName: {
    color: "#2f5d45",
    fontWeight: "700",
    fontSize: 15,
  },
  purchaseDate: {
    color: "#6c7a73",
    marginTop: 4,
    fontSize: 12,
  },
  purchaseBuyer: {
    color: "#486756",
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  purchaseActions: {
    flexDirection: "row",
    gap: 8,
  },
  purchaseActionPrimary: {
    flex: 1,
    backgroundColor: "#2f5d45",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  purchaseActionPrimaryText: {
    color: "#fff",
    fontWeight: "700",
  },
  purchaseActionSecondary: {
    flex: 1,
    backgroundColor: "#dce7e0",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  purchaseActionSecondaryText: {
    color: "#2f5d45",
    fontWeight: "700",
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
