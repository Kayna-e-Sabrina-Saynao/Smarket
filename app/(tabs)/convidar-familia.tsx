import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { PremiumFeatureModal } from "@/src/components/PremiumFeatureModal";
import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { PremiumCard } from "@/src/components/premium/PremiumCard";
import { PremiumScreen } from "@/src/components/premium/PremiumScreen";
import { PLANS } from "@/src/config/plans";
import { useSubscription } from "@/src/context/subscription-context";
import { ensureUserInviteCode } from "@/src/services/subscriptionService";
import { premiumColors, premiumSpacing } from "@/src/theme/premium-ui";
import { canUseFamilyFeatures } from "@/src/utils/planPermissions";
import { auth } from "../../firebaseConfig";

export default function ConvidarFamiliaScreen() {
  const router = useRouter();
  const { currentPlan, subscription, isUltimate } = useSubscription();
  const [inviteCode, setInviteCode] = useState<string | null>(subscription?.inviteCode ?? null);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const familyEnabled = canUseFamilyFeatures(currentPlan, isUltimate);

  useEffect(() => {
    if (!familyEnabled) {
      setPremiumModalVisible(true);
      return;
    }

    const uid = auth.currentUser?.uid;

    if (!uid) {
      return;
    }

    ensureUserInviteCode(uid)
      .then((code) => setInviteCode(code))
      .catch(() => undefined);
  }, [familyEnabled]);

  const inviteLink = useMemo(() => {
    if (!inviteCode) {
      return "";
    }

    return Linking.createURL("/convite", {
      queryParams: { code: inviteCode },
    });
  }, [inviteCode]);

  const shareInvite = async (type: "link" | "code" | "qr") => {
    if (!inviteCode) {
      return;
    }

    const messages = {
      link: `Entre na minha familia no SMARKET: ${inviteLink}`,
      code: `Use este codigo no SMARKET para entrar na familia: ${inviteCode}`,
      qr: `Escaneie este QR Code ou use o codigo ${inviteCode} para entrar no SMARKET.`,
    };

    await Share.share({
      message: messages[type],
      title: "Convite SMARKET Familia",
    });
  };

  const copyCode = () => {
    if (!inviteCode) {
      return;
    }

    Alert.alert("Codigo pronto", `Compartilhe este codigo com sua familia: ${inviteCode}`);
  };

  if (!familyEnabled) {
    return (
      <PremiumScreen scroll={false}>
        <PremiumFeatureModal
          visible={premiumModalVisible}
          onClose={() => {
            setPremiumModalVisible(false);
            router.back();
          }}
          onViewPlans={() => {
            setPremiumModalVisible(false);
            router.replace("/(tabs)/planos");
          }}
        />
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
              <MaterialIcons name="groups" size={22} color={premiumColors.primary} />
            </View>
          </View>

          <Text style={styles.title}>Convidar membros</Text>
          <Text style={styles.subtitle}>
            Plano {PLANS[currentPlan].name} com espaco para ate 5 pessoas.
          </Text>

          <PremiumCard style={styles.codeCard}>
            <Text style={styles.sectionLabel}>Codigo da familia</Text>
            <Text style={styles.codeValue}>{inviteCode ?? "Gerando..."}</Text>
            <Text style={styles.codeHelper}>
              Compartilhe o codigo ou o link para conectar novos membros.
            </Text>
          </PremiumCard>

          <PremiumCard style={styles.qrCard}>
            <Text style={styles.sectionLabel}>QR Code</Text>
            {inviteCode ? (
              <View style={styles.qrWrapper}>
                <QRCode value={inviteLink} size={164} color="#173428" backgroundColor="#ffffff" />
              </View>
            ) : null}
          </PremiumCard>

          <PremiumButton label="Compartilhar link" onPress={() => shareInvite("link")} />
          <PremiumButton secondary label="Compartilhar codigo" onPress={() => shareInvite("code")} />
          <PremiumButton secondary label="Compartilhar QR Code" onPress={() => shareInvite("qr")} />
          <PremiumButton secondary label="Ver codigo" onPress={copyCode} />
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
    backgroundColor: premiumColors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: premiumColors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: premiumColors.textSecondary,
    marginTop: -10,
    lineHeight: 20,
  },
  codeCard: {
    gap: 8,
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  sectionLabel: {
    color: premiumColors.textSecondary,
    fontWeight: "700",
  },
  codeValue: {
    color: premiumColors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  codeHelper: {
    color: premiumColors.textSecondary,
    lineHeight: 20,
  },
  qrCard: {
    alignItems: "center",
    gap: 12,
  },
  qrWrapper: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: premiumColors.surface,
  },
});
