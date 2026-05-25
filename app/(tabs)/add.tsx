import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Categoria, useBudget } from "@/context/budget-context";
import { PremiumFeatureModal } from "@/src/components/PremiumFeatureModal";
import { useSubscription } from "@/src/context/subscription-context";
import { trackEvent } from "@/src/services/analyticsService";
import {
  notifyListUpdated,
  scheduleInactivityReminder,
} from "@/src/services/notificationService";
import { canUseCustomization } from "@/src/utils/planPermissions";

const CORES_PERSONALIZADAS = [
  "#2f5d45",
  "#f2c94c",
  "#6c5ce7",
  "#27ae60",
  "#e17055",
  "#ff8fab",
  "#d4a373",
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
  const [corCategoriaPersonalizada, setCorCategoriaPersonalizada] = useState(
    CORES_PERSONALIZADAS[0]
  );
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

    // As validacoes aqui evitam gravar itens inconsistentes no estado global e no Firebase.
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
  const categoriasPersonalizadas = opcoesCategoria.filter((categoria) => categoria.personalizada);

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
      <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Preparando formulario...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Adicionar Item</Text>
          <Text style={styles.subtitle}>Preencha os dados do novo item</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            value={nome}
            onChangeText={setNome}
            style={styles.input}
            placeholder="Ex.: Cafe"
            placeholderTextColor="#90a096"
          />

          <Text style={styles.label}>Categoria</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}>
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
                    categoria === opcao.nome &&
                      !usarCategoriaPersonalizada &&
                      styles.categoryTextActive,
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
                placeholderTextColor="#90a096"
              />

              <Text style={styles.rgbLabel}>Escolha uma cor</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorRow}>
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
                <View style={styles.deleteCategoriesCard}>
                {categoriasPersonalizadas.map((categoriaPersonalizada) => (
                  <View key={categoriaPersonalizada.nome} style={styles.deleteCategoryRow}>
                    <View style={styles.deleteCategoryInfo}>
                      <View
                        style={[
                          styles.deleteCategoryColor,
                          { backgroundColor: categoriaPersonalizada.cor },
                        ]}
                      />
                      <Text style={styles.deleteCategoryName}>
                        {categoriaPersonalizada.nome}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteCategoryButton}
                      onPress={() => apagarCategoria(categoriaPersonalizada.nome)}>
                      <Text style={styles.deleteCategoryButtonText}>Remover</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                </View>
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
            placeholderTextColor="#90a096"
          />

          <TouchableOpacity style={styles.primaryButton} onPress={salvar}>
            <Text style={styles.primaryButtonText}>Adicionar a lista</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PremiumFeatureModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        onViewPlans={abrirPlanos}
        title="Recurso Premium"
        description="Personalizacao esta disponivel apenas nos planos Pro e Familia."
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#e9eceb",
    borderRadius: 28,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.22,
    shadowRadius: 3.84,
    elevation: 5,
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
    marginTop: 6,
    marginBottom: 22,
  },
  label: {
    color: "#486756",
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#f7faf8",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#2f5d45",
  },
  categories: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    paddingRight: 10,
  },
  category: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#d3dcd7",
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryActive: {
    backgroundColor: "#2f5d45",
  },
  categoryText: {
    color: "#42524a",
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#fff",
  },
  customToggle: {
    backgroundColor: "#dce7e0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  customToggleActive: {
    backgroundColor: "#2f5d45",
  },
  customToggleText: {
    color: "#3f5d4d",
    fontWeight: "700",
    textAlign: "center",
  },
  customToggleTextActive: {
    color: "#fff",
  },
  premiumHint: {
    color: "#66766d",
    marginBottom: 12,
    lineHeight: 19,
    textAlign: "center",
  },
  customCard: {
    backgroundColor: "#dce7e0",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  rgbLabel: {
    color: "#486756",
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
    borderColor: "#ffffff",
  },
  colorOptionActive: {
    borderColor: "#2f5d45",
    transform: [{ scale: 1.08 }],
  },
  manageSection: {
    marginBottom: 8,
  },
  manageToggle: {
    alignSelf: "flex-start",
    paddingHorizontal: 2,
    paddingVertical: 6,
    marginBottom: 4,
  },
  manageToggleText: {
    color: "#486756",
    fontWeight: "700",
    fontSize: 13,
  },
  deleteCategoriesCard: {
    backgroundColor: "#dce7e0",
    borderRadius: 18,
    padding: 12,
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
    color: "#34443c",
    fontWeight: "600",
    flexShrink: 1,
  },
  deleteCategoryButton: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  deleteCategoryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#2f5d45",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 24,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#d7dfda",
  },
  secondaryButtonText: {
    color: "#3f5d4d",
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
