import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Categoria, useBudget } from "@/context/budget-context";
import { PremiumFeatureModal } from "@/src/components/PremiumFeatureModal";
import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { useSubscription } from "@/src/context/subscription-context";
import { trackEvent } from "@/src/services/analyticsService";
import { notifyListUpdated, scheduleInactivityReminder } from "@/src/services/notificationService";
import { premiumColors, premiumRadius, premiumShadows, premiumSpacing } from "@/src/theme/premium-ui";
import { canUseCustomization } from "@/src/utils/planPermissions";

const CORES_PERSONALIZADAS = [
  "#2F5D45",
  "#F2C94C",
  "#6C5CE7",
  "#27AE60",
  "#E17055",
  "#FF8FAB",
  "#D4A373",
  "#577590",
];

export default function AddItemScreen() {
  const router = useRouter();
  const { currentPlan, subscription, isUltimate } = useSubscription();
  const {
    carregandoDados,
    opcoesCategoria,
    adicionarOnMarketItem,
    adicionarCategoriaPersonalizada,
    removerCategoriaPersonalizada,
  } = useBudget();
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Mercado");
  const [quantidade, setQuantidade] = useState("");
  const [usarCategoriaPersonalizada, setUsarCategoriaPersonalizada] = useState(false);
  const [nomeCategoriaPersonalizada, setNomeCategoriaPersonalizada] = useState("");
  const [corCategoriaPersonalizada, setCorCategoriaPersonalizada] = useState(CORES_PERSONALIZADAS[0]);
  const [mostrarGerenciarCategorias, setMostrarGerenciarCategorias] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const customizationEnabled = canUseCustomization(currentPlan, isUltimate);

  const abrirPlanos = () => {
    setPremiumModalVisible(false);
    router.push("/(tabs)/planos");
  };

  const salvar = () => {
    const quantidadeNumerica = Number(quantidade);
    let categoriaSelecionada = categoria;

    if (!nome.trim()) {
      Alert.alert("Nome obrigatorio", "Informe o nome do item.");
      return;
    }

    if (!Number.isInteger(quantidadeNumerica) || quantidadeNumerica <= 0) {
      Alert.alert("Quantidade invalida", "Informe uma quantidade inteira maior que zero.");
      return;
    }

    if (usarCategoriaPersonalizada) {
      if (!customizationEnabled) {
        setPremiumModalVisible(true);
        return;
      }

      if (!nomeCategoriaPersonalizada.trim()) {
        Alert.alert("Categoria obrigatoria", "Informe um nome para a categoria personalizada.");
        return;
      }

      const resultado = adicionarCategoriaPersonalizada(
        nomeCategoriaPersonalizada,
        corCategoriaPersonalizada
      );

      if (!resultado.sucesso) {
        if (resultado.erro === "categoria-existente") {
          Alert.alert("Categoria existente", "Ja existe uma categoria com esse nome.");
          return;
        }

        Alert.alert("Categoria invalida", "Nao foi possivel salvar essa categoria.");
        return;
      }

      categoriaSelecionada = resultado.categoria ?? categoria;
    }

    adicionarOnMarketItem({
      nome: nome.trim(),
      categoria: categoriaSelecionada,
      quantidade: quantidadeNumerica,
    });

    trackEvent("create_list", {
      category: categoriaSelecionada,
      quantity: quantidadeNumerica,
    }).catch(() => undefined);
    notifyListUpdated(subscription?.name).catch(() => undefined);
    scheduleInactivityReminder().catch(() => undefined);

    router.back();
  };

  const categoriasPersonalizadas = opcoesCategoria.filter((itemCategoria) => itemCategoria.personalizada);

  const apagarCategoria = (nomeCategoria: string) => {
    if (!customizationEnabled) {
      setPremiumModalVisible(true);
      return;
    }

    const resultado = removerCategoriaPersonalizada(nomeCategoria);

    if (!resultado.sucesso) {
      Alert.alert("Erro", "Nao foi possivel apagar essa categoria.");
      return;
    }

    if (categoria === nomeCategoria) {
      setCategoria("Mercado");
    }

    Alert.alert("Categoria apagada", "A categoria personalizada foi removida.");
  };

  if (carregandoDados) {
    return (
      <PremiumScreen scroll={false}>
        <PremiumCard style={styles.loadingCard}>
          <Text style={styles.loadingText}>Preparando formulario...</Text>
        </PremiumCard>
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
              <Text style={styles.titleBadgeText}>+</Text>
            </View>
          </View>

          <Text style={styles.title}>Adicionar Item</Text>
          <Text style={styles.subtitle}>Preencha os dados do novo item</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            value={nome}
            onChangeText={setNome}
            style={styles.input}
            placeholder="Ex.: Cafe"
            placeholderTextColor="#90A096"
          />

          <Text style={styles.label}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            {opcoesCategoria.map((opcao) => (
              <TouchableOpacity
                key={opcao.nome}
                style={[
                  styles.category,
                  { borderColor: opcao.cor },
                  categoria === opcao.nome && !usarCategoriaPersonalizada && styles.categoryActive,
                ]}
                onPress={() => {
                  setUsarCategoriaPersonalizada(false);
                  setCategoria(opcao.nome);
                }}>
                <Text
                  style={[
                    styles.categoryText,
                    categoria === opcao.nome && !usarCategoriaPersonalizada && styles.categoryTextActive,
                  ]}>
                  {opcao.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.customToggle, usarCategoriaPersonalizada && styles.customToggleActive]}
            onPress={() => {
              if (!customizationEnabled) {
                setPremiumModalVisible(true);
                return;
              }

              setUsarCategoriaPersonalizada((estadoAtual) => !estadoAtual);
            }}>
            <Text
              style={[
                styles.customToggleText,
                usarCategoriaPersonalizada && styles.customToggleTextActive,
              ]}>
              {usarCategoriaPersonalizada
                ? "Usando categoria personalizada"
                : "Criar categoria personalizada"}
            </Text>
          </TouchableOpacity>

          {!customizationEnabled ? (
            <Text style={styles.premiumHint}>
              Personalizacao esta disponivel apenas nos planos Pro e Familia.
            </Text>
          ) : null}

          {usarCategoriaPersonalizada ? (
            <View style={styles.customCard}>
              <TextInput
                value={nomeCategoriaPersonalizada}
                onChangeText={setNomeCategoriaPersonalizada}
                style={styles.input}
                placeholder="Nome da categoria"
                placeholderTextColor="#90A096"
              />

              <Text style={styles.rgbLabel}>Escolha uma cor</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
                {CORES_PERSONALIZADAS.map((cor) => (
                  <TouchableOpacity
                    key={cor}
                    style={[
                      styles.colorOption,
                      { backgroundColor: cor },
                      corCategoriaPersonalizada === cor && styles.colorOptionActive,
                    ]}
                    onPress={() => setCorCategoriaPersonalizada(cor)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {categoriasPersonalizadas.length > 0 ? (
            <View style={styles.manageSection}>
              <TouchableOpacity
                style={styles.manageToggle}
                onPress={() => {
                  if (!customizationEnabled) {
                    setPremiumModalVisible(true);
                    return;
                  }

                  setMostrarGerenciarCategorias((estadoAtual) => !estadoAtual);
                }}>
                <Text style={styles.manageToggleText}>
                  {mostrarGerenciarCategorias
                    ? "Ocultar categorias personalizadas"
                    : "Gerenciar categorias personalizadas"}
                </Text>
              </TouchableOpacity>

              {mostrarGerenciarCategorias ? (
                <PremiumCard style={styles.deleteCategoriesCard}>
                  {categoriasPersonalizadas.map((categoriaPersonalizada) => (
                    <View key={categoriaPersonalizada.nome} style={styles.deleteCategoryRow}>
                      <View style={styles.deleteCategoryInfo}>
                        <View
                          style={[
                            styles.deleteCategoryColor,
                            { backgroundColor: categoriaPersonalizada.cor },
                          ]}
                        />
                        <Text style={styles.deleteCategoryName}>{categoriaPersonalizada.nome}</Text>
                      </View>

                      <PremiumButton
                        secondary
                        label="Remover"
                        onPress={() => apagarCategoria(categoriaPersonalizada.nome)}
                        style={styles.deleteCategoryButton}
                      />
                    </View>
                  ))}
                </PremiumCard>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.label}>Quantidade</Text>
          <TextInput
            value={quantidade}
            onChangeText={setQuantidade}
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Ex.: 3"
            placeholderTextColor="#90A096"
          />

          <PremiumButton label="Adicionar a lista" onPress={salvar} style={styles.primaryButton} />
          <PremiumButton secondary label="Cancelar" onPress={() => router.back()} />
        </PremiumCard>
      </ScrollView>

      <PremiumFeatureModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        onViewPlans={abrirPlanos}
        title="Recurso Premium"
        description="Personalizacao esta disponivel apenas nos planos Pro e Familia."
      />
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topButton: {
    minWidth: 108,
  },
  titleBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: premiumColors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBadgeText: {
    color: premiumColors.primary,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 30,
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
  label: {
    color: premiumColors.text,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 6,
  },
  input: {
    backgroundColor: premiumColors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: premiumColors.text,
    borderWidth: 1,
    borderColor: premiumColors.border,
    boxShadow: premiumShadows.soft,
  },
  categories: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 10,
  },
  category: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: premiumRadius.pill,
    backgroundColor: premiumColors.surfaceMuted,
    borderWidth: 2,
  },
  categoryActive: {
    backgroundColor: premiumColors.primary,
  },
  categoryText: {
    color: premiumColors.text,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: premiumColors.surface,
  },
  customToggle: {
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: premiumRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  customToggleActive: {
    backgroundColor: premiumColors.primary,
  },
  customToggleText: {
    color: premiumColors.text,
    fontWeight: "700",
    textAlign: "center",
  },
  customToggleTextActive: {
    color: premiumColors.surface,
  },
  premiumHint: {
    color: premiumColors.textSecondary,
    lineHeight: 19,
    textAlign: "center",
  },
  customCard: {
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: premiumRadius.lg,
    padding: 12,
    gap: 12,
  },
  rgbLabel: {
    color: premiumColors.text,
    fontWeight: "700",
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 10,
  },
  colorOption: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  colorOptionActive: {
    borderColor: premiumColors.text,
    transform: [{ scale: 1.08 }],
  },
  manageSection: {
    gap: 8,
  },
  manageToggle: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  manageToggleText: {
    color: premiumColors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  deleteCategoriesCard: {
    gap: 10,
  },
  deleteCategoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  deleteCategoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  deleteCategoryColor: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  deleteCategoryName: {
    color: premiumColors.text,
    fontWeight: "600",
    flexShrink: 1,
  },
  deleteCategoryButton: {
    width: 110,
  },
  primaryButton: {
    marginTop: 8,
  },
  loadingCard: {
    width: "100%",
    minHeight: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: premiumColors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
