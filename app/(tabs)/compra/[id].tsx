import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useBudget } from "@/context/budget-context";

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
};

export default function CompraDetalheScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { buscarCompraPorId, carregandoDados } = useBudget();
  const compraId = Number(params.id);
  const compra = Number.isNaN(compraId) ? undefined : buscarCompraPorId(compraId);

  if (carregandoDados) {
    return (
      <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Carregando compra...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!compra) {
    return (
      <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Compra nao encontrada.</Text>
        </View>
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

          <Text style={styles.title}>{compra.nome}</Text>
          <Text style={styles.subtitle}>{formatarData(compra.data)}</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total gasto</Text>
            <Text style={styles.summaryValue}>{formatarMoeda(compra.totalGasto)}</Text>
          </View>

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
              <View style={styles.imageCard}>
                <Image
                  source={{ uri: compra.fotoNotaUri }}
                  style={styles.image}
                  contentFit="cover"
                />
              </View>
            </>
          ) : null}
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
    justifyContent: "center",
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
  summaryCard: {
    backgroundColor: "#dce7e0",
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    marginBottom: 20,
  },
  summaryLabel: {
    color: "#486756",
    fontWeight: "700",
    marginBottom: 6,
  },
  summaryValue: {
    color: "#2f5d45",
    fontWeight: "800",
    fontSize: 28,
  },
  sectionTitle: {
    color: "#2f5d45",
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
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  itemRow: {
    backgroundColor: "#fff",
    borderRadius: 16,
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
    color: "#2f5d45",
    fontWeight: "700",
    fontSize: 15,
  },
  itemMeta: {
    color: "#6c7a73",
    marginTop: 4,
    fontSize: 12,
  },
  itemTotal: {
    color: "#2f5d45",
    fontWeight: "800",
  },
  imageCard: {
    backgroundColor: "#dce7e0",
    borderRadius: 18,
    padding: 10,
    marginTop: 4,
  },
  image: {
    width: "100%",
    height: 240,
    borderRadius: 14,
    backgroundColor: "#c8d4ce",
  },
  loadingCard: {
    flex: 1,
    margin: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e9eceb",
    borderRadius: 24,
  },
  loadingText: {
    color: "#2f5d45",
    fontSize: 16,
    fontWeight: "600",
  },
});
