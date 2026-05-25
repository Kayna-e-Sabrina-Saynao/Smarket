import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";

export default function AjudaScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <IconSymbol name="questionmark.circle.fill" size={18} color="#2f5d45" />
            </View>
            <Text style={styles.title}>Como usar</Text>
          </View>
          <Text style={styles.subtitle}>Guia rapido para o fluxo do app</Text>

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>1. Adicione itens</Text>
            <Text style={styles.tipText}>Use o botao `+` para montar sua lista de compras.</Text>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>2. Va para On Market</Text>
            <Text style={styles.tipText}>
              Marque os itens comprados e informe o valor unitario quando estiver no mercado.
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>3. Finalize a compra</Text>
            <Text style={styles.tipText}>
              Em Orcamento, use `Finalizar Compra` para guardar tudo no historico.
            </Text>
          </View>
        </View>
      </ScrollView>
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
  tipCard: {
    backgroundColor: "#dce7e0",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  tipTitle: { color: "#2f5d45", fontWeight: "800", marginBottom: 6, fontSize: 15 },
  tipText: { color: "#567064", lineHeight: 20 },
});
