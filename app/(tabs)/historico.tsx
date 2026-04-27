import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { CompraHistorico, useBudget } from "@/context/budget-context";

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

export default function HistoricoScreen() {
  const router = useRouter();
  const { carregandoDados, historicoCompras, cicloAno, iniciarNovoCiclo } = useBudget();
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const [anoVisualizado, setAnoVisualizado] = useState(cicloAno);

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

  if (carregandoDados) {
    return (
      <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Carregando historico...</Text>
        </View>
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
                  onPress={() => setDiaSelecionado(bloco.dia)}>
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
            <TouchableOpacity
              key={compra.id}
              style={styles.purchaseRow}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/compra/[id]",
                  params: { id: String(compra.id) },
                })
              }>
              <View>
                <Text style={styles.purchaseName}>{compra.nome}</Text>
                <Text style={styles.purchaseDate}>{formatarData(compra.data)}</Text>
              </View>
              <Text style={styles.purchaseArrow}>Ver</Text>
            </TouchableOpacity>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
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
  purchaseArrow: {
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
