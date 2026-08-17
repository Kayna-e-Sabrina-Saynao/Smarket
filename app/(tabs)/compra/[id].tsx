import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useBudget } from "@/context/budget-context";
import { PremiumFeatureModal } from "@/src/components/PremiumFeatureModal";
import { PremiumLockedState } from "@/src/components/PremiumLockedState";
import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { useSubscription } from "@/src/context/subscription-context";
import { baixarOuCompartilharPdfCompra } from "@/src/services/purchasePdfService";
import { premiumColors, premiumRadius, premiumSpacing } from "@/src/theme/premium-ui";
import { canViewHistory } from "@/src/utils/planPermissions";

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
};

const formatarDataDetalhe = (data: Date | null, fallback: string) =>
  data ? data.toLocaleDateString("pt-BR") : formatarData(fallback);

export default function CompraDetalheScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { buscarCompraPorId, carregandoDados } = useBudget();
  const { currentPlan, subscriptionLoading, isUltimate, subscription } = useSubscription();
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [premiumNoticeShown, setPremiumNoticeShown] = useState(false);
  const [baixandoPdf, setBaixandoPdf] = useState(false);
  const compraId = Number(params.id);
  const compra = Number.isNaN(compraId) ? undefined : buscarCompraPorId(compraId);
  const premiumBlocked = !canViewHistory(currentPlan, isUltimate);

  useEffect(() => {
    if (subscriptionLoading || premiumNoticeShown || !premiumBlocked) {
      return;
    }

    setPremiumModalVisible(true);
    setPremiumNoticeShown(true);
  }, [premiumBlocked, premiumNoticeShown, subscriptionLoading]);

  if (carregandoDados || subscriptionLoading) {
    return (
      <PremiumScreen>
        <View style={styles.centerCard}>
          <Text style={styles.centerText}>Carregando compra...</Text>
        </View>
      </PremiumScreen>
    );
  }

  if (premiumBlocked) {
    return (
      <PremiumScreen>
        <PremiumLockedState
          title="Detalhes da compra bloqueados"
          description="A visualizacao completa dos detalhes da compra faz parte dos planos Pro e Familia."
          onViewPlans={() => {
            setPremiumModalVisible(false);
            router.push("/(tabs)/planos");
          }}
        />
        <PremiumFeatureModal
          visible={premiumModalVisible}
          onClose={() => setPremiumModalVisible(false)}
          onViewPlans={() => {
            setPremiumModalVisible(false);
            router.push("/(tabs)/planos");
          }}
        />
      </PremiumScreen>
    );
  }

  if (!compra) {
    return (
      <PremiumScreen>
        <View style={styles.centerCard}>
          <Text style={styles.centerText}>Compra nao encontrada.</Text>
        </View>
      </PremiumScreen>
    );
  }

  const baixarPdf = async () => {
    if (baixandoPdf) {
      return;
    }

    if (!compra.items.length) {
      Alert.alert("Sem produtos", "Essa compra nao possui produtos para gerar o PDF.");
      return;
    }

    setBaixandoPdf(true);

    try {
      await baixarOuCompartilharPdfCompra(compra, subscription?.name);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel gerar o PDF dessa compra agora.";

      Alert.alert("Erro ao gerar PDF", message);
    } finally {
      setBaixandoPdf(false);
    }
  };

  return (
    <PremiumScreen scroll={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PremiumCard style={styles.card}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{compra.nome}</Text>
          <Text style={styles.subtitle}>{formatarData(compra.data)}</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total gasto</Text>
            <Text style={styles.summaryValue}>{formatarMoeda(compra.totalGasto)}</Text>
            {compra.completedBy ? (
              <Text style={styles.summaryMeta}>
                Compra realizada por {compra.completedBy} em{" "}
                {formatarDataDetalhe(compra.completedAt ?? null, compra.data)}
              </Text>
            ) : null}
          </View>

          <PremiumButton
            label={baixandoPdf ? "Gerando PDF..." : "Baixar PDF"}
            onPress={baixarPdf}
            disabled={baixandoPdf}
            style={styles.pdfButton}
          />

          <Text style={styles.sectionTitle}>Categorias</Text>
          <View style={styles.categoryRow}>
            {compra.gastoPorCategoria.map((categoria) => (
              <View
                key={categoria.nome}
                style={[styles.categoryBadge, { backgroundColor: categoria.cor }]}>
                <Text style={styles.categoryBadgeText}>{categoria.nome}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Produtos</Text>
          {compra.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.nome}</Text>
                <Text style={styles.itemMeta}>
                  {item.quantidade} x {formatarMoeda(item.valorUnitario)} • {item.categoria}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                {formatarMoeda(item.quantidade * item.valorUnitario)}
              </Text>
            </View>
          ))}

          {compra.fotoNotaUri ? (
            <>
              <Text style={styles.sectionTitle}>Foto da nota</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.imageCard}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/nota/[id]",
                    params: { id: String(compra.id) },
                  })
                }>
                <Image
                  source={{ uri: compra.fotoNotaUri }}
                  style={styles.image}
                  contentFit="cover"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewImageButton}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/nota/[id]",
                    params: { id: String(compra.id) },
                  })
                }>
                <Text style={styles.viewImageButtonText}>Abrir nota com zoom</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </PremiumCard>
      </ScrollView>
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
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: premiumRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  backButtonText: {
    color: premiumColors.text,
    fontWeight: "700",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: premiumColors.text,
  },
  subtitle: {
    textAlign: "center",
    color: premiumColors.textSecondary,
    marginTop: 6,
    marginBottom: 8,
  },
  summaryCard: {
    backgroundColor: premiumColors.successSoft,
    borderRadius: premiumRadius.md,
    padding: 18,
    alignItems: "center",
    marginBottom: 4,
  },
  summaryLabel: {
    color: premiumColors.textSecondary,
    fontWeight: "700",
    marginBottom: 6,
  },
  summaryValue: {
    color: premiumColors.primary,
    fontWeight: "800",
    fontSize: 28,
  },
  summaryMeta: {
    color: premiumColors.textSecondary,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "600",
  },
  pdfButton: {
    marginBottom: 4,
  },
  sectionTitle: {
    color: premiumColors.text,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 10,
    marginTop: 8,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    borderRadius: premiumRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  itemRow: {
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: premiumRadius.sm,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: premiumColors.text,
    fontWeight: "700",
    fontSize: 15,
  },
  itemMeta: {
    color: premiumColors.textSecondary,
    marginTop: 4,
    fontSize: 12,
  },
  itemTotal: {
    color: premiumColors.text,
    fontWeight: "800",
  },
  imageCard: {
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: premiumRadius.md,
    padding: 10,
    marginTop: 4,
  },
  image: {
    width: "100%",
    height: 240,
    borderRadius: premiumRadius.sm,
    backgroundColor: premiumColors.surfaceMuted,
  },
  viewImageButton: {
    marginTop: 10,
    backgroundColor: premiumColors.primary,
    borderRadius: premiumRadius.sm,
    paddingVertical: 12,
    alignItems: "center",
  },
  viewImageButtonText: {
    color: premiumColors.surface,
    fontWeight: "700",
  },
  centerCard: {
    flex: 1,
    margin: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: premiumColors.surface,
    borderRadius: premiumRadius.lg,
    borderWidth: 1,
    borderColor: premiumColors.border,
  },
  centerText: {
    color: premiumColors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
