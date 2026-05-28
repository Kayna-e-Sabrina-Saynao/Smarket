import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBudget } from "@/context/budget-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AppEmptyState } from "@/src/components/AppEmptyState";
import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { premiumColors, premiumShadows } from "@/src/theme/premium-ui";
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

const HEADER_EXPANDED_HEIGHT = 356;
const HEADER_COLLAPSED_HEIGHT = 112;
const HEADER_SCROLL_DISTANCE = 156;

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const telaCompacta = width <= 360;
  const telaIntermediaria = width <= 430;
  const larguraCard = Math.min(370, Math.max(0, width - 32));
  const webViewportStyle =
    Platform.OS === "web"
      ? ({
          minHeight: "100vh",
          width: "100vw",
          maxWidth: "100vw",
          overflowX: "hidden",
          boxSizing: "border-box",
        } as any)
      : undefined;
  const homeContainerWebStyle =
    Platform.OS === "web"
      ? ({
          width: "100vw",
          maxWidth: "100vw",
          overflowX: "hidden",
          boxSizing: "border-box",
        } as any)
      : undefined;
  const categoriesWebStyle =
    Platform.OS === "web"
      ? ({
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        } as any)
      : undefined;
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
  const percentualGasto = orcamentoTotal === 0 ? 0 : (valorGasto / orcamentoTotal) * 100;

  const itemsFiltrados =
    categoriaAtiva === "Tudo"
      ? items.filter((item) => item.quantidade > 0)
      : items.filter((item) => item.categoria === categoriaAtiva && item.quantidade > 0);
  const exibeEstadoVazioPrincipal = items.length === 0 && categoriaAtiva === "Tudo";

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
    opacity: interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE * 0.7],
      [1, 0],
      Extrapolation.CLAMP
    ),
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
      <PremiumScreen
        scroll={false}
        style={webViewportStyle}
        contentContainerStyle={styles.homeScreenContent}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Carregando seus dados...</Text>
        </View>
      </PremiumScreen>
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
    <PremiumScreen
      scroll={false}
      style={webViewportStyle}
      contentContainerStyle={styles.homeScreenContent}>
      <View style={[styles.container, homeContainerWebStyle]}>
        <PremiumCard style={[styles.card, { width: larguraCard }]}>
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
              <Text
                style={[
                  styles.title,
                  telaIntermediaria && styles.titleReduced,
                  telaCompacta && styles.titleCompacta,
                ]}>
                Resumo Financeiro
              </Text>
              <Text style={styles.month}>{mesAtual}</Text>
            </Animated.View>

            <Animated.View style={[styles.summaryDetails, compactDetailsStyle]}>
              <View style={styles.orcamentoEditor}>
                <Text style={styles.orcamentoLabel}>Orcamento total</Text>
                <View style={[styles.orcamentoRow, telaCompacta && styles.orcamentoRowCompacta]}>
                  <TextInput
                    value={orcamentoInput}
                    onChangeText={setOrcamentoInput}
                    keyboardType="decimal-pad"
                    style={[styles.orcamentoInput, telaCompacta && styles.orcamentoInputCompacto]}
                    placeholder="Digite o valor"
                    placeholderTextColor="#9AA3AF"
                  />
                  <PremiumButton
                    label="Salvar"
                    onPress={salvarOrcamento}
                    style={[
                      styles.orcamentoButton,
                      telaIntermediaria && styles.orcamentoButtonReduced,
                      telaCompacta && styles.orcamentoButtonCompacto,
                    ]}
                  />
                </View>
              </View>

              <View style={styles.balanceCard}>
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.68}
                  numberOfLines={1}
                  style={[
                    styles.value,
                    telaIntermediaria && styles.valueReduced,
                    telaCompacta && styles.valueCompacta,
                  ]}>
                  {formatarMoeda(orcamentoTotal)}
                </Text>

                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progress,
                      {
                        width: `${Math.min(Math.max(percentualGasto, 0), 100)}%`,
                        backgroundColor: orcamentoRestante < 0 ? "#EF4444" : premiumColors.primary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.balanceDetails}>
                  <View style={styles.rowBetween}>
                    <Text numberOfLines={1} style={styles.label}>
                      Orcamento Restante
                    </Text>
                    <Text numberOfLines={1} style={[styles.label, styles.labelRight]}>
                      Valor Gasto
                    </Text>
                  </View>

                  <View style={styles.rowBetween}>
                    <Text
                      adjustsFontSizeToFit
                      minimumFontScale={0.72}
                      numberOfLines={1}
                      style={[
                        styles.labelValue,
                        orcamentoRestante < 0 && styles.labelValueNegative,
                      ]}>
                      {formatarMoeda(orcamentoRestante)}
                    </Text>
                    <Text
                      adjustsFontSizeToFit
                      minimumFontScale={0.72}
                      numberOfLines={1}
                      style={[styles.labelValue, styles.labelValueRight]}>
                      {formatarMoeda(valorGasto)}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </Animated.View>

          <PremiumButton
            label="Finalizar Compra"
            style={styles.finishButton}
            onPress={() => {
              if (saindo) return;
              router.push("/(tabs)/finalizar-compra");
            }}
          />

          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            alwaysBounceHorizontal={false}
            style={[styles.categoriesScroll, categoriesWebStyle]}
            contentContainerStyle={styles.categoriesContainer}>
            {["Tudo", ...categorias].map((categoria) => (
              <TouchableOpacity
                key={categoria}
                style={[
                  styles.category,
                  categoriaAtiva === categoria && styles.categoryActive,
                ]}
                onPress={() => setCategoriaAtiva(categoria)}>
                <Text
                  numberOfLines={1}
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
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.listaContent, { paddingBottom: 120 + insets.bottom }]}>
            {exibeEstadoVazioPrincipal ? (
              <AppEmptyState
                title="Sua primeira lista comeca aqui"
                description="Organize suas compras em segundos"
              />
            ) : itemsFiltrados.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Nenhum item encontrado nesta categoria</Text>
              </View>
            ) : (
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

          <View
            pointerEvents="box-none"
            style={[
              styles.bottomActions,
              {
                bottom: 82 + insets.bottom,
                left: 0,
                right: 0,
              },
            ]}>
            <View style={styles.bottomActionsRow}>
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
        </PremiumCard>
      </View>
    </PremiumScreen>
  );
}

