import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { OnMarketItem, useBudget } from "@/context/budget-context";
import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { premiumColors, premiumRadius, premiumShadows, premiumSpacing } from "@/src/theme/premium-ui";

const FILTROS_CATEGORIA = [
  "Todas",
  "Limpeza",
  "Mercado",
  "Hortifruti",
  "Higiene",
  "Padaria",
  "Outros",
] as const;

const formatarQuantidade = (quantidade: number) =>
  `${quantidade} ${quantidade === 1 ? "unidade" : "unidades"}`;

export default function OnMarketScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const telaCompacta = width <= 360;
  const { carregandoDados, onMarketItems, concluirOnMarketItem } = useBudget();
  const [categoriaAtiva, setCategoriaAtiva] =
    useState<(typeof FILTROS_CATEGORIA)[number]>("Todas");
  const [itemAbertoId, setItemAbertoId] = useState<number | null>(null);
  const [valoresUnitarios, setValoresUnitarios] = useState<Record<number, string>>({});

  const itensFiltrados = useMemo(() => {
    if (categoriaAtiva === "Todas") {
      return onMarketItems;
    }

    return onMarketItems.filter((item) => item.categoria === categoriaAtiva);
  }, [categoriaAtiva, onMarketItems]);

  const toggleItem = (item: OnMarketItem) => {
    setItemAbertoId((estadoAtual) => (estadoAtual === item.id ? null : item.id));
  };

  const confirmarValor = (item: OnMarketItem) => {
    const valorDigitado = valoresUnitarios[item.id] ?? "";
    const valor = Number(valorDigitado.replace(",", "."));

    if (Number.isNaN(valor) || valor <= 0) {
      Alert.alert("Valor invalido", "Informe um valor unitario maior que zero.");
      return;
    }

    concluirOnMarketItem(item.id, valor);
    setValoresUnitarios((estadoAtual) => {
      const proximoEstado = { ...estadoAtual };
      delete proximoEstado[item.id];
      return proximoEstado;
    });
    setItemAbertoId(null);
  };

  if (carregandoDados) {
    return (
      <PremiumScreen scroll={false}>
        <PremiumCard style={styles.loadingCard}>
          <Text style={styles.loadingText}>Carregando lista ativa...</Text>
        </PremiumCard>
      </PremiumScreen>
    );
  }

  return (
    <PremiumScreen scroll={false}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <PremiumCard style={styles.card}>
          <View style={styles.topBar}>
            <PremiumButton secondary label="Voltar" onPress={() => router.back()} style={styles.backButton} />
            <View style={styles.topBadge}>
              <MaterialIcons name="shopping-cart" size={20} color={premiumColors.primary} />
            </View>
          </View>

          <Text style={styles.title}>On Market</Text>
          <Text style={styles.subtitle}>Lista de compras ativa</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            alwaysBounceHorizontal={false}
            contentContainerStyle={styles.filtersRow}>
            {FILTROS_CATEGORIA.map((categoria) => (
              <TouchableOpacity
                key={categoria}
                style={[
                  styles.filterChip,
                  categoriaAtiva === categoria && styles.filterChipActive,
                ]}
                onPress={() => setCategoriaAtiva(categoria)}>
                <MaterialIcons
                  name="sell"
                  size={14}
                  color={
                    categoriaAtiva === categoria
                      ? premiumColors.surface
                      : premiumColors.textSecondary
                  }
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.filterChipText,
                    categoriaAtiva === categoria && styles.filterChipTextActive,
                  ]}>
                  {categoria}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {itensFiltrados.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhum item nessa selecao</Text>
              <Text style={styles.emptyText}>
                Adicione itens na Home e finalize aqui quando estiver no mercado.
              </Text>
            </View>
          ) : (
            itensFiltrados.map((item) => {
              const aberto = itemAbertoId === item.id;

              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <TouchableOpacity
                      style={[styles.checkbox, aberto && styles.checkboxActive]}
                      onPress={() => toggleItem(item)}>
                      {aberto ? (
                        <MaterialIcons name="check" size={14} color={premiumColors.surface} />
                      ) : null}
                    </TouchableOpacity>

                    <View style={styles.itemMain}>
                      <Text style={styles.itemName}>{item.nome}</Text>
                      <Text style={styles.itemMeta}>
                        {formatarQuantidade(item.quantidade)} - {item.categoria}
                      </Text>
                    </View>

                    <View style={[styles.categoryBadge, { backgroundColor: item.cor }]}>
                      <Text style={styles.categoryBadgeText}>{item.categoria}</Text>
                    </View>
                  </View>

                  {aberto ? (
                    <View style={styles.priceBox}>
                      <Text style={styles.priceLabel}>Valor unitario</Text>
                      <View style={[styles.priceRow, telaCompacta && styles.priceRowCompact]}>
                        <TextInput
                          value={valoresUnitarios[item.id] ?? ""}
                          onChangeText={(texto) =>
                            setValoresUnitarios((estadoAtual) => ({
                              ...estadoAtual,
                              [item.id]: texto,
                            }))
                          }
                          style={styles.priceInput}
                          keyboardType="decimal-pad"
                          placeholder="Ex.: 12,50"
                          placeholderTextColor="#90A096"
                        />
                        <PremiumButton
                          label="Confirmar"
                          onPress={() => confirmarValor(item)}
                          style={[styles.confirmButton, telaCompacta && styles.confirmButtonCompact]}
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </PremiumCard>
      </ScrollView>
    </PremiumScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: premiumSpacing.lg + 24,
  },
  card: {
    gap: premiumSpacing.sm,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    minWidth: 108,
  },
  topBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: premiumColors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: premiumColors.text,
  },
  subtitle: {
    color: premiumColors.textSecondary,
    marginTop: -10,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 10,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: premiumColors.surface,
    borderRadius: premiumRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: premiumColors.border,
    boxShadow: premiumShadows.soft,
    flexShrink: 0,
  },
  filterChipActive: {
    backgroundColor: premiumColors.primary,
    borderColor: premiumColors.primary,
  },
  filterChipText: {
    color: premiumColors.text,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: premiumColors.surface,
  },
  itemCard: {
    backgroundColor: premiumColors.surface,
    borderRadius: premiumRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: premiumColors.border,
    boxShadow: premiumShadows.card,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: premiumColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: premiumColors.surface,
  },
  checkboxActive: {
    backgroundColor: premiumColors.primary,
    borderColor: premiumColors.primary,
  },
  itemMain: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: premiumColors.text,
  },
  itemMeta: {
    color: premiumColors.textSecondary,
    marginTop: 4,
    fontSize: 12,
  },
  categoryBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 110,
  },
  categoryBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 11,
  },
  priceBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: premiumColors.border,
  },
  priceLabel: {
    color: premiumColors.textSecondary,
    fontWeight: "700",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  priceRowCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  priceInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: premiumRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontSize: 16,
    color: premiumColors.text,
    borderWidth: 1,
    borderColor: premiumColors.border,
    fontVariant: ["tabular-nums"],
  },
  confirmButton: {
    width: 128,
  },
  confirmButtonCompact: {
    width: "100%",
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyTitle: {
    color: premiumColors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    color: premiumColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 180,
  },
  loadingText: {
    color: premiumColors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
