import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useBudget } from "@/context/budget-context";
import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { useSubscription } from "@/src/context/subscription-context";
import { trackEvent } from "@/src/services/analyticsService";
import { notifyPurchaseAdded, scheduleInactivityReminder } from "@/src/services/notificationService";
import { premiumColors, premiumRadius, premiumShadows, premiumSpacing } from "@/src/theme/premium-ui";
import { canTrackBuyer, canUseFamilyFeatures } from "@/src/utils/planPermissions";

const normalizarData = (valor: string) => {
  const partes = valor.trim().split("/");

  if (partes.length !== 3) {
    return null;
  }

  const [dia, mes, ano] = partes.map((parte) => Number(parte));

  if (
    !Number.isInteger(dia) ||
    !Number.isInteger(mes) ||
    !Number.isInteger(ano) ||
    dia < 1 ||
    dia > 31 ||
    mes < 1 ||
    mes > 12 ||
    ano < 2000
  ) {
    return null;
  }

  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
};

const dataAtualFormatada = () => {
  const agora = new Date();
  return `${String(agora.getDate()).padStart(2, "0")}/${String(agora.getMonth() + 1).padStart(2, "0")}/${agora.getFullYear()}`;
};

export default function FinalizarCompraScreen() {
  const router = useRouter();
  const { finalizarCompra } = useBudget();
  const { currentPlan, subscription, isUltimate } = useSubscription();
  const [nomeCompra, setNomeCompra] = useState("");
  const [dataCompra, setDataCompra] = useState(dataAtualFormatada);
  const [fotoNotaUri, setFotoNotaUri] = useState<string | null>(null);
  const [comprador, setComprador] = useState("");
  const [compradorInicializado, setCompradorInicializado] = useState(false);
  const trackingEnabled = canTrackBuyer(currentPlan, isUltimate);
  const familyEnabled = canUseFamilyFeatures(currentPlan, isUltimate);
  const membrosFamilia = subscription?.familyMembers ?? [];

  useEffect(() => {
    if (!trackingEnabled) {
      setCompradorInicializado(false);
      return;
    }

    if (!compradorInicializado && subscription?.name) {
      setComprador(subscription.name);
      setCompradorInicializado(true);
    }
  }, [compradorInicializado, subscription?.name, trackingEnabled]);

  const selecionarImagem = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert("Permissao necessaria", "Libere acesso as fotos para anexar a nota.");
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!resultado.canceled && resultado.assets[0]?.uri) {
      setFotoNotaUri(resultado.assets[0].uri);
    }
  };

  const finalizar = async () => {
    const dataNormalizada = normalizarData(dataCompra);

    if (!nomeCompra.trim()) {
      Alert.alert("Nome obrigatorio", "Informe o nome da compra.");
      return;
    }

    if (!dataNormalizada) {
      Alert.alert("Data invalida", "Informe a data no formato DD/MM/AAAA.");
      return;
    }

    if (trackingEnabled && !comprador.trim()) {
      Alert.alert("Quem realizou a compra?", "Informe o nome de quem concluiu essa compra.");
      return;
    }

    const resultado = await finalizarCompra({
      nome: nomeCompra,
      data: dataNormalizada,
      fotoNotaUri,
      completedBy: trackingEnabled ? comprador : undefined,
    });

    if (!resultado.sucesso) {
      if (resultado.erro === "sem-itens") {
        Alert.alert("Sem itens", "Conclua itens no On Market antes de finalizar a compra.");
        return;
      }

      if (resultado.erro === "comprador-vazio") {
        Alert.alert("Comprador obrigatorio", "Informe quem realizou a compra.");
        return;
      }

      Alert.alert("Erro", "Nao foi possivel finalizar a compra agora.");
      return;
    }

    trackEvent("complete_purchase", {
      plan: currentPlan,
      buyer: trackingEnabled ? comprador : "nao-informado",
    }).catch(() => undefined);
    notifyPurchaseAdded(trackingEnabled ? comprador : undefined).catch(() => undefined);
    scheduleInactivityReminder().catch(() => undefined);

    router.replace({
      pathname: "/(tabs)/gastos",
      params: {
        data: dataNormalizada,
        success: "1",
      },
    });
  };

  return (
    <PremiumScreen scroll={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PremiumCard style={styles.card}>
          <View style={styles.topBar}>
            <PremiumButton secondary label="Voltar" onPress={() => router.back()} style={styles.topButton} />
            <View style={styles.titleBadge}>
              <Text style={styles.titleBadgeText}>✓</Text>
            </View>
          </View>

          <Text style={styles.title}>Finalizar Compra</Text>
          <Text style={styles.subtitle}>Preencha os dados finais da compra</Text>

          <Text style={styles.label}>Nome da compra</Text>
          <TextInput
            value={nomeCompra}
            onChangeText={setNomeCompra}
            style={styles.input}
            placeholder="Ex.: Compra da semana"
            placeholderTextColor="#90A096"
          />

          <Text style={styles.label}>Data</Text>
          <TextInput
            value={dataCompra}
            onChangeText={setDataCompra}
            style={styles.input}
            placeholder="Ex.: 27/04/2026"
            placeholderTextColor="#90A096"
          />

          <Text style={styles.label}>Foto da nota (opcional)</Text>
          <PremiumButton
            secondary
            label={fotoNotaUri ? "Trocar imagem da nota" : "Adicionar foto da nota"}
            onPress={selecionarImagem}
          />

          {fotoNotaUri ? (
            <PremiumCard style={styles.previewCard}>
              <Image source={{ uri: fotoNotaUri }} style={styles.previewImage} contentFit="cover" />
            </PremiumCard>
          ) : null}

          {trackingEnabled ? (
            <View style={styles.buyerCard}>
              <Text style={styles.label}>Quem realizou esta compra?</Text>
              <Text style={styles.buyerHelper}>
                {familyEnabled
                  ? "Escolha um membro da familia ou digite o nome manualmente."
                  : "Digite o nome de quem concluiu esta compra."}
              </Text>

              {familyEnabled && membrosFamilia.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.membersRow}>
                  {membrosFamilia.map((membro) => {
                    const selecionado = comprador.trim().toLowerCase() === membro.toLowerCase();

                    return (
                      <PremiumButton
                        key={membro}
                        secondary={!selecionado}
                        label={membro}
                        onPress={() => setComprador(membro)}
                        style={styles.memberChip}
                      />
                    );
                  })}
                </ScrollView>
              ) : null}

              <TextInput
                value={comprador}
                onChangeText={setComprador}
                style={styles.input}
                placeholder="Ex.: Paulo"
                placeholderTextColor="#90A096"
              />
            </View>
          ) : null}

          <PremiumButton label="Finalizar compra" onPress={finalizar} style={styles.primaryButton} />
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
    fontSize: 24,
    fontWeight: "800",
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
  previewCard: {
    padding: 10,
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    backgroundColor: "#C8D4CE",
  },
  buyerCard: {
    backgroundColor: premiumColors.surfaceMuted,
    borderRadius: premiumRadius.lg,
    padding: 14,
    gap: 12,
  },
  buyerHelper: {
    color: premiumColors.textSecondary,
    lineHeight: 20,
  },
  membersRow: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 10,
  },
  memberChip: {
    minWidth: 110,
  },
  primaryButton: {
    marginTop: 8,
  },
});
