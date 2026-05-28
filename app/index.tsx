import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Alert,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { auth, db } from "../firebaseConfig";
import { trackEvent } from "@/src/services/analyticsService";
import { ensureUserSubscriptionProfile } from "@/src/services/subscriptionService";

const garantirEstruturaUsuario = async (uid: string, email: string) => {
  const perfilRef = doc(db, "usuarios", uid);
  const orcamentoRef = doc(db, "usuarios", uid, "orcamento", "atual");
  const perfilSnapshot = await getDoc(perfilRef);
  const orcamentoSnapshot = await getDoc(orcamentoRef);

  // Contas antigas podem existir no Auth sem o documento de perfil no Firestore.
  if (!perfilSnapshot.exists()) {
    await setDoc(
      perfilRef,
      {
        email,
        perfil: "padrao",
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    await setDoc(
      perfilRef,
      {
        email,
        atualizadoEm: serverTimestamp(),
      },
      { merge: true }
    );
  }

  // O documento de orcamento so deve ser criado na primeira vez para nao sobrescrever dados existentes.
  if (!orcamentoSnapshot.exists()) {
    await setDoc(
      orcamentoRef,
      {
        orcamentoTotal: 0,
        items: [],
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      },
      { merge: true }
    );
  }

  await ensureUserSubscriptionProfile({
    uid,
    email,
    name: auth.currentUser?.displayName,
  });
};

const getCodigoErro = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";

export default function Login() {
  const router = useRouter();
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [emailFocado, setEmailFocado] = useState(false);
  const [senhaFocada, setSenhaFocada] = useState(false);
  const [confirmacaoFocada, setConfirmacaoFocada] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(18)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuario) => {
      if (usuario) {
        router.replace("/(tabs)");
      }
    });

    return unsubscribe;
  }, [router]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateAnim]);

  const handleLogin = async () => {
    if (!email || !senha) {
      alert("Preencha email e senha");
      return;
    }

    try {
      setCarregando(true);
      const credencial = await signInWithEmailAndPassword(auth, email.trim(), senha);
      trackEvent("login", { method: "email" }).catch(() => undefined);
      try {
        await garantirEstruturaUsuario(credencial.user.uid, credencial.user.email ?? email.trim());
      } catch {
        // Se a autenticacao funcionou mas o Firestore falhou, ainda deixamos o usuario entrar.
      }
    } catch (error: unknown) {
      const codigoErro = getCodigoErro(error);

      if (codigoErro === "auth/invalid-credential" || codigoErro === "auth/wrong-password") {
        alert("Email ou senha incorretos");
      } else if (codigoErro === "auth/user-not-found") {
        alert("Conta nao encontrada");
      } else if (codigoErro === "auth/invalid-email") {
        alert("Email invalido");
      } else if (codigoErro === "auth/too-many-requests") {
        alert("Muitas tentativas. Tente novamente em instantes.");
      } else {
        alert("Nao foi possivel entrar agora");
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleRegistro = async () => {
    if (!email || !senha || !confirmarSenha) {
      alert("Preencha todos os campos");
      return;
    }

    if (senha.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (senha !== confirmarSenha) {
      alert("As senhas nao coincidem");
      return;
    }

    try {
      setCarregando(true);
      const credencial = await createUserWithEmailAndPassword(auth, email.trim(), senha);
      trackEvent("sign_up", { method: "email" }).catch(() => undefined);
      try {
        await garantirEstruturaUsuario(credencial.user.uid, credencial.user.email ?? email.trim());
      } catch {
        // Mantemos a conta criada e o usuario autenticado mesmo se a estrutura inicial falhar.
      }
    } catch (error: unknown) {
      const codigoErro = getCodigoErro(error);

      if (codigoErro === "auth/email-already-in-use") {
        alert("Esse email ja esta cadastrado");
      } else if (codigoErro === "auth/invalid-email") {
        alert("Email invalido");
      } else if (codigoErro === "auth/weak-password") {
        alert("A senha deve ter pelo menos 6 caracteres");
      } else {
        alert("Nao foi possivel criar a conta");
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleEsqueciSenha = async () => {
    const emailNormalizado = email.trim();

    if (!emailNormalizado) {
      Alert.alert("Informe seu email", "Digite o email da conta para receber o link de redefinicao.");
      return;
    }

    try {
      setCarregando(true);
      await sendPasswordResetEmail(auth, emailNormalizado);
      Alert.alert(
        "Email enviado",
        "Enviamos um link para redefinir sua senha no email informado."
      );
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "auth/user-not-found"
      ) {
        Alert.alert("Conta nao encontrada", "Nao existe usuario cadastrado com esse email.");
      } else if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "auth/invalid-email"
      ) {
        Alert.alert("Email invalido", "Confira o email digitado e tente novamente.");
      } else {
        Alert.alert("Falha ao enviar", "Nao foi possivel enviar o email de recuperacao agora.");
      }
    } finally {
      setCarregando(false);
    }
  };

  const animarBotao = (para: number) => {
    Animated.spring(buttonScale, {
      toValue: para,
      useNativeDriver: true,
      friction: 8,
      tension: 140,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />
      <View style={styles.backgroundLineOne} />
      <View style={styles.backgroundLineTwo} />

      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.contentWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateAnim }],
            },
          ]}>
          <View style={styles.logoWrap}>
            <Image
              source={require("../assets/images/smarket-logo.png")}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.subtitle}>
              {modo === "login" ? "Entre na sua conta" : "Crie sua conta"}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.switchRow}>
              <TouchableOpacity
                style={[styles.switchButton, modo === "login" && styles.switchButtonActive]}
                onPress={() => setModo("login")}>
                {modo === "login" ? (
                  <LinearGradient
                    colors={["#22C55E", "#4ADE80"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.switchGradient}
                  />
                ) : null}
                <View style={styles.switchContent}>
                  <MaterialIcons
                    name="person-outline"
                    size={18}
                    color={modo === "login" ? "#FFFFFF" : "#6B7280"}
                  />
                  <Text style={[styles.switchText, modo === "login" && styles.switchTextActive]}>
                    Login
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.switchButton, modo === "registro" && styles.switchButtonActive]}
                onPress={() => setModo("registro")}>
                {modo === "registro" ? (
                  <LinearGradient
                    colors={["#22C55E", "#4ADE80"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.switchGradient}
                  />
                ) : null}
                <View style={styles.switchContent}>
                  <MaterialIcons
                    name="person-add-alt-1"
                    size={18}
                    color={modo === "registro" ? "#FFFFFF" : "#6B7280"}
                  />
                  <Text
                    style={[styles.switchText, modo === "registro" && styles.switchTextActive]}>
                    Registro
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputWrapper, emailFocado && styles.inputWrapperFocused]}>
              <MaterialIcons name="mail-outline" size={20} color="#6B7280" />
              <TextInput
                placeholder="Seu melhor email"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocado(true)}
                onBlur={() => setEmailFocado(false)}
              />
            </View>

            <View style={[styles.inputWrapper, senhaFocada && styles.inputWrapperFocused]}>
              <MaterialIcons name="lock-outline" size={20} color="#6B7280" />
              <TextInput
                placeholder="Sua senha"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!mostrarSenha}
                style={styles.input}
                value={senha}
                onChangeText={setSenha}
                onFocus={() => setSenhaFocada(true)}
                onBlur={() => setSenhaFocada(false)}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setMostrarSenha((estadoAtual) => !estadoAtual)}>
                <MaterialIcons
                  name={mostrarSenha ? "visibility-off" : "visibility"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {modo === "registro" ? (
              <View
                style={[styles.inputWrapper, confirmacaoFocada && styles.inputWrapperFocused]}>
                <MaterialIcons name="lock-outline" size={20} color="#6B7280" />
                <TextInput
                  placeholder="Confirme sua senha"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!mostrarConfirmacao}
                  style={styles.input}
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  onFocus={() => setConfirmacaoFocada(true)}
                  onBlur={() => setConfirmacaoFocada(false)}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setMostrarConfirmacao((estadoAtual) => !estadoAtual)}>
                  <MaterialIcons
                    name={mostrarConfirmacao ? "visibility-off" : "visibility"}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            ) : null}

            {modo === "login" ? (
              <TouchableOpacity
                style={styles.resetPasswordButton}
                onPress={handleEsqueciSenha}
                disabled={carregando}>
                <Text style={styles.resetPasswordText}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            ) : null}

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Pressable
                style={styles.buttonPressable}
                onPress={modo === "login" ? handleLogin : handleRegistro}
                onPressIn={() => animarBotao(1.015)}
                onPressOut={() => animarBotao(1)}
                disabled={carregando}>
                <LinearGradient
                  colors={["#22C55E", "#4ADE80"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.button}>
                  <Text style={styles.buttonText}>
                    {carregando
                      ? "Carregando..."
                      : modo === "login"
                        ? "Entrar"
                        : "Criar conta"}
                  </Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>

          <View style={styles.footer}>
            <MaterialIcons name="shield" size={16} color="rgba(17, 24, 39, 0.45)" />
            <Text style={styles.footerText}>Seus dados protegidos</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  contentWrapper: {
    width: "100%",
    alignSelf: "center",
  },
  backgroundOrbTop: {
    position: "absolute",
    top: -70,
    right: -40,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(74, 222, 128, 0.18)",
  },
  backgroundOrbBottom: {
    position: "absolute",
    bottom: -100,
    left: -30,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(34, 197, 94, 0.10)",
  },
  backgroundLineOne: {
    position: "absolute",
    bottom: 170,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.08)",
  },
  backgroundLineTwo: {
    position: "absolute",
    bottom: 110,
    right: 20,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: "rgba(17, 24, 39, 0.04)",
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: -52,
  },
  logo: {
    width: 360,
    height: 360,
    marginBottom: -90,
  },
  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 0,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 8,
  },
  switchRow: {
    flexDirection: "row",
    backgroundColor: "#F5F7FA",
    borderRadius: 22,
    padding: 6,
    marginBottom: 18,
  },
  switchButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  switchButtonActive: {
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  switchGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  switchContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 14,
  },
  switchTextActive: {
    color: "#FFFFFF",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    minHeight: 58,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    marginBottom: 12,
  },
  inputWrapperFocused: {
    borderColor: "#22C55E",
    shadowColor: "#22C55E",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 17,
    paddingHorizontal: 12,
    color: "#111827",
    fontSize: 15,
  },
  passwordToggle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  resetPasswordButton: {
    alignSelf: "flex-end",
    marginTop: 2,
    marginBottom: 14,
  },
  resetPasswordText: {
    color: "#22C55E",
    fontWeight: "600",
    fontSize: 13,
  },
  buttonPressable: {
    borderRadius: 20,
  },
  button: {
    minHeight: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    color: "rgba(17, 24, 39, 0.45)",
    fontSize: 12,
    fontWeight: "600",
  },
});
