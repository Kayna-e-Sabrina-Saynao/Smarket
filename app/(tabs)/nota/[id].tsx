import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
import { useSubscription } from "@/src/context/subscription-context";
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
      <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
        <View style={styles.centerCard}>
          <Text style={styles.centerText}>Carregando nota...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (premiumBlocked) {
    return (
      <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
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
      </LinearGradient>
    );
  }

  if (!compra?.fotoNotaUri) {
    return (
      <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
        <View style={styles.centerCard}>
          <Text style={styles.centerText}>Nota nao encontrada.</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#173428", "#0f241b"]} style={styles.container}>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    backgroundColor: "#d7dfda",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: {
    color: "#244534",
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 22,
  },
  subtitle: {
    color: "#d7e3dc",
    marginTop: 4,
    fontSize: 13,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 18,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#dce7e0",
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonText: {
    color: "#244534",
    fontSize: 22,
    fontWeight: "800",
  },
  zoomBadge: {
    backgroundColor: "#244534",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  zoomBadgeText: {
    color: "#fff",
    fontWeight: "700",
  },
  resetButton: {
    backgroundColor: "#2f5d45",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginLeft: "auto",
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  helperText: {
    color: "#d7e3dc",
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    fontSize: 13,
  },
  horizontalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  verticalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  imageFrame: {
    backgroundColor: "#eef3f0",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dce7e0",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#eef3f0",
  },
  centerCard: {
    flex: 1,
    margin: 20,
    borderRadius: 24,
    backgroundColor: "#e9eceb",
    justifyContent: "center",
    alignItems: "center",
  },
  centerText: {
    color: "#2f5d45",
    fontWeight: "700",
    fontSize: 16,
  },
});
