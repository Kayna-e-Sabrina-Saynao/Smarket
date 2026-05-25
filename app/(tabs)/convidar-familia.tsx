import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { PremiumFeatureModal } from "@/src/components/PremiumFeatureModal";
import { PLANS } from "@/src/config/plans";
import { useSubscription } from "@/src/context/subscription-context";
import { ensureUserInviteCode } from "@/src/services/subscriptionService";
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
      <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
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
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Convidar membros</Text>
              <Text style={styles.subtitle}>
                Plano {PLANS[currentPlan].name} com espaco para ate 5 pessoas.
              </Text>
            </View>

            <View style={styles.iconCircle}>
              <MaterialIcons name="groups" size={24} color="#2f5d45" />
            </View>
          </View>

          <View style={styles.codeCard}>
            <Text style={styles.sectionLabel}>Codigo da familia</Text>
            <Text style={styles.codeValue}>{inviteCode ?? "Gerando..."}</Text>
            <Text style={styles.codeHelper}>
              Compartilhe o codigo ou o link para conectar novos membros.
            </Text>
          </View>

          <View style={styles.qrCard}>
            <Text style={styles.sectionLabel}>QR Code</Text>
            {inviteCode ? (
              <View style={styles.qrWrapper}>
                <QRCode value={inviteLink} size={164} color="#173428" backgroundColor="#ffffff" />
              </View>
            ) : null}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => shareInvite("link")}>
            <Text style={styles.primaryButtonText}>Compartilhar link</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => shareInvite("code")}>
            <Text style={styles.secondaryButtonText}>Compartilhar codigo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => shareInvite("qr")}>
            <Text style={styles.secondaryButtonText}>Compartilhar QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostButton} onPress={copyCode}>
            <Text style={styles.ghostButtonText}>Ver codigo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, padding: 20 },
  card: {
    backgroundColor: "#e9eceb",
    borderRadius: 30,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  title: { color: "#173428", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#607068", marginTop: 6, lineHeight: 20 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dce7e0",
    alignItems: "center",
    justifyContent: "center",
  },
  codeCard: {
    backgroundColor: "#f5f8f6",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  sectionLabel: {
    color: "#5c7065",
    marginBottom: 8,
    fontWeight: "700",
  },
  codeValue: {
    color: "#173428",
    fontSize: 24,
    fontWeight: "800",
  },
  codeHelper: {
    color: "#61736a",
    marginTop: 8,
    lineHeight: 20,
  },
  qrCard: {
    backgroundColor: "#dce7e0",
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    alignItems: "center",
  },
  qrWrapper: {
    marginTop: 10,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "#fff",
  },
  primaryButton: {
    backgroundColor: "#2f5d45",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: { color: "#fff", fontWeight: "800" },
  secondaryButton: {
    backgroundColor: "#dce7e0",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  secondaryButtonText: { color: "#2f5d45", fontWeight: "800" },
  ghostButton: {
    alignItems: "center",
    paddingVertical: 14,
  },
  ghostButtonText: { color: "#607068", fontWeight: "700" },
});
