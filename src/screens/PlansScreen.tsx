import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { PlanCard } from "@/src/components/PlanCard";
import { PLAN_ORDER, PLANS } from "@/src/config/plans";
import { useSubscription } from "@/src/context/subscription-context";
import { trackEvent } from "@/src/services/analyticsService";
import { SmarketPlanId } from "@/src/types/subscription";

export default function PlansScreen() {
  const router = useRouter();
  const {
    currentPlan,
    handleRestorePurchases,
    handleSubscribe,
    subscription,
    subscriptionLoading,
    billingAvailable,
    isUltimate,
  } = useSubscription();
  const [savingPlan, setSavingPlan] = useState<SmarketPlanId | null>(null);
  const [restoringPurchases, setRestoringPurchases] = useState(false);

  useEffect(() => {
    trackEvent("open_plans_screen").catch(() => undefined);
  }, []);

  const handlePlanSelection = async (planId: SmarketPlanId) => {
    setSavingPlan(planId);

    try {
      trackEvent("start_subscription", { plan: planId }).catch(() => undefined);
      await handleSubscribe(planId);
      trackEvent("complete_subscription", { plan: planId }).catch(() => undefined);
      Alert.alert(
        "Plano atualizado",
        planId === "free"
          ? "Seu plano Grátis está ativo."
          : `Seu plano ${PLANS[planId].name} foi ativado com sucesso.`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar seu plano agora.";

      Alert.alert("Falha ao atualizar", message);
    } finally {
      setSavingPlan(null);
    }
  };

  const handleRestore = async () => {
    setRestoringPurchases(true);

    try {
      await handleRestorePurchases();
      Alert.alert("Compras restauradas", "Verificamos sua assinatura atual com a Google Play.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel restaurar compras agora.";

      Alert.alert("Falha ao restaurar", message);
    } finally {
      setRestoringPurchases(false);
    }
  };

  return (
    <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Planos SMARKET</Text>
          <Text style={styles.subtitle}>
            Escolha entre uso básico, uso individual avançado ou gestão compartilhada da casa.
          </Text>

          {!billingAvailable ? (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>Assinatura real no Android</Text>
              <Text style={styles.warningText}>
                O Google Play Billing funciona em development build ou app publicado na Play Store.
              </Text>
            </View>
          ) : null}

          <View style={styles.currentPlanCard}>
            <Text style={styles.currentPlanLabel}>Plano atual</Text>
            <Text style={styles.currentPlanValue}>
              {isUltimate ? "Ultimate / Admin" : PLANS[currentPlan].name}
            </Text>
            <Text style={styles.currentPlanHelper}>
              Status: {isUltimate ? "acesso total liberado" : subscription?.subscriptionStatus ?? "active"}
            </Text>
          </View>

          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId];
            const buttonText =
              isUltimate
                ? "Acesso liberado"
                : planId === "free"
                ? "Comecar gratis"
                : planId === "pro"
                  ? "Assinar Pro"
                  : "Assinar Família";

            return (
              <PlanCard
                key={plan.id}
                name={plan.name}
                price={plan.priceLabel}
                description={plan.description}
                features={plan.features}
                highlighted={plan.highlighted}
                buttonText={
                  savingPlan === plan.id || subscriptionLoading ? "Atualizando..." : buttonText
                }
                current={currentPlan === plan.id}
                onPress={() => {
                  if (savingPlan || subscriptionLoading || isUltimate) {
                    return;
                  }

                  handlePlanSelection(plan.id);
                }}
              />
            );
          })}

          <View style={styles.footerCard}>
            <Text style={styles.footerTitle}>Gerencie sua assinatura</Text>
            <Text style={styles.footerText}>
              O app agora consulta a Google Play para comprar, restaurar e sincronizar o plano
              com o Firestore automaticamente.
            </Text>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={restoringPurchases || subscriptionLoading}>
              <Text style={styles.restoreButtonText}>
                {restoringPurchases ? "Restaurando..." : "Restaurar compras"}
              </Text>
            </TouchableOpacity>
          </View>
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
    fontSize: 30,
    fontWeight: "800",
    color: "#173428",
    textAlign: "center",
  },
  subtitle: {
    color: "#61736a",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 21,
  },
  currentPlanCard: {
    backgroundColor: "#dce7e0",
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
  },
  currentPlanLabel: {
    color: "#5a7064",
    fontSize: 13,
    marginBottom: 6,
  },
  currentPlanValue: {
    color: "#173428",
    fontSize: 22,
    fontWeight: "800",
  },
  currentPlanHelper: {
    color: "#5a7064",
    marginTop: 6,
  },
  warningCard: {
    backgroundColor: "#f8f3df",
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#eadf9f",
  },
  warningTitle: {
    color: "#685718",
    fontWeight: "800",
    marginBottom: 6,
  },
  warningText: {
    color: "#7b6d35",
    lineHeight: 20,
  },
  footerCard: {
    backgroundColor: "#f4f8f5",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#dce7e0",
  },
  footerTitle: {
    color: "#173428",
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 6,
  },
  footerText: {
    color: "#5f7268",
    lineHeight: 21,
  },
  restoreButton: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: "#2f5d45",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  restoreButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
});
