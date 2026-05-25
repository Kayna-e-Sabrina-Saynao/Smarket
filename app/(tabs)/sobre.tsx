import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  SMARKET_APP_DESCRIPTION,
  SMARKET_APP_NAME,
  SMARKET_APP_VERSION,
} from "@/src/config/app";

export default function SobreScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <MaterialIcons name="shopping-bag" size={30} color="#2f5d45" />
            </View>
            <Text style={styles.title}>{SMARKET_APP_NAME}</Text>
            <Text style={styles.version}>Versao {SMARKET_APP_VERSION}</Text>
            <Text style={styles.description}>{SMARKET_APP_DESCRIPTION}</Text>
          </View>

          <InfoBlock
            title="Proposta"
            text="Um app simples para organizar compras, acompanhar gastos e compartilhar listas sem complicacao."
          />
          <InfoBlock
            title="Tecnologia"
            text="Construido com React Native, Expo, Firebase Authentication e Firestore para sincronizacao segura."
          />
          <InfoBlock
            title="Pronto para crescer"
            text="A base de assinatura, onboarding, historico, familia e analytics ja fica pronta para a publicacao na Play Store."
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <Text style={styles.blockText}>{text}</Text>
    </View>
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
  hero: {
    alignItems: "center",
    marginBottom: 18,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#dce7e0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: { color: "#173428", fontSize: 30, fontWeight: "800" },
  version: { color: "#607068", marginTop: 6, fontWeight: "700" },
  description: {
    color: "#607068",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 21,
  },
  block: {
    backgroundColor: "#f4f8f5",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  blockTitle: { color: "#173428", fontWeight: "800", marginBottom: 6 },
  blockText: { color: "#607068", lineHeight: 21 },
});
