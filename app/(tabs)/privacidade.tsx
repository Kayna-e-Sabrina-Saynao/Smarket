import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PrivacidadeScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Politica de Privacidade</Text>
              <Text style={styles.subtitle}>Como o SMARKET protege seus dados.</Text>
            </View>
            <View style={styles.iconCircle}>
              <MaterialIcons name="verified-user" size={22} color="#2f5d45" />
            </View>
          </View>

          <InfoBlock
            title="Dados usados"
            text="Email, listas, historico, configuracoes e plano atual sao armazenados para sincronizar sua conta entre dispositivos."
          />
          <InfoBlock
            title="Finalidade"
            text="Esses dados servem para organizar compras, manter backup automatico e permitir recursos de assinatura do app."
          />
          <InfoBlock
            title="Compartilhamento"
            text="O SMARKET nao vende seus dados. Informacoes so sao compartilhadas quando voce usa recursos de familia ou convite."
          />
          <InfoBlock
            title="Controle"
            text="Voce pode sair da conta a qualquer momento. Seus dados permanecem vinculados ao seu login para restauracao futura."
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  title: { color: "#173428", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#607068", marginTop: 6 },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#dce7e0",
    alignItems: "center",
    justifyContent: "center",
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
