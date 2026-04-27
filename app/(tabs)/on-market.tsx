import { LinearGradient } from "expo-linear-gradient";
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
} from "react-native";

import { OnMarketItem, useBudget } from "@/context/budget-context";

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
      <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Carregando lista ativa...</Text>
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

          <Text style={styles.title}>On Market</Text>
          <Text style={styles.subtitle}>Lista de compras ativa</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}>
            {FILTROS_CATEGORIA.map((categoria) => (
              <TouchableOpacity
                key={categoria}
                style={[
                  styles.filterChip,
                  categoriaAtiva === categoria && styles.filterChipActive,
                ]}
                onPress={() => setCategoriaAtiva(categoria)}>
                <Text
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
                      {aberto ? <Text style={styles.checkboxIcon}>✓</Text> : null}
                    </TouchableOpacity>

                    <View style={styles.itemMain}>
                      <Text style={styles.itemName}>{item.nome}</Text>
                      <Text style={styles.itemMeta}>
                        {formatarQuantidade(item.quantidade)} • {item.categoria}
                      </Text>
                    </View>

                    <View style={[styles.categoryBadge, { backgroundColor: item.cor }]}>
                      <Text style={styles.categoryBadgeText}>{item.categoria}</Text>
                    </View>
                  </View>

                  {aberto ? (
                    <View style={styles.priceBox}>
                      <Text style={styles.priceLabel}>Valor unitario</Text>
                      <View style={styles.priceRow}>
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
                          placeholderTextColor="#90a096"
                        />
                        <TouchableOpacity
                          style={styles.confirmButton}
                          onPress={() => confirmarValor(item)}>
                          <Text style={styles.confirmButtonText}>Confirmar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2f5d45",
  },
  subtitle: {
    textAlign: "center",
    color: "#66766d",
    marginTop: 6,
    marginBottom: 20,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 10,
    marginBottom: 18,
  },
  filterChip: {
    backgroundColor: "#d3dcd7",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: "#2f5d45",
  },
  filterChipText: {
    color: "#42524a",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
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
    borderColor: "#9aaca1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxActive: {
    backgroundColor: "#2f5d45",
    borderColor: "#2f5d45",
  },
  checkboxIcon: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  itemMain: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#34443c",
  },
  itemMeta: {
    color: "#6c7a73",
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
    borderTopColor: "#e1e8e3",
  },
  priceLabel: {
    color: "#486756",
    fontWeight: "700",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  priceInput: {
    flex: 1,
    backgroundColor: "#f7faf8",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#2f5d45",
  },
  confirmButton: {
    backgroundColor: "#2f5d45",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#2f5d45",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    color: "#718078",
    textAlign: "center",
    lineHeight: 20,
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
