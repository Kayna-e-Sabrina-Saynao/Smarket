import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type PremiumLockedStateProps = {
  title: string;
  description: string;
  onViewPlans: () => void;
};

export function PremiumLockedState({
  title,
  description,
  onViewPlans,
}: PremiumLockedStateProps) {
  return (
    <View style={styles.card}>
      <View style={styles.lockBadge}>
        <Text style={styles.lockBadgeText}>Premium</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <TouchableOpacity style={styles.button} onPress={onViewPlans}>
        <Text style={styles.buttonText}>Ver planos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#e9eceb",
    margin: 20,
    marginTop: 40,
    padding: 24,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 5,
  },
  lockBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dce7e0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  lockBadgeText: {
    color: "#2f5d45",
    fontWeight: "800",
    fontSize: 12,
  },
  title: {
    color: "#173428",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  description: {
    color: "#61736a",
    lineHeight: 22,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2f5d45",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
