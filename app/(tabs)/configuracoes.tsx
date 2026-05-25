import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useBudget } from "@/context/budget-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PremiumFeatureModal } from "@/src/components/PremiumFeatureModal";
import { PLANS } from "@/src/config/plans";
import { useSubscription } from "@/src/context/subscription-context";
import {
  canCreateList,
  canExportPDF,
  canShareLists,
  canUseFamilyFeatures,
  canUseCustomization,
  getMaxFamilyMembers,
} from "@/src/utils/planPermissions";

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const { cicloAno, historicoCompras, onMarketItems, items } = useBudget();
  const {
    currentPlan,
    handleCancelSubscription,
    subscription,
    subscriptionLoading,
    isUltimate,
    isAdmin,
  } = useSubscription();
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [premiumModalContent, setPremiumModalContent] = useState({
    title: "Recurso Premium",
    description: "Esse recurso esta disponivel nos planos Pro e Familia.",
  });
  const currentListCount = 1;

  const abrirPlanos = () => {
    setPremiumModalVisible(false);
    router.push("/(tabs)/planos");
  };

  const abrirModalPremium = (description: string) => {
    setPremiumModalContent({
      title: "Recurso Premium",
      description,
    });
    setPremiumModalVisible(true);
  };

  const lidarComNovaLista = () => {
    if (!canCreateList(currentPlan, currentListCount, isUltimate)) {
      abrirModalPremium("Esse recurso esta disponivel nos planos Pro e Familia.");
      return;
    }

    Alert.alert(
      "Multiplas listas liberadas",
      "Seu plano ja permite varias listas. A arquitetura SaaS esta pronta para a futura tela de listas."
    );
  };

  const lidarComCompartilhamento = () => {
    if (!canShareLists(currentPlan, isUltimate)) {
      abrirModalPremium("Esse recurso esta disponivel nos planos Pro e Familia.");
      return;
    }

    Alert.alert(
      "Compartilhamento pronto",
      "Seu plano libera compartilhar listas. Agora so falta conectar o fluxo real de convite."
    );
  };

  const lidarComExportacao = () => {
    if (!canExportPDF(currentPlan, isUltimate)) {
      abrirModalPremium("Esse recurso esta disponivel nos planos Pro e Familia.");
      return;
    }

    Alert.alert(
      "Exportacao pronta",
      "Seu plano libera exportar PDF. A integracao futura pode gerar arquivo e compartilhar pelo celular."
    );
  };

  const lidarComRecursosFamilia = () => {
    if (!canUseFamilyFeatures(currentPlan, isUltimate)) {
      abrirModalPremium("Esse recurso esta disponivel nos planos Pro e Familia.");
      return;
    }

    Alert.alert(
      "Familia liberada",
      `Seu plano aceita ate ${getMaxFamilyMembers(currentPlan, isUltimate)} membros. A base ja esta pronta para sincronizacao familiar.`
    );
  };

  const lidarComPersonalizacao = () => {
    if (!canUseCustomization(currentPlan, isUltimate)) {
      abrirModalPremium("Personalizacao esta disponivel apenas nos planos Pro e Familia.");
      return;
    }

    Alert.alert(
      "Personalizacao liberada",
      "Seu plano libera tema, cores, categorias personalizadas e outras preferencias visuais avancadas."
    );
  };

  const abrirConvitesFamilia = () => {
    if (!canUseFamilyFeatures(currentPlan, isUltimate)) {
      abrirModalPremium("Esse recurso esta disponivel nos planos Pro e Familia.");
      return;
    }

    router.push("/(tabs)/convidar-familia");
  };

  const abrirGerenciamentoAssinatura = async () => {
    try {
      await handleCancelSubscription();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel abrir o gerenciamento da assinatura agora.";

      Alert.alert("Falha ao abrir", message);
    }
  };

  return (
    <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <IconSymbol name="gearshape.fill" size={18} color="#2f5d45" />
            </View>
            <Text style={styles.title}>Configuracoes</Text>
          </View>
          <Text style={styles.subtitle}>Assinatura, limites e visao geral do seu ciclo</Text>

          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planLabel}>Plano atual</Text>
                <Text style={styles.planValue}>
                  {isUltimate ? "Ultimate / Admin" : PLANS[currentPlan].name}
                </Text>
                <Text style={styles.planHelper}>
                  Status:{" "}
                  {subscriptionLoading
                    ? "carregando"
                    : isUltimate
                      ? "acesso total liberado"
                      : subscription?.subscriptionStatus ?? "active"}
                </Text>
              </View>

              <TouchableOpacity style={styles.planButton} onPress={() => router.push("/(tabs)/planos")}>
                <Text style={styles.planButtonText}>Ver planos</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoLabel}>Ano do ciclo</Text>
              <IconSymbol name="gearshape.fill" size={16} color="#2f5d45" />
            </View>
            <Text style={styles.infoValue}>{cicloAno}</Text>
            <Text style={styles.infoHelper}>Ciclo fixo do projeto por enquanto.</Text>
          </View>

          {isAdmin ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Acesso administrativo</Text>
              <Text style={styles.infoValue}>Ativo</Text>
              <Text style={styles.infoHelper}>
                Sua conta esta usando acesso total por Firebase Custom Claims.
              </Text>
            </View>
          ) : null}

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Compras no historico</Text>
            <Text style={styles.infoValue}>{historicoCompras.length}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Notificacoes</Text>
            <Text style={styles.infoValue}>
              {subscription?.notificationsEnabled ? "Ativas" : "Padrao do aparelho"}
            </Text>
          </View>

          {currentPlan !== "free" ? (
            <TouchableOpacity style={styles.actionCard} onPress={abrirGerenciamentoAssinatura}>
              <Text style={styles.actionTitle}>Gerenciar assinatura</Text>
              <Text style={styles.actionText}>
                Abra o centro de assinaturas da Google Play para cancelar ou revisar o plano.
              </Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Itens no mercado</Text>
            <Text style={styles.infoValue}>{onMarketItems.length}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Itens em orcamento</Text>
            <Text style={styles.infoValue}>{items.length}</Text>
          </View>

          <Text style={styles.sectionTitle}>Recursos do plano</Text>

          <TouchableOpacity style={styles.actionCard} onPress={lidarComNovaLista}>
            <Text style={styles.actionTitle}>Criar nova lista</Text>
            <Text style={styles.actionText}>Plano Gratis fica com 1 lista. Pro e Familia liberam ilimitadas.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={lidarComCompartilhamento}>
            <Text style={styles.actionTitle}>Compartilhar listas</Text>
            <Text style={styles.actionText}>Pro e Familia podem receber o fluxo real de compartilhamento depois.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={lidarComExportacao}>
            <Text style={styles.actionTitle}>Exportar PDF</Text>
            <Text style={styles.actionText}>A arquitetura fica pronta para gerar PDF das listas e compras.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={lidarComRecursosFamilia}>
            <Text style={styles.actionTitle}>Gestao familiar</Text>
            <Text style={styles.actionText}>
              Sincronizacao e metas compartilhadas para ate {getMaxFamilyMembers("family", isUltimate)} membros.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={lidarComPersonalizacao}>
            <Text style={styles.actionTitle}>Personalizacao visual</Text>
            <Text style={styles.actionText}>
              Tema, aparencia, categorias personalizadas e ajustes visuais avancados.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={abrirConvitesFamilia}>
            <Text style={styles.actionTitle}>Convidar membros</Text>
            <Text style={styles.actionText}>
              Compartilhe link, codigo ou QR Code para montar sua familia no app.
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Play Store ready</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/privacidade")}>
            <Text style={styles.actionTitle}>Politica de Privacidade</Text>
            <Text style={styles.actionText}>
              Transparencia sobre dados, sincronizacao e armazenamento.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/termos")}>
            <Text style={styles.actionTitle}>Termos de Uso</Text>
            <Text style={styles.actionText}>
              Regras simples para uso do aplicativo e dos planos.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/sobre")}>
            <Text style={styles.actionTitle}>Sobre o aplicativo</Text>
            <Text style={styles.actionText}>
              Nome, versao, descricao e base pronta para crescimento.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PremiumFeatureModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        onViewPlans={abrirPlanos}
        title={premiumModalContent.title}
        description={premiumModalContent.description}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, padding: 20, justifyContent: "center" },
  card: {
    backgroundColor: "#e9eceb",
    borderRadius: 30,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
  backButtonText: { color: "#3f5d4d", fontWeight: "700" },
  titleRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  titleIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#dce7e0",
    alignItems: "center",
    justifyContent: "center",
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
  planCard: {
    backgroundColor: "#f3f8f5",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d4e3da",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  planLabel: {
    color: "#567064",
    marginBottom: 4,
  },
  planValue: {
    color: "#173428",
    fontWeight: "800",
    fontSize: 22,
  },
  planHelper: {
    color: "#6c7a73",
    marginTop: 6,
  },
  planButton: {
    backgroundColor: "#2f5d45",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  planButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  infoCard: {
    backgroundColor: "#dce7e0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  infoLabel: { color: "#567064", marginBottom: 4 },
  infoValue: { color: "#2f5d45", fontWeight: "800", fontSize: 22 },
  infoHelper: { color: "#6c7a73", marginTop: 6 },
  sectionTitle: {
    color: "#2f5d45",
    fontWeight: "800",
    fontSize: 17,
    marginTop: 8,
    marginBottom: 10,
  },
  actionCard: {
    backgroundColor: "#f4f7f5",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#dce7e0",
  },
  actionTitle: {
    color: "#173428",
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 6,
  },
  actionText: {
    color: "#607068",
    lineHeight: 20,
  },
});
