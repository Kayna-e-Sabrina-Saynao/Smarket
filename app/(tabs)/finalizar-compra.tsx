import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useBudget } from "@/context/budget-context";

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

export default function FinalizarCompraScreen() {
  const router = useRouter();
  const { finalizarCompra } = useBudget();
  const [nomeCompra, setNomeCompra] = useState("");
  const [dataCompra, setDataCompra] = useState("");
  const [fotoNotaUri, setFotoNotaUri] = useState<string | null>(null);

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

  const finalizar = () => {
    const dataNormalizada = normalizarData(dataCompra);

    if (!nomeCompra.trim()) {
      Alert.alert("Nome obrigatorio", "Informe o nome da compra.");
      return;
    }

    if (!dataNormalizada) {
      Alert.alert("Data invalida", "Informe a data no formato DD/MM/AAAA.");
      return;
    }

    const resultado = finalizarCompra({
      nome: nomeCompra,
      data: dataNormalizada,
      fotoNotaUri,
    });

    if (!resultado.sucesso) {
      if (resultado.erro === "sem-itens") {
        Alert.alert("Sem itens", "Conclua itens no On Market antes de finalizar a compra.");
        return;
      }

      Alert.alert("Erro", "Nao foi possivel finalizar a compra agora.");
      return;
    }

    Alert.alert("Compra finalizada", "A compra foi salva no historico.", [
      {
        text: "OK",
        onPress: () => router.replace("/(tabs)/gastos"),
      },
    ]);
  };

  return (
    <LinearGradient colors={["#5f9f7a", "#2f5d45"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Finalizar Compra</Text>
          <Text style={styles.subtitle}>Preencha os dados finais da compra</Text>

          <Text style={styles.label}>Nome da compra</Text>
          <TextInput
            value={nomeCompra}
            onChangeText={setNomeCompra}
            style={styles.input}
            placeholder="Ex.: Compra da semana"
            placeholderTextColor="#90a096"
          />

          <Text style={styles.label}>Data</Text>
          <TextInput
            value={dataCompra}
            onChangeText={setDataCompra}
            style={styles.input}
            placeholder="Ex.: 27/04/2026"
            placeholderTextColor="#90a096"
          />

          <Text style={styles.label}>Foto da nota (opcional)</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={selecionarImagem}>
            <Text style={styles.uploadButtonText}>
              {fotoNotaUri ? "Trocar imagem da nota" : "Adicionar foto da nota"}
            </Text>
          </TouchableOpacity>

          {fotoNotaUri ? (
            <View style={styles.previewCard}>
              <Image source={{ uri: fotoNotaUri }} style={styles.previewImage} contentFit="cover" />
            </View>
          ) : null}

          <TouchableOpacity style={styles.primaryButton} onPress={finalizar}>
            <Text style={styles.primaryButtonText}>Finalizar compra</Text>
          </TouchableOpacity>
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
    marginBottom: 22,
  },
  label: {
    color: "#486756",
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#f7faf8",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#2f5d45",
  },
  uploadButton: {
    backgroundColor: "#dce7e0",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#2f5d45",
    fontWeight: "700",
  },
  previewCard: {
    marginTop: 14,
    backgroundColor: "#dce7e0",
    borderRadius: 18,
    padding: 10,
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    backgroundColor: "#c8d4ce",
  },
  primaryButton: {
    backgroundColor: "#2f5d45",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 24,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
