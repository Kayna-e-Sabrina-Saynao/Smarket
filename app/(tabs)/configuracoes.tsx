import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useBudget } from "@/context/budget-context";
import { PremiumFeatureModal } from "@/src/components/PremiumFeatureModal";
import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { PLANS } from "@/src/config/plans";
import { useCycle } from "@/src/context/CycleContext";
import { useSubscription } from "@/src/context/subscription-context";
import { disableNotifications, enableNotifications } from "@/src/services/notificationService";
import { updateUserAppPreferences } from "@/src/services/subscriptionService";
import {
  canCreateList,
  canExportPDF,
  canShareLists,
  canUseCustomization,
  canUseFamilyFeatures,
  getMaxFamilyMembers,
} from "@/src/utils/planPermissions";
import {
  premiumColors,
  premiumRadius,
  premiumSpacing,
} from "@/src/theme/premium-ui";

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const { historicoCompras, onMarketItems, items } = useBudget();
  const { currentMonth, currentYear, cycleUpdating, getCurrentCycle, setCurrentMonth, setCurrentYear } =
    useCycle();
  const {
    currentPlan,
    handleCancelSubscription,
    subscription,
    subscriptionLoading,
    isUltimate,
    isAdmin,
  } = useSubscription();
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsEnabledUi, setNotificationsEnabledUi] = useState(
    subscription?.notificationsEnabled === true
  );
  const [premiumModalContent, setPremiumModalContent] = useState({
    title: "Recurso Premium",
    description: "Esse recurso esta disponivel nos planos Pro e Familia.",
  });
  const currentListCount = 1;

  useEffect(() => {
    setNotificationsEnabledUi(subscription?.notificationsEnabled === true);
  }, [subscription?.notificationsEnabled]);

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

  const alterarMes = async (delta: number) => {
    const proximoMes = currentMonth + delta;

    if (proximoMes < 0) {
      await setCurrentYear(currentYear - 1);
      await setCurrentMonth(11);
      return;
    }

    if (proximoMes > 11) {
      await setCurrentYear(currentYear + 1);
      await setCurrentMonth(0);
      return;
    }

    await setCurrentMonth(proximoMes);
  };

  const alterarAno = async (delta: number) => {
    await setCurrentYear(currentYear + delta);
  };

  const alternarNotificacoes = async (valor: boolean) => {
    const uid = subscription?.uid;

    if (!uid || notificationsLoading) {
      return;
    }

    setNotificationsLoading(true);

    try {
      if (valor) {
        setNotificationsEnabledUi(true);
        const permission = await enableNotifications();

        if (!permission.granted) {
          setNotificationsEnabledUi(false);
          Alert.alert(
            "Permissao necessaria",
            "Ative as notificacoes nas configuracoes do dispositivo."
          );
          await updateUserAppPreferences(uid, {
            notificationsEnabled: false,
          });
          return;
        }

        await updateUserAppPreferences(uid, {
          notificationsEnabled: true,
        });
        return;
      }

      setNotificationsEnabledUi(false);
      await disableNotifications();
      await updateUserAppPreferences(uid, {
        notificationsEnabled: false,
      });
    } finally {
      setNotificationsLoading(false);
    }
  };

  const ActionCard = ({
    title,
    description,
    icon,
    onPress,
  }: {
    title: string;
    description: string;
    icon: React.ComponentProps<typeof MaterialIcons>["name"];
    onPress: () => void;
  }) => (
    <PremiumCard style={styles.actionCard}>
      <View style={styles.actionHeader}>
        <View style={styles.actionIcon}>
          <MaterialIcons name={icon} size={20} color={premiumColors.primary} />
        </View>
        <View style={styles.actionTextWrap}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionText}>{description}</Text>
        </View>
      </View>
      <PremiumButton secondary label="Abrir" onPress={onPress} style={styles.actionButton} />
    </PremiumCard>
  );

  return (
    <PremiumScreen scroll={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PremiumCard style={styles.card}>
          <View style={styles.topBar}>
            <PremiumButton secondary label="Voltar" onPress={() => router.back()} style={styles.topButton} />
            <View style={styles.titleBadge}>
              <MaterialIcons name="settings" size={22} color={premiumColors.primary} />
            </View>
          </View>

          <Text style={styles.title}>Configuracoes</Text>
          <Text style={styles.subtitle}>Assinatura, limites e visao geral do seu ciclo</Text>

          <PremiumCard style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planCopy}>
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

              <PremiumButton
                secondary
                label="Ver planos"
                onPress={() => router.push("/(tabs)/planos")}
                style={styles.planButton}
              />
            </View>
          </PremiumCard>

          <PremiumCard style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View>
                <Text style={styles.infoLabel}>Ciclo atual</Text>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                  {getCurrentCycle().fullLabel}
                </Text>
                <Text style={styles.infoHelper}>
                  Mude o mes e o ano do ciclo.
                </Text>
              </View>
              <View style={styles.iconBubble}>
                <MaterialIcons name="tune" size={20} color={premiumColors.primary} />
              </View>
            </View>

            <View style={styles.cycleControls}>
              <View style={styles.cycleControlGroup}>
                <Text style={styles.cycleControlLabel}>Mes</Text>
                <View style={styles.cycleButtonsRow}>
                  <PremiumButton secondary label="-" onPress={() => alterarMes(-1)} style={styles.cycleButton} />
                  <Text style={styles.cycleValue} numberOfLines={1} ellipsizeMode="tail">
                    {getCurrentCycle().monthLabel}
                  </Text>
                  <PremiumButton secondary label="+" onPress={() => alterarMes(1)} style={styles.cycleButton} />
                </View>
              </View>

              <View style={styles.cycleControlGroup}>
                <Text style={styles.cycleControlLabel}>Ano</Text>
                <View style={styles.cycleButtonsRow}>
                  <PremiumButton secondary label="-" onPress={() => alterarAno(-1)} style={styles.cycleButton} />
                  <Text style={styles.cycleValue}>{currentYear}</Text>
                  <PremiumButton secondary label="+" onPress={() => alterarAno(1)} style={styles.cycleButton} />
                </View>
              </View>
            </View>

            {cycleUpdating ? (
              <View style={styles.inlineStatus}>
                <ActivityIndicator size="small" color={premiumColors.primary} />
                <Text style={styles.inlineStatusText}>Atualizando ciclo...</Text>
              </View>
            ) : null}

          </PremiumCard>

          {isAdmin ? (
            <PremiumCard style={styles.infoCard}>
              <Text style={styles.infoLabel}>Acesso administrativo</Text>
              <Text style={styles.infoValue}>Ativo</Text>
              <Text style={styles.infoHelper}>
                Sua conta esta usando acesso total por Firebase Custom Claims.
              </Text>
            </PremiumCard>
          ) : null}

          <View style={styles.miniGrid}>
            <PremiumCard style={styles.miniCard}>
              <Text style={styles.infoLabel}>Compras no historico</Text>
              <Text style={styles.infoValue}>{historicoCompras.length}</Text>
            </PremiumCard>

            <PremiumCard style={styles.miniCard}>
              <Text style={styles.infoLabel}>Itens no mercado</Text>
              <Text style={styles.infoValue}>{onMarketItems.length}</Text>
            </PremiumCard>

            <PremiumCard style={styles.miniCard}>
              <Text style={styles.infoLabel}>Itens em orcamento</Text>
              <Text style={styles.infoValue}>{items.length}</Text>
            </PremiumCard>
          </View>

          <PremiumCard style={styles.infoCard}>
            <View style={styles.notificationRow}>
              <View style={styles.notificationInfo}>
                <Text style={styles.infoLabel}>Notificacoes</Text>
                <Text style={styles.infoValue}>
                  {notificationsEnabledUi ? "Ativadas" : "Desativadas"}
                </Text>
                <Text style={styles.infoHelper}>
                  Controle lembretes e avisos do app sem perguntar permissao toda hora.
                </Text>
              </View>

              <Switch
                value={notificationsEnabledUi}
                onValueChange={alternarNotificacoes}
                disabled={notificationsLoading}
                trackColor={{ false: "#D1D5DB", true: "#86EFAC" }}
                thumbColor={notificationsEnabledUi ? premiumColors.primary : premiumColors.surface}
              />
            </View>

            {notificationsLoading ? (
              <View style={styles.inlineStatus}>
                <ActivityIndicator size="small" color={premiumColors.primary} />
                <Text style={styles.inlineStatusText}>Salvando preferencia...</Text>
              </View>
            ) : null}
          </PremiumCard>

          {currentPlan !== "free" ? (
            <ActionCard
              title="Gerenciar assinatura"
              description="Abra o centro de assinaturas da Google Play para cancelar ou revisar o plano."
              icon="credit-card"
              onPress={abrirGerenciamentoAssinatura}
            />
          ) : null}

          <Text style={styles.sectionTitle}>Recursos do plano</Text>

          <ActionCard
            title="Criar nova lista"
            description="Plano Gratis fica com 1 lista. Pro e Familia liberam ilimitadas."
            icon="playlist-add-circle"
            onPress={lidarComNovaLista}
          />

          <ActionCard
            title="Compartilhar listas"
            description="Pro e Familia podem receber o fluxo real de compartilhamento depois."
            icon="group"
            onPress={lidarComCompartilhamento}
          />

          <ActionCard
            title="Exportar PDF"
            description="A arquitetura fica pronta para gerar PDF das listas e compras."
            icon="picture-as-pdf"
            onPress={lidarComExportacao}
          />

          <ActionCard
            title="Gestao familiar"
            description={`Sincronizacao e metas compartilhadas para ate ${getMaxFamilyMembers("family", isUltimate)} membros.`}
            icon="diversity-3"
            onPress={lidarComRecursosFamilia}
          />

          <ActionCard
            title="Personalizacao visual"
            description="Tema, aparencia, categorias personalizadas e ajustes visuais avancados."
            icon="palette"
            onPress={lidarComPersonalizacao}
          />

          <ActionCard
            title="Convidar membros"
            description="Compartilhe link, codigo ou QR Code para montar sua familia no app."
            icon="qr-code-2"
            onPress={abrirConvitesFamilia}
          />

          <Text style={styles.sectionTitle}>Play Store ready</Text>

          <ActionCard
            title="Politica de Privacidade"
            description="Transparencia sobre dados, sincronizacao e armazenamento."
            icon="policy"
            onPress={() => router.push("/(tabs)/privacidade")}
          />

          <ActionCard
            title="Termos de Uso"
            description="Regras simples para uso do aplicativo e dos planos."
            icon="gavel"
            onPress={() => router.push("/(tabs)/termos")}
          />

          <ActionCard
            title="Sobre o aplicativo"
            description="Nome, versao, descricao e base pronta para crescimento."
            icon="info"
            onPress={() => router.push("/(tabs)/sobre")}
          />
        </PremiumCard>
      </ScrollView>

      <PremiumFeatureModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        onViewPlans={abrirPlanos}
        title={premiumModalContent.title}
        description={premiumModalContent.description}
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
  planCard: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
    padding: premiumSpacing.sm,
  },
  planHeader: {
    gap: 14,
  },
  planCopy: {
    gap: 4,
  },
  planLabel: {
    color: premiumColors.textSecondary,
  },
  planValue: {
    color: premiumColors.text,
    fontWeight: "800",
    fontSize: 22,
  },
  planHelper: {
    color: premiumColors.textSecondary,
    marginTop: 2,
  },
  planButton: {
    width: "100%",
  },
  infoCard: {
    gap: 12,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  infoLabel: {
    color: premiumColors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    color: premiumColors.text,
    fontWeight: "800",
    fontSize: 22,
  },
  infoHelper: {
    color: premiumColors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: premiumColors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  cycleControls: {
    gap: 12,
  },
  cycleControlGroup: {
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: premiumRadius.lg,
    padding: 14,
  },
  cycleControlLabel: {
    color: premiumColors.textSecondary,
    fontSize: 12,
    marginBottom: 10,
  },
  cycleButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cycleButton: {
    width: 58,
  },
  cycleValue: {
    color: premiumColors.text,
    fontWeight: "800",
    fontSize: 15,
    flex: 1,
    textAlign: "center",
    overflow: "hidden",
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  notificationInfo: {
    flex: 1,
  },
  inlineStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineStatusText: {
    color: premiumColors.textSecondary,
    fontSize: 13,
  },
  miniGrid: {
    gap: 12,
  },
  miniCard: {
    padding: premiumSpacing.sm,
  },
  sectionTitle: {
    color: premiumColors.text,
    fontWeight: "800",
    fontSize: 18,
    marginTop: 4,
  },
  actionCard: {
    gap: 14,
  },
  actionHeader: {
    flexDirection: "row",
    gap: 12,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: premiumColors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    color: premiumColors.text,
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 6,
  },
  actionText: {
    color: premiumColors.textSecondary,
    lineHeight: 20,
  },
  actionButton: {
    width: "100%",
  },
});
