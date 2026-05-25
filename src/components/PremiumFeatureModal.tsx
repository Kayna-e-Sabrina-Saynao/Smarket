import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type PremiumFeatureModalProps = {
  visible: boolean;
  onClose: () => void;
  onViewPlans: () => void;
  title?: string;
  description?: string;
};

export function PremiumFeatureModal({
  visible,
  onClose,
  onViewPlans,
  title = "Recurso Premium",
  description = "Esse recurso esta disponivel nos planos Pro e Familia.",
}: PremiumFeatureModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PRO</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={onViewPlans}>
            <Text style={styles.primaryButtonText}>Ver planos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Agora nao</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(8, 22, 16, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#eef3f0",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#d7f0dc",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  badgeText: {
    color: "#2f5d45",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.6,
  },
  title: {
    color: "#173428",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  description: {
    color: "#5d6f65",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  primaryButton: {
    backgroundColor: "#2f5d45",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: "#d7dfda",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#3f5d4d",
    fontWeight: "700",
    fontSize: 15,
  },
});
