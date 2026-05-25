import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AppEmptyStateProps = {
  title: string;
  description: string;
  buttonLabel: string;
  onPress: () => void;
};

export function AppEmptyState({
  title,
  description,
  buttonLabel,
  onPress,
}: AppEmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <LinearGradient colors={["#dff5e3", "#f3fbf5"]} style={styles.illustration}>
        <View style={styles.cartBase}>
          <View style={styles.cartBasket} />
          <View style={styles.cartHandle} />
          <View style={styles.cartWheelLeft} />
          <View style={styles.cartWheelRight} />
          <View style={styles.listSheet}>
            <View style={styles.listLine} />
            <View style={styles.listLineShort} />
            <View style={styles.listLine} />
          </View>
        </View>
      </LinearGradient>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  illustration: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  cartBase: {
    width: 110,
    height: 90,
    position: "relative",
  },
  cartBasket: {
    position: "absolute",
    left: 12,
    top: 22,
    width: 68,
    height: 38,
    borderWidth: 5,
    borderColor: "#2f5d45",
    borderRadius: 14,
    backgroundColor: "#ffffff",
  },
  cartHandle: {
    position: "absolute",
    left: 0,
    top: 10,
    width: 28,
    height: 5,
    backgroundColor: "#2f5d45",
    transform: [{ rotate: "-24deg" }],
    borderRadius: 4,
  },
  cartWheelLeft: {
    position: "absolute",
    left: 22,
    bottom: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2f5d45",
  },
  cartWheelRight: {
    position: "absolute",
    left: 64,
    bottom: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2f5d45",
  },
  listSheet: {
    position: "absolute",
    right: 8,
    top: 0,
    width: 40,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: "#9bd8a0",
    paddingHorizontal: 8,
    paddingTop: 10,
    gap: 6,
  },
  listLine: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#b6d9ba",
  },
  listLineShort: {
    width: "70%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "#b6d9ba",
  },
  title: {
    color: "#173428",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    color: "#64756b",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 18,
    maxWidth: 260,
  },
  button: {
    backgroundColor: "#2f5d45",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
