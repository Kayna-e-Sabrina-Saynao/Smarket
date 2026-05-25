import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { useBudget } from "@/context/budget-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AppEmptyState } from "@/src/components/AppEmptyState";
import { auth } from "../../firebaseConfig";

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

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

const HEADER_EXPANDED_HEIGHT = 252;
const HEADER_COLLAPSED_HEIGHT = 124;
const HEADER_SCROLL_DISTANCE = 160;

export default function Home() {
  const router = useRouter();
  const {
    categorias,
    carregandoDados,
    forcarSalvarDados,
    items,
    orcamentoTotal,
    valorGasto,
    orcamentoRestante,
    definirOrcamentoTotal,
    deletarItem,
    incrementarQuantidade,
    decrementarQuantidade,
  } = useBudget();
  const [categoriaAtiva, setCategoriaAtiva] = useState("Tudo");
  const [orcamentoInput, setOrcamentoInput] = useState(String(orcamentoTotal));
  const [saindo, setSaindo] = useState(false);
  const scrollY = useSharedValue(0);

  useEffect(() => {
    setOrcamentoInput(String(orcamentoTotal));
  }, [orcamentoTotal]);

  const dataAtual = new Date();
  const mesAtual = `${MESES[dataAtual.getMonth()]} ${dataAtual.getFullYear()}`;

  // O filtro permite visualizar todos os itens ou apenas uma categoria por vez.
  const percentualGasto = orcamentoTotal === 0 ? 0 : (valorGasto / orcamentoTotal) * 100;

  const itemsFiltrados =
    categoriaAtiva === "Tudo"
      ? items.filter((item) => item.quantidade > 0)
      : items.filter((item) => item.categoria === categoriaAtiva && item.quantidade > 0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const compactableHeaderStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [HEADER_EXPANDED_HEIGHT, HEADER_COLLAPSED_HEIGHT],
      Extrapolation.CLAMP
    ),
  }));

  const compactDetailsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HEADER_SCROLL_DISTANCE * 0.7], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, HEADER_SCROLL_DISTANCE],
          [0, -18],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const compactSummaryStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(scrollY.value, [0, HEADER_SCROLL_DISTANCE], [1, 0.88], Extrapolation.CLAMP),
      },
    ],
  }));

  if (carregandoDados) {
    return (
      <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Carregando seus dados...</Text>
        </View>
      </LinearGradient>
    );
  }

  const salvarOrcamento = () => {
    const valorNormalizado = Number(orcamentoInput.replace(",", "."));

    if (Number.isNaN(valorNormalizado) || valorNormalizado <= 0) {
      alert("Orcamento invalido. Digite um valor maior que zero.");
      return;
    }

    definirOrcamentoTotal(valorNormalizado);
  };

  const sairDaConta = async () => {
    if (saindo) {
      return;
    }

    setSaindo(true);
    try {
      await forcarSalvarDados();
      await signOut(auth);
      router.replace("/");
    } catch {
      setSaindo(false);
      alert("Nao foi possivel sair agora.");
    }
  };

  return (
    <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.helpIconButton}
              onPress={() => router.push("/(tabs)/ajuda")}>
              <View style={styles.helpIconInner}>
                <Text style={styles.helpIconText}>?</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsIconButton}
              onPress={() => router.push("/(tabs)/configuracoes")}>
              <IconSymbol name="gearshape.fill" size={24} color="#9ee0a2" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={sairDaConta}
            disabled={saindo}>
            <IconSymbol
              name="rectangle.portrait.and.arrow.right"
              size={18}
              color="#fff"
            />
            <Text style={styles.logoutText}>{saindo ? "Saindo..." : "Sair"}</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.compactableHeader, compactableHeaderStyle]}>
          <Animated.View style={compactSummaryStyle}>
            <Text style={styles.title}>Resumo Financeiro</Text>
            <Text style={styles.month}>{mesAtual}</Text>
          </Animated.View>

          <Animated.View style={compactDetailsStyle}>
            <View style={styles.orcamentoEditor}>
              <Text style={styles.orcamentoLabel}>Orcamento total</Text>
              <View style={styles.orcamentoRow}>
                <TextInput
                  value={orcamentoInput}
                  onChangeText={setOrcamentoInput}
                  keyboardType="decimal-pad"
                  style={styles.orcamentoInput}
                  placeholder="Digite o valor"
                  placeholderTextColor="#88958d"
                />
                <TouchableOpacity style={styles.orcamentoButton} onPress={salvarOrcamento}>
                  <Text style={styles.orcamentoButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.value}>{formatarMoeda(orcamentoTotal)}</Text>

            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progress,
                  {
                    width: `${Math.min(Math.max(percentualGasto, 0), 100)}%`,
                    backgroundColor: orcamentoRestante < 0 ? "#c0392b" : "#2f5d45",
                  },
                ]}
              />
            </View>

            <View style={styles.rowBetween}>
              <Text style={styles.label}>Orcamento Restante</Text>
              <Text style={styles.label}>Valor Gasto</Text>
            </View>

            <View style={styles.rowBetween}>
              <Text
                style={[
                  styles.labelValue,
                  orcamentoRestante < 0 && styles.labelValueNegative,
                ]}>
                {formatarMoeda(orcamentoRestante)}
              </Text>
              <Text style={styles.labelValue}>{formatarMoeda(valorGasto)}</Text>
            </View>

          </Animated.View>
        </Animated.View>

        <TouchableOpacity
          style={styles.finishButton}
          onPress={() => {
            if (saindo) return;
            router.push("/(tabs)/finalizar-compra");
          }}>
          <Text style={styles.finishButtonText}>Finalizar Compra</Text>
        </TouchableOpacity>

        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}>
          {/* "Tudo" reaproveita a mesma listagem sem criar uma categoria extra no banco. */}
          {["Tudo", ...categorias].map((categoria) => (
            <TouchableOpacity
              key={categoria}
              style={[
                styles.category,
                categoriaAtiva === categoria && styles.categoryActive,
              ]}
              onPress={() => setCategoriaAtiva(categoria)}>
              <Text
                style={[
                  styles.categoryText,
                  categoriaAtiva === categoria && styles.categoryTextActive,
                ]}>
                {categoria}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.ScrollView>

        <Animated.ScrollView
          style={styles.listaContainer}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listaContent}>
          {items.length === 0 && categoriaAtiva === "Tudo" ? (
            <AppEmptyState
              title="Sua primeira lista comeca aqui"
              description="Organize suas compras em segundos"
              buttonLabel="Criar lista"
              onPress={() => router.push("/(tabs)/add")}
            />
          ) : itemsFiltrados.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhum item encontrado nesta categoria</Text>
            </View>
          ) : (
            // Os controles alteram apenas o estado global; o contexto cuida da persistencia no Firestore.
            itemsFiltrados.map((item) => (
              <View key={item.id} style={styles.item}>
                <View style={styles.itemInfo}>
                  <View style={[styles.badge, { backgroundColor: item.cor }]}>
                    <Text style={styles.badgeText}>{item.nome}</Text>
                  </View>
                  <View style={styles.itemTotals}>
                    <Text style={styles.itemValor}>
                      {formatarMoeda(item.quantidade * item.valorUnitario)}
                    </Text>
                    <Text style={styles.itemUnitario}>
                      {formatarMoeda(item.valorUnitario)} por unidade
                    </Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.btnSmall}
                    onPress={() => incrementarQuantidade(item.id)}>
                    <Text style={styles.btnText}>+</Text>
                  </TouchableOpacity>

                  <Text style={styles.qty}>{item.quantidade}</Text>

                  <TouchableOpacity
                    style={styles.btnSmall}
                    onPress={() => decrementarQuantidade(item.id)}>
                    <Text style={styles.btnText}>-</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.delete}
                    onPress={() => deletarItem(item.id)}>
                    <Text style={styles.deleteText}>x</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </Animated.ScrollView>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.onMarketButton}
            onPress={() => {
              if (saindo) return;
              router.push("/(tabs)/on-market");
            }}
            activeOpacity={0.7}>
            <Text style={styles.onMarketText}>ON MARKET</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              if (saindo) return;
              router.push("/(tabs)/add");
            }}
            activeOpacity={0.7}>
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "90%",
    height: "88%",
    backgroundColor: "#e9eceb",
    borderRadius: 30,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  compactableHeader: {
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eef3f0",
    alignItems: "center",
    justifyContent: "center",
  },
  helpIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#9ee0a2",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
  },
  helpIconInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  helpIconText: {
    color: "#111",
    fontSize: 24,
    lineHeight: 24,
    fontWeight: "900",
  },
  settingsIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2f5d45",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
  },
  settingsIconText: {
    color: "#9ee0a2",
    fontSize: 24,
    lineHeight: 24,
    fontWeight: "900",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2f5d45",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-end",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2f5d45",
  },
  month: {
    textAlign: "center",
    color: "#5d6d65",
    marginBottom: 18,
    fontSize: 14,
  },
  orcamentoEditor: {
    backgroundColor: "#dce7e0",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d0ddd6",
  },
  orcamentoLabel: {
    fontSize: 13,
    color: "#486756",
    marginBottom: 8,
    fontWeight: "600",
  },
  orcamentoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orcamentoInput: {
    flex: 1,
    backgroundColor: "#f7faf8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#2f5d45",
    fontSize: 16,
  },
  orcamentoButton: {
    backgroundColor: "#2f5d45",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  orcamentoButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  value: {
    fontSize: 38,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 16,
    color: "#2f5d45",
  },
  progressContainer: {
    height: 10,
    backgroundColor: "#d3dcd7",
    borderRadius: 10,
    overflow: "hidden",
    marginVertical: 15,
  },
  progress: {
    height: "100%",
    borderRadius: 10,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    color: "#666",
  },
  labelValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2f5d45",
  },
  labelValueNegative: {
    color: "#c0392b",
  },
  finishButton: {
    marginTop: 16,
    backgroundColor: "#2f5d45",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  finishButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  categoriesScroll: {
    marginTop: 20,
    flexGrow: 0,
  },
  categoriesContainer: {
    paddingHorizontal: 2,
  },
  category: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#d3dcd7",
    borderRadius: 20,
    marginRight: 10,
  },
  categoryActive: {
    backgroundColor: "#2f5d45",
  },
  categoryText: {
    fontSize: 14,
    color: "#444",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#fff",
  },
  listaContainer: {
    marginTop: 20,
    flex: 1,
  },
  listaContent: {
    paddingBottom: 110,
  },
  item: {
    marginBottom: 12,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  itemTotals: {
    alignItems: "flex-end",
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    maxWidth: "58%",
  },
  badgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  itemValor: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2f5d45",
  },
  itemUnitario: {
    fontSize: 11,
    color: "#66766d",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  btnSmall: {
    width: 32,
    height: 32,
    backgroundColor: "#cde3d7",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  btnText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2f5d45",
  },
  qty: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: "600",
    minWidth: 30,
    textAlign: "center",
  },
  delete: {
    marginLeft: 10,
    width: 32,
    height: 32,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  deleteText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomActions: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  onMarketButton: {
    backgroundColor: "#dce7e0",
    borderRadius: 28,
    paddingHorizontal: 18,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.16,
    shadowRadius: 3.84,
    elevation: 4,
  },
  onMarketText: {
    color: "#2f5d45",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  addButton: {
    backgroundColor: "#2f5d45",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addText: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyStateText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
  loadingCard: {
    width: "84%",
    backgroundColor: "#e9eceb",
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
  },
  loadingText: {
    color: "#2f5d45",
    fontSize: 16,
    fontWeight: "600",
  },
});
