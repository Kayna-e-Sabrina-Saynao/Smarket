import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { useBudget } from "@/context/budget-context";
import { PremiumFeatureModal } from "@/src/components/PremiumFeatureModal";
import { PremiumLockedState } from "@/src/components/PremiumLockedState";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { useSubscription } from "@/src/context/subscription-context";
import { premiumColors, premiumRadius, premiumSpacing } from "@/src/theme/premium-ui";
import { canViewHistory } from "@/src/utils/planPermissions";

const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
};

const ZOOM_MINIMO = 1;
const ZOOM_MAXIMO = 4;
const ZOOM_PASSO = 0.5;

export default function NotaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { buscarCompraPorId, carregandoDados } = useBudget();
  const { currentPlan, subscriptionLoading, isUltimate } = useSubscription();
  const { width, height } = useWindowDimensions();
  const [zoom, setZoom] = useState(1);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [premiumNoticeShown, setPremiumNoticeShown] = useState(false);
  const compraId = Number(params.id);
  const compra = Number.isNaN(compraId) ? undefined : buscarCompraPorId(compraId);
  const premiumBlocked = !canViewHistory(currentPlan, isUltimate);

  const tamanhoBase = useMemo(
    () => ({
      largura: Math.max(width - 40, 280),
      altura: Math.max(height - 220, 360),
    }),
    [height, width]
  );

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
          <Text style={styles.centerText}>Carregando nota...</Text>
        </View>
      </PremiumScreen>
    );
  }

  if (premiumBlocked) {
    return (
      <PremiumScreen>
        <PremiumLockedState
          title="Nota detalhada bloqueada"
          description="Visualizar e ampliar a nota completa faz parte dos planos Pro e Familia."
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

  if (!compra?.fotoNotaUri) {
    return (
      <PremiumScreen>
        <View style={styles.centerCard}>
          <Text style={styles.centerText}>Nota nao encontrada.</Text>
        </View>
      </PremiumScreen>
    );
  }

  return (
    <PremiumScreen scroll={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>Nota da compra</Text>
          <Text style={styles.subtitle}>
            {compra.nome} - {formatarData(compra.data)}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setZoom((valorAtual) => Math.max(ZOOM_MINIMO, valorAtual - ZOOM_PASSO))}>
          <Text style={styles.controlButtonText}>-</Text>
        </TouchableOpacity>

        <View style={styles.zoomBadge}>
          <Text style={styles.zoomBadgeText}>{Math.round(zoom * 100)}%</Text>
        </View>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setZoom((valorAtual) => Math.min(ZOOM_MAXIMO, valorAtual + ZOOM_PASSO))}>
          <Text style={styles.controlButtonText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={() => setZoom(1)}>
          <Text style={styles.resetButtonText}>Resetar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.helperText}>
        Use os botoes de zoom e arraste a imagem para ver os detalhes.
      </Text>

      <ScrollView
        horizontal
        bounces={false}
        contentContainerStyle={styles.horizontalScrollContent}
        showsHorizontalScrollIndicator={false}>
        <ScrollView
          bounces={false}
          maximumZoomScale={4}
          minimumZoomScale={1}
          contentContainerStyle={styles.verticalScrollContent}
          showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.imageFrame,
              {
                width: tamanhoBase.largura * zoom,
                height: tamanhoBase.altura * zoom,
              },
            ]}>
            <Image
              source={{ uri: compra.fotoNotaUri }}
              style={styles.image}
              contentFit="contain"
            />
          </View>
        </ScrollView>
      </ScrollView>
    </PremiumScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: premiumSpacing.sm,
    paddingHorizontal: premiumSpacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: premiumRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: premiumColors.border,
  },
  backButtonText: {
    color: premiumColors.text,
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    color: premiumColors.text,
    fontWeight: "800",
    fontSize: 22,
  },
  subtitle: {
    color: premiumColors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: premiumSpacing.sm,
    marginTop: 18,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: premiumRadius.sm,
    backgroundColor: premiumColors.surfaceMuted,
    borderWidth: 1,
    borderColor: premiumColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonText: {
    color: premiumColors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  zoomBadge: {
    backgroundColor: premiumColors.primary,
    borderRadius: premiumRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  zoomBadgeText: {
    color: premiumColors.surface,
    fontWeight: "700",
  },
  resetButton: {
    backgroundColor: premiumColors.text,
    borderRadius: premiumRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginLeft: "auto",
  },
  resetButtonText: {
    color: premiumColors.surface,
    fontWeight: "700",
  },
  helperText: {
    color: premiumColors.textSecondary,
    paddingHorizontal: premiumSpacing.sm,
    marginTop: 12,
    marginBottom: 12,
    fontSize: 13,
  },
  horizontalScrollContent: {
    paddingHorizontal: premiumSpacing.sm,
    paddingBottom: 24,
  },
  verticalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  imageFrame: {
    backgroundColor: premiumColors.surface,
    borderRadius: premiumRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: premiumColors.border,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: premiumColors.surface,
  },
  centerCard: {
    flex: 1,
    margin: 20,
    borderRadius: premiumRadius.lg,
    backgroundColor: premiumColors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: premiumColors.border,
  },
  centerText: {
    color: premiumColors.text,
    fontWeight: "700",
    fontSize: 16,
  },
});