const styles = StyleSheet.create({
  homeScreenContent: {
    width: "100%",
    maxWidth: "100%",
    paddingTop: 8,
    paddingHorizontal: 0,
    paddingBottom: 0,
    overflow: "hidden",
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    alignItems: "center",
    overflow: "hidden",
  },
  card: {
    width: "100%",
    maxWidth: 370,
    flex: 1,
    alignSelf: "center",
    marginTop: 0,
    marginBottom: 8,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  compactableHeader: {
    overflow: "hidden",
    backgroundColor: premiumColors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#ECF3EE",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    boxShadow: premiumShadows.card,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  helpIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: premiumColors.successSoft,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  helpIconInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  helpIconText: {
    color: premiumColors.text,
    fontSize: 22,
    lineHeight: 22,
    fontWeight: "900",
  },
  settingsIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2f5d45",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2f5d45",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: "flex-end",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: premiumColors.text,
    marginTop: 0,
  },
  titleReduced: {
    fontSize: 24,
  },
  titleCompacta: {
    fontSize: 22,
  },
  month: {
    textAlign: "center",
    color: premiumColors.textSecondary,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "500",
  },
  summaryDetails: {
    gap: 10,
  },
  orcamentoEditor: {
    backgroundColor: "#F7FAF7",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5ECE7",
  },
  orcamentoLabel: {
    fontSize: 12,
    color: "#4B6357",
    marginBottom: 8,
    fontWeight: "600",
  },
  orcamentoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  orcamentoRowCompacta: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  orcamentoInput: {
    flex: 1,
    minWidth: 0,
    height: 50,
    backgroundColor: premiumColors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 0,
    color: premiumColors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: premiumColors.border,
    fontVariant: ["tabular-nums"],
  },
  orcamentoInputCompacto: {
    width: "100%",
  },
  orcamentoButton: {
    minWidth: 88,
    width: 96,
    flexShrink: 0,
    alignSelf: "stretch",
  },
  orcamentoButtonReduced: {
    width: 92,
    minWidth: 84,
  },
  orcamentoButtonCompacto: {
    width: "100%",
  },
  balanceCard: {
    backgroundColor: premiumColors.surface,
    borderRadius: 20,
    height: "auto",
    minHeight: 150,
    overflow: "visible",
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: premiumColors.border,
    boxShadow: premiumShadows.soft,
  },
  value: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 10,
    color: premiumColors.text,
    fontVariant: ["tabular-nums"],
  },
  valueReduced: {
    fontSize: 30,
  },
  valueCompacta: {
    fontSize: 27,
  },
  progressContainer: {
    height: 10,
    backgroundColor: "#E5ECE7",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 10,
  },
  balanceDetails: {
    width: "100%",
    marginTop: 12,
    gap: 6,
  },
  progress: {
    height: "100%",
    borderRadius: 999,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 4,
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    color: premiumColors.textSecondary,
    fontWeight: "500",
  },
  labelRight: {
    textAlign: "right",
  },
  labelValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "800",
    color: premiumColors.text,
    fontVariant: ["tabular-nums"],
  },
  labelValueRight: {
    textAlign: "right",
  },
  labelValueNegative: {
    color: "#EF4444",
  },
  finishButton: {
    width: "100%",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 2,
  },
  categoriesScroll: {
    marginTop: 14,
    flexGrow: 0,
    width: "100%",
    maxWidth: "100%",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
    paddingLeft: 2,
    paddingRight: 2,
    paddingTop: 0,
    paddingBottom: 8,
    alignItems: "center",
  },
  category: {
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: premiumColors.surface,
    borderRadius: 999,
    marginRight: 0,
    borderWidth: 1,
    borderColor: premiumColors.border,
    boxShadow: premiumShadows.soft,
    maxWidth: "100%",
  },
  categoryActive: {
    backgroundColor: premiumColors.primary,
    borderColor: premiumColors.primary,
  },
  categoryText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#fff",
  },
  listaContainer: {
    marginTop: 12,
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  listaContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  item: {
    marginBottom: 10,
    backgroundColor: premiumColors.surface,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEF2F0",
    boxShadow: premiumShadows.card,
  },
  itemInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  itemTotals: {
    alignItems: "flex-end",
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    maxWidth: "56%",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  itemValor: {
    fontSize: 14,
    fontWeight: "800",
    color: premiumColors.text,
  },
  itemUnitario: {
    fontSize: 11,
    color: premiumColors.textSecondary,
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
    backgroundColor: "#E8F7EC",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E8E4A",
  },
  qty: {
    marginHorizontal: 10,
    fontSize: 15,
    fontWeight: "700",
    minWidth: 26,
    textAlign: "center",
    color: premiumColors.text,
  },
  delete: {
    marginLeft: 10,
    width: 32,
    height: 32,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  deleteText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  bottomActions: {
    position: "absolute",
    left: 0,
    right: 0,
    width: "100%",
    maxWidth: "100%",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  bottomActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  onMarketButton: {
    backgroundColor: premiumColors.surface,
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 46,
    width: 118,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: premiumColors.border,
    boxShadow: premiumShadows.soft,
  },
  onMarketText: {
    color: premiumColors.text,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  addButton: {
    backgroundColor: premiumColors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: premiumShadows.button,
    elevation: 8,
  },
  addText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  emptyState: {
    padding: 28,
    alignItems: "center",
  },
  emptyStateText: {
    color: premiumColors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  loadingCard: {
    width: "84%",
    maxWidth: 420,
    backgroundColor: premiumColors.surface,
    padding: 24,
    borderRadius: 28,
    alignItems: "center",
    boxShadow: premiumShadows.card,
  },
  loadingText: {
    color: premiumColors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
